import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import type { Theme } from "../../../types";
import PillButton from "../../../components/ui/PillButton";
import { getColors, QUIZ_MODE_COLORS, BLACK } from "../../../themes/design";

interface QuizKindOption {
  value: string;
  label: string;
}

interface QuizSelectionScreenProps {
  theme: Theme;
  quizKindOptions: QuizKindOption[];
  onQuizModeSelect: (value: string) => void;
  onShowStats: () => void;
}

const QUIZ_GROUPS: {
  modeKey: string;
  icon: string;
  accent: string;
  options: { value: string; descKey: string }[];
}[] = [
  {
    modeKey: "quiz.mode.note",
    icon: "♩",
    accent: QUIZ_MODE_COLORS.note,
    options: [
      { value: "note-choice", descKey: "quiz.desc.noteChoice" },
      { value: "note-fretboard", descKey: "quiz.desc.noteFretboard" },
    ],
  },
  {
    modeKey: "quiz.mode.degree",
    icon: "°",
    accent: QUIZ_MODE_COLORS.degree,
    options: [
      { value: "degree-choice", descKey: "quiz.desc.degreeChoice" },
      { value: "degree-fretboard", descKey: "quiz.desc.degreeFretboard" },
    ],
  },
  {
    modeKey: "quiz.mode.chord",
    icon: "♯",
    accent: QUIZ_MODE_COLORS.chord,
    options: [{ value: "chord-choice", descKey: "quiz.desc.chordIdentify" }],
  },
  {
    modeKey: "quiz.mode.scale",
    icon: "≈",
    accent: QUIZ_MODE_COLORS.scale,
    options: [{ value: "scale-choice", descKey: "quiz.desc.scaleNoteSelect" }],
  },
  {
    modeKey: "quiz.mode.diatonic",
    icon: "Ⅶ",
    accent: QUIZ_MODE_COLORS.diatonic,
    options: [{ value: "diatonic-all", descKey: "quiz.desc.diatonicAll" }],
  },
];

export default function QuizSelectionScreen({
  theme,
  onQuizModeSelect,
  onShowStats,
}: QuizSelectionScreenProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const insets = useSafeAreaInsets();
  const colors = getColors(isDark);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.pageBg }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header row */}
      <View style={styles.titleRow}>
        <PillButton
          isDark={isDark}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onShowStats();
          }}
          testID="quiz-stats-btn"
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M18 20V10" stroke={colors.textSubtle} strokeWidth={2} strokeLinecap="round" />
            <Path d="M12 20V4" stroke={colors.textSubtle} strokeWidth={2} strokeLinecap="round" />
            <Path d="M6 20v-6" stroke={colors.textSubtle} strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <Text style={[styles.statsBtnText, { color: colors.textSubtle }]}>{t("quiz.stats")}</Text>
        </PillButton>
      </View>

      {QUIZ_GROUPS.flatMap((group) =>
        group.options.map((opt) => {
          const iconCircleBg = isDark ? `${group.accent}26` : `${group.accent}1A`;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onQuizModeSelect(opt.value);
              }}
              activeOpacity={0.7}
              style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            >
              <View style={styles.cardInner}>
                <View style={[styles.iconCircle, { backgroundColor: iconCircleBg }]}>
                  <Text style={[styles.iconText, { color: group.accent }]}>{group.icon}</Text>
                </View>
                <View style={styles.textBlock}>
                  <Text style={[styles.modeLabel, { color: colors.text }]}>{t(group.modeKey)}</Text>
                  <Text style={[styles.modeDesc, { color: colors.textSubtle }]}>
                    {t(opt.descKey)}
                  </Text>
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
  statsBtnText: {},
  card: {
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: BLACK,
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
    borderCurve: "continuous",
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
