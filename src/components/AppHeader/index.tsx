import { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  PanResponder,
  Animated,
} from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { useTranslation } from "react-i18next";
import "../../i18n";
import type { Accidental, BaseLabelMode, Theme } from "../../types";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { DropdownSelect } from "../ui/DropdownSelect";
import { useRootStepper } from "../../hooks/useRootStepper";

import { changeLocale } from "../../i18n";

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
        if (newV !== valRef.current[0]) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
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
        if (newV !== valRef.current[1]) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
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

interface HeaderBarProps {
  theme: Theme;
  rootNote: string;
  accidental: Accidental;
  baseLabelMode: BaseLabelMode;
  showQuiz: boolean;
  showStats?: boolean;
  rootChangeDisabled?: boolean;
  onBaseLabelModeChange: (mode: BaseLabelMode) => void;
  onRootNoteChange: (note: string) => void;
  quizKindValue?: string;
  quizKindOptions?: { value: string; label: string }[];
  onQuizKindChange?: (value: string) => void;
  fretRange: [number, number];
  onThemeChange: (theme: Theme) => void;
  onFretRangeChange: (range: [number, number]) => void;
  onAccidentalChange: (accidental: Accidental) => void;
  leftHanded?: boolean;
  onLeftHandedChange?: (value: boolean) => void;
}

export default function HeaderBar({
  theme,
  rootNote,
  accidental,
  baseLabelMode,
  showQuiz,
  showStats = false,
  rootChangeDisabled = false,
  onBaseLabelModeChange,
  onRootNoteChange,
  quizKindValue,
  quizKindOptions,
  onQuizKindChange,
  fretRange,
  onThemeChange,
  onFretRangeChange,
  onAccidentalChange,
  leftHanded = false,
  onLeftHandedChange,
}: HeaderBarProps) {
  const { t, i18n } = useTranslation();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const isDark = theme === "dark";

  const overlayAnim = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(700)).current;

  // Label underline slide animation
  const underlineLeft = useRef(new Animated.Value(0)).current;
  const underlineWidth = useRef(new Animated.Value(0)).current;
  const labelLayouts = useRef<Record<string, { x: number; w: number }>>({});
  const prevMode = useRef(baseLabelMode);
  const underlineReady = useRef(false);

  if (prevMode.current !== baseLabelMode) {
    prevMode.current = baseLabelMode;
    const l = labelLayouts.current[baseLabelMode];
    if (l) {
      Animated.parallel([
        Animated.timing(underlineLeft, { toValue: l.x, duration: 300, useNativeDriver: false }),
        Animated.timing(underlineWidth, { toValue: l.w, duration: 300, useNativeDriver: false }),
      ]).start();
    }
  }

  // Root note bounce animation
  const rootScale = useRef(new Animated.Value(1)).current;
  const prevRootNote = useRef(rootNote);
  if (prevRootNote.current !== rootNote) {
    prevRootNote.current = rootNote;
    rootScale.stopAnimation();
    rootScale.setValue(0.8);
    Animated.spring(rootScale, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }

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

  const { stepNote } = useRootStepper({
    accidental,
    rootNote,
    rootChangeDisabled,
    onRootNoteChange,
  });

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
      {/* Root stepper (absolute left) — hidden when root change is disabled or on stats */}
      {!rootChangeDisabled && !showStats && (
        <View style={styles.stepperRow}>
          <TouchableOpacity onPress={() => stepNote(-1)} style={styles.stepBtn} activeOpacity={0.7}>
            <Text style={[styles.stepBtnText, { color: isDark ? "#9ca3af" : "#78716c" }]}>‹</Text>
          </TouchableOpacity>
          <Animated.Text
            style={[
              styles.rootNote,
              {
                color: isDark ? "#fff" : "#1c1917",
                transform: [{ scale: rootScale }],
              },
            ]}
          >
            {rootNote}
          </Animated.Text>
          <TouchableOpacity onPress={() => stepNote(1)} style={styles.stepBtn} activeOpacity={0.7}>
            <Text style={[styles.stepBtnText, { color: isDark ? "#9ca3af" : "#78716c" }]}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quiz kind selector (center) */}
      {showQuiz && !showStats && quizKindValue && quizKindOptions && onQuizKindChange && (
        <View>
          <DropdownSelect
            theme={theme}
            value={quizKindValue}
            onChange={onQuizKindChange}
            options={quizKindOptions}
            variant="plain"
          />
        </View>
      )}

      {/* Note / Degree toggle (center) */}
      {!showQuiz && !showStats && (
        <View style={styles.labelToggle}>
          <TouchableOpacity
            onPress={() => onBaseLabelModeChange("note")}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              labelLayouts.current.note = { x, w: width };
              if (!underlineReady.current && baseLabelMode === "note") {
                underlineReady.current = true;
                underlineLeft.setValue(x);
                underlineWidth.setValue(width);
              }
            }}
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
            <View style={[styles.labelUnderline, { opacity: 0 }]} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onBaseLabelModeChange("degree")}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              labelLayouts.current.degree = { x, w: width };
              if (!underlineReady.current && baseLabelMode === "degree") {
                underlineReady.current = true;
                underlineLeft.setValue(x);
                underlineWidth.setValue(width);
              }
            }}
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
            <View style={[styles.labelUnderline, { opacity: 0 }]} />
          </TouchableOpacity>
          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              height: 2,
              borderRadius: 1,
              left: underlineLeft,
              width: underlineWidth,
              backgroundColor: isDark ? "#fff" : "#1c1917",
            }}
          />
        </View>
      )}

      {/* Settings button (absolute right) */}
      <TouchableOpacity
        testID="settings-button"
        onPress={openSettings}
        style={styles.headerBtn}
        activeOpacity={0.7}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
            stroke={isDark ? "#e5e7eb" : "#1c1917"}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
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

            {/* Left-handed */}
            {onLeftHandedChange && (
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                  {t("leftHanded")}
                </Text>
                <SegmentedToggle
                  theme={theme}
                  value={leftHanded}
                  onChange={onLeftHandedChange}
                  options={[
                    { value: false, label: "OFF" },
                    { value: true, label: "ON" },
                  ]}
                  size="compact"
                />
              </View>
            )}

            {/* Fret range */}
            <View style={[styles.settingRow, { borderBottomWidth: 0, paddingBottom: 4 }]}>
              <Text style={[styles.settingLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("settingsPanel.fretRange")}
              </Text>
            </View>
            <View style={{ paddingTop: 4, paddingBottom: 16, paddingHorizontal: 4 }}>
              <RangeSlider
                value={fretRange}
                min={0}
                max={14}
                onChange={onFretRangeChange}
                isDark={isDark}
              />
            </View>
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
    position: "relative",
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
});
