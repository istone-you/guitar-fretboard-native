import { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  PanResponder,
  Animated,
} from "react-native";
import { useTranslation } from "react-i18next";
import "../../i18n";
import type { Accidental, BaseLabelMode, Theme } from "../../types";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { DropdownSelect } from "../ui/DropdownSelect";
import { NOTES_SHARP, NOTES_FLAT } from "../../logic/fretboard";

const COLOR_PRESETS = [
  "#ff69b6",
  "#ff4d4d",
  "#ff8c00",
  "#ffd700",
  "#40e0d0",
  "#00bfff",
  "#0ea5e9",
  "#7c3aed",
  "#10b981",
  "#84cc16",
  "#f97316",
  "#ec4899",
];
import { changeLocale } from "../../i18n";

const SETTINGS_ICON_DARK = require("../../../public/settings_dark.jpg");
const SETTINGS_ICON_LIGHT = require("../../../public/settings.png");

const THUMB = 24;

// Dual-thumb range slider
function RangeSlider({
  value,
  min,
  max,
  onChange,
  isDark,
}: {
  value: [number, number];
  min: number;
  max: number;
  onChange: (range: [number, number]) => void;
  isDark: boolean;
}) {
  const twRef = useRef(0);
  const [tw, setTw] = useState(0);
  const valRef = useRef(value);
  valRef.current = value;

  const minStart = useRef({ x: 0, v: 0 });
  const minPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        minStart.current = { x: e.nativeEvent.pageX, v: valRef.current[0] };
      },
      onPanResponderMove: (e) => {
        const w = twRef.current;
        if (w <= THUMB) return;
        const dx = e.nativeEvent.pageX - minStart.current.x;
        const newV = Math.round(
          Math.max(
            min,
            Math.min(valRef.current[1] - 1, minStart.current.v + (dx / (w - THUMB)) * (max - min)),
          ),
        );
        onChange([newV, valRef.current[1]]);
      },
    }),
  ).current;

  const maxStart = useRef({ x: 0, v: 0 });
  const maxPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        maxStart.current = { x: e.nativeEvent.pageX, v: valRef.current[1] };
      },
      onPanResponderMove: (e) => {
        const w = twRef.current;
        if (w <= THUMB) return;
        const dx = e.nativeEvent.pageX - maxStart.current.x;
        const newV = Math.round(
          Math.max(
            valRef.current[0] + 1,
            Math.min(max, maxStart.current.v + (dx / (w - THUMB)) * (max - min)),
          ),
        );
        onChange([valRef.current[0], newV]);
      },
    }),
  ).current;

  const total = max - min;
  const minFrac = tw > THUMB ? (value[0] - min) / total : 0;
  const maxFrac = tw > THUMB ? (value[1] - min) / total : 1;
  const minLeft = minFrac * (tw - THUMB);
  const maxLeft = maxFrac * (tw - THUMB);
  const fillLeft = minLeft + THUMB / 2;
  const fillWidth = Math.max(0, maxLeft - minLeft);

  return (
    <View
      style={{ paddingVertical: 16, position: "relative" }}
      onLayout={(e) => {
        twRef.current = e.nativeEvent.layout.width;
        setTw(e.nativeEvent.layout.width);
      }}
    >
      {/* Track */}
      <View style={{ height: 4, borderRadius: 2, backgroundColor: isDark ? "#374151" : "#d6d3d1" }}>
        <View
          style={{
            position: "absolute",
            height: 4,
            left: fillLeft,
            width: fillWidth,
            borderRadius: 2,
            backgroundColor: isDark ? "#e5e7eb" : "#1c1917",
          }}
        />
      </View>
      {/* Min thumb */}
      <View
        style={{
          position: "absolute",
          top: 16 - THUMB / 2 + 2,
          left: minLeft,
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: isDark ? "#e5e7eb" : "#1c1917",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 3,
          elevation: 3,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 3,
        }}
        {...minPan.panHandlers}
      >
        <Text style={{ fontSize: 9, color: "#fff", fontWeight: "700" }}>{value[0]}</Text>
      </View>
      {/* Max thumb */}
      <View
        style={{
          position: "absolute",
          top: 16 - THUMB / 2 + 2,
          left: maxLeft,
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: isDark ? "#e5e7eb" : "#1c1917",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          elevation: 3,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 3,
        }}
        {...maxPan.panHandlers}
      >
        <Text style={{ fontSize: 9, color: "#fff", fontWeight: "700" }}>{value[1]}</Text>
      </View>
    </View>
  );
}

