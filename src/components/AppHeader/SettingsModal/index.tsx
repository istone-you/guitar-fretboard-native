import { forwardRef, useImperativeHandle, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { changeLocale } from "../../../i18n";
import type { Accidental, Theme } from "../../../types";
import { SegmentedToggle } from "../../ui/SegmentedToggle";
import SlideToggle from "../../ui/SlideToggle";
import GlassIconButton from "../../ui/GlassIconButton";
import SheetProgressiveHeader from "../../ui/SheetProgressiveHeader";
import RangeSlider from "./RangeSlider";
import { getColors, radius } from "../../../themes/tokens";
import BottomSheetModal, { SHEET_HANDLE_CLEARANCE } from "../../ui/BottomSheetModal";

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
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const bgColor = colors.surface;

  useImperativeHandle(ref, () => ({ open: () => setVisible(true) }));

  return (
    <BottomSheetModal visible={visible} onClose={() => setVisible(false)}>
      {({ close, dragHandlers }) => (
        <View style={[styles.panel, { backgroundColor: bgColor, borderColor: colors.border }]}>
          {/* Rows content — paddingTop reserves space for the absolute glass header */}
          <View style={{ paddingHorizontal: 20, paddingTop: headerHeight }}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSubtle }]}>{t("theme")}</Text>
              <SegmentedToggle
                theme={theme}
                value={theme}
                onChange={onThemeChange}
                options={[
                  { value: "dark" as Theme, label: "☾" },
                  { value: "light" as Theme, label: "☀︎" },
                ]}
                size="compact"
              />
            </View>

            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSubtle }]}>{t("accidental")}</Text>
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
              <Text style={[styles.label, { color: colors.textSubtle }]}>{t("language")}</Text>
              <SegmentedToggle
                theme={theme}
                value={(i18n.language === "en" ? "en" : "ja") as "ja" | "en"}
                onChange={(locale) => void changeLocale(locale)}
                options={[
                  { value: "ja" as const, label: "ja" },
                  { value: "en" as const, label: "en" },
                ]}
                size="compact"
              />
            </View>

            {onLeftHandedChange && (
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textSubtle }]}>{t("leftHanded")}</Text>
                <SlideToggle
                  value={leftHanded}
                  onValueChange={onLeftHandedChange}
                  isDark={isDark}
                />
              </View>
            )}

            <View style={[styles.row, { borderBottomWidth: 0, paddingTop: 20, paddingBottom: 4 }]}>
              <Text style={[styles.label, { color: colors.textSubtle }]}>
                {t("settingsPanel.fretRange")}
              </Text>
            </View>
            <View style={{ paddingTop: 12, paddingBottom: 16, paddingHorizontal: 4 }}>
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
            dragHandlers={dragHandlers}
            style={styles.glassHeader}
          >
            <View style={styles.headerRow}>
              <GlassIconButton
                isDark={isDark}
                onPress={close}
                icon="close"
                testID="settings-close-btn"
              />
              <View style={styles.headerCenter}>
                <Text style={[styles.title, { color: colors.text }]}>{t("settings")}</Text>
              </View>
              <View style={styles.headerRight} />
            </View>
          </SheetProgressiveHeader>
        </View>
      )}
    </BottomSheetModal>
  );
});

export default SettingsModal;

const styles = StyleSheet.create({
  panel: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
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
    paddingTop: SHEET_HANDLE_CLEARANCE,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    width: 36,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
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
