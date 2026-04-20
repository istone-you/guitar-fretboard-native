import { StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import type { Theme, QuizQuestion } from "../../../types";
import { getColors, SEMANTIC_COLORS, WHITE } from "../../../themes/design";
import BounceButton from "../BounceButton";

interface ChoicePanelProps {
  theme: Theme;
  question: QuizQuestion;
  answered: boolean;
  quizSelectedChoices: string[];
  onAnswer: (answer: string) => void;
  onSubmitChoice: () => void;
}

export default function ChoicePanel({
  theme,
  question,
  answered,
  quizSelectedChoices,
  onAnswer,
  onSubmitChoice,
}: ChoicePanelProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.choicesGrid}>
        {question.choices.map((choice) => {
          const isSelected = quizSelectedChoices.includes(choice);
          const isCorrectChoice = question.correctNoteNames
            ? question.correctNoteNames.includes(choice)
            : choice === question.correct;
          let bgColor: string;
          let borderColor: string;
          let textColor: string;
          if (!answered) {
            bgColor = isSelected ? colors.primaryBtn : isDark ? colors.fillIdle : WHITE;
            borderColor = isSelected ? "transparent" : colors.borderStrong;
            textColor = isSelected ? colors.primaryBtnText : colors.textStrong;
          } else {
            if (isCorrectChoice) {
              bgColor = SEMANTIC_COLORS.success;
              borderColor = "transparent";
              textColor = WHITE;
            } else if (isSelected && !isCorrectChoice) {
              bgColor = SEMANTIC_COLORS.error;
              borderColor = "transparent";
              textColor = WHITE;
            } else {
              bgColor = colors.fillIdle;
              borderColor = isDark ? colors.borderStrong : colors.border2;
              textColor = colors.textMuted;
            }
          }
          return (
            <BounceButton
              key={choice}
              selected={isSelected}
              onPress={() => !answered && onAnswer(choice)}
              style={[styles.choiceBtn, { backgroundColor: bgColor, borderColor, borderWidth: 1 }]}
            >
              <Text style={[styles.choiceBtnText, { color: textColor }]}>{choice}</Text>
            </BounceButton>
          );
        })}
      </View>
      {!answered && quizSelectedChoices.length > 0 && (
        <BounceButton
          selected={false}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSubmitChoice();
          }}
          style={[styles.submitBtn, { backgroundColor: colors.primaryBtn }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.submitBtnText, { color: colors.primaryBtnText }]}>
            {t("quiz.submit")}
          </Text>
        </BounceButton>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  choicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  choiceBtn: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 48,
    alignItems: "center",
  },
  choiceBtnText: {
    fontSize: 15,
    fontWeight: "500",
  },
  submitBtn: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: "center",
    alignSelf: "center",
  },
  submitBtnText: {
    fontWeight: "600",
    fontSize: 14,
  },
});
