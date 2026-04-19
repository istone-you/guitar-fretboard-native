import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../i18n";
import type { Theme } from "../../types";
import PillButton from "../../components/ui/PillButton";

interface QuizKindOption {
  value: string;
  label: string;
}

interface QuizSelectionScreenProps {
  theme: Theme;
  quizKindOptions: QuizKindOption[];
  onSelect: (value: string) => void;
  onShowStats: () => void;
}

// iOS system accent colors per quiz mode
const QUIZ_GROUPS: {
  modeKey: string;
  icon: string;
  accent: string;
  options: { value: string; descKey: string }[];
}[] = [
  {
    modeKey: "quiz.mode.note",
    icon: "♩",
    accent: "#007AFF",
    options: [
      { value: "note-choice", descKey: "quiz.desc.noteChoice" },
      { value: "note-fretboard", descKey: "quiz.desc.noteFretboard" },
    ],
  },
  {
    modeKey: "quiz.mode.degree",
    icon: "°",
    accent: "#5856D6",
    options: [
      { value: "degree-choice", descKey: "quiz.desc.degreeChoice" },
      { value: "degree-fretboard", descKey: "quiz.desc.degreeFretboard" },
    ],
  },
  {
    modeKey: "quiz.mode.chord",
    icon: "♯",
    accent: "#FF9500",
    options: [
      { value: "chord-choice", descKey: "quiz.desc.chordIdentify" },
      { value: "chord-fretboard", descKey: "quiz.desc.chordFretboard" },
    ],
  },
  {
    modeKey: "quiz.mode.scale",
    icon: "≈",
    accent: "#34C759",
    options: [
      { value: "scale-choice", descKey: "quiz.desc.scaleNoteSelect" },
      { value: "scale-fretboard", descKey: "quiz.desc.scaleFretboard" },
    ],
  },
  {
    modeKey: "quiz.mode.diatonic",
    icon: "Ⅶ",
    accent: "#FF3B30",
    options: [{ value: "diatonic-all", descKey: "quiz.desc.diatonicAll" }],
  },
];

function QuizSelectionScreen({ theme, onSelect, onShowStats }: QuizSelectionScreenProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const insets = useSafeAreaInsets();

  const cardBg = isDark ? "#1c1c1e" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const titleColor = isDark ? "#f9fafb" : "#1c1917";
  const descColor = isDark ? "#8e8e93" : "#78716c";
  const statsIcon = isDark ? "#8e8e93" : "#78716c";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? "#000000" : "#ffffff" }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header row */}
      <View style={styles.titleRow}>
        {/* Stats pill button */}
        <PillButton
          isDark={isDark}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onShowStats();
          }}
          testID="quiz-stats-btn"
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M18 20V10" stroke={statsIcon} strokeWidth={2} strokeLinecap="round" />
            <Path d="M12 20V4" stroke={statsIcon} strokeWidth={2} strokeLinecap="round" />
            <Path d="M6 20v-6" stroke={statsIcon} strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <Text style={[styles.statsBtnText, { color: statsIcon }]}>{t("quiz.stats")}</Text>
        </PillButton>
      </View>

      {/* Quiz cards — one per mode×type combination (9 total) */}
      {QUIZ_GROUPS.flatMap((group) =>
        group.options.map((opt) => {
          const iconCircleBg = isDark ? `${group.accent}26` : `${group.accent}1A`;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(opt.value);
              }}
              activeOpacity={0.7}
              style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <View style={styles.cardInner}>
                <View style={[styles.iconCircle, { backgroundColor: iconCircleBg }]}>
                  <Text style={[styles.iconText, { color: group.accent }]}>{group.icon}</Text>
                </View>
                <View style={styles.textBlock}>
                  <Text style={[styles.modeLabel, { color: titleColor }]}>{t(group.modeKey)}</Text>
                  <Text style={[styles.modeDesc, { color: descColor }]}>{t(opt.descKey)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }),
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 0,
    gap: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  statsBtnText: {
    fontSize: 13,
    fontWeight: "500",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 20,
    fontWeight: "700",
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  modeDesc: {
    fontSize: 13,
    lineHeight: 17,
  },
});

interface QuizPaneProps {
  theme: Theme;
  quizKindOptions: QuizKindOption[];
  onQuizModeSelect: (value: string) => void;
  onShowStats: () => void;
}

export default function QuizPane({
  theme,
  quizKindOptions,
  onQuizModeSelect,
  onShowStats,
}: QuizPaneProps) {
  return (
    <QuizSelectionScreen
      theme={theme}
      quizKindOptions={quizKindOptions}
      onSelect={onQuizModeSelect}
      onShowStats={onShowStats}
    />
  );
}
