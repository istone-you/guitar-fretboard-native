import { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTranslation } from "react-i18next";
import "../../i18n";
import type { Accidental, BaseLabelMode, Theme } from "../../types";
import { useRootStepper } from "../../hooks/useRootStepper";
import SettingsModal, { type SettingsModalRef } from "./SettingsModal";

interface HeaderBarProps {
  theme: Theme;
  rootNote: string;
  accidental: Accidental;
  baseLabelMode: BaseLabelMode;
  showQuiz: boolean;
  rootChangeDisabled?: boolean;
  onBaseLabelModeChange: (mode: BaseLabelMode) => void;
  onRootNoteChange: (note: string) => void;
  onBack?: () => void;
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
  rootChangeDisabled = false,
  onBaseLabelModeChange,
  onRootNoteChange,
  onBack,
  fretRange,
  onThemeChange,
  onFretRangeChange,
  onAccidentalChange,
  leftHanded = false,
  onLeftHandedChange,
}: HeaderBarProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const settingsModalRef = useRef<SettingsModalRef>(null);

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
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: isDark ? "#e5e7eb" : "#1c1917" }]}>‹</Text>
        </TouchableOpacity>
      )}

      {!rootChangeDisabled && !onBack && (
        <View style={styles.stepperRow}>
          <TouchableOpacity onPress={() => stepNote(-1)} style={styles.stepBtn} activeOpacity={0.7}>
            <Text style={[styles.stepBtnText, { color: isDark ? "#9ca3af" : "#78716c" }]}>‹</Text>
          </TouchableOpacity>
          <Animated.View
            style={[
              styles.rootPill,
              {
                backgroundColor: isDark ? "#1f2937" : "#e7e5e4",
                transform: [{ scale: rootScale }],
              },
            ]}
          >
            <Text style={[styles.rootNote, { color: isDark ? "#f9fafb" : "#1c1917" }]}>
              {rootNote}
            </Text>
          </Animated.View>
          <TouchableOpacity onPress={() => stepNote(1)} style={styles.stepBtn} activeOpacity={0.7}>
            <Text style={[styles.stepBtnText, { color: isDark ? "#9ca3af" : "#78716c" }]}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {!showQuiz && !onBack && (
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

      <TouchableOpacity
        testID="settings-button"
        onPress={() => settingsModalRef.current?.open()}
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

      <SettingsModal
        ref={settingsModalRef}
        theme={theme}
        accidental={accidental}
        fretRange={fretRange}
        leftHanded={leftHanded}
        onThemeChange={onThemeChange}
        onAccidentalChange={onAccidentalChange}
        onFretRangeChange={onFretRangeChange}
        onLeftHandedChange={onLeftHandedChange}
      />
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
  backBtn: {
    position: "absolute",
    left: 0,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 36,
    lineHeight: 42,
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
  rootPill: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rootNote: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "monospace",
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
});
