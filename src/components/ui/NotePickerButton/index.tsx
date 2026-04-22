import { useRef, useState } from "react";
import { Animated, View, Text, TouchableOpacity, StyleSheet, Switch } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import type { Accidental, Theme } from "../../../types";
import { getNotesByAccidental } from "../../../lib/fretboard";
import { getColors, radius, TOGGLE_COLORS } from "../../../themes/design";
import { getPillStyle } from "../PillButton";
import BottomSheetModal, { SHEET_HANDLE_CLEARANCE, useSheetHeight } from "../BottomSheetModal";
import SheetProgressiveHeader from "../SheetProgressiveHeader";
import GlassIconButton from "../GlassIconButton";
import NotePill from "../NotePill";

interface NotePickerButtonProps {
  theme: Theme;
  accidental: Accidental;
  value: string;
  onChange: (note: string) => void;
  label: string;
  sheetTitle: string;
  perLayerRoot?: boolean;
  onPerLayerRootChange?: (value: boolean) => void;
  disabled?: boolean;
}

export default function NotePickerButton({
  theme,
  accidental,
  value,
  onChange,
  label,
  sheetTitle,
  perLayerRoot,
  onPerLayerRootChange,
  disabled,
}: NotePickerButtonProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const sheetHeight = useSheetHeight();
  const [sheetVisible, setSheetVisible] = useState(false);

  const colors = getColors(isDark);
  const bgColor = colors.surface;
  const notes = getNotesByAccidental(accidental);

  const scale = useRef(new Animated.Value(1)).current;
  const prevValue = useRef(value);
  const prevDisabled = useRef(disabled);
  if (prevValue.current !== value || prevDisabled.current !== disabled) {
    prevValue.current = value;
    prevDisabled.current = disabled;
    scale.stopAnimation();
    scale.setValue(0.8);
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSheetVisible(true);
        }}
        activeOpacity={0.7}
      >
        <Animated.View style={[getPillStyle(colors), { transform: [{ scale }] }]}>
          <Text style={[styles.pillLabel, { color: colors.textSubtle }]}>{label}</Text>
          <Text style={[styles.pillText, { color: disabled ? colors.textMuted : colors.text }]}>
            {disabled ? "-" : value}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      <BottomSheetModal visible={sheetVisible} onClose={() => setSheetVisible(false)}>
        {({ close, dragHandlers }) => (
          <View
            style={[
              styles.sheet,
              { height: sheetHeight, backgroundColor: bgColor, borderColor: colors.border },
            ]}
          >
            <SheetProgressiveHeader
              isDark={isDark}
              bgColor={bgColor}
              dragHandlers={dragHandlers}
              style={{ paddingTop: SHEET_HANDLE_CLEARANCE }}
            >
              <View style={styles.headerRow}>
                <GlassIconButton
                  isDark={isDark}
                  onPress={close}
                  icon="close"
                  style={styles.headerSide}
                />
                <View style={styles.headerCenter}>
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>{sheetTitle}</Text>
                </View>
                <View style={styles.headerSide} />
              </View>
            </SheetProgressiveHeader>

            <View
              style={[styles.noteGrid, disabled && { opacity: 0.35 }]}
              pointerEvents={disabled ? "none" : "auto"}
            >
              {notes.map((note) => (
                <NotePill
                  key={note}
                  label={note}
                  selected={note === value}
                  activeBg={colors.chipSelectedBg}
                  activeText={colors.chipSelectedText}
                  inactiveBg={colors.chipUnselectedBg}
                  inactiveText={colors.text}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onChange(note);
                  }}
                />
              ))}
            </View>

            {onPerLayerRootChange !== undefined && (
              <View
                style={[
                  styles.settingsSection,
                  { borderTopColor: colors.border, borderColor: colors.border },
                ]}
              >
                <View style={[styles.settingsRow, { borderColor: colors.border }]}>
                  <Text style={[styles.settingsLabel, { color: colors.text }]}>
                    {t("header.perLayerRoot")}
                  </Text>
                  <Switch
                    value={perLayerRoot ?? false}
                    onValueChange={(v) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onPerLayerRootChange(v);
                    }}
                    trackColor={{ false: colors.borderStrong, true: TOGGLE_COLORS.on }}
                    ios_backgroundColor={colors.borderStrong}
                  />
                </View>
              </View>
            )}
          </View>
        )}
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  pillLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    paddingBottom: 32,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerSide: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  noteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
    justifyContent: "center",
  },
  settingsSection: {
    marginTop: 16,
    marginHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
});
