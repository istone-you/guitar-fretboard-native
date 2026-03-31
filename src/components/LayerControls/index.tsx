import { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Modal,
  Pressable,
  Animated,
} from "react-native";
import { useTranslation } from "react-i18next";
import "../../i18n";
import {
  CAGED_ORDER,
  DIATONIC_CHORDS,
  NOTES_FLAT,
  NOTES_SHARP,
  TRIAD_INVERSION_OPTIONS,
  getDiatonicChord,
  getRootIndex,
} from "../../logic/fretboard";
import type { Theme, Accidental, ChordDisplayMode, ScaleType, ChordType } from "../../types";
import { DropdownSelect } from "../ui/DropdownSelect";
import { buildScaleOptions } from "../ui/scaleOptions";

const CHORD_TYPES: ChordType[] = [
  "Major", "Minor", "7th", "maj7", "m7", "m7(b5)", "dim7", "m(maj7)",
  "sus2", "sus4", "6", "m6", "dim", "aug",
];
const TRIAD_CHORD_TYPES = ["Major", "Minor", "Diminished", "Augmented"];

type MobileTab = "scale" | "caged" | "chord";
const TABS: MobileTab[] = ["scale", "caged", "chord"];

// Preset color palette for the color picker
const COLOR_PRESETS = [
  "#ff69b6", "#ff4d4d", "#ff8c00", "#ffd700",
  "#40e0d0", "#00bfff", "#0ea5e9", "#7c3aed",
  "#10b981", "#84cc16", "#f97316", "#ec4899",
];

// Toggle switch
function ToggleSwitch({
  active,
  onPress,
  disabled,
}: {
  active: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={[
        styles.toggle,
        { backgroundColor: active ? "#0ea5e9" : "#4b5563" },
      ]}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.toggleThumb,
          { transform: [{ translateX: active ? 20 : 2 }] },
        ]}
      />
    </TouchableOpacity>
  );
}

