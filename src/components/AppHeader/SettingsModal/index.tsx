import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable, Animated } from "react-native";
import { useTranslation } from "react-i18next";
import { changeLocale } from "../../../i18n";
import type { Accidental, Theme } from "../../../types";
import { SegmentedToggle } from "../../ui/SegmentedToggle";
import SlideToggle from "../../ui/SlideToggle";
import SheetProgressiveHeader from "../../ui/SheetProgressiveHeader";
import RangeSlider from "./RangeSlider";

export interface SettingsModalRef {
  open: () => void;
}

interface SettingsModalProps {
  theme: Theme;
  accidental: Accidental;
  fretRange: [number, number];
  leftHanded: boolean;
  onThemeChange: (theme: Theme) => void;
  onAccidentalChange: (accidental: Accidental) => void;
  onFretRangeChange: (range: [number, number]) => void;
  onLeftHandedChange?: (value: boolean) => void;
}

const SettingsModal = forwardRef<SettingsModalRef, SettingsModalProps>(function SettingsModal(
  {
    theme,
    accidental,
    fretRange,
    leftHanded,
    onThemeChange,
    onAccidentalChange,
    onFretRangeChange,
    onLeftHandedChange,
  },
  ref,
) {
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(72);
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(700)).current;
  const isDark = theme === "dark";
  const bgColor = isDark ? "#1a1a1a" : "#fff";

  const open = () => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(panelAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  };

  const close = () => {
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(panelAnim, { toValue: 700, duration: 240, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  useImperativeHandle(ref, () => ({ open }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
        <Pressable style={{ flex: 1 }} onPress={close} />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          {
            backgroundColor: bgColor,
            borderColor: isDark ? "#374151" : "#e7e5e4",
            transform: [{ translateY: panelAnim }],
          },
        ]}
      >
        {/* Rows content — paddingTop reserves space for the absolute glass header */}
        <View style={{ paddingHorizontal: 20, paddingTop: headerHeight }}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
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

          <View style={styles.row}>
            <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
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

          <View style={styles.row}>
            <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
              {t("language")}
            </Text>
            <SegmentedToggle
              theme={theme}
              value={(i18n.language === "en" ? "en" : "ja") as "ja" | "en"}
              onChange={(locale) => void changeLocale(locale)}
              options={[
                { value: "ja" as const, label: "JA" },
                { value: "en" as const, label: "EN" },
              ]}
              size="compact"
            />
          </View>

          {onLeftHandedChange && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("leftHanded")}
              </Text>
              <SlideToggle value={leftHanded} onValueChange={onLeftHandedChange} isDark={isDark} />
            </View>
          )}

          <View style={[styles.row, { borderBottomWidth: 0, paddingBottom: 4 }]}>
            <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
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
        {/* Absolute glass header — rows appear behind it */}
        <SheetProgressiveHeader
          isDark={isDark}
          bgColor={bgColor}
          onLayout={setHeaderHeight}
          style={styles.glassHeader}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: isDark ? "#fff" : "#1c1917" }]}>
              {t("settings")}
            </Text>
            <TouchableOpacity onPress={close} activeOpacity={0.7}>
              <Text style={{ fontSize: 20, color: isDark ? "#9ca3af" : "#78716c" }}>✕</Text>
            </TouchableOpacity>
          </View>
        </SheetProgressiveHeader>
      </Animated.View>
    </Modal>
  );
});

export default SettingsModal;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    paddingBottom: 40,
  },
  glassHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  label: {
    fontSize: 14,
  },
});
