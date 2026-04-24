import { Alert, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import PillButton from "../../../components/ui/PillButton";
import Icon from "../../../components/ui/Icon";
import { getColors } from "../../../themes/design";
import type { Accidental, Theme } from "../../../types";
import type { KeyType } from "../lib/circleData";
import OverlayToggleBar from "../OverlayToggleBar";
import type { CircleOverlayKey } from "../CircleWheel";

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

  const keyTypeOptions: { value: KeyType; label: string }[] = [
    { value: "major", label: "Major" },
    { value: "minor", label: "Minor" },
  ];

  return (
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
      <OverlayToggleBar
        theme={theme}
        activeOverlay={activeOverlay}
        onChange={onActiveOverlayChange}
      />
    </View>
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
  uploadBtn: {
    paddingHorizontal: 8,
  },
});
