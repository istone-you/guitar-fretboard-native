import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { getNotesByAccidental } from "../../../lib/fretboard";
import { CIRCLE_OVERLAY_COLORS, getColors } from "../../../themes/design";
import type { Accidental, Theme } from "../../../types";
import { getSecondaryDominantCells, keyRootSemitone, type KeyType } from "../lib/circleData";
import type { CircleChordDetail } from "../index";

interface DominantsPanelProps {
  theme: Theme;
  accidental: Accidental;
  selectedIndex: number;
  keyType: KeyType;
  onChordTap?: (detail: CircleChordDetail) => void;
}

export default function DominantsPanel({
  theme,
  accidental,
  selectedIndex,
  keyType,
  onChordTap,
}: DominantsPanelProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const notes = getNotesByAccidental(accidental);

  const cells = getSecondaryDominantCells(selectedIndex, keyType);

  return (
    <View
      testID="dominants-panel"
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>
        {t("circle.legend.secondaryDominant")}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {cells.map((cell) => {
          const rootIndex = keyRootSemitone(cell.secDomPosition, "major");
          const name = notes[rootIndex] + "7";
          return (
            <TouchableOpacity
              key={`secdom-${cell.targetDegreeLabel}`}
              testID={`dominants-panel-secdom-${cell.targetDegreeLabel}`}
              activeOpacity={0.7}
              onPress={() =>
                onChordTap?.({
                  rootIndex,
                  chordType: "7th",
                  chordName: name,
                  subtitle: `V/${cell.targetDegreeLabel}`,
                })
              }
              style={[
                styles.chip,
                {
                  backgroundColor: colors.pageBg,
                  borderColor: CIRCLE_OVERLAY_COLORS.secondaryDominant,
                },
              ]}
            >
              <Text style={[styles.degreeLabel, { color: colors.textSubtle }]}>
                {`V/${cell.targetDegreeLabel}`}
              </Text>
              <Text style={[styles.chordName, { color: colors.textStrong }]}>{name}</Text>
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
