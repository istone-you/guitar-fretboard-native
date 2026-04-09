import { StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import type { Theme, QuizQuestion } from "../../../types";
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
            bgColor = isSelected ? (isDark ? "#e5e7eb" : "#1c1917") : isDark ? "#374151" : "#fff";
            borderColor = isSelected ? "transparent" : isDark ? "#4b5563" : "#d6d3d1";
            textColor = isSelected ? (isDark ? "#1c1917" : "#fff") : isDark ? "#e5e7eb" : "#1c1917";
          } else {
            if (isCorrectChoice) {
              bgColor = "#16a34a";
              borderColor = "transparent";
              textColor = "#fff";
            } else if (isSelected && !isCorrectChoice) {
              bgColor = "#ef4444";
              borderColor = "transparent";
              textColor = "#fff";
            } else {
              bgColor = isDark ? "#374151" : "#f5f5f4";
              borderColor = isDark ? "#4b5563" : "#e7e5e4";
              textColor = isDark ? "#6b7280" : "#a8a29e";
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
          style={[styles.submitBtn, { backgroundColor: isDark ? "#e5e7eb" : "#1c1917" }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.submitBtnText, { color: isDark ? "#1c1917" : "#fff" }]}>
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
    paddingVertical: 8,
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
