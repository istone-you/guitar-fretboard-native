import { useMemo, useRef, useState } from "react";
import { Alert, View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import * as Haptics from "expo-haptics";
import Icon from "../ui/Icon";
import { useTranslation } from "react-i18next";
import "../../i18n";
import type { Theme, ChordType, ScaleType, QuizMode, QuizType, QuizQuestion } from "../../types";
import { buildScaleOptions } from "../ui/scaleOptions";
import SettingsModal from "./SettingsModal";
import ChoicePanel from "./ChoicePanel";
import ChordPanel from "./ChordPanel";
import DiatonicPanel from "./DiatonicPanel";
import BounceButton from "./BounceButton";
import PillButton from "../ui/PillButton";
import { getColors, SEMANTIC_COLORS } from "../../themes/design";

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
  quizStrings: number[];
  onQuizStringsChange: (value: number[]) => void;
  quizKeys: string[];
  onQuizKeysChange: (value: string[]) => void;
  quizNoteNames: string[];
  onQuizNoteNamesChange: (value: string[]) => void;
  layersFull: boolean;
  onAddLayer: () => void;
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
  quizStrings,
  onQuizStringsChange,
  quizKeys,
  onQuizKeysChange,
  quizNoteNames,
  onQuizNoteNamesChange,
  layersFull,
  onAddLayer,
}: QuizPanelProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const answered = selectedAnswer !== null;

  const [settingsVisible, setSettingsVisible] = useState(false);

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

  // ── Filter toggle handlers ──────────────────────────────────────

  const handleChordTypeToggle = (value: ChordType) => {
    if (answered) return;
    if (chordQuizTypes.includes(value)) {
      if (chordQuizTypes.length === 1) return;
      onChordQuizTypesChange(chordQuizTypes.filter((t) => t !== value));
      return;
    }
    onChordQuizTypesChange([...chordQuizTypes, value]);
  };

  const handleQuizKeyToggle = (key: string) => {
    if (answered) return;
    if (quizKeys.includes(key)) {
      if (quizKeys.length === 1) return;
      onQuizKeysChange(quizKeys.filter((k) => k !== key));
      return;
    }
    onQuizKeysChange([...quizKeys, key]);
  };

  const handleQuizNoteNameToggle = (name: string) => {
    if (answered) return;
    if (quizNoteNames.includes(name)) {
      if (quizNoteNames.length === 1) return;
      onQuizNoteNamesChange(quizNoteNames.filter((n) => n !== name));
      return;
    }
    onQuizNoteNamesChange([...quizNoteNames, name]);
  };

  const handleQuizStringToggle = (item: string) => {
    if (answered) return;
    const s = Number(item);
    if (quizStrings.includes(s)) {
      if (quizStrings.length === 1) return;
      onQuizStringsChange(quizStrings.filter((v) => v !== s).sort((a, b) => a - b));
      return;
    }
    onQuizStringsChange([...quizStrings, s].sort((a, b) => a - b));
  };

  // ── Diatonic helpers ────────────────────────────────────────────

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

  // ── Question text ───────────────────────────────────────────────

  const questionText = useMemo(() => {
    if (quizType === "fretboard") {
      if (mode === "degree") {
        const degreeRoot = question.promptQuizRoot ?? rootNote;
        return quizStrings.length > 1
          ? t("quiz.questionDegreeAllStrings", { degree: question.correct, root: degreeRoot })
          : t("quiz.questionDegreeFretboard", {
              string: stringNumber,
              degree: question.correct,
              root: degreeRoot,
            });
      }
      if (mode === "diatonic") return "";
      return quizStrings.length > 1
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
    return t("quiz.questionDegree", {
      string: stringNumber,
      fret: question.fret,
      root: question.promptQuizRoot ?? rootNote,
    });
  }, [mode, quizType, question, rootNote, stringNumber, quizStrings, t]);

  // ── Settings rows ───────────────────────────────────────────────

  const getSummary = (items: string[], selected: string[]) =>
    selected.length === items.length ? t("quiz.filterAll") : `${selected.length}/${items.length}`;

  const settingsRows = [
    ...(mode === "note"
      ? [
          {
            key: "noteNames",
            label: t("quiz.quizNoteNames.label"),
            summary: getSummary(noteOptions.slice(0, 12), quizNoteNames),
          },
        ]
      : []),
    ...(mode === "degree" || mode === "scale"
      ? [
          {
            key: "keys",
            label: t("quiz.quizKeys.label"),
            summary: getSummary(noteOptions.slice(0, 12), quizKeys),
          },
        ]
      : []),
    ...((mode === "note" || mode === "degree" || mode === "scale") && quizType === "fretboard"
      ? [
          {
            key: "strings",
            label: t("quiz.quizStrings.label"),
            summary: getSummary(
              ["1", "2", "3", "4", "5", "6"],
              quizStrings.map((s) => String(6 - s)),
            ),
          },
        ]
      : []),
    ...(mode === "scale"
      ? [
          {
            key: "scale",
            label: t("layers.scale"),
            summary: scaleOptions.find((o) => o.value === scaleType)?.label ?? scaleType,
          },
        ]
      : []),
    ...(mode === "chord"
      ? [
          {
            key: "chordTypes",
            label: t("quiz.chordTypes.label"),
            summary: getSummary(availableChordQuizTypes, chordQuizTypes),
          },
        ]
      : []),
    ...(mode === "diatonic"
      ? [
          {
            key: "diatonicKey",
            label: t("controls.key"),
            summary: diatonicKeyOptions.find((o) => o.value === diatonicQuizKeyType)?.label ?? "",
          },
          {
            key: "diatonicChordSize",
            label: t("controls.chordType"),
            summary:
              diatonicChordSizeOptions.find((o) => o.value === diatonicQuizChordSize)?.label ?? "",
          },
        ]
      : []),
  ];

  // ── Settings sub-page data ──────────────────────────────────────
  // These are passed to SettingsModal and driven by its internal settingsPage state.
  // We compute all possible sub-pages and let the modal pick the right one.
  const settingsSubPages: Record<
    string,
    {
      title: string;
      items: string[];
      selected: string[];
      labels: Record<string, string> | null;
      toggle: (v: string) => void;
    }
  > = {
    noteNames: {
      title: t("quiz.quizNoteNames.label"),
      items: noteOptions.slice(0, 12),
      selected: quizNoteNames,
      labels: null,
      toggle: handleQuizNoteNameToggle,
    },
    strings: {
      title: t("quiz.quizStrings.label"),
      items: ["1", "2", "3", "4", "5", "6"],
      selected: quizStrings.map((s) => String(6 - s)),
      labels: null,
      toggle: (item) => handleQuizStringToggle(String(6 - Number(item))),
    },
    keys: {
      title: t("quiz.quizKeys.label"),
      items: noteOptions.slice(0, 12),
      selected: quizKeys,
      labels: null,
      toggle: handleQuizKeyToggle,
    },
    chordTypes: {
      title: t("quiz.chordTypes.label"),
      items: availableChordQuizTypes as string[],
      selected: chordQuizTypes as string[],
      labels: null,
      toggle: (v) => handleChordTypeToggle(v as ChordType),
    },
    scale: {
      title: t("layers.scale"),
      items: scaleOptions.map((o) => o.value),
      selected: [scaleType],
      labels: Object.fromEntries(scaleOptions.map((o) => [o.value, o.label])),
      toggle: (v) => onScaleTypeChange(v as ScaleType),
    },
    diatonicKey: {
      title: t("controls.key"),
      items: diatonicKeyOptions.map((o) => o.value),
      selected: [diatonicQuizKeyType],
      labels: Object.fromEntries(diatonicKeyOptions.map((o) => [o.value, o.label])),
      toggle: (v) => onDiatonicQuizKeyTypeChange(v as "major" | "natural-minor"),
    },
    diatonicChordSize: {
      title: t("controls.chordType"),
      items: diatonicChordSizeOptions.map((o) => o.value),
      selected: [diatonicQuizChordSize],
      labels: Object.fromEntries(diatonicChordSizeOptions.map((o) => [o.value, o.label])),
      toggle: (v) => onDiatonicQuizChordSizeChange(v as "triad" | "seventh"),
    },
  };

  return (
    <View style={styles.card}>
      {/* Score + buttons */}
      <View style={styles.headerRow}>
        <Text style={[styles.score, { color: colors.textSubtle }]}>
          ✓ {score.correct} / {score.total}
        </Text>
        <View style={styles.headerBtns}>
          <PillButton
            isDark={isDark}
            onPress={() => {
              if (layersFull) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert(t("finder.addToLayerFullTitle"), t("finder.addToLayerFull"));
              } else {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onAddLayer();
              }
            }}
            testID="quiz-add-layer-button"
            style={{ paddingHorizontal: 8 }}
          >
            <Icon name="upload" size={16} color={colors.textSubtle} />
          </PillButton>
          <PillButton
            isDark={isDark}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSettingsVisible(true);
            }}
            testID="quiz-settings-button"
            style={{ paddingHorizontal: 8 }}
          >
            <Icon name="ellipsis" size={16} color={colors.textSubtle} />
          </PillButton>
        </View>
      </View>

      {/* Settings modal */}
      <SettingsModal
        theme={theme}
        visible={settingsVisible}
        settingsRows={settingsRows}
        settingsSubPages={settingsSubPages}
        onClose={() => setSettingsVisible(false)}
      />

      {/* Question text */}
      {questionText !== "" && (
        <BounceView key={questionText} style={{ marginTop: 8 }}>
          <Text style={[styles.questionText, { color: colors.text }]}>{questionText}</Text>
        </BounceView>
      )}

      {/* note / degree / scale choices */}
      {quizType === "choice" && (mode === "note" || mode === "degree" || mode === "scale") && (
        <ChoicePanel
          theme={theme}
          question={question}
          answered={answered}
          quizSelectedChoices={quizSelectedChoices}
          onAnswer={onAnswer}
          onSubmitChoice={onSubmitChoice}
        />
      )}

      {/* chord quiz */}
      {quizType === "choice" && mode === "chord" && (
        <ChordPanel
          theme={theme}
          question={question}
          answered={answered}
          quizSelectedChordRoot={quizSelectedChordRoot}
          quizSelectedChordType={quizSelectedChordType}
          chordQuizTypes={chordQuizTypes}
          noteOptions={noteOptions}
          onChordQuizRootSelect={onChordQuizRootSelect}
          onChordQuizTypeSelect={onChordQuizTypeSelect}
          onSubmitChordChoice={onSubmitChordChoice}
        />
      )}

      {/* diatonic quiz */}
      {mode === "diatonic" && quizType === "all" && (
        <DiatonicPanel
          theme={theme}
          question={question}
          answered={answered}
          noteOptions={noteOptions}
          diatonicAllAnswers={diatonicAllAnswers}
          diatonicSelectedRoot={diatonicSelectedRoot}
          diatonicSelectedChordType={diatonicSelectedChordType}
          currentDiatonicDegree={currentDiatonicDegree}
          diatonicAllFilled={diatonicAllFilled}
          onDiatonicAnswerRootSelect={onDiatonicAnswerRootSelect}
          onDiatonicAnswerTypeSelect={onDiatonicAnswerTypeSelect}
          onDiatonicDegreeCardClick={onDiatonicDegreeCardClick}
          onDiatonicSubmitAll={onDiatonicSubmitAll}
        />
      )}

      {/* Fretboard quiz: tap instruction + submit */}
      {quizType === "fretboard" && mode !== "diatonic" && !answered && (
        <View style={{ alignItems: "center", gap: 10 }}>
          <BounceView>
            <Text style={{ fontSize: 15, color: colors.textSubtle }}>
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

      {/* Result + navigation */}
      {answered && (
        <ResultSection>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "bold",
              color: isCorrect ? SEMANTIC_COLORS.success : SEMANTIC_COLORS.error,
            }}
          >
            {isCorrect ? t("quiz.correct") : t("quiz.incorrectOnly")}
          </Text>
          {!isCorrect && question.answerLabel != null && (
            <Text style={[styles.answerLabel, { color: colors.textSubtle }]}>
              {t("quiz.incorrect", { answer: question.answerLabel })}
            </Text>
          )}
          <View style={styles.navBtns}>
            <TouchableOpacity
              onPress={onRetryQuestion}
              style={[
                styles.navBtn,
                {
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.sheetBg,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, color: colors.textDim }}>{t("quiz.retry")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onNextQuestion}
              style={[
                styles.navBtn,
                { backgroundColor: colors.primaryBtn, borderColor: "transparent" },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, color: colors.primaryBtnText, fontWeight: "600" }}>
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
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginHorizontal: -12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 44,
  },
  score: {
    fontSize: 14,
    fontFamily: "monospace",
    flexShrink: 0,
  },
  headerBtns: {
    flexDirection: "row",
    gap: 6,
  },
  settingsBtn: {
    padding: 6,
  },
  questionText: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  resultRow: {
    alignItems: "center",
    gap: 8,
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
    borderCurve: "continuous",
    paddingHorizontal: 16,
    paddingVertical: 8,
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
