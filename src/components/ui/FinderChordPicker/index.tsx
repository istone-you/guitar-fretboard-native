import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import type { Accidental, Theme } from "../../../types";
import { getColors } from "../../../themes/design";
import NotePickerButton from "../NotePickerButton";

interface FinderChordPickerProps {
  theme: Theme;
  accidental: Accidental;
  rootNote: string;
  onRootChange: (note: string) => void;
  chordTypes: { value: string; label: string }[];
  selectedChordType: string;
  onChordTypeChange: (type: string) => void;
  borderColor: string;
}

export default function FinderChordPicker({
  theme,
  accidental,
  rootNote,
  onRootChange,
  chordTypes,
  selectedChordType,
  onChordTypeChange,
  borderColor,
}: FinderChordPickerProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);

  return (
    <View style={[styles.pickerRow, { borderBottomColor: borderColor }]}>
      <NotePickerButton
        theme={theme}
        accidental={accidental}
        value={rootNote}
        onChange={(note) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onRootChange(note);
        }}
        label={t("header.root")}
        sheetTitle={t("header.root")}
      />
      <View style={styles.chipsRow}>
        {chordTypes.map((chordType) => {
          const isSelected = selectedChordType === chordType.value;
          return (
            <TouchableOpacity
              key={chordType.value}
              testID={`note-pill-${chordType.label}`}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChordTypeChange(chordType.value);
              }}
              style={[
                styles.chip,
                isSelected
                  ? { backgroundColor: colors.chipSelectedBg, borderColor: colors.chipSelectedBg }
                  : { backgroundColor: colors.surface, borderColor: colors.borderStrong },
              ]}
              activeOpacity={0.7}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected
                      ? colors.chipSelectedText
                      : isDark
                        ? colors.textStrong
                        : colors.textDim,
                  },
                ]}
              >
                {chordType.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
    alignItems: "center",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  chip: {
    borderWidth: 2,
    borderRadius: 16,
    borderCurve: "continuous",
    height: 32,
    minWidth: 36,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
