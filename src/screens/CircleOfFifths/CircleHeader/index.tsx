import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import PillButton, { getPillStyle } from "../../../components/ui/PillButton";
import Icon from "../../../components/ui/Icon";
import BottomSheetModal, {
  SHEET_HANDLE_CLEARANCE,
  useSheetHeight,
} from "../../../components/ui/BottomSheetModal";
import SheetProgressiveHeader from "../../../components/ui/SheetProgressiveHeader";
import GlassIconButton from "../../../components/ui/GlassIconButton";
import {
  CIRCLE_OVERLAY_COLORS,
  DIATONIC_FUNCTION_COLORS,
  RELATED_KEY_COLORS,
  getColors,
} from "../../../themes/design";
import type { Accidental, Theme } from "../../../types";
import type { KeyType } from "../lib/circleData";
import type { CircleOverlayKey } from "../CircleWheel";

const OVERLAY_OPTIONS: ReadonlyArray<{
  key: CircleOverlayKey;
  labelKey: string;
  color: string;
}> = [
  { key: "relatedKeys", labelKey: "circle.overlay.relatedKeys", color: RELATED_KEY_COLORS.tonic },
  {
    key: "diatonic",
    labelKey: "circle.overlay.diatonic",
    color: DIATONIC_FUNCTION_COLORS.T,
  },
  {
    key: "dominants",
    labelKey: "circle.overlay.dominants",
    color: CIRCLE_OVERLAY_COLORS.secondaryDominant,
  },
  {
    key: "modalInterchange",
    labelKey: "circle.overlay.modalInterchange",
    color: CIRCLE_OVERLAY_COLORS.modalInterchange,
  },
];

interface CircleHeaderProps {
  theme: Theme;
  accidental: Accidental;
  rootNote: string;
  keyType: KeyType;
  onRootNoteChange: (note: string) => void;
  onKeyTypeChange: (keyType: KeyType) => void;
  onAddLayer?: () => void;
  isLayerFull?: boolean;
  activeOverlay: CircleOverlayKey | null;
  onActiveOverlayChange: (overlay: CircleOverlayKey | null) => void;
}

export default function CircleHeader({
  theme,
  accidental,
  rootNote,
  keyType,
  onRootNoteChange,
  onKeyTypeChange,
  onAddLayer,
  isLayerFull,
  activeOverlay,
  onActiveOverlayChange,
}: CircleHeaderProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const sheetHeight = useSheetHeight();
  const [sheetVisible, setSheetVisible] = useState(false);

  const keyTypeOptions: { value: KeyType; label: string }[] = [
    { value: "major", label: "Major" },
    { value: "minor", label: "Minor" },
  ];

  const activeOption = OVERLAY_OPTIONS.find((o) => o.key === activeOverlay) ?? null;

  return (
    <>
      <View style={[styles.container, { borderBottomColor: colors.borderStrong }]}>
        <View style={[styles.row, { borderBottomColor: colors.borderStrong }]}>
          <NotePickerButton
            theme={theme}
            accidental={accidental}
            value={rootNote}
            onChange={(note) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRootNoteChange(note);
            }}
            label={t("header.key")}
            sheetTitle={t("header.key")}
          />
          <SegmentedToggle
            theme={theme}
            value={keyType}
            onChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onKeyTypeChange(v as KeyType);
            }}
            options={keyTypeOptions}
            size="compact"
            segmentWidth={64}
          />
          {onAddLayer ? (
            <PillButton
              isDark={isDark}
              onPress={() => {
                if (isLayerFull) {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                  Alert.alert(t("finder.addToLayerFullTitle"), t("finder.addToLayerFull"));
                  return;
                }
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAddLayer();
              }}
              style={styles.uploadBtn}
            >
              <Icon name="upload" size={16} color={colors.textSubtle} />
            </PillButton>
          ) : null}
        </View>
        <View style={styles.overlayRow}>
          <TouchableOpacity
            testID="overlay-picker-button"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSheetVisible(true);
            }}
            activeOpacity={0.7}
            style={[getPillStyle(colors), activeOption && { borderColor: activeOption.color }]}
          >
            <Text style={[styles.pillLabel, { color: colors.textSubtle }]}>
              {t("circle.overlay.label")}
            </Text>
            <Text
              style={[
                styles.pillValue,
                { color: activeOption ? activeOption.color : colors.textMuted },
              ]}
            >
              {activeOption ? t(activeOption.labelKey) : t("circle.overlay.none")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <BottomSheetModal visible={sheetVisible} onClose={() => setSheetVisible(false)}>
        {({ close, dragHandlers }) => (
          <View
            style={[
              styles.sheet,
              {
                height: sheetHeight,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <SheetProgressiveHeader
              isDark={isDark}
              bgColor={colors.surface}
              dragHandlers={dragHandlers}
              style={{ paddingTop: SHEET_HANDLE_CLEARANCE }}
            >
              <View style={styles.sheetHeaderRow}>
                <GlassIconButton
                  isDark={isDark}
                  onPress={close}
                  icon="close"
                  style={styles.headerSide}
                />
                <View style={styles.headerCenter}>
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>
                    {t("circle.overlay.label")}
                  </Text>
                </View>
                <View style={styles.headerSide} />
              </View>
            </SheetProgressiveHeader>

            <View style={styles.listContainer}>
              {/* None option */}
              <TouchableOpacity
                testID="overlay-option-none"
                style={[styles.listRow, { borderBottomColor: colors.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onActiveOverlayChange(null);
                  close();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.colorDot, { backgroundColor: colors.borderStrong }]} />
                <Text style={[styles.listLabel, { color: colors.text }]}>
                  {t("circle.overlay.none")}
                </Text>
                {activeOverlay === null && <Icon name="check" size={16} color={colors.accent} />}
              </TouchableOpacity>

              {OVERLAY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  testID={`overlay-option-${option.key}`}
                  style={[styles.listRow, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onActiveOverlayChange(option.key);
                    close();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.colorDot, { backgroundColor: option.color }]} />
                  <Text style={[styles.listLabel, { color: colors.text }]}>
                    {t(option.labelKey)}
                  </Text>
                  {activeOverlay === option.key && (
                    <Icon name="check" size={16} color={colors.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  overlayRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  pillValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  uploadBtn: {
    paddingHorizontal: 8,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  sheetHeaderRow: {
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
  },
  listContainer: {
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  listLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
});
