import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import "../../i18n";
import type { Accidental, BaseLabelMode, Theme } from "../../types";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { getColors } from "../../themes/design";
import PillButton from "../ui/PillButton";
import Icon from "../ui/Icon";
import NotePickerButton from "../ui/NotePickerButton";

interface FretboardControlsProps {
  theme: Theme;
  rootNote: string;
  accidental: Accidental;
  baseLabelMode: BaseLabelMode;
  onRootNoteChange: (note: string) => void;
  onBaseLabelModeChange: (mode: BaseLabelMode) => void;
  onPresetPress?: () => void;
  perLayerRoot?: boolean;
  onPerLayerRootChange?: (value: boolean) => void;
}

export default function FretboardControls({
  theme,
  rootNote,
  accidental,
  baseLabelMode,
  onRootNoteChange,
  onBaseLabelModeChange,
  onPresetPress,
  perLayerRoot,
  onPerLayerRootChange,
}: FretboardControlsProps) {
  const { t, i18n } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);

  return (
    <View style={[styles.container, { position: "relative" }]}>
      <View style={styles.left}>
        <SegmentedToggle
          theme={theme}
          value={baseLabelMode}
          onChange={onBaseLabelModeChange}
          options={[
            { value: "note" as BaseLabelMode, label: t("header.note") },
            { value: "degree" as BaseLabelMode, label: t("header.degree") },
          ]}
          size="compact"
          segmentWidth={i18n.language === "en" ? 72 : 56}
        />
      </View>

      <View style={styles.right}>
        <NotePickerButton
          theme={theme}
          accidental={accidental}
          value={rootNote}
          onChange={onRootNoteChange}
          label={t("header.root")}
          sheetTitle={t("header.root")}
          perLayerRoot={perLayerRoot}
          onPerLayerRootChange={onPerLayerRootChange}
          disabled={perLayerRoot}
        />

        {onPresetPress && (
          <PillButton
            isDark={isDark}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPresetPress();
            }}
          >
            <Icon name="bookmark" size={16} color={colors.textSubtle} />
          </PillButton>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
