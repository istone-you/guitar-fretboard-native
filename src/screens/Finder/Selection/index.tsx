import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import type { Theme } from "../../../types";
import { getColors } from "../../../themes/design";
import Icon, { type IconName } from "../../../components/ui/Icon";
import type { FinderMode } from "../types";

interface SelectionProps {
  theme: Theme;
  onSelect: (mode: FinderMode) => void;
}

const MODES: {
  mode: FinderMode;
  icon: IconName;
  titleKey: string;
  descKey: string;
}[] = [
  {
    mode: "identify",
    icon: "music-note",
    titleKey: "finder.homeIdentifyTitle",
    descKey: "finder.homeIdentifyDesc",
  },
  {
    mode: "chord-list",
    icon: "chord-grid",
    titleKey: "finder.homeChordListTitle",
    descKey: "finder.homeChordListDesc",
  },
  {
    mode: "diatonic",
    icon: "bar-chart",
    titleKey: "finder.homeDiatonicTitle",
    descKey: "finder.homeDiatonicDesc",
  },
  {
    mode: "substitution",
    icon: "music-note",
    titleKey: "finder.homeSubTitle",
    descKey: "finder.homeSubDesc",
  },
  {
    mode: "capo",
    icon: "capo",
    titleKey: "finder.homeCapoTitle",
    descKey: "finder.homeCapoDesc",
  },
  {
    mode: "modulation",
    icon: "arrows-lr",
    titleKey: "finder.homeModulationTitle",
    descKey: "finder.homeModulationDesc",
  },
  {
    mode: "related-keys",
    icon: "network",
    titleKey: "finder.homeRelatedKeysTitle",
    descKey: "finder.homeRelatedKeysDesc",
  },
  {
    mode: "modes",
    icon: "rotate-cw",
    titleKey: "finder.homeModesTitle",
    descKey: "finder.homeModesDesc",
  },
];

export default function FinderSelection({ theme, onSelect }: SelectionProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.pageBg }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
    >
      {MODES.map(({ mode, icon, titleKey, descKey }) => (
        <TouchableOpacity
          key={mode}
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(mode);
          }}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? colors.border : colors.border2,
            },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.pageBg }]}>
            <Icon name={icon} size={32} color={colors.textStrong} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.textStrong }]}>{t(titleKey)}</Text>
          <Text style={[styles.cardDesc, { color: colors.textSubtle }]}>{t(descKey)}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  card: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  cardDesc: {
    fontSize: 14,
    textAlign: "center",
  },
});
