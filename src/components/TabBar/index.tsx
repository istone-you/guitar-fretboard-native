import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import Svg, { Path, Text as SvgText, Circle, Line } from "react-native-svg";
import { useTranslation } from "react-i18next";
import "../../i18n";
import { getColors } from "../../themes/design";

interface TabBarProps {
  isDark: boolean;
  showQuiz: boolean;
  showFinder: boolean;
  insetBottom: number;
  onPressHome: () => void;
  onPressFinder: () => void;
  onPressQuiz: () => void;
}

export default function TabBar({
  isDark,
  showQuiz,
  showFinder,
  insetBottom,
  onPressHome,
  onPressFinder,
  onPressQuiz,
}: TabBarProps) {
  const { t } = useTranslation();
  const colors = getColors(isDark);
  const activeColor = colors.text;
  const inactiveColor = colors.textSubtle;

  const isHome = !showQuiz && !showFinder;
  const isFinder = showFinder;
  const isQuiz = showQuiz;

  const tabs = [
    {
      id: "home",
      isActive: isHome,
      onPress: onPressHome,
      testID: "tab-home",
      labelKey: "tabs.home",
    },
    {
      id: "finder",
      isActive: isFinder,
      onPress: onPressFinder,
      testID: "tab-finder",
      labelKey: "tabs.finder",
    },
    {
      id: "quiz",
      isActive: isQuiz,
      onPress: onPressQuiz,
      testID: "tab-quiz",
      labelKey: "tabs.quiz",
    },
  ];

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBorder,
          paddingBottom: Math.max(insetBottom, 8),
        },
      ]}
    >
      {tabs.map((tab) => {
        const color = tab.isActive ? activeColor : inactiveColor;
        return (
          <TouchableOpacity
            key={tab.id}
            testID={tab.testID}
            style={styles.tabItem}
            onPress={tab.onPress}
            activeOpacity={0.7}
          >
            {tab.isActive && (
              <View style={[styles.activeIndicator, { backgroundColor: activeColor }]} />
            )}
            <View style={styles.iconWrapper}>
              {tab.id === "home" && (
                <Image
                  source={
                    isDark
                      ? require("../../../public/guiter_dark.png")
                      : require("../../../public/guiter.png")
                  }
                  style={[styles.tabIcon, { tintColor: color }]}
                  resizeMode="contain"
                />
              )}
              {tab.id === "finder" && (
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={1.6} />
                  <Line
                    x1="16.5"
                    y1="16.5"
                    x2="22"
                    y2="22"
                    stroke={color}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                  />
                </Svg>
              )}
              {tab.id === "quiz" && (
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                    stroke={color}
                    strokeWidth={1.6}
                    strokeLinejoin="round"
                  />
                  <SvgText
                    x="12"
                    y="16"
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="bold"
                    fill={color}
                  >
                    Q
                  </SvgText>
                </Svg>
              )}
            </View>
            <Text style={[styles.tabLabel, { color }]}>{t(tab.labelKey)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    width: 32,
    height: 3,
    borderRadius: 999,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 4,
    letterSpacing: 0.2,
  },
});
