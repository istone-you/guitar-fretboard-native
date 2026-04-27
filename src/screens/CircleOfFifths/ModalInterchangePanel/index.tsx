import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { getNotesByAccidental } from "../../../lib/fretboard";
import { CIRCLE_OVERLAY_COLORS, getColors } from "../../../themes/design";
import type { Accidental, ChordType, Theme } from "../../../types";
import {
  getModalInterchangeCells,
  keyRootSemitone,
  type KeyType,
  type RingName,
} from "../lib/circleData";
import type { CircleChordDetail } from "../index";

function chordNameFromRingPosition(
  ring: RingName,
  position: number,
  notes: readonly string[],
): string {
  if (ring === "major") {
    return notes[keyRootSemitone(position, "major")];
  }
  if (ring === "minor") {
    return notes[keyRootSemitone(position, "minor")] + "m";
  }
  // flat5: dim chord root is 11 semitones above the hosting major key root
  return notes[(keyRootSemitone(position, "major") + 11) % 12] + "°";
}

function chordRootIndexFromRingPosition(ring: RingName, position: number): number {
  if (ring === "major") return keyRootSemitone(position, "major");
  if (ring === "minor") return keyRootSemitone(position, "minor");
  return (keyRootSemitone(position, "major") + 11) % 12;
}

const RING_CHORD_TYPE: Record<RingName, ChordType> = {
  major: "Major",
  minor: "Minor",
  flat5: "dim",
};

interface ModalInterchangePanelProps {
  theme: Theme;
  accidental: Accidental;
  selectedIndex: number;
  keyType: KeyType;
  onChordTap?: (detail: CircleChordDetail) => void;
}

export default function ModalInterchangePanel({
  theme,
  accidental,
  selectedIndex,
  keyType,
  onChordTap,
}: ModalInterchangePanelProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const notes = getNotesByAccidental(accidental);

  const cells = getModalInterchangeCells(selectedIndex, keyType);

  return (
    <View
      testID="modal-interchange-panel"
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>
        {t("circle.legend.modalInterchange")}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {cells.map((cell) => {
          const chordName = chordNameFromRingPosition(cell.ring, cell.position, notes);
          return (
            <TouchableOpacity
              key={cell.degreeLabel}
              testID={`modal-interchange-panel-${cell.degreeLabel}`}
              activeOpacity={0.7}
              onPress={() =>
                onChordTap?.({
                  rootIndex: chordRootIndexFromRingPosition(cell.ring, cell.position),
                  chordType: RING_CHORD_TYPE[cell.ring],
                  chordName,
                  subtitle: cell.degreeLabel,
                })
              }
              style={[
                styles.chip,
                {
                  backgroundColor: colors.pageBg,
                  borderColor: CIRCLE_OVERLAY_COLORS.modalInterchange,
                },
              ]}
            >
              <Text style={[styles.degreeLabel, { color: colors.textSubtle }]}>
                {cell.degreeLabel}
              </Text>
              <Text style={[styles.chordName, { color: colors.textStrong }]}>{chordName}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 2,
  },
  chip: {
    alignItems: "center",
    borderRadius: 8,
    borderCurve: "continuous",
    borderWidth: 1,
    minWidth: 48,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  degreeLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  chordName: {
    fontSize: 13,
    fontWeight: "700",
  },
});
