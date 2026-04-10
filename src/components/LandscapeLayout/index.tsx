import { View, Text, StatusBar, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MainPracticePane from "../../screens/MainPractice";
import type { MainPracticePaneProps } from "../../screens/MainPractice";
import type { Theme } from "../../types";

type LandscapeLayoutProps = Omit<MainPracticePaneProps, "isLandscape" | "disableAnimation"> & {
  winHeight: number;
  theme: Theme;
};

export default function LandscapeLayout({
  winHeight,
  theme,
  ...mainPaneProps
}: LandscapeLayoutProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isDark = theme === "dark";
  const bgColor = isDark ? "#030712" : "#f3f4f6";

  const availH = winHeight - 44;
  const fbScale = (availH * 0.85) / 200;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: bgColor,
          paddingTop: insets.top,
          paddingLeft: Math.max(insets.left, 16),
        },
      ]}
    >
      <StatusBar
        translucent
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
      />

      <View style={[styles.infoOverlay, { marginTop: Math.max(0, (availH - 200 * fbScale) / 2) }]}>
        <View style={styles.infoBar}>
          <Text
            style={[styles.infoText, { color: isDark ? "#e5e7eb" : "#1c1917", marginRight: 6 }]}
          >
            {t("header.root")} {mainPaneProps.rootNote}
          </Text>
        </View>

        {mainPaneProps.layers.some((l) => l.enabled) && (
          <View style={styles.infoBar}>
            {mainPaneProps.layers
              .filter((l) => l.enabled)
              .map((l) => {
                let label: string;
                if (l.type === "custom") {
                  const items =
                    l.customMode === "note" ? [...l.selectedNotes] : [...l.selectedDegrees];
                  label = items.length > 0 ? items.join(", ") : t("layers.custom");
                } else if (l.type === "scale") {
                  label = t(
                    `options.scale.${l.scaleType.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase())}`,
                  );
                } else if (l.type === "caged") {
                  const ct = l.cagedChordType === "minor" ? "m" : "";
                  label = `CAGED${ct}: ${[...l.cagedForms].join(", ") || "-"}`;
                } else {
                  const mode = t(`options.chordDisplayMode.${l.chordDisplayMode}`);
                  if (l.chordDisplayMode === "diatonic") {
                    label = `${mode}(${l.diatonicDegree} ${t(`options.diatonicKey.${l.diatonicKeyType === "natural-minor" ? "naturalMinor" : "major"}`)} ${t(`options.diatonicChordSize.${l.diatonicChordSize}`)})`;
                  } else if (l.chordDisplayMode === "triad") {
                    label = `${mode}(${l.chordType} ${t(`options.triadInversions.${l.triadInversion}`)})`;
                  } else if (l.chordDisplayMode === "on-chord") {
                    label = `${mode}: ${l.onChordName}`;
                  } else {
                    label = `${mode}: ${l.chordType}`;
                  }
                }
                return (
                  <View key={l.id} style={[styles.infoPill, { backgroundColor: l.color }]}>
                    <Text style={styles.infoPillText}>{label}</Text>
                  </View>
                );
              })}
          </View>
        )}
      </View>

      <View style={styles.fretboardWrapper}>
        <View
          style={{
            transform: [{ scale: fbScale }],
            transformOrigin: "top left",
          }}
        >
          <MainPracticePane {...mainPaneProps} theme={theme} isLandscape disableAnimation />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  infoOverlay: {},
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "700",
  },
  infoPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.15)",
  },
  infoPillText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  fretboardWrapper: {
    flex: 1,
    overflow: "hidden",
  },
});
