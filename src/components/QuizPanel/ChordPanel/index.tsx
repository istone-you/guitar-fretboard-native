import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import type { Theme, ChordType, QuizQuestion } from "../../../types";
import BounceButton from "../BounceButton";

interface ChordPanelProps {
  theme: Theme;
  question: QuizQuestion;
  answered: boolean;
  quizSelectedChordRoot: string | null;
  quizSelectedChordType: ChordType | null;
  chordQuizTypes: ChordType[];
  onChordQuizRootSelect: (root: string) => void;
  onChordQuizTypeSelect: (chordType: ChordType) => void;
  onSubmitChordChoice: () => void;
}

export default function ChordPanel({
  theme,
  question,
  answered,
  quizSelectedChordRoot,
  quizSelectedChordType,
  chordQuizTypes,
  onChordQuizRootSelect,
  onChordQuizTypeSelect,
  onSubmitChordChoice,
}: ChordPanelProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";

  return (
    <View style={{ gap: 10 }}>
      {/* Root selection */}
      <View style={styles.choicesGrid}>
        {["A", "B", "C", "D", "E", "F", "G"].map((choice) => {
          const isCorrectChoice = choice === question.promptChordRoot;
          const isSelectedChoice = choice === quizSelectedChordRoot;
          let bgColor: string, borderColor: string, textColor: string;
          if (!answered) {
            bgColor = isSelectedChoice
              ? isDark
                ? "#e5e7eb"
                : "#1c1917"
              : isDark
                ? "#374151"
                : "#fff";
            borderColor = isSelectedChoice ? "transparent" : isDark ? "#4b5563" : "#d6d3d1";
            textColor = isSelectedChoice
              ? isDark
                ? "#1c1917"
                : "#fff"
              : isDark
                ? "#e5e7eb"
                : "#1c1917";
          } else {
            if (isCorrectChoice) {
              bgColor = "#16a34a";
              borderColor = "transparent";
              textColor = "#fff";
            } else if (isSelectedChoice) {
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
              selected={isSelectedChoice}
              onPress={() => onChordQuizRootSelect(choice)}
              style={[styles.choiceBtn, { backgroundColor: bgColor, borderColor, borderWidth: 1 }]}
            >
              <Text style={[styles.choiceBtnText, { color: textColor }]}>{choice}</Text>
            </BounceButton>
          );
        })}
      </View>

      {/* Chord type selection (before answer) */}
      {quizSelectedChordRoot != null && !answered && (
        <>
          <View style={styles.choicesGrid}>
            {(question.diatonicChordTypeOptions ?? chordQuizTypes).map((ct) => {
              const isSelected = ct === quizSelectedChordType;
              return (
                <BounceButton
                  key={ct}
                  selected={isSelected}
                  onPress={() => onChordQuizTypeSelect(ct)}
                  style={[
                    styles.choiceBtn,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? "#e5e7eb"
                          : "#1c1917"
                        : isDark
                          ? "#374151"
                          : "#fff",
                      borderColor: isSelected ? "transparent" : isDark ? "#4b5563" : "#d6d3d1",
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceBtnText,
                      {
                        color: isSelected
                          ? isDark
                            ? "#1c1917"
                            : "#fff"
                          : isDark
                            ? "#e5e7eb"
                            : "#1c1917",
                      },
                    ]}
                  >
                    {ct}
                  </Text>
                </BounceButton>
              );
            })}
          </View>
          {quizSelectedChordType != null && (
            <BounceButton
              selected={false}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSubmitChordChoice();
              }}
              style={[styles.submitBtn, { backgroundColor: isDark ? "#e5e7eb" : "#1c1917" }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.submitBtnText, { color: isDark ? "#1c1917" : "#fff" }]}>
                {t("quiz.submit")}
              </Text>
            </BounceButton>
          )}
        </>
      )}

      {/* Chord type result (after answer) */}
      {answered && (
        <View style={styles.choicesGrid}>
          {chordQuizTypes.map((ct) => {
            const isCorrect = ct === question.promptChordType;
            const isSelected = ct === quizSelectedChordType;
            return (
              <TouchableOpacity
                key={ct}
                disabled
                style={[
                  styles.choiceBtn,
                  {
                    backgroundColor: isCorrect
                      ? "#16a34a"
                      : isSelected
                        ? "#ef4444"
                        : isDark
                          ? "#374151"
                          : "#f5f5f4",
                    borderWidth: 1,
                    borderColor: "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.choiceBtnText,
                    { color: isCorrect || isSelected ? "#fff" : isDark ? "#6b7280" : "#a8a29e" },
                  ]}
                >
                  {ct}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
