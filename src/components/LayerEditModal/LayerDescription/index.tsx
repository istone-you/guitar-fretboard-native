import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import type { Theme, LayerConfig } from "../../../types";
import { getColors } from "../../../themes/design";
import {
  PROGRESSION_TEMPLATES,
  templateDisplayName,
  type ProgressionTemplate,
} from "../../../lib/fretboard";

/** Map ChordType values that contain special characters to safe i18n keys */
const CHORD_KEY_MAP: Record<string, string> = {
  "m7(b5)": "m7b5",
  "m(maj7)": "mmaj7",
  "#9": "sharp9",
  "#11": "sharp11",
  "add#11": "addSharp11",
  "m(add9)": "madd9",
};

/** Map ScaleType kebab-case to camelCase i18n keys */
function scaleI18nKey(scaleType: string): string {
  return scaleType.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

interface LayerDescriptionProps {
  theme: Theme;
  layer: LayerConfig;
  /** Show only the item-specific description (scale/chord), omitting the layer-type description */
  itemOnly?: boolean;
  progressionTemplates?: ProgressionTemplate[];
}

export default function LayerDescription({
  theme,
  layer,
  itemOnly,
  progressionTemplates,
}: LayerDescriptionProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const textColor = colors.textSubtle;
  const headingColor = colors.textStrong;
  const dividerColor = isDark ? colors.border : colors.border2;

  let layerDesc = "";
  let itemDesc = "";

  if (layer.type === "scale") {
    layerDesc = t("description.layer.scale");
    itemDesc = t(`description.scale.${scaleI18nKey(layer.scaleType)}`);
  } else if (layer.type === "chord") {
    const mode = layer.chordDisplayMode;
    if (mode === "form" || mode === "triad") {
      layerDesc = t(`description.layer.chord.${mode}`);
      const key = CHORD_KEY_MAP[layer.chordType] ?? layer.chordType;
      const desc = t(`description.chord.${key}`, { defaultValue: "" });
      if (desc) itemDesc = desc;
    } else {
      layerDesc = t("description.layer.chord.onChord");
    }
  } else if (layer.type === "caged") {
    layerDesc = t("description.layer.caged");
  } else if (layer.type === "progression") {
    layerDesc = t("description.layer.progression");
    const templateId = layer.progressionTemplateId ?? "251";
    const tp = (progressionTemplates ?? PROGRESSION_TEMPLATES).find((t_) => t_.id === templateId);
    if (tp?.description) {
      itemDesc = tp.description;
    } else {
      const desc = t(`description.progression.${templateId}`, { defaultValue: "" });
      if (desc) itemDesc = desc;
    }
  } else {
    layerDesc = t("description.layer.custom");
  }

  return (
    <View style={styles.container}>
      {!itemOnly && <Text style={[styles.text, { color: textColor }]}>{layerDesc}</Text>}
      {itemDesc !== "" && (
        <>
          {!itemOnly && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
          <Text style={[styles.heading, { color: headingColor }]}>
            {layer.type === "scale"
              ? t(`options.scale.${scaleI18nKey(layer.scaleType)}`)
              : layer.type === "progression"
                ? (() => {
                    const tp = (progressionTemplates ?? PROGRESSION_TEMPLATES).find(
                      (t_) => t_.id === (layer.progressionTemplateId ?? "251"),
                    );
                    return tp ? templateDisplayName(tp) : "";
                  })()
                : layer.chordType}
          </Text>
          <Text style={[styles.text, { color: textColor }]}>{itemDesc}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 4,
    gap: 6,
  },
  heading: {
    fontSize: 13,
    fontWeight: "600",
  },
  text: {
    fontSize: 13,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});
