import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import type { Theme, ChordType, QuizQuestion } from "../../../types";
import { getColors, SEMANTIC_COLORS, WHITE } from "../../../themes/design";
import BounceButton from "../BounceButton";

interface ChordPanelProps {
  theme: Theme;
  question: QuizQuestion;
  answered: boolean;
  quizSelectedChordRoot: string | null;
  quizSelectedChordType: ChordType | null;
  chordQuizTypes: ChordType[];
  noteOptions: string[];
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
  noteOptions,
  onChordQuizRootSelect,
  onChordQuizTypeSelect,
  onSubmitChordChoice,
}: ChordPanelProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);

  return (
    <View style={{ gap: 10 }}>
      {/* Root selection */}
      <View style={styles.choicesGrid}>
        {noteOptions.slice(0, 12).map((choice) => {
          const isCorrectChoice = choice === question.promptChordRoot;
          const isSelectedChoice = choice === quizSelectedChordRoot;
          let bgColor: string, borderColor: string, textColor: string;
          if (!answered) {
            bgColor = isSelectedChoice ? colors.primaryBtn : isDark ? colors.fillIdle : WHITE;
            borderColor = isSelectedChoice ? "transparent" : colors.borderStrong;
            textColor = isSelectedChoice ? colors.primaryBtnText : colors.textStrong;
          } else {
            if (isCorrectChoice) {
              bgColor = SEMANTIC_COLORS.success;
              borderColor = "transparent";
              textColor = WHITE;
            } else if (isSelectedChoice) {
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
                        ? colors.primaryBtn
                        : isDark
                          ? colors.fillIdle
                          : WHITE,
                      borderColor: isSelected ? "transparent" : colors.borderStrong,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceBtnText,
                      {
                        color: isSelected ? colors.primaryBtnText : colors.textStrong,
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
              style={[styles.submitBtn, { backgroundColor: colors.primaryBtn }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.submitBtnText, { color: colors.primaryBtnText }]}>
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
                      ? SEMANTIC_COLORS.success
                      : isSelected
                        ? SEMANTIC_COLORS.error
                        : colors.fillIdle,
                    borderWidth: 1,
                    borderColor: "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.choiceBtnText,
                    { color: isCorrect || isSelected ? WHITE : colors.textMuted },
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
