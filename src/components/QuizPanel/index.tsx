import { useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../i18n";
import type { Theme, ChordType, ScaleType, QuizMode, QuizType, QuizQuestion } from "../../types";
import { DropdownSelect } from "../ui/DropdownSelect";
import { buildScaleOptions } from "../ui/scaleOptions";

function BounceButton({
  selected,
  onPress,
  style,
  activeOpacity = 0.7,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  style: any;
  activeOpacity?: number;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const mounted = useRef(false);
  const prevSelected = useRef(selected);

  if (!mounted.current) {
    mounted.current = true;
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  } else if (prevSelected.current !== selected) {
    prevSelected.current = selected;
    scale.stopAnimation();
    scale.setValue(0.8);
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={style}
        activeOpacity={activeOpacity}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

function BounceView({ children, style }: { children: React.ReactNode; style?: any }) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const mounted = useRef(false);

  if (!mounted.current) {
    mounted.current = true;
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }

  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

function ResultSection({ children }: { children: React.ReactNode }) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const mounted = useRef(false);

  if (!mounted.current) {
    mounted.current = true;
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={[styles.resultRow, { transform: [{ scale }] }]}>{children}</Animated.View>
  );
}

interface QuizPanelProps {
  theme: Theme;
  mode: QuizMode;
  quizType: QuizType;
  question: QuizQuestion;
  score: { correct: number; total: number };
  selectedAnswer: string | null;
  rootNote: string;
  quizSelectedChoices: string[];
  noteOptions: string[];
  quizSelectedChordRoot: string | null;
  quizSelectedChordType: ChordType | null;
  diatonicSelectedRoot: string | null;
  diatonicSelectedChordType: ChordType | null;
  diatonicAllAnswers: Record<string, { root: string; chordType: ChordType }>;
  diatonicEditingDegree: string | null;
  diatonicQuizKeyType: "major" | "natural-minor";
  diatonicQuizChordSize: "triad" | "seventh";
  chordQuizTypes: ChordType[];
  availableChordQuizTypes: ChordType[];
  scaleType: ScaleType;
  onChordQuizTypesChange: (value: ChordType[]) => void;
  onScaleTypeChange: (value: ScaleType) => void;
  onDiatonicQuizKeyTypeChange: (value: "major" | "natural-minor") => void;
  onDiatonicQuizChordSizeChange: (value: "triad" | "seventh") => void;
  onAnswer: (answer: string) => void;
  onSubmitChoice: () => void;
  onChordQuizRootSelect: (root: string) => void;
  onChordQuizTypeSelect: (chordType: ChordType) => void;
  onSubmitChordChoice: () => void;
  onDiatonicAnswerRootSelect: (root: string) => void;
  onDiatonicAnswerTypeSelect: (chordType: ChordType) => void;
  onDiatonicDegreeCardClick: (degree: string) => void;
  onDiatonicSubmitAll: () => void;
  onSubmitFretboard: () => void;
  onNextQuestion: () => void;
  onRetryQuestion: () => void;
  quizSelectedCells: { stringIdx: number; fret: number }[];
  fretboardAllStrings: boolean;
  onFretboardAllStringsChange: (value: boolean) => void;
}

export default function QuizPanel({
  theme,
  mode,
  quizType,
  question,
  score,
  selectedAnswer,
  rootNote,
  quizSelectedChoices,
  noteOptions,
  quizSelectedChordRoot,
  quizSelectedChordType,
  diatonicSelectedRoot,
  diatonicSelectedChordType,
  diatonicAllAnswers,
  diatonicEditingDegree,
  diatonicQuizKeyType,
  diatonicQuizChordSize,
  chordQuizTypes,
  availableChordQuizTypes,
  scaleType,
  onChordQuizTypesChange,
  onScaleTypeChange,
  onDiatonicQuizKeyTypeChange,
  onDiatonicQuizChordSizeChange,
  onAnswer,
  onSubmitChoice,
  onChordQuizRootSelect,
  onChordQuizTypeSelect,
  onSubmitChordChoice,
  onDiatonicAnswerRootSelect,
  onDiatonicAnswerTypeSelect,
  onDiatonicDegreeCardClick,
  onDiatonicSubmitAll,
  onSubmitFretboard,
  onNextQuestion,
  onRetryQuestion,
  quizSelectedCells,
  fretboardAllStrings,
  onFretboardAllStringsChange,
}: QuizPanelProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const answered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === question.correct;
  const stringNumber = 6 - question.stringIdx;

  const { options: scaleOptions } = buildScaleOptions(t);

  const scaleTypeKey = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

  const diatonicKeyOptions = [
    { value: "major", label: t("options.diatonicKey.major") },
    { value: "natural-minor", label: t("options.diatonicKey.naturalMinor") },
  ];
  const diatonicChordSizeOptions = [
    { value: "triad", label: t("options.diatonicChordSize.triad") },
    { value: "seventh", label: t("options.diatonicChordSize.seventh") },
  ];

  const handleChordTypeToggle = (value: ChordType) => {
    if (answered) return;
    if (chordQuizTypes.includes(value)) {
      if (chordQuizTypes.length === 1) return;
      onChordQuizTypesChange(chordQuizTypes.filter((t) => t !== value));
      return;
    }
    onChordQuizTypesChange([...chordQuizTypes, value]);
  };

  const currentDiatonicDegree = useMemo(() => {
    if (diatonicEditingDegree != null) return diatonicEditingDegree;
    return (
      question.diatonicAnswers?.find((entry) => diatonicAllAnswers[entry.degree] == null)?.degree ??
      null
    );
  }, [diatonicEditingDegree, diatonicAllAnswers, question.diatonicAnswers]);

  const diatonicAllFilled = useMemo(
    () =>
      question.diatonicAnswers?.every((entry) => diatonicAllAnswers[entry.degree] != null) ?? false,
    [diatonicAllAnswers, question.diatonicAnswers],
  );

  // Build question text
  const questionText = useMemo(() => {
    if (quizType === "fretboard") {
      if (mode === "degree") {
        return fretboardAllStrings
          ? t("quiz.questionDegreeAllStrings", { degree: question.correct, root: rootNote })
          : t("quiz.questionDegreeFretboard", {
              string: stringNumber,
              degree: question.correct,
              root: rootNote,
            });
      }
      if (mode === "scale") {
        return t("quiz.questionScaleFretboard", {
          root: question.promptScaleRoot,
          scale: t(`options.scale.${scaleTypeKey(question.promptScaleType ?? "")}`),
        });
      }
      if (mode === "chord") {
        return t("quiz.questionChordFretboard", { chord: question.promptChordLabel });
      }
      if (mode === "diatonic") return "";
      return fretboardAllStrings
        ? t("quiz.questionNoteAllStrings", { note: question.correct })
        : t("quiz.questionFretboard", { string: stringNumber, note: question.correct });
    }
    if (mode === "scale") {
      return t("quiz.questionScale", {
        root: question.promptScaleRoot,
        scale: t(`options.scale.${scaleTypeKey(question.promptScaleType ?? "")}`),
      });
    }
    if (mode === "diatonic") {
      return t("quiz.questionDiatonicAll", {
        root: rootNote,
        keyType: t(
          `options.diatonicKey.${question.promptDiatonicKeyType === "major" ? "major" : "naturalMinor"}`,
        ),
        chordSize: t(`options.diatonicChordSize.${question.promptDiatonicChordSize}`),
      });
    }
    if (mode === "chord") return t("quiz.questionChordIdentify");
    if (mode === "note")
      return t("quiz.questionNote", { string: stringNumber, fret: question.fret });
    return t("quiz.questionDegree", { string: stringNumber, fret: question.fret, root: rootNote });
  }, [mode, quizType, question, rootNote, stringNumber, fretboardAllStrings, t]);

  return (
    <View style={styles.card}>
      {/* Score */}
      <View style={styles.headerRow}>
        <Text style={[styles.score, { color: isDark ? "#9ca3af" : "#78716c" }]}>
          ✓ {score.correct} / {score.total}
        </Text>
      </View>

      {/* Chord quiz types filter */}
      {mode === "chord" && (
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
            {t("quiz.chordTypes.label")}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {availableChordQuizTypes.map((ct) => {
                const active = chordQuizTypes.includes(ct);
                return (
                  <BounceButton
                    key={`${ct}-${quizType}`}
                    selected={active}
                    onPress={() => handleChordTypeToggle(ct)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active
                          ? isDark
                            ? "#e5e7eb"
                            : "#1c1917"
                          : isDark
                            ? "#374151"
                            : "#fff",
                        borderColor: active ? "transparent" : isDark ? "#4b5563" : "#d6d3d1",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: active
                          ? isDark
                            ? "#1c1917"
                            : "#fff"
                          : isDark
                            ? "#e5e7eb"
                            : "#44403c",
                      }}
                    >
                      {ct}
                    </Text>
                  </BounceButton>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Scale type selector */}
      {mode === "scale" && (
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
            {t("layers.scale")}
          </Text>
          <DropdownSelect
            theme={theme}
            value={scaleType}
            onChange={(v) => onScaleTypeChange(v as ScaleType)}
            options={scaleOptions}
            variant="plain"
          />
        </View>
      )}

      {/* Fretboard mode single/all strings */}
      {quizType === "fretboard" && (mode === "note" || mode === "degree") && (
        <View style={styles.filterRow}>
          <DropdownSelect
            theme={theme}
            value={String(fretboardAllStrings)}
            onChange={(v) => !answered && onFretboardAllStringsChange(v === "true")}
            options={[
              { value: "false", label: t("quiz.fretboardMode.singleString") },
              { value: "true", label: t("quiz.fretboardMode.allStrings") },
            ]}
            disabled={answered}
            variant="plain"
          />
        </View>
      )}

      {/* Diatonic settings */}
      {mode === "diatonic" && (
        <View style={styles.filterRow}>
          <View style={styles.diatonicSettingsRow}>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={[styles.filterLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("controls.key")}
              </Text>
              <DropdownSelect
                theme={theme}
                value={diatonicQuizKeyType}
                onChange={(v) => onDiatonicQuizKeyTypeChange(v as "major" | "natural-minor")}
                options={diatonicKeyOptions}
                disabled={answered}
                variant="plain"
              />
            </View>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={[styles.filterLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("controls.chordType")}
              </Text>
              <DropdownSelect
                theme={theme}
                value={diatonicQuizChordSize}
                onChange={(v) => onDiatonicQuizChordSizeChange(v as "triad" | "seventh")}
                options={diatonicChordSizeOptions}
                disabled={answered}
                variant="plain"
              />
            </View>
          </View>
        </View>
      )}

      {/* Question text */}
      {questionText !== "" && (
        <BounceView key={questionText}>
          <Text style={[styles.questionText, { color: isDark ? "#fff" : "#1c1917" }]}>
            {questionText}
          </Text>
        </BounceView>
      )}

      {/* Choices for note/degree/scale modes */}
      {quizType === "choice" && (mode === "note" || mode === "degree" || mode === "scale") && (
        <View style={{ gap: 10 }}>
          <View style={styles.choicesGrid}>
            {question.choices.map((choice) => {
              const isSelected = selectedAnswer === choice || quizSelectedChoices.includes(choice);
              const isCorrectChoice = question.correctNoteNames
                ? question.correctNoteNames.includes(choice)
                : choice === question.correct;
              let bgColor: string;
              let borderColor: string;
              let textColor: string;
              if (!answered) {
                const sel = quizSelectedChoices.includes(choice);
                bgColor = sel ? (isDark ? "#e5e7eb" : "#1c1917") : isDark ? "#374151" : "#fff";
                borderColor = sel ? "transparent" : isDark ? "#4b5563" : "#d6d3d1";
                textColor = sel ? (isDark ? "#1c1917" : "#fff") : isDark ? "#e5e7eb" : "#1c1917";
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
                  style={[
                    styles.choiceBtn,
                    { backgroundColor: bgColor, borderColor, borderWidth: 1 },
                  ]}
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
      )}

      {/* Chord choice: root + type selection */}
      {quizType === "choice" && mode === "chord" && (
        <View style={{ gap: 10 }}>
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
                  style={[
                    styles.choiceBtn,
                    { backgroundColor: bgColor, borderColor, borderWidth: 1 },
                  ]}
                >
                  <Text style={[styles.choiceBtnText, { color: textColor }]}>{choice}</Text>
                </BounceButton>
              );
            })}
          </View>
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
                        {
                          color: isCorrect || isSelected ? "#fff" : isDark ? "#6b7280" : "#a8a29e",
                        },
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
      )}

      {/* Diatonic all mode */}
      {mode === "diatonic" && quizType === "all" && (
        <View style={{ gap: 8 }}>
          {/* Degree cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {question.diatonicAnswers?.map((entry) => {
                const answer = diatonicAllAnswers[entry.degree];
                const isEditing = currentDiatonicDegree === entry.degree;
                return (
                  <BounceButton
                    key={entry.degree}
                    selected={false}
                    onPress={() => !answered && onDiatonicDegreeCardClick(entry.degree)}
                    style={[
                      styles.diatonicCard,
                      {
                        borderColor:
                          isEditing && !answered
                            ? isDark
                              ? "#e5e7eb"
                              : "#1c1917"
                            : isDark
                              ? "#374151"
                              : "#d6d3d1",
                        backgroundColor: answered
                          ? answer?.root === entry.root && answer?.chordType === entry.chordType
                            ? "#16a34a"
                            : answer
                              ? "#ef4444"
                              : isDark
                                ? "#374151"
                                : "#f5f5f4"
                          : isDark
                            ? "#1f2937"
                            : "#fff",
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 13, color: isDark ? "#9ca3af" : "#78716c" }}>
                      {entry.degree}
                    </Text>
                    {answer ? (
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "bold",
                          color: answered ? "#fff" : isDark ? "#e5e7eb" : "#1c1917",
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
                      <Text style={{ fontSize: 14, color: isDark ? "#4b5563" : "#d6d3d1" }}>
                        --
                      </Text>
                    )}
                    {answered && (
                      <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
                        {entry.root}
                        {entry.chordType === "Major"
                          ? ""
                          : entry.chordType === "Minor"
                            ? "m"
                            : entry.chordType}
                      </Text>
                    )}
                  </BounceButton>
                );
              })}
            </View>
          </ScrollView>

          {/* Root selection */}
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
                            ? isDark
                              ? "#e5e7eb"
                              : "#1c1917"
                            : isDark
                              ? "#374151"
                              : "#fff",
                        borderColor:
                          note === diatonicSelectedRoot
                            ? "transparent"
                            : isDark
                              ? "#4b5563"
                              : "#d6d3d1",
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color:
                          note === diatonicSelectedRoot
                            ? isDark
                              ? "#1c1917"
                              : "#fff"
                            : isDark
                              ? "#e5e7eb"
                              : "#1c1917",
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
                              ? isDark
                                ? "#e5e7eb"
                                : "#1c1917"
                              : isDark
                                ? "#374151"
                                : "#fff",
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
                              ? isDark
                                ? "#1c1917"
                                : "#fff"
                              : isDark
                                ? "#e5e7eb"
                                : "#1c1917",
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
                  style={[styles.submitBtn, { backgroundColor: isDark ? "#e5e7eb" : "#1c1917" }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.submitBtnText, { color: isDark ? "#1c1917" : "#fff" }]}>
                    {t("quiz.submit")}
                  </Text>
                </BounceButton>
              )}
            </View>
          )}
        </View>
      )}

      {/* Fretboard quiz: tap instruction + submit */}
      {quizType === "fretboard" && mode !== "diatonic" && !answered && (
        <View style={{ alignItems: "center", gap: 10 }}>
          <BounceView>
            <Text style={{ fontSize: 15, color: isDark ? "#9ca3af" : "#78716c" }}>
              {t("quiz.tapInstruction")}
            </Text>
          </BounceView>
          {quizSelectedCells.length > 0 && (
            <BounceButton
              selected={false}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSubmitFretboard();
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
      )}

      {/* Result + navigation */}
      {answered && (
        <ResultSection>
          <Text
            style={{ fontSize: 17, fontWeight: "bold", color: isCorrect ? "#16a34a" : "#ef4444" }}
          >
            {isCorrect ? t("quiz.correct") : t("quiz.incorrectOnly")}
          </Text>
          {!isCorrect && question.answerLabel != null && (
            <Text style={[styles.answerLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
              {t("quiz.incorrect", { answer: question.answerLabel })}
            </Text>
          )}
          <View style={styles.navBtns}>
            <TouchableOpacity
              onPress={onRetryQuestion}
              style={[
                styles.navBtn,
                {
                  borderColor: isDark ? "#4b5563" : "#d6d3d1",
                  backgroundColor: isDark ? "#1f2937" : "#fff",
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, color: isDark ? "#d1d5db" : "#57534e" }}>
                {t("quiz.retry")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onNextQuestion}
              style={[
                styles.navBtn,
                { backgroundColor: isDark ? "#e5e7eb" : "#1c1917", borderColor: "transparent" },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, color: isDark ? "#1c1917" : "#fff", fontWeight: "600" }}>
                {t("quiz.next")}
              </Text>
            </TouchableOpacity>
          </View>
        </ResultSection>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  score: {
    fontSize: 14,
    fontFamily: "monospace",
    flexShrink: 0,
  },
  filterRow: {
    alignItems: "center",
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  diatonicSettingsRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  questionText: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
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
  resultRow: {
    alignItems: "center",
    gap: 8,
  },
  resultBadge: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  resultBadgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  answerLabel: {
    fontSize: 16,
    textAlign: "center",
  },
  navBtns: {
    flexDirection: "row",
    gap: 10,
  },
  navBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  diatonicCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    minWidth: 56,
    alignItems: "center",
    gap: 2,
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