// Circular color swatch button + picker modal
function ColorSwatch({
  color,
  onChange,
  disabled,
}: {
  color: string;
  onChange: (color: string) => void;
  disabled: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
        style={[styles.colorSwatch, { backgroundColor: color, opacity: disabled ? 0.4 : 1 }]}
        activeOpacity={0.7}
      />
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.colorOverlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.colorPicker}>
            <View style={styles.colorGrid}>
              {COLOR_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => { onChange(preset); setVisible(false); }}
                  style={[
                    styles.colorPreset,
                    { backgroundColor: preset },
                    color === preset && styles.colorPresetSelected,
                  ]}
                  activeOpacity={0.8}
                />
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export interface LayerControlsProps {
  theme: Theme;
  rootNote: string;
  accidental: Accidental;
  showLayers: boolean;
  setShowLayers: (value: boolean) => void;
  showChord: boolean;
  setShowChord: (value: boolean) => void;
  chordDisplayMode: ChordDisplayMode;
  setChordDisplayMode: (value: string) => void;
  showScale: boolean;
  setShowScale: (value: boolean) => void;
  scaleType: ScaleType;
  setScaleType: (value: string) => void;
  showCaged: boolean;
  setShowCaged: (value: boolean) => void;
  cagedForms: Set<string>;
  toggleCagedForm: (key: string) => void;
  chordType: ChordType;
  setChordType: (value: string) => void;
  triadInversion: string;
  setTriadInversion: (value: string) => void;
  diatonicKeyType: string;
  setDiatonicKeyType: (value: string) => void;
  diatonicChordSize: string;
  setDiatonicChordSize: (value: string) => void;
  diatonicDegree: string;
  setDiatonicDegree: (value: string) => void;
  scaleColor: string;
  setScaleColor: (value: string) => void;
  cagedColor: string;
  setCagedColor: (value: string) => void;
  chordColor: string;
  setChordColor: (value: string) => void;
}

export default function LayerControls({
  theme,
  rootNote,
  accidental,
  showLayers,
  setShowLayers,
  showChord,
  setShowChord,
  chordDisplayMode,
  setChordDisplayMode,
  showScale,
  setShowScale,
  scaleType,
  setScaleType,
  showCaged,
  setShowCaged,
  cagedForms,
  toggleCagedForm,
  chordType,
  setChordType,
  triadInversion,
  setTriadInversion,
  diatonicKeyType,
  setDiatonicKeyType,
  diatonicChordSize,
  setDiatonicChordSize,
  diatonicDegree,
  setDiatonicDegree,
  scaleColor,
  setScaleColor,
  cagedColor,
  setCagedColor,
  chordColor,
  setChordColor,
}: LayerControlsProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<MobileTab>("scale");
  const touchStartX = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 15 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
      onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dx) > 15 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
      onPanResponderGrant: (e) => {
        touchStartX.current = e.nativeEvent.pageX;
      },
      onPanResponderRelease: (_, gs) => {
        if (Math.abs(gs.dx) < 40) return;
        setActiveTab((cur) => {
          const idx = TABS.indexOf(cur);
          if (gs.dx < 0) return TABS[Math.min(idx + 1, TABS.length - 1)];
          return TABS[Math.max(idx - 1, 0)];
        });
      },
    }),
  ).current;

  const { options: scaleOptions } = buildScaleOptions(t);
  const notes = accidental === "sharp" ? NOTES_SHARP : NOTES_FLAT;
  const rootIndex = getRootIndex(rootNote);
  const diatonicScaleType = `${diatonicKeyType}-${diatonicChordSize}`;

  const diatonicKeyOptions = [
    { value: "major", label: t("options.diatonicKey.major") },
    { value: "natural-minor", label: t("options.diatonicKey.naturalMinor") },
  ];
  const diatonicChordSizeOptions = [
    { value: "triad", label: t("options.diatonicChordSize.triad") },
    { value: "seventh", label: t("options.diatonicChordSize.seventh") },
  ];
  const chordDisplayOptions: { value: ChordDisplayMode; label: string }[] = [
    { value: "form", label: t("options.chordDisplayMode.form") },
    { value: "power", label: t("options.chordDisplayMode.power") },
    { value: "triad", label: t("options.chordDisplayMode.triad") },
    { value: "diatonic", label: t("options.chordDisplayMode.diatonic") },
  ];
  const triadInversionOptions = TRIAD_INVERSION_OPTIONS.map(({ value }) => ({
    value,
    label: t(`options.triadInversions.${value}`),
  }));
  const suffixMap: Record<string, string> = {
    Major: "", Minor: "m", "7th": "7", maj7: "maj7", m7: "m7",
    "m7(b5)": "m7(b5)", dim7: "dim", "m(maj7)": "m(maj7)",
  };
  const diatonicCodeOptions = (DIATONIC_CHORDS[diatonicScaleType] ?? []).map(({ value }) => {
    const chord = getDiatonicChord(rootIndex, diatonicScaleType, value);
    return {
      value,
      label: `${value} (${notes[chord.rootIndex]}${suffixMap[chord.chordType] ?? chord.chordType})`,
    };
  });

  const placeholderOptions = [{ value: "", label: "--" }];
  const chordValueOptions =
    chordDisplayMode === "form"
      ? CHORD_TYPES.map((v) => ({ value: v, label: v }))
      : chordDisplayMode === "triad"
        ? TRIAD_CHORD_TYPES.map((v) => ({ value: v, label: v }))
        : chordDisplayMode === "diatonic"
          ? diatonicCodeOptions
          : placeholderOptions;
  const chordValue = chordDisplayMode === "diatonic" ? diatonicDegree : chordType;
  const thirdOptions =
    chordDisplayMode === "diatonic" ? diatonicKeyOptions
      : chordDisplayMode === "triad" ? triadInversionOptions
        : placeholderOptions;
  const thirdValue =
    chordDisplayMode === "diatonic" ? diatonicKeyType
      : chordDisplayMode === "triad" ? triadInversion : "";
  const fourthOptions = chordDisplayMode === "diatonic" ? diatonicChordSizeOptions : placeholderOptions;
  const fourthValue = chordDisplayMode === "diatonic" ? diatonicChordSize : "";

  // Card background/border depending on layer on/off state
  const getCardStyle = (layerOn: boolean) => {
    if (!showLayers) {
      return isDark
        ? { borderColor: "rgba(255,255,255,0.05)", backgroundColor: "#0a0a0a" }
        : { borderColor: "#e7e5e4", backgroundColor: "#f5f5f4" };
    }
    if (layerOn) {
      return isDark
        ? { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "#111111" }
        : { borderColor: "#e7e5e4", backgroundColor: "#fafaf9" };
    }
    return isDark
      ? { borderColor: "rgba(255,255,255,0.05)", backgroundColor: "#0d0d0d" }
      : { borderColor: "rgba(231,229,228,0.6)", backgroundColor: "#f5f5f4" };
  };

  const getContentOpacity = (layerOn: boolean) =>
    showLayers && layerOn ? 1 : 0.45;

  const sectionLabel = (text: string) => (
    <Text style={[styles.sectionLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
      {text}
    </Text>
  );

  // ── Scale card ──────────────────────────────────────────────────
  const scaleCard = (
    <View style={[styles.card, getCardStyle(showScale)]}>
      <View style={{ opacity: getContentOpacity(showScale), flex: 1 }}>
        <View style={styles.cardTitleRow}>
          <ColorSwatch
            color={scaleColor}
            onChange={setScaleColor}
            disabled={!showLayers || !showScale}
          />
          <ToggleSwitch
            active={showScale}
            onPress={() => setShowScale(!showScale)}
            disabled={!showLayers}
          />
        </View>

        {/* Content */}
        <View style={styles.cardCenter}>
          <View style={{ alignSelf: "stretch", gap: 6 }}>
            {sectionLabel(t("mobileControls.scaleKind"))}
            <DropdownSelect
              theme={theme}
              value={scaleType}
              onChange={setScaleType}
              options={scaleOptions}
              disabled={!showLayers || !showScale}
              fullWidth
            />
          </View>
        </View>
      </View>
    </View>
  );

  // ── CAGED card ──────────────────────────────────────────────────
  const cagedCard = (
    <View style={[styles.card, getCardStyle(showCaged)]}>
      <View style={{ opacity: getContentOpacity(showCaged), flex: 1 }}>
        <View style={styles.cardTitleRow}>
          <ColorSwatch
            color={cagedColor}
            onChange={setCagedColor}
            disabled={!showLayers || !showCaged}
          />
          <ToggleSwitch
            active={showCaged}
            onPress={() => setShowCaged(!showCaged)}
            disabled={!showLayers}
          />
        </View>

        <View style={styles.cardCenter}>
          <View style={{ alignItems: "center", gap: 8 }}>
            {sectionLabel(t("mobileControls.cagedForms"))}
            <View style={styles.cagedRow}>
              {CAGED_ORDER.map((key) => {
                const active = cagedForms.has(key);
                const cagedDisabled = !showLayers || !showCaged;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => !cagedDisabled && toggleCagedForm(key)}
                    disabled={cagedDisabled}
                    style={[
                      styles.cagedBtn,
                      {
                        backgroundColor: active ? (isDark ? "#0284c7" : "#0ea5e9") : isDark ? "#374151" : "#fff",
                        borderColor: active ? "transparent" : isDark ? "#6b7280" : "#d6d3d1",
                        transform: [{ scale: active ? 1.05 : 1 }],
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "bold", color: active ? "#fff" : isDark ? "#f3f4f6" : "#44403c" }}>
                      {key}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  // ── Chord card ──────────────────────────────────────────────────
  const chordCard = (
    <View style={[styles.card, getCardStyle(showChord)]}>
      <View style={{ opacity: getContentOpacity(showChord), flex: 1 }}>
        <View style={styles.cardTitleRow}>
          <ColorSwatch
            color={chordColor}
            onChange={setChordColor}
            disabled={!showLayers || !showChord}
          />
          <ToggleSwitch
            active={showChord}
            onPress={() => setShowChord(!showChord)}
            disabled={!showLayers}
          />
        </View>

        {/* 2x2 grid of dropdowns */}
        <View style={styles.chordGrid}>
          <View style={styles.chordGridCell}>
            {sectionLabel(t("controls.displayMode"))}
            <DropdownSelect
              theme={theme}
              value={chordDisplayMode}
              onChange={setChordDisplayMode}
              options={chordDisplayOptions}
              disabled={!showLayers || !showChord}
              fullWidth
            />
          </View>
          <View style={styles.chordGridCell}>
            {sectionLabel(chordDisplayMode === "diatonic" ? t("controls.degree") : t("controls.chord"))}
            <DropdownSelect
              theme={theme}
              value={chordValue}
              onChange={chordDisplayMode === "diatonic" ? setDiatonicDegree : setChordType}
              options={chordValueOptions}
              disabled={!showLayers || !showChord || chordDisplayMode === "power"}
              fullWidth
            />
          </View>
          <View style={styles.chordGridCell}>
            {sectionLabel(chordDisplayMode === "diatonic" ? t("controls.key") : t("controls.inversion"))}
            <DropdownSelect
              theme={theme}
              value={thirdValue}
              onChange={chordDisplayMode === "diatonic" ? setDiatonicKeyType : setTriadInversion}
              options={thirdOptions}
              disabled={!showLayers || !showChord || (chordDisplayMode !== "diatonic" && chordDisplayMode !== "triad")}
              fullWidth
            />
          </View>
          <View style={styles.chordGridCell}>
            {sectionLabel(t("controls.chordType"))}
            <DropdownSelect
              theme={theme}
              value={fourthValue}
              onChange={setDiatonicChordSize}
              options={fourthOptions}
              disabled={!showLayers || !showChord || chordDisplayMode !== "diatonic"}
              fullWidth
            />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* "Layers" header with show/hide toggle */}
      <View style={styles.headerRow}>
        <Text style={[styles.headingText, { color: isDark ? "#9ca3af" : "#78716c" }]}>
          {t("mobileControls.layers")}
        </Text>
        <TouchableOpacity
          onPress={() => setShowLayers(!showLayers)}
          style={[
            styles.smallBtn,
            {
              borderColor: isDark ? "#4b5563" : "#d6d3d1",
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#fff",
            },
          ]}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 14, color: isDark ? "#d1d5db" : "#57534e" }}>
            {showLayers ? t("mobileControls.hide") : t("mobileControls.show")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab buttons (Scale / CAGED / Chord) */}
      <View style={[styles.tabRow, !showLayers && { opacity: 0.4 }]}>
        {([
          { tab: "scale" as MobileTab, label: t("layers.scale"), on: showScale, color: scaleColor },
          { tab: "caged" as MobileTab, label: t("layers.caged"), on: showCaged, color: cagedColor },
          { tab: "chord" as MobileTab, label: t("layers.chord"), on: showChord, color: chordColor },
        ]).map(({ tab, label, on, color }) => {
          const isCurrent = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => showLayers && setActiveTab(tab)}
              disabled={!showLayers}
              style={styles.tabBtn}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabLabel,
                {
                  color: isCurrent
                    ? isDark ? "#f3f4f6" : "#1c1917"
                    : isDark ? "#6b7280" : "#a8a29e",
                  fontWeight: isCurrent ? "600" : "400",
                },
              ]}>
                {label}
              </Text>
              <View style={[
                styles.tabDot,
                { backgroundColor: on ? color : isDark ? "#4b5563" : "#d6d3d1" },
              ]} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Swipeable card area */}
      <View {...panResponder.panHandlers}>
        {activeTab === "scale" && scaleCard}
        {activeTab === "caged" && cagedCard}
        {activeTab === "chord" && chordCard}
      </View>
    </View>
  );
}

const CARD_HEIGHT = 210;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headingText: {
    fontSize: 15,
  },
  smallBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 28,
  },
  tabBtn: {
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 5,
  },
  tabLabel: {
    fontSize: 14,
  },
  tabDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  // Card
  card: {
    height: CARD_HEIGHT,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    position: "relative",
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 0,
  },
  cardCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
  },
  toggleThumb: {
    position: "absolute",
    top: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  colorPicker: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#1f2937",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: 192,
    justifyContent: "center",
  },
  colorPreset: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorPresetSelected: {
    borderWidth: 3,
    borderColor: "#fff",
  },
  // CAGED buttons (h-9 w-9 = 36x36)
  cagedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  cagedBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  // Chord 2x2 grid
  chordGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignContent: "center",
  },
  chordGridCell: {
    width: "48%",
    gap: 4,
    alignItems: "center",
  },
});
