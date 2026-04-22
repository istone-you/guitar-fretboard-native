import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import type { Theme } from "../../../types";
import { getColors } from "../../../themes/design";
import { SegmentedToggle } from "../SegmentedToggle";

interface NoteDegreeModeToggleProps {
  theme: Theme;
  value: "note" | "degree";
  onChange: (mode: "note" | "degree") => void;
}

export default function NoteDegreeModeToggle({
  theme,
  value,
  onChange,
}: NoteDegreeModeToggleProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);

  return (
    <View
      style={[styles.section, { borderBottomColor: isDark ? colors.border2 : colors.borderStrong }]}
    >
      <View style={styles.row}>
        <SegmentedToggle
          theme={theme}
          value={value}
          onChange={(mode) => onChange(mode as "note" | "degree")}
          options={[
            { value: "note", label: t("noteFilter.title") },
            { value: "degree", label: t("degreeFilter.title") },
          ]}
          size="compact"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: 8,
  },
});
