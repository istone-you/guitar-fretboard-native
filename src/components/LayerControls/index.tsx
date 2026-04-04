import { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Animated,
  Modal,
  Pressable,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../i18n";
import {
  CAGED_ORDER,
  CHORD_CAGED_ORDER,
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
  "Major",
  "Minor",
  "7th",
  "maj7",
  "m7",
  "m7(b5)",
  "dim7",
  "m(maj7)",
  "sus2",
  "sus4",
  "6",
  "m6",
  "dim",
  "aug",
];
const TRIAD_CHORD_TYPES = ["Major", "Minor", "Diminished", "Augmented"];

type MobileTab = "scale" | "caged" | "chord";
const TABS: MobileTab[] = ["scale", "caged", "chord"];

function ToggleSwitch({
  active,
  onPress,
  disabled,
  isDark,
  activeColor,
}: {
  active: boolean;
  onPress: () => void;
  disabled: boolean;
  isDark: boolean;
  activeColor?: string;
}) {
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const prevActive = useRef(active);

  // Sync immediately when active changes externally (e.g. double-tap on tab)
  if (prevActive.current !== active) {
    prevActive.current = active;
    anim.setValue(active ? 1 : 0);
  }

  const handlePress = () => {
    const toValue = active ? 0 : 1;
    // Mark as already handled so the external sync doesn't override the animation
    prevActive.current = !active;
    Animated.timing(anim, { toValue, duration: 300, useNativeDriver: false }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const thumbTranslateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 20],
  });
  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? "#4b5563" : "#d6d3d1", activeColor ?? (isDark ? "#d1d5db" : "#1c1917")],
  });

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.toggle, { backgroundColor: bgColor }]}>
        <Animated.View
          style={[styles.toggleThumb, { transform: [{ translateX: thumbTranslateX }] }]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

// CAGED button with bounce animation
function CagedButton({
  label,
  active,
  disabled,
  isDark,
  activeColor,
  onPress,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  isDark: boolean;
  activeColor: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(active ? 1.05 : 1)).current;
  const prevKey = useRef(`${active}:${disabled}`);
  const currentKey = `${active}:${disabled}`;

  if (prevKey.current !== currentKey) {
    prevKey.current = currentKey;
    scale.stopAnimation();
    scale.setValue(0.8);
    Animated.spring(scale, {
      toValue: active ? 1.05 : 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.cagedBtn,
          {
            backgroundColor: active ? activeColor : isDark ? "#374151" : "#fff",
            borderColor: active ? "transparent" : isDark ? "#6b7280" : "#d6d3d1",
          },
        ]}
        activeOpacity={0.7}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: active ? "#fff" : isDark ? "#f3f4f6" : "#44403c",
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// コードレイヤーCAGEDモード用ボタン（CAGEDレイヤーとは独立）
function ChordCagedButton({
  label,
  active,
  isDark,
  onPress,
}: {
  label: string;
  active: boolean;
  isDark: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(active ? 1.05 : 1)).current;
  const prevActive = useRef(active);

  if (prevActive.current !== active) {
    prevActive.current = active;
    scale.stopAnimation();
    scale.setValue(0.8);
    Animated.spring(scale, {
      toValue: active ? 1.05 : 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={[
          styles.cagedBtn,
          {
            backgroundColor: active
              ? isDark
                ? "#e5e7eb"
                : "#1c1917"
              : isDark
                ? "#1f2937"
                : "#fafaf9",
            borderColor: active ? "transparent" : isDark ? "#374151" : "#d6d3d1",
          },
        ]}
        activeOpacity={0.7}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: active ? (isDark ? "#1c1917" : "#fff") : isDark ? "#f3f4f6" : "#44403c",
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export interface LayerControlsProps {
  theme: Theme;
  rootNote: string;
  accidental: Accidental;
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
  cagedColor: string;
  chordColor: string;
  colorPickerRef?: React.RefObject<View | null>;
  toggleRef?: React.RefObject<View | null>;
  tabRowRef?: React.RefObject<View | null>;
  cardAreaRef?: React.RefObject<View | null>;
}

export default function LayerControls({
  theme,
  rootNote,
  accidental,
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
  cagedColor,
  chordColor,
  colorPickerRef,
  toggleRef,
  tabRowRef,
  cardAreaRef,
}: LayerControlsProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<MobileTab>("scale");
  const [cagedPickerVisible, setCagedPickerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevTabIdx = useRef(0);
  const touchStartX = useRef(0);
  const lastTabTapRef = useRef(0);

  // Swipe by direction: -1 = left swipe (next), 1 = right swipe (prev)
  const swipeTabRef = useRef<(dir: -1 | 1) => void>(() => {});
  swipeTabRef.current = (dir: -1 | 1) => {
    const oldIdx = prevTabIdx.current;
    const newIdx =
      dir === -1 ? (oldIdx + 1) % TABS.length : (oldIdx - 1 + TABS.length) % TABS.length;
    const newTab = TABS[newIdx];
    slideAnim.setValue(dir === -1 ? 300 : -300);
    setActiveTab(newTab);
    prevTabIdx.current = newIdx;
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  // Switch to specific tab (from tab button press)
  const switchTab = (newTab: MobileTab) => {
    const newIdx = TABS.indexOf(newTab);
    const oldIdx = prevTabIdx.current;
    if (newIdx === oldIdx) return;
    const direction = newIdx > oldIdx ? 1 : -1;
    slideAnim.setValue(direction * 300);
    setActiveTab(newTab);
    prevTabIdx.current = newIdx;
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 15 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        Math.abs(gs.dx) > 15 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
      onPanResponderGrant: (e) => {
        touchStartX.current = e.nativeEvent.pageX;
      },
      onPanResponderRelease: (_, gs) => {
        if (Math.abs(gs.dx) < 40) return;
        swipeTabRef.current(gs.dx < 0 ? -1 : 1);
      },
    }),
  ).current;

  const tabPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 20 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2,
      onPanResponderRelease: (_, gs) => {
        if (Math.abs(gs.dx) < 40) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (gs.dx > 0) {
          // Swipe right → all layers ON
          setShowScale(true);
          setShowCaged(true);
          setShowChord(true);
        } else {
          // Swipe left → all layers OFF
          setShowScale(false);
          setShowCaged(false);
          setShowChord(false);
        }
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
    { value: "caged", label: t("options.chordDisplayMode.caged") },
    { value: "triad", label: t("options.chordDisplayMode.triad") },
    { value: "diatonic", label: t("options.chordDisplayMode.diatonic") },
  ];
  const triadInversionOptions = TRIAD_INVERSION_OPTIONS.map(({ value }) => ({
    value,
    label: t(`options.triadInversions.${value}`),
  }));
  const suffixMap: Record<string, string> = {
    Major: "",
    Minor: "m",
    "7th": "7",
    maj7: "maj7",
    m7: "m7",
    "m7(b5)": "m7(b5)",
    dim7: "dim",
    "m(maj7)": "m(maj7)",
  };
  const diatonicCodeOptions = (DIATONIC_CHORDS[diatonicScaleType] ?? []).map(({ value }) => {
    const chord = getDiatonicChord(rootIndex, diatonicScaleType, value);
    return {
      value,
      label: `${value} (${notes[chord.rootIndex]}${suffixMap[chord.chordType] ?? chord.chordType})`,
    };
  });

  const placeholderOptions = [{ value: "", label: "—" }];
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
    chordDisplayMode === "diatonic"
      ? diatonicKeyOptions
      : chordDisplayMode === "triad"
        ? triadInversionOptions
        : placeholderOptions;
  const thirdValue =
    chordDisplayMode === "diatonic"
      ? diatonicKeyType
      : chordDisplayMode === "triad"
        ? triadInversion
        : "";
  const fourthOptions =
    chordDisplayMode === "diatonic" ? diatonicChordSizeOptions : placeholderOptions;
  const fourthValue = chordDisplayMode === "diatonic" ? diatonicChordSize : "";

  // Card background/border depending on layer on/off state
  const getCardStyle = (layerOn: boolean) => {
    if (layerOn) {
      return isDark
        ? { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "#111111" }
        : { borderColor: "#e7e5e4", backgroundColor: "#fafaf9" };
    }
    return isDark
      ? { borderColor: "rgba(255,255,255,0.05)", backgroundColor: "#0d0d0d" }
      : { borderColor: "rgba(231,229,228,0.6)", backgroundColor: "#f5f5f4" };
  };

  const getContentOpacity = (layerOn: boolean) => (layerOn ? 1 : 0.45);

  const sectionLabel = (text: string) => (
    <Text style={[styles.sectionLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>{text}</Text>
  );

  // ── Scale card ──────────────────────────────────────────────────
  const scaleCard = (
    <View style={[styles.card, getCardStyle(showScale)]}>
      <View style={styles.cardToggle} ref={toggleRef as any}>
        <ToggleSwitch
          active={showScale}
          onPress={() => setShowScale(!showScale)}
          disabled={false}
          isDark={isDark}
          activeColor={scaleColor}
        />
      </View>
      <View style={{ opacity: getContentOpacity(showScale), flex: 1 }}>
        {/* Content */}
        <View style={styles.cardCenter}>
          <View style={{ alignSelf: "stretch", gap: 6 }}>
            {sectionLabel(t("mobileControls.scaleKind"))}
            <DropdownSelect
              theme={theme}
              value={scaleType}
              onChange={setScaleType}
              options={scaleOptions}
              disabled={!showScale}
              fullWidth
              variant="plain"
            />
          </View>
        </View>
      </View>
    </View>
  );

  // ── CAGED card ──────────────────────────────────────────────────
  const cagedCard = (
    <View style={[styles.card, getCardStyle(showCaged)]}>
      <View style={styles.cardToggle}>
        <ToggleSwitch
          active={showCaged}
          onPress={() => setShowCaged(!showCaged)}
          disabled={false}
          isDark={isDark}
          activeColor={cagedColor}
        />
      </View>
      <View style={{ opacity: getContentOpacity(showCaged), flex: 1 }}>
        <View style={styles.cardCenter}>
          <View style={{ alignItems: "center", gap: 8 }}>
            {sectionLabel(t("mobileControls.cagedForms"))}
            <View style={styles.cagedRow}>
              {CAGED_ORDER.map((key) => {
                const active = cagedForms.has(key);
                const cagedDisabled = !showCaged;
                return (
                  <CagedButton
                    key={key}
                    label={key}
                    active={active}
                    disabled={cagedDisabled}
                    isDark={isDark}
                    activeColor={cagedColor}
                    onPress={() => {
                      if (!cagedDisabled) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        toggleCagedForm(key);
                      }
                    }}
                  />
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
      <View style={styles.cardToggle}>
        <ToggleSwitch
          active={showChord}
          onPress={() => setShowChord(!showChord)}
          disabled={false}
          isDark={isDark}
          activeColor={chordColor}
        />
      </View>
      <View style={{ opacity: getContentOpacity(showChord), flex: 1 }}>
        {/* 2x2 grid of dropdowns */}
        <View style={styles.chordGrid}>
          <View style={styles.chordGridCell}>
            {sectionLabel(t("controls.displayMode"))}
            <DropdownSelect
              theme={theme}
              value={chordDisplayMode}
              onChange={setChordDisplayMode}
              options={chordDisplayOptions}
              disabled={!showChord}
              fullWidth
              variant="plain"
            />
          </View>
          <View style={styles.chordGridCell}>
            {sectionLabel(
              chordDisplayMode === "power" || chordDisplayMode === "caged"
                ? ""
                : chordDisplayMode === "diatonic"
                  ? t("controls.degree")
                  : t("controls.chord"),
            )}
            {chordDisplayMode === "caged" ? (
              <>
                <TouchableOpacity
                  onPress={() => setCagedPickerVisible(true)}
                  disabled={!showChord}
                  style={[styles.cagedTrigger, { opacity: showChord ? 1 : 0.45 }]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: isDark ? "#fff" : "#1c1917",
                    }}
                  >
                    {[...cagedForms].join(", ") || "—"}
                  </Text>
                  <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
                    <Path
                      d="M3 6l5 5 5-5"
                      stroke={isDark ? "#6b7280" : "#a8a29e"}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
                <Modal
                  visible={cagedPickerVisible}
                  transparent
                  animationType="none"
                  onRequestClose={() => setCagedPickerVisible(false)}
                >
                  <Pressable
                    style={styles.cagedPickerOverlay}
                    onPress={() => setCagedPickerVisible(false)}
                  >
                    <Pressable
                      style={[
                        styles.cagedPickerMenu,
                        {
                          backgroundColor: isDark
                            ? "rgba(17,24,39,0.97)"
                            : "rgba(250,250,249,0.97)",
                          borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4",
                        },
                      ]}
                    >
                      <View style={styles.cagedPickerRow}>
                        {CHORD_CAGED_ORDER.map((key) => {
                          const active = cagedForms.has(key);
                          return (
                            <ChordCagedButton
                              key={key}
                              label={key}
                              active={active}
                              isDark={isDark}
                              onPress={() => toggleCagedForm(key)}
                            />
                          );
                        })}
                      </View>
                    </Pressable>
                  </Pressable>
                </Modal>
              </>
            ) : (
              <DropdownSelect
                theme={theme}
                value={chordValue}
                onChange={chordDisplayMode === "diatonic" ? setDiatonicDegree : setChordType}
                options={chordValueOptions}
                disabled={!showChord || chordDisplayMode === "power"}
                fullWidth
                variant="plain"
              />
            )}
          </View>
          <View style={styles.chordGridCell}>
            {sectionLabel(
              chordDisplayMode === "diatonic"
                ? t("controls.key")
                : chordDisplayMode === "triad"
                  ? t("controls.inversion")
                  : "",
            )}
            <DropdownSelect
              theme={theme}
              value={thirdValue}
              onChange={chordDisplayMode === "diatonic" ? setDiatonicKeyType : setTriadInversion}
              options={thirdOptions}
              disabled={
                !showChord || (chordDisplayMode !== "diatonic" && chordDisplayMode !== "triad")
              }
              fullWidth
              variant="plain"
            />
          </View>
          <View style={styles.chordGridCell}>
            {sectionLabel(chordDisplayMode === "diatonic" ? t("controls.chordType") : "")}
            <DropdownSelect
              theme={theme}
              value={fourthValue}
              onChange={setDiatonicChordSize}
              options={fourthOptions}
              disabled={!showChord || chordDisplayMode !== "diatonic"}
              fullWidth
              variant="plain"
            />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tab buttons (Scale / CAGED / Chord) — swipe right=all ON, left=all OFF */}
      <View ref={tabRowRef as any} style={styles.tabRow} {...tabPanResponder.panHandlers}>
        {[
          {
            tab: "scale" as MobileTab,
            label: t("layers.scale"),
            on: showScale,
            color: scaleColor,
          },
          {
            tab: "caged" as MobileTab,
            label: t("layers.caged"),
            on: showCaged,
            color: cagedColor,
          },
          {
            tab: "chord" as MobileTab,
            label: t("layers.chord"),
            on: showChord,
            color: chordColor,
          },
        ].map(({ tab, label, on, color }) => {
          const isCurrent = activeTab === tab;
          const toggleLayer = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (tab === "scale") setShowScale(!showScale);
            else if (tab === "caged") setShowCaged(!showCaged);
            else setShowChord(!showChord);
          };
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                const now = Date.now();
                if (isCurrent && now - lastTabTapRef.current < 300) {
                  toggleLayer();
                } else {
                  switchTab(tab);
                }
                lastTabTapRef.current = now;
              }}
              disabled={false}
              style={styles.tabBtn}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isCurrent
                      ? isDark
                        ? "#f3f4f6"
                        : "#1c1917"
                      : isDark
                        ? "#6b7280"
                        : "#a8a29e",
                    fontWeight: isCurrent ? "600" : "400",
                  },
                ]}
              >
                {label}
              </Text>
              <View
                style={[
                  styles.tabDot,
                  {
                    backgroundColor: on ? color : isDark ? "#4b5563" : "#d6d3d1",
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Swipeable card area */}
      <View ref={cardAreaRef as any} {...panResponder.panHandlers} style={{ overflow: "hidden" }}>
        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
          {activeTab === "scale" && scaleCard}
          {activeTab === "caged" && cagedCard}
          {activeTab === "chord" && chordCard}
        </Animated.View>
      </View>
    </View>
  );
}

const CARD_HEIGHT = 185;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
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
  cardToggle: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
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
  cagedTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  cagedPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  cagedPickerMenu: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  cagedPickerRow: {
    flexDirection: "row",
    gap: 8,
  },
});
