import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  CIRCLE_OVERLAY_COLORS,
  DIATONIC_FUNCTION_COLORS,
  RELATED_KEY_COLORS,
  getColors,
} from "../../../themes/design";
import type { Theme } from "../../../types";
import type { CircleOverlayKey } from "../CircleWheel";

interface OverlayLegendProps {
  theme: Theme;
  activeOverlay: CircleOverlayKey | null;
}

interface LegendItem {
  color: string;
  label: string;
}

function getLegendItems(activeOverlay: CircleOverlayKey, t: (key: string) => string): LegendItem[] {
  switch (activeOverlay) {
    case "relatedKeys":
      return [
        { color: RELATED_KEY_COLORS.tonic, label: t("circle.relation.tonic") },
        { color: RELATED_KEY_COLORS.dominant, label: t("circle.relation.dominant") },
        { color: RELATED_KEY_COLORS.subdominant, label: t("circle.relation.subdominant") },
        { color: RELATED_KEY_COLORS.parallel, label: t("circle.relation.parallel") },
      ];
    case "diatonic":
      return [
        { color: DIATONIC_FUNCTION_COLORS.T, label: t("circle.legend.tonicFn") },
        { color: DIATONIC_FUNCTION_COLORS.SD, label: t("circle.legend.subdominantFn") },
        { color: DIATONIC_FUNCTION_COLORS.D, label: t("circle.legend.dominantFn") },
      ];
    case "dominants":
      return [
        {
          color: CIRCLE_OVERLAY_COLORS.secondaryDominant,
          label: t("circle.legend.secondaryDominant"),
        },
      ];
    case "modalInterchange":
      return [
        {
          color: CIRCLE_OVERLAY_COLORS.modalInterchange,
          label: t("circle.legend.modalInterchange"),
        },
      ];
  }
}

export default function OverlayLegend({ theme, activeOverlay }: OverlayLegendProps) {
  const { t } = useTranslation();
  const colors = getColors(theme === "dark");

  if (!activeOverlay) return null;
  const items = getLegendItems(activeOverlay, t);

  return (
    <View
      testID="circle-overlay-legend"
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          <View style={[styles.swatch, { backgroundColor: item.color }]} />
          <Text style={[styles.label, { color: colors.textStrong }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignSelf: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
