import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { DIATONIC_CHORDS, getNotesByAccidental } from "../../../lib/fretboard";
import { getColors } from "../../../themes/design";
import type { Accidental, ChordType, Theme } from "../../../types";
import { keyRootSemitone, type KeyType } from "../lib/circleData";
import type { CircleChordDetail } from "../index";

const CHORD_SUFFIX: Partial<Record<string, string>> = {
  Major: "",
  Minor: "m",
  dim: "°",
};

const MAJOR_SCALE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE_OFFSETS = [0, 2, 3, 5, 7, 8, 10];

interface KeyInfoPanelProps {
  theme: Theme;
  accidental: Accidental;
  selectedIndex: number;
  keyType: KeyType;
  onChordTap?: (detail: CircleChordDetail) => void;
}

export default function KeyInfoPanel({
  theme,
  accidental,
  selectedIndex,
  keyType,
  onChordTap,
}: KeyInfoPanelProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const notes = getNotesByAccidental(accidental);

  const rootSemitone = keyRootSemitone(selectedIndex, keyType);
  const scaleKey = keyType === "major" ? "major-triad" : "natural-minor-triad";
  const diatonicChords = DIATONIC_CHORDS[scaleKey] ?? [];

  const chordItems = diatonicChords.map((entry) => {
    const rootIndex = (rootSemitone + entry.offset) % 12;
    const chordRoot = notes[rootIndex];
    const suffix = CHORD_SUFFIX[entry.chordType] ?? entry.chordType;
    return {
      degree: entry.value,
      name: `${chordRoot}${suffix}`,
      chordType: entry.chordType as ChordType,
      rootIndex,
    };
  });

  const scaleOffsets = keyType === "major" ? MAJOR_SCALE_OFFSETS : MINOR_SCALE_OFFSETS;
  const scaleNotes = scaleOffsets.map((offset) => notes[(rootSemitone + offset) % 12]);

  return (
    <View
      testID="key-info-panel"
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>
        {t("circle.keyInfo.diatonicChords")}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chordRow}
      >
        {chordItems.map((item) => (
          <TouchableOpacity
            key={item.degree}
            testID={`key-info-chord-${item.degree}`}
            activeOpacity={0.7}
            onPress={() =>
              onChordTap?.({
                rootIndex: item.rootIndex,
                chordType: item.chordType,
                chordName: item.name,
                subtitle: item.degree,
              })
            }
            style={[
              styles.chordChip,
              { backgroundColor: colors.pageBg, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.degreeLabel, { color: colors.textSubtle }]}>{item.degree}</Text>
            <Text style={[styles.chordName, { color: colors.textStrong }]}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>
        {t("circle.keyInfo.scaleNotes")}
      </Text>
      <View style={styles.notesRow}>
        {scaleNotes.map((note) => (
          <Text
            key={note}
            testID={`key-info-note-${note}`}
            style={[styles.noteText, { color: colors.textStrong }]}
          >
            {note}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chordRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 2,
  },
  chordChip: {
    alignItems: "center",
    borderRadius: 8,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 44,
  },
  degreeLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  chordName: {
    fontSize: 13,
    fontWeight: "700",
  },
  notesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  noteText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
