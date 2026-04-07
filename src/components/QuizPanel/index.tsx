import { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Modal,
  Pressable,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../i18n";
import type { Theme, ChordType, ScaleType, QuizMode, QuizType, QuizQuestion } from "../../types";
import { DropdownSelect } from "../ui/DropdownSelect";
import ChevronIcon from "../ui/ChevronIcon";
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

function MultiSelectPopup({
  theme,
  label,
  items,
  selected,
  onToggle,
  disabled,
}: {
  theme: Theme;
  label: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const menuScale = useRef(new Animated.Value(1)).current;
  const menuOpacity = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isDark = theme === "dark";
  const count = selected.length;
  const total = items.length;
  const summary = count === total ? t("quiz.filterAll") : `${count}/${total}`;
  const textColor = disabled ? (isDark ? "#6b7280" : "#a8a29e") : isDark ? "#fff" : "#1c1917";

  const prevSummary = useRef(summary);
  if (prevSummary.current !== summary) {
    prevSummary.current = summary;
    scaleAnim.stopAnimation();
    scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }

  const close = () => {
    Animated.timing(menuOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setVisible(false);
    });
  };

  return (
    <>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={() => {
            if (disabled) return;
            menuScale.setValue(0.5);
            menuOpacity.setValue(1);
            setVisible(true);
          }}
          disabled={disabled}
          style={popupStyles.trigger}
          activeOpacity={0.7}
        >
          <Text style={[popupStyles.triggerText, { color: textColor }]} numberOfLines={1}>
            {summary}
          </Text>
          {!disabled && (
            <ChevronIcon
              size={12}
              color={isDark ? "#6b7280" : "#a8a29e"}
              direction={visible ? "up" : "down"}
            />
          )}
        </TouchableOpacity>
      </Animated.View>
      <Modal
        visible={visible && !disabled}
        transparent
        animationType="none"
        onRequestClose={close}
        onShow={() => {
          Animated.timing(menuScale, {
            toValue: 1.05,
            duration: 100,
            useNativeDriver: true,
          }).start(() => {
            Animated.spring(menuScale, {
              toValue: 1,
              friction: 4,
              tension: 200,
              useNativeDriver: true,
            }).start();
          });
        }}
      >
        <Pressable style={popupStyles.overlay} onPress={close}>
          <Animated.View
            style={[
              popupStyles.menu,
              {
                backgroundColor: isDark ? "rgba(17,24,39,0.97)" : "rgba(250,250,249,0.97)",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4",
                transform: [{ scale: menuScale }],
                opacity: menuOpacity,
              },
            ]}
          >
            <Pressable>
              <Text style={[popupStyles.menuTitle, { color: isDark ? "#e5e7eb" : "#1c1917" }]}>
                {label}
              </Text>
              <View style={popupStyles.chipGrid}>
                {items.map((item) => {
                  const active = selected.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onToggle(item);
                      }}
                      style={[
                        popupStyles.chip,
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
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: active
                            ? isDark
                              ? "#1c1917"
                              : "#fff"
                            : isDark
                              ? "#e5e7eb"
                              : "#44403c",
                        }}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const popupStyles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  triggerText: {
    fontSize: 15,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  menu: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    width: 300,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 48,
    alignItems: "center",
  },
});

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
        const degreeRoot = question.promptQuizRoot ?? rootNote;
        return quizStrings.length > 1
          ? t("quiz.questionDegreeAllStrings", { degree: question.correct, root: degreeRoot })
          : t("quiz.questionDegreeFretboard", {
              string: stringNumber,
              degree: question.correct,
              root: degreeRoot,
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

  return (
    <View style={styles.card}>
      {/* Score */}
      <View style={styles.headerRow}>
        <Text style={[styles.score, { color: isDark ? "#9ca3af" : "#78716c" }]}>
          ✓ {score.correct} / {score.total}
        </Text>
      </View>

      {/* Note mode: note names + strings in a row */}
      {mode === "note" && quizType === "fretboard" && (
        <View style={styles.filterRow}>
          <View style={styles.diatonicSettingsRow}>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={[styles.filterLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("quiz.quizNoteNames.label")}
              </Text>
              <MultiSelectPopup
                theme={theme}
                label={t("quiz.quizNoteNames.label")}
                items={noteOptions.slice(0, 12)}
                selected={quizNoteNames}
                onToggle={handleQuizNoteNameToggle}
                disabled={answered}
              />
            </View>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={[styles.filterLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("quiz.quizStrings.label")}
              </Text>
              <MultiSelectPopup
                theme={theme}
                label={t("quiz.quizStrings.label")}
                items={["1", "2", "3", "4", "5", "6"]}
                selected={quizStrings.map((s) => String(6 - s))}
                onToggle={(item) => handleQuizStringToggle(String(6 - Number(item)))}
                disabled={answered}
              />
            </View>
          </View>
        </View>
      )}

      {/* Note mode choice: note names only */}
      {mode === "note" && quizType !== "fretboard" && (
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
            {t("quiz.quizNoteNames.label")}
          </Text>
          <MultiSelectPopup
            theme={theme}
            label={t("quiz.quizNoteNames.label")}
            items={noteOptions.slice(0, 12)}
            selected={quizNoteNames}
            onToggle={handleQuizNoteNameToggle}
            disabled={answered}
          />
        </View>
      )}

      {/* Degree mode: keys + strings in a row (fretboard only) */}
      {mode === "degree" && quizType === "fretboard" && (
        <View style={styles.filterRow}>
          <View style={styles.diatonicSettingsRow}>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={[styles.filterLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("quiz.quizKeys.label")}
              </Text>
              <MultiSelectPopup
                theme={theme}
                label={t("quiz.quizKeys.label")}
                items={noteOptions.slice(0, 12)}
                selected={quizKeys}
                onToggle={handleQuizKeyToggle}
                disabled={answered}
              />
            </View>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={[styles.filterLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("quiz.quizStrings.label")}
              </Text>
              <MultiSelectPopup
                theme={theme}
                label={t("quiz.quizStrings.label")}
                items={["1", "2", "3", "4", "5", "6"]}
                selected={quizStrings.map((s) => String(6 - s))}
                onToggle={(item) => handleQuizStringToggle(String(6 - Number(item)))}
                disabled={answered}
              />
            </View>
          </View>
        </View>
      )}

      {/* Degree mode choice: keys only */}
      {mode === "degree" && quizType !== "fretboard" && (
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
            {t("quiz.quizKeys.label")}
          </Text>
          <MultiSelectPopup
            theme={theme}
            label={t("quiz.quizKeys.label")}
            items={noteOptions.slice(0, 12)}
            selected={quizKeys}
            onToggle={handleQuizKeyToggle}
            disabled={answered}
          />
        </View>
      )}

      {/* Scale mode fretboard: keys + strings + scale in a row */}
      {mode === "scale" && quizType === "fretboard" && (
        <View style={styles.filterRow}>
          <View style={styles.diatonicSettingsRow}>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={[styles.filterLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("quiz.quizKeys.label")}
              </Text>
              <MultiSelectPopup
                theme={theme}
                label={t("quiz.quizKeys.label")}
                items={noteOptions.slice(0, 12)}
                selected={quizKeys}
                onToggle={handleQuizKeyToggle}
                disabled={answered}
              />
            </View>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={[styles.filterLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("quiz.quizStrings.label")}
              </Text>
              <MultiSelectPopup
                theme={theme}
                label={t("quiz.quizStrings.label")}
                items={["1", "2", "3", "4", "5", "6"]}
                selected={quizStrings.map((s) => String(6 - s))}
                onToggle={(item) => handleQuizStringToggle(String(6 - Number(item)))}
                disabled={answered}
              />
            </View>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={[styles.filterLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("layers.scale")}
              </Text>
              <DropdownSelect
                theme={theme}
                value={scaleType}
                onChange={(v) => onScaleTypeChange(v as ScaleType)}
                options={scaleOptions}
                disabled={answered}
                variant="plain"
              />
            </View>
          </View>
        </View>
      )}

      {/* Scale mode choice: keys + scale in a row */}
      {mode === "scale" && quizType !== "fretboard" && (
        <View style={styles.filterRow}>
          <View style={styles.diatonicSettingsRow}>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={[styles.filterLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("quiz.quizKeys.label")}
              </Text>
              <MultiSelectPopup
                theme={theme}
                label={t("quiz.quizKeys.label")}
                items={noteOptions.slice(0, 12)}
                selected={quizKeys}
                onToggle={handleQuizKeyToggle}
                disabled={answered}
              />
            </View>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={[styles.filterLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("layers.scale")}
              </Text>
              <DropdownSelect
                theme={theme}
                value={scaleType}
                onChange={(v) => onScaleTypeChange(v as ScaleType)}
                options={scaleOptions}
                disabled={answered}
                variant="plain"
              />
            </View>
          </View>
        </View>
      )}

      {/* Chord quiz types filter */}
      {mode === "chord" && (
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
            {t("quiz.chordTypes.label")}
          </Text>
          <MultiSelectPopup
            theme={theme}
            label={t("quiz.chordTypes.label")}
            items={availableChordQuizTypes}
            selected={chordQuizTypes}
            onToggle={(v) => handleChordTypeToggle(v as ChordType)}
            disabled={answered}
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
        <BounceView key={questionText} style={{ marginTop: 8 }}>
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
