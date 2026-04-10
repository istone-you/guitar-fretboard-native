import { View, TouchableOpacity, Image, StyleSheet } from "react-native";
import Svg, { Path, Text as SvgText, Circle, Line } from "react-native-svg";

interface TabBarProps {
  isDark: boolean;
  showQuiz: boolean;
  showStats: boolean;
  showFinder: boolean;
  insetBottom: number;
  onPressHome: () => void;
  onPressFinder: () => void;
  onPressQuiz: () => void;
  onPressStats: () => void;
}

export default function TabBar({
  isDark,
  showQuiz,
  showStats,
  showFinder,
  insetBottom,
  onPressHome,
  onPressFinder,
  onPressQuiz,
  onPressStats,
}: TabBarProps) {
  const activeColor = isDark ? "#e5e7eb" : "#1c1917";
  const inactiveColor = isDark ? "#6b7280" : "#a8a29e";
  const homeColor = !showQuiz && !showStats && !showFinder ? activeColor : inactiveColor;
  const finderColor = showFinder ? activeColor : inactiveColor;
  const quizColor = showQuiz ? activeColor : inactiveColor;
  const statsColor = showStats ? activeColor : inactiveColor;

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: isDark ? "#111111" : "#fafaf9",
          borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4",
          paddingBottom: Math.max(insetBottom, 8),
        },
      ]}
    >
      {/* Home */}
      <TouchableOpacity
        testID="tab-home"
        style={styles.tabItem}
        onPress={onPressHome}
        activeOpacity={0.7}
      >
        <Image
          source={
            isDark
              ? require("../../../public/guiter_dark.png")
              : require("../../../public/guiter.png")
          }
          style={[styles.tabIcon, { tintColor: homeColor }]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Finder */}
      <TouchableOpacity
        testID="tab-finder"
        style={styles.tabItem}
        onPress={onPressFinder}
        activeOpacity={0.7}
      >
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
          <Circle cx="11" cy="11" r="7" stroke={finderColor} strokeWidth={1.5} />
          <Line
            x1="16.5"
            y1="16.5"
            x2="22"
            y2="22"
            stroke={finderColor}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </Svg>
      </TouchableOpacity>

      {/* Quiz */}
      <TouchableOpacity
        testID="tab-quiz"
        style={styles.tabItem}
        onPress={onPressQuiz}
        activeOpacity={0.7}
      >
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
            stroke={quizColor}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <SvgText
            x="12"
            y="16"
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill={quizColor}
          >
            Q
          </SvgText>
        </Svg>
      </TouchableOpacity>

      {/* Stats */}
      <TouchableOpacity
        testID="tab-stats"
        style={styles.tabItem}
        onPress={onPressStats}
        activeOpacity={0.7}
      >
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
          <Path d="M18 20V10" stroke={statsColor} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M12 20V4" stroke={statsColor} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M6 20v-6" stroke={statsColor} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  tabIcon: {
    width: 28,
    height: 28,
  },
});
