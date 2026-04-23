import { useState, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
} from "react-native";
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
  resetDescRef?: React.MutableRefObject<(() => void) | null>;
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
  { mode: "capo", icon: "capo", titleKey: "finder.homeCapoTitle", descKey: "finder.homeCapoDesc" },
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
  {
    mode: "progression-analysis",
    icon: "bar-chart",
    titleKey: "finder.homeProgressionAnalysisTitle",
    descKey: "finder.homeProgressionAnalysisDesc",
  },
  {
    mode: "scale-compat",
    icon: "music-note",
    titleKey: "finder.homeScaleCompatTitle",
    descKey: "finder.homeScaleCompatDesc",
  },
];

export default function FinderSelection({ theme, onSelect, resetDescRef }: SelectionProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const [showDesc, setShowDesc] = useState(false);
  const descAnim = useRef(new Animated.Value(0)).current;

  const normalOpacity = descAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  const resetDesc = () => {
    descAnim.setValue(0);
    setShowDesc(false);
  };

  if (resetDescRef) {
    resetDescRef.current = resetDesc;
  }

  const toggleDesc = () => {
    if (showDesc) {
      Animated.timing(descAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() =>
        setShowDesc(false),
      );
    } else {
      setShowDesc(true);
      descAnim.setValue(0);
      Animated.timing(descAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
  };

  return (
    <View style={styles.root}>
      <Pressable
        style={[styles.infoBtn, { borderColor: colors.border, backgroundColor: colors.pageBg }]}
        onPress={toggleDesc}
        hitSlop={12}
      >
        <Text style={[styles.infoBtnText, { color: colors.textSubtle }]}>i</Text>
      </Pressable>

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.pageBg }}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {MODES.map(({ mode, icon, titleKey, descKey }) => (
            <View key={mode} style={styles.cell}>
              <TouchableOpacity
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
                <Animated.View style={[styles.layer, { opacity: normalOpacity }]}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.pageBg }]}>
                    <Icon name={icon} size={28} color={colors.textStrong} />
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.textStrong }]}>
                    {t(titleKey)}
                  </Text>
                </Animated.View>

                {showDesc && (
                  <Animated.View style={[styles.layer, { opacity: descAnim }]}>
                    <Text style={[styles.cardTitle, { color: colors.textStrong }]}>
                      {t(titleKey)}
                    </Text>
                    <Text style={[styles.descText, { color: colors.textSubtle }]}>
                      {t(descKey)}
                    </Text>
                  </Animated.View>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  infoBtn: {
    position: "absolute",
    top: 12,
    right: 16,
    zIndex: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  infoBtnText: {
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "600",
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  cell: {
    width: "48%",
  },
  card: {
    width: "100%",
    height: 120,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  descText: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
