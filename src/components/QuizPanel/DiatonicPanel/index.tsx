import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import type { Theme, ChordType, QuizQuestion } from "../../../types";
import { getColors, SEMANTIC_COLORS, WHITE, ON_ACCENT } from "../../../themes/design";
import BounceButton from "../BounceButton";

interface DiatonicPanelProps {
  theme: Theme;
  question: QuizQuestion;
  answered: boolean;
  noteOptions: string[];
  diatonicAllAnswers: Record<string, { root: string; chordType: ChordType }>;
  diatonicSelectedRoot: string | null;
  diatonicSelectedChordType: ChordType | null;
  currentDiatonicDegree: string | null;
  diatonicAllFilled: boolean;
  onDiatonicAnswerRootSelect: (root: string) => void;
  onDiatonicAnswerTypeSelect: (chordType: ChordType) => void;
  onDiatonicDegreeCardClick: (degree: string) => void;
  onDiatonicSubmitAll: () => void;
}

export default function DiatonicPanel({
  theme,
  question,
  answered,
  noteOptions,
  diatonicAllAnswers,
  diatonicSelectedRoot,
  diatonicSelectedChordType,
  currentDiatonicDegree,
  diatonicAllFilled,
  onDiatonicAnswerRootSelect,
  onDiatonicAnswerTypeSelect,
  onDiatonicDegreeCardClick,
  onDiatonicSubmitAll,
}: DiatonicPanelProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);

  return (
    <View style={{ gap: 8 }}>
      {/* Degree cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {question.diatonicAnswers?.map((entry) => {
            const answer = diatonicAllAnswers[entry.degree];
            const isEditing = currentDiatonicDegree === entry.degree;
            return (
              <TouchableOpacity
                key={entry.degree}
                onPress={() => {
                  if (!answered) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onDiatonicDegreeCardClick(entry.degree);
                  }
                }}
                activeOpacity={0.7}
                style={[
                  styles.card,
                  {
                    borderColor:
                      isEditing && !answered
                        ? colors.primaryBtn
                        : isDark
                          ? colors.border2
                          : colors.borderStrong,
                    backgroundColor: answered
                      ? answer?.root === entry.root && answer?.chordType === entry.chordType
                        ? SEMANTIC_COLORS.success
                        : answer
                          ? SEMANTIC_COLORS.error
                          : colors.fillIdle
                      : isDark
                        ? colors.sheetBg
                        : WHITE,
                  },
                ]}
              >
                <Text style={{ fontSize: 13, color: colors.textSubtle }}>{entry.degree}</Text>
                {answer ? (
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "bold",
                      color: answered ? WHITE : colors.textStrong,
                    }}
                  >
                    {answer.root}
                    {answer.chordType === "Major"
                      ? ""
                      : answer.chordType === "Minor"
                        ? "m"
                        : answer.chordType}
                  </Text>
                ) : (
                  <Text style={{ fontSize: 14, color: colors.borderStrong }}>--</Text>
                )}
                {answered && (
                  <Text style={{ fontSize: 14, color: ON_ACCENT.text }}>
                    {entry.root}
                    {entry.chordType === "Major"
                      ? ""
                      : entry.chordType === "Minor"
                        ? "m"
                        : entry.chordType}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Root + type selection */}
      {!answered && currentDiatonicDegree != null && (
        <View style={{ gap: 8 }}>
          <View style={styles.choicesGrid}>
            {noteOptions.slice(0, 12).map((note) => (
              <BounceButton
                key={note}
                selected={note === diatonicSelectedRoot}
                onPress={() => onDiatonicAnswerRootSelect(note)}
                style={[
                  styles.choiceBtn,
                  {
                    backgroundColor:
                      note === diatonicSelectedRoot
                        ? colors.primaryBtn
                        : isDark
                          ? colors.fillIdle
                          : WHITE,
                    borderColor:
                      note === diatonicSelectedRoot ? "transparent" : colors.borderStrong,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color:
                      note === diatonicSelectedRoot ? colors.primaryBtnText : colors.textStrong,
                  }}
                >
                  {note}
                </Text>
              </BounceButton>
            ))}
          </View>
          {diatonicSelectedRoot != null && (
            <View style={styles.choicesGrid}>
              {(question.diatonicChordTypeOptions ?? []).map((ct) => (
                <BounceButton
                  key={ct}
                  selected={ct === diatonicSelectedChordType}
                  onPress={() => onDiatonicAnswerTypeSelect(ct)}
                  style={[
                    styles.choiceBtn,
                    {
                      backgroundColor:
                        ct === diatonicSelectedChordType
                          ? colors.primaryBtn
                          : isDark
                            ? colors.fillIdle
                            : WHITE,
                      borderColor: "transparent",
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color:
                        ct === diatonicSelectedChordType
                          ? colors.primaryBtnText
                          : colors.textStrong,
                    }}
                  >
                    {ct}
                  </Text>
                </BounceButton>
              ))}
            </View>
          )}
          {diatonicAllFilled && (
            <BounceButton
              selected={false}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onDiatonicSubmitAll();
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    borderCurve: "continuous",
    padding: 8,
    minWidth: 56,
    alignItems: "center",
    gap: 2,
  },
  choicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  choiceBtn: {
    borderRadius: 999,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 48,
    alignItems: "center",
  },
  submitBtn: {
    borderRadius: 999,
    borderCurve: "continuous",
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