export interface HeaderBarProps {
  theme: Theme;
  rootNote: string;
  accidental: Accidental;
  baseLabelMode: BaseLabelMode;
  showQuiz: boolean;
  rootChangeDisabled?: boolean;
  rootStepperRef?: React.RefObject<View | null>;
  labelToggleRef?: React.RefObject<View | null>;
  onBaseLabelModeChange: (mode: BaseLabelMode) => void;
  onRootNoteChange: (note: string) => void;
  quizKindValue?: string;
  quizKindOptions?: { value: string; label: string }[];
  onQuizKindChange?: (value: string) => void;
  fretRange: [number, number];
  onThemeChange: (theme: Theme) => void;
  onFretRangeChange: (range: [number, number]) => void;
  onAccidentalChange: (accidental: Accidental) => void;
  onShowHowToUse: () => void;
  scaleColor: string;
  onScaleColorChange: (color: string) => void;
  cagedColor: string;
  onCagedColorChange: (color: string) => void;
  chordColor: string;
  onChordColorChange: (color: string) => void;
}

export default function HeaderBar({
  theme,
  rootNote,
  accidental,
  baseLabelMode,
  showQuiz,
  rootChangeDisabled = false,
  rootStepperRef,
  labelToggleRef,
  onBaseLabelModeChange,
  onRootNoteChange,
  quizKindValue,
  quizKindOptions,
  onQuizKindChange,
  fretRange,
  onThemeChange,
  onFretRangeChange,
  onAccidentalChange,
  onShowHowToUse,
  scaleColor,
  onScaleColorChange,
  cagedColor,
  onCagedColorChange,
  chordColor,
  onChordColorChange,
}: HeaderBarProps) {
  const { t, i18n } = useTranslation();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [colorPickerTarget, setColorPickerTarget] = useState<"scale" | "caged" | "chord" | null>(
    null,
  );
  const isDark = theme === "dark";

  const overlayAnim = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(700)).current;

  const openSettings = () => {
    setSettingsVisible(true);
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(panelAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  };

  const closeSettings = () => {
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(panelAnim, { toValue: 700, duration: 240, useNativeDriver: true }),
    ]).start(() => setSettingsVisible(false));
  };

  const handleLocaleChange = (locale: "ja" | "en") => {
    void changeLocale(locale);
  };

  const notes: string[] = [...(accidental === "sharp" ? NOTES_SHARP : NOTES_FLAT)];
  const currentIndex = notes.indexOf(rootNote);
  const stepNote = (dir: 1 | -1) => {
    if (rootChangeDisabled) return;
    const next = (currentIndex + dir + 12) % 12;
    onRootNoteChange(notes[next]);
  };

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: isDark ? "#111111" : "#fafaf9",
          borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4",
        },
      ]}
    >
      {/* Root stepper (absolute left) */}
      <View ref={rootStepperRef as any} style={styles.stepperRow}>
        <TouchableOpacity
          onPress={() => stepNote(-1)}
          disabled={rootChangeDisabled}
          style={[styles.stepBtn, rootChangeDisabled && styles.disabled]}
          activeOpacity={0.7}
        >
          <Text style={[styles.stepBtnText, { color: isDark ? "#9ca3af" : "#78716c" }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.rootNote, { color: isDark ? "#fff" : "#1c1917" }]}>{rootNote}</Text>
        <TouchableOpacity
          onPress={() => stepNote(1)}
          disabled={rootChangeDisabled}
          style={[styles.stepBtn, rootChangeDisabled && styles.disabled]}
          activeOpacity={0.7}
        >
          <Text style={[styles.stepBtnText, { color: isDark ? "#9ca3af" : "#78716c" }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Quiz kind selector (center) */}
      {showQuiz && quizKindValue && quizKindOptions && onQuizKindChange && (
        <DropdownSelect
          theme={theme}
          value={quizKindValue}
          onChange={onQuizKindChange}
          options={quizKindOptions}
          variant="plain"
        />
      )}

      {/* Note / Degree toggle (center) */}
      {!showQuiz && (
        <View ref={labelToggleRef as any} style={styles.labelToggle}>
          <TouchableOpacity
            onPress={() => onBaseLabelModeChange("note")}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text
              style={[
                styles.labelToggleText,
                {
                  color:
                    baseLabelMode === "note"
                      ? isDark
                        ? "#fff"
                        : "#1c1917"
                      : isDark
                        ? "#6b7280"
                        : "#a8a29e",
                  fontWeight: baseLabelMode === "note" ? "700" : "400",
                },
              ]}
            >
              {t("header.note")}
            </Text>
            {baseLabelMode === "note" && (
              <View
                style={[styles.labelUnderline, { backgroundColor: isDark ? "#fff" : "#1c1917" }]}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onBaseLabelModeChange("degree")}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text
              style={[
                styles.labelToggleText,
                {
                  color:
                    baseLabelMode === "degree"
                      ? isDark
                        ? "#fff"
                        : "#1c1917"
                      : isDark
                        ? "#6b7280"
                        : "#a8a29e",
                  fontWeight: baseLabelMode === "degree" ? "700" : "400",
                },
              ]}
            >
              {t("header.degree")}
            </Text>
            {baseLabelMode === "degree" && (
              <View
                style={[styles.labelUnderline, { backgroundColor: isDark ? "#fff" : "#1c1917" }]}
              />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Settings button (absolute right) */}
      <TouchableOpacity
        testID="settings-button"
        onPress={openSettings}
        style={styles.headerBtn}
        activeOpacity={0.7}
      >
        <Image
          source={isDark ? SETTINGS_ICON_DARK : SETTINGS_ICON_LIGHT}
          style={styles.settingsIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <Modal
        visible={settingsVisible}
        transparent
        animationType="none"
        onRequestClose={closeSettings}
      >
        {/* Overlay fades in separately */}
        <Animated.View style={[styles.modalOverlay, { opacity: overlayAnim }]}>
          <Pressable style={{ flex: 1 }} onPress={closeSettings} />
        </Animated.View>

        {/* Panel slides up separately */}
        <Animated.View
          style={[
            styles.settingsPanel,
            {
              backgroundColor: isDark ? "#1a1a1a" : "#fff",
              borderColor: isDark ? "#374151" : "#e7e5e4",
              transform: [{ translateY: panelAnim }],
            },
          ]}
        >
          <View style={styles.settingsHeader}>
            <Text style={[styles.settingsTitle, { color: isDark ? "#fff" : "#1c1917" }]}>
              {t("settings")}
            </Text>
            <TouchableOpacity onPress={closeSettings} activeOpacity={0.7}>
              <Text style={{ fontSize: 20, color: isDark ? "#9ca3af" : "#78716c" }}>✕</Text>
            </TouchableOpacity>
          </View>

          <View>
            {/* Theme */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("theme")}
              </Text>
              <SegmentedToggle
                theme={theme}
                value={theme}
                onChange={onThemeChange}
                options={[
                  { value: "dark" as Theme, label: t("dark") },
                  { value: "light" as Theme, label: t("light") },
                ]}
                size="compact"
              />
            </View>

            {/* Accidental */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("accidental")}
              </Text>
              <SegmentedToggle
                theme={theme}
                value={accidental}
                onChange={onAccidentalChange}
                options={[
                  { value: "sharp" as Accidental, label: "♯" },
                  { value: "flat" as Accidental, label: "♭" },
                ]}
                size="compact"
              />
            </View>

            {/* Language */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("language")}
              </Text>
              <SegmentedToggle
                theme={theme}
                value={(i18n.language === "en" ? "en" : "ja") as "ja" | "en"}
                onChange={handleLocaleChange}
                options={[
                  { value: "ja" as const, label: "JA" },
                  { value: "en" as const, label: "EN" },
                ]}
                size="compact"
              />
            </View>

            {/* Layer colors */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("layerColors")}
              </Text>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => setColorPickerTarget("scale")}
                  style={[styles.colorDot, { backgroundColor: scaleColor }]}
                />
                <TouchableOpacity
                  onPress={() => setColorPickerTarget("caged")}
                  style={[styles.colorDot, { backgroundColor: cagedColor }]}
                />
                <TouchableOpacity
                  onPress={() => setColorPickerTarget("chord")}
                  style={[styles.colorDot, { backgroundColor: chordColor }]}
                />
              </View>
            </View>
            <Modal
              visible={colorPickerTarget != null}
              transparent
              animationType="fade"
              onRequestClose={() => setColorPickerTarget(null)}
            >
              <Pressable style={styles.colorOverlay} onPress={() => setColorPickerTarget(null)}>
                <View
                  style={[styles.colorPicker, { backgroundColor: isDark ? "#1f2937" : "#fff" }]}
                >
                  <Text
                    style={[styles.colorPickerTitle, { color: isDark ? "#e5e7eb" : "#1c1917" }]}
                  >
                    {colorPickerTarget && t(`layers.${colorPickerTarget}`)}
                  </Text>
                  <View style={styles.colorGrid}>
                    {COLOR_PRESETS.map((preset) => (
                      <TouchableOpacity
                        key={preset}
                        onPress={() => {
                          if (colorPickerTarget === "scale") onScaleColorChange(preset);
                          else if (colorPickerTarget === "caged") onCagedColorChange(preset);
                          else onChordColorChange(preset);
                          setColorPickerTarget(null);
                        }}
                        style={[
                          styles.colorPresetDot,
                          { backgroundColor: preset },
                          preset ===
                            (colorPickerTarget === "scale"
                              ? scaleColor
                              : colorPickerTarget === "caged"
                                ? cagedColor
                                : chordColor) && styles.colorPresetSelected,
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </Pressable>
            </Modal>

            {/* Fret range */}
            <View style={[styles.settingRow, { borderBottomWidth: 0, paddingBottom: 4 }]}>
              <Text style={[styles.settingLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("settingsPanel.fretRange")}
              </Text>
              <Text style={[styles.fretRangeValue, { color: isDark ? "#e5e7eb" : "#1c1917" }]}>
                {fretRange[0]} – {fretRange[1]}
              </Text>
            </View>
            <View style={{ paddingBottom: 16, paddingHorizontal: 4 }}>
              <RangeSlider
                value={fretRange}
                min={0}
                max={14}
                onChange={onFretRangeChange}
                isDark={isDark}
              />
            </View>

            {/* How to use button */}
            <TouchableOpacity
              onPress={() => {
                closeSettings();
                onShowHowToUse();
              }}
              style={[styles.settingRow, { justifyContent: "center", borderBottomWidth: 0 }]}
              activeOpacity={0.7}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: isDark ? "#9ca3af" : "#4b5563" }}
              >
                {t("howToUse")}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    height: 44,
    borderBottomWidth: 1,
  },
  stepperRow: {
    position: "absolute",
    left: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  headerBtn: {
    position: "absolute",
    right: 12,
    padding: 6,
  },
  stepBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  stepBtnText: {
    fontSize: 20,
  },
  rootNote: {
    width: 28,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  disabled: {
    opacity: 0.4,
  },
  labelToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  labelToggleText: {
    fontSize: 15,
  },
  labelUnderline: {
    height: 2,
    borderRadius: 1,
    marginTop: 2,
  },
  settingsIcon: {
    width: 22,
    height: 22,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  settingsPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 40,
  },
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  settingLabel: {
    fontSize: 14,
  },
  fretRangeValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  colorOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  colorPicker: {
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    gap: 14,
  },
  colorPickerTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: 192,
    justifyContent: "center",
  },
  colorPresetDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorPresetSelected: {
    borderWidth: 3,
    borderColor: "#fff",
  },
});
