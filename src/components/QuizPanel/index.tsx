import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import "../../i18n";
import type { Theme, ChordType, ScaleType, QuizMode, QuizType, QuizQuestion } from "../../types";
import { DropdownSelect } from "../ui/DropdownSelect";
import { buildScaleOptions } from "../ui/scaleOptions";

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
  onKindChange: (mode: QuizMode, type: QuizType) => void;
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
  onKindChange,
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

  const quizKindValue = `${mode}-${quizType}`;
  const quizKindOptions = [
    { value: "note-choice", label: t("quiz.kind.noteChoice") },
    { value: "note-fretboard", label: t("quiz.kind.noteFretboard") },
    { value: "degree-choice", label: t("quiz.kind.degreeChoice") },
    { value: "degree-fretboard", label: t("quiz.kind.degreeFretboard") },
    { value: "chord-choice", label: t("quiz.kind.chordChoice") },
    { value: "chord-fretboard", label: t("quiz.kind.chordFretboard") },
    { value: "scale-choice", label: t("quiz.kind.scaleChoice") },
    { value: "scale-fretboard", label: t("quiz.kind.scaleFretboard") },
    { value: "diatonic-all", label: t("quiz.kind.diatonicAll") },
  ];

  const handleKindChange = (value: string) => {
    const parts = value.split("-");
    const newType = parts[parts.length - 1] as QuizType;
    const newMode = parts.slice(0, -1).join("-") as QuizMode;
    onKindChange(newMode, newType);
  };

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
      {/* Header: Kind selector + Score */}
      <View style={styles.headerRow}>
        <View style={{ minWidth: 170, marginBottom: 8 }}>
          <DropdownSelect
            theme={theme}
            value={quizKindValue}
            onChange={handleKindChange}
            options={quizKindOptions}
            fullWidth
          />
        </View>
        <Text style={[styles.score, { color: isDark ? "#9ca3af" : "#78716c" }]}>
          ✓ {score.correct} / {score.total}
        </Text>
      </View>

      {/* Chord quiz types filter */}
      {mode === "chord" && (
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: isDark ? "#d1d5db" : "#44403c" }]}>
            {t("quiz.chordTypes.label")}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {availableChordQuizTypes.map((ct) => {
                const active = chordQuizTypes.includes(ct);
                return (
                  <TouchableOpacity
                    key={ct}
                    onPress={() => handleChordTypeToggle(ct)}
                    disabled={answered}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active
                          ? isDark
                            ? "#0284c7"
                            : "#0ea5e9"
                          : isDark
                            ? "#374151"
                            : "#fff",
                        borderColor: active ? "transparent" : isDark ? "#4b5563" : "#d6d3d1",
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: active ? "#fff" : isDark ? "#e5e7eb" : "#44403c",
                      }}
                    >
                      {ct}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Scale type selector */}
      {mode === "scale" && (
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: isDark ? "#d1d5db" : "#44403c" }]}>
            {t("layers.scale")}
          </Text>
          <DropdownSelect
            theme={theme}
            value={scaleType}
            onChange={(v) => onScaleTypeChange(v as ScaleType)}
            options={scaleOptions}
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
          />
        </View>
      )}

      {/* Diatonic settings */}
      {mode === "diatonic" && (
        <View style={styles.filterRow}>
          <View style={styles.diatonicSettingsRow}>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={[styles.filterLabel, { color: isDark ? "#d1d5db" : "#44403c" }]}>
                {t("controls.key")}
              </Text>
              <DropdownSelect
                theme={theme}
                value={diatonicQuizKeyType}
                onChange={(v) => onDiatonicQuizKeyTypeChange(v as "major" | "natural-minor")}
                options={diatonicKeyOptions}
                disabled={answered}
              />
            </View>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={[styles.filterLabel, { color: isDark ? "#d1d5db" : "#44403c" }]}>
                {t("controls.chordType")}
              </Text>
              <DropdownSelect
                theme={theme}
                value={diatonicQuizChordSize}
                onChange={(v) => onDiatonicQuizChordSizeChange(v as "triad" | "seventh")}
                options={diatonicChordSizeOptions}
                disabled={answered}
              />
            </View>
          </View>
        </View>
      )}

      {/* Question text */}
      {questionText !== "" && (
        <Text style={[styles.questionText, { color: isDark ? "#fff" : "#1c1917" }]}>
          {questionText}
        </Text>
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
                bgColor = sel ? (isDark ? "#0284c7" : "#0ea5e9") : isDark ? "#374151" : "#fff";
                borderColor = sel ? "transparent" : isDark ? "#4b5563" : "#d6d3d1";
                textColor = sel ? "#fff" : isDark ? "#e5e7eb" : "#1c1917";
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
                <TouchableOpacity
                  key={choice}
                  onPress={() => !answered && onAnswer(choice)}
                  disabled={answered}
                  style={[
                    styles.choiceBtn,
                    { backgroundColor: bgColor, borderColor, borderWidth: 1 },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.choiceBtnText, { color: textColor }]}>{choice}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {!answered && quizSelectedChoices.length > 0 && (
            <TouchableOpacity
              onPress={onSubmitChoice}
              style={[styles.submitBtn, { backgroundColor: isDark ? "#0284c7" : "#0ea5e9" }]}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>{t("quiz.submit")}</Text>
            </TouchableOpacity>
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
                    ? "#0284c7"
                    : "#0ea5e9"
                  : isDark
                    ? "#374151"
                    : "#fff";
                borderColor = isSelectedChoice ? "transparent" : isDark ? "#4b5563" : "#d6d3d1";
                textColor = isSelectedChoice ? "#fff" : isDark ? "#e5e7eb" : "#1c1917";
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
                <TouchableOpacity
                  key={choice}
                  onPress={() => onChordQuizRootSelect(choice)}
                  disabled={answered}
                  style={[
                    styles.choiceBtn,
                    { backgroundColor: bgColor, borderColor, borderWidth: 1 },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.choiceBtnText, { color: textColor }]}>{choice}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {quizSelectedChordRoot != null && !answered && (
            <>
              <View style={styles.choicesGrid}>
                {(question.diatonicChordTypeOptions ?? chordQuizTypes).map((ct) => {
                  const isSelected = ct === quizSelectedChordType;
                  return (
                    <TouchableOpacity
                      key={ct}
                      onPress={() => onChordQuizTypeSelect(ct)}
                      style={[
                        styles.choiceBtn,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? "#0284c7"
                              : "#0ea5e9"
                            : isDark
                              ? "#374151"
                              : "#fff",
                          borderColor: isSelected ? "transparent" : isDark ? "#4b5563" : "#d6d3d1",
                          borderWidth: 1,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.choiceBtnText,
                          { color: isSelected ? "#fff" : isDark ? "#e5e7eb" : "#1c1917" },
                        ]}
                      >
                        {ct}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {quizSelectedChordType != null && (
                <TouchableOpacity
                  onPress={onSubmitChordChoice}
                  style={[styles.submitBtn, { backgroundColor: isDark ? "#0284c7" : "#0ea5e9" }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitBtnText}>{t("quiz.submit")}</Text>
                </TouchableOpacity>
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
                  <TouchableOpacity
                    key={entry.degree}
                    onPress={() => !answered && onDiatonicDegreeCardClick(entry.degree)}
                    disabled={answered}
                    style={[
                      styles.diatonicCard,
                      {
                        borderColor:
                          isEditing && !answered
                            ? isDark
                              ? "#0284c7"
                              : "#0ea5e9"
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
                    activeOpacity={0.7}
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
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Root selection */}
          {!answered && currentDiatonicDegree != null && (
            <View style={{ gap: 8 }}>
              <View style={styles.choicesGrid}>
                {noteOptions.slice(0, 12).map((note) => (
                  <TouchableOpacity
                    key={note}
                    onPress={() => onDiatonicAnswerRootSelect(note)}
                    style={[
                      styles.choiceBtn,
                      {
                        backgroundColor:
                          note === diatonicSelectedRoot
                            ? isDark
                              ? "#0284c7"
                              : "#0ea5e9"
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
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color:
                          note === diatonicSelectedRoot ? "#fff" : isDark ? "#e5e7eb" : "#1c1917",
                      }}
                    >
                      {note}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {diatonicSelectedRoot != null && (
                <View style={styles.choicesGrid}>
                  {(question.diatonicChordTypeOptions ?? []).map((ct) => (
                    <TouchableOpacity
                      key={ct}
                      onPress={() => onDiatonicAnswerTypeSelect(ct)}
                      style={[
                        styles.choiceBtn,
                        {
                          backgroundColor:
                            ct === diatonicSelectedChordType
                              ? isDark
                                ? "#0284c7"
                                : "#0ea5e9"
                              : isDark
                                ? "#374151"
                                : "#fff",
                          borderColor: "transparent",
                          borderWidth: 1,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color:
                            ct === diatonicSelectedChordType
                              ? "#fff"
                              : isDark
                                ? "#e5e7eb"
                                : "#1c1917",
                        }}
                      >
                        {ct}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {diatonicAllFilled && (
                <TouchableOpacity
                  onPress={onDiatonicSubmitAll}
                  style={[styles.submitBtn, { backgroundColor: isDark ? "#0284c7" : "#0ea5e9" }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitBtnText}>{t("quiz.submit")}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Fretboard quiz: tap instruction + submit */}
      {quizType === "fretboard" && mode !== "diatonic" && !answered && (
        <View style={{ alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 15, color: isDark ? "#9ca3af" : "#78716c" }}>
            {t("quiz.tapInstruction")}
          </Text>
          {quizSelectedCells.length > 0 && (
            <TouchableOpacity
              onPress={onSubmitFretboard}
              style={[styles.submitBtn, { backgroundColor: isDark ? "#0284c7" : "#0ea5e9" }]}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>{t("quiz.submit")}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Result + navigation */}
      {answered && (
        <View style={styles.resultRow}>
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
                { backgroundColor: isDark ? "#0284c7" : "#0ea5e9", borderColor: "transparent" },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, color: "#fff", fontWeight: "600" }}>
                {t("quiz.next")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    fontSize: 15,
    fontWeight: "600",
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
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
