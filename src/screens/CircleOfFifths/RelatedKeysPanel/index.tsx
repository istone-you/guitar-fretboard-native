import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { getNotesByAccidental } from "../../../lib/fretboard";
import { RELATED_KEY_COLORS, getColors } from "../../../themes/design";
import type { Accidental, Theme } from "../../../types";
import {
  getRelatedKeyCells,
  keyRootSemitone,
  type KeyType,
  type RelatedKeyRelation,
} from "../lib/circleData";
import type { CircleChordDetail } from "../index";

const RELATION_LABEL_KEY: Record<RelatedKeyRelation, string> = {
  tonic: "circle.relation.tonic",
  dominant: "circle.relation.dominant",
  subdominant: "circle.relation.subdominant",
  parallel: "circle.relation.parallel",
  doushu: "circle.relation.doushu",
};

interface RelatedKeysPanelProps {
  theme: Theme;
  accidental: Accidental;
  selectedIndex: number;
  keyType: KeyType;
  onChordTap?: (detail: CircleChordDetail) => void;
}

export default function RelatedKeysPanel({
  theme,
  accidental,
  selectedIndex,
  keyType,
  onChordTap,
}: RelatedKeysPanelProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const notes = getNotesByAccidental(accidental);

  const cells = getRelatedKeyCells(selectedIndex, keyType);

  return (
    <View
      testID="related-keys-panel"
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.grid}>
        {cells.map((cell) => {
          const rootIndex = keyRootSemitone(
            cell.position,
            cell.ring === "major" ? "major" : "minor",
          );
          const noteName = notes[rootIndex];
          const keyLabel = cell.ring === "minor" ? `${noteName}m` : noteName;
          const chordType = cell.ring === "major" ? "Major" : "Minor";
          const color = RELATED_KEY_COLORS[cell.relation];
          return (
            <TouchableOpacity
              key={cell.relation}
              testID={`related-keys-cell-${cell.relation}`}
              activeOpacity={0.7}
              onPress={() =>
                onChordTap?.({
                  rootIndex,
                  chordType,
                  chordName: keyLabel,
                  subtitle: t(RELATION_LABEL_KEY[cell.relation]),
                })
              }
              style={[styles.cell, { backgroundColor: colors.pageBg, borderColor: colors.border }]}
            >
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={[styles.relation, { color: colors.textSubtle }]}>
                {t(RELATION_LABEL_KEY[cell.relation])}
              </Text>
              <Text style={[styles.keyName, { color: colors.textStrong }]}>{keyLabel}</Text>
            </TouchableOpacity>
          );
        })}
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
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cell: {
    alignItems: "center",
    borderRadius: 10,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minWidth: 72,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  dot: {
    borderRadius: 5,
    borderCurve: "continuous",
    height: 10,
    width: 10,
  },
  relation: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  keyName: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});
