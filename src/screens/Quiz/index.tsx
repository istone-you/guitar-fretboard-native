import { forwardRef, useImperativeHandle, useRef, useState, useMemo, useCallback } from "react";
import { View, Animated, PanResponder, StyleSheet, useWindowDimensions } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../i18n";
import SceneHeader from "../../components/AppHeader/SceneHeader";
import { CHORD_QUIZ_TYPES_ALL, useQuiz } from "../../hooks/useQuiz";
import { useQuizNavigation } from "../../hooks/useQuizNavigation";
import { useQuizViewModel } from "../../hooks/useQuizViewModel";
import { useQuizRecords } from "../../hooks/useQuizRecords";
import { getNotesByAccidental } from "../../lib/fretboard";
import { createDefaultLayer } from "../../types";
import { QUIZ_ACCENT_COLORS, getColors } from "../../themes/design";
import type { Accidental, BaseLabelMode, ScaleType, Theme, LayerConfig } from "../../types";
import QuizActivePracticePane from "./Active";
import StatsPane from "./Stats";
import QuizSelectionScreen from "./Selection";

export interface QuizScreenHandle {
  onLeave: () => void;
  regenerate: () => void;
}

export interface QuizScreenProps {
  theme: Theme;
  accidental: Accidental;
  fretRange: [number, number];
  leftHanded?: boolean;
  rootNote: string;
  baseLabelMode: BaseLabelMode;
  isLandscape: boolean;
  winWidth: number;
  onFretboardDoubleTap: () => void;
  // Header props
  onThemeChange: (theme: Theme) => void;
  onFretRangeChange: (range: [number, number]) => void;
  onAccidentalChange: (accidental: Accidental) => void;
  onLeftHandedChange: (value: boolean) => void;
}

const QuizScreen = forwardRef<QuizScreenHandle, QuizScreenProps>(function QuizScreen(
  {
    theme,
    accidental,
    fretRange,
    leftHanded,
    rootNote,
    baseLabelMode,
    isLandscape,
    winWidth,
    onFretboardDoubleTap,
    onThemeChange,
    onFretRangeChange,
    onAccidentalChange,
    onLeftHandedChange,
  },
  ref,
) {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const effectiveWinWidth = winWidth || screenWidth;

  const isDark = theme === "dark";
  const bgColor = getColors(isDark).pageBg;

  const [scaleType, setScaleType] = useState<ScaleType>("major");
  const [showStats, setShowStats] = useState(false);

  const statsSlideAnim = useRef(new Animated.Value(0)).current;
  const { records, addRecord, clearRecords } = useQuizRecords();

  const handleOpenStats = useCallback(() => {
    statsSlideAnim.setValue(effectiveWinWidth);
    setShowStats(true);
    setTimeout(() => {
      Animated.timing(statsSlideAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();
    }, 0);
  }, [statsSlideAnim, effectiveWinWidth]);

  const handleCloseStats = useCallback(() => {
    Animated.timing(statsSlideAnim, {
      toValue: effectiveWinWidth,
      duration: 120,
      useNativeDriver: true,
    }).start(() => setShowStats(false));
  }, [statsSlideAnim, effectiveWinWidth]);

  // Swipe-right to close stats pane
  const showStatsRef = useRef(showStats);
  showStatsRef.current = showStats;
  const handleCloseStatsRef = useRef(handleCloseStats);
  handleCloseStatsRef.current = handleCloseStats;
  const statsSwipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        showStatsRef.current && g.dx > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (g.dx > 0) statsSlideAnim.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > 80 || (g.dx > 30 && g.vx > 0.5)) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          handleCloseStatsRef.current();
        } else {
          Animated.timing(statsSlideAnim, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.timing(statsSlideAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  // Forwarding refs to break the circular dependency between
  // useQuizNavigation (owns showQuiz) and useQuiz/useQuizViewModel
  const quizNavCallbacksRef = useRef({
    onQuizKindChange: (_: string) => {},
    onShowQuizChange: (_: boolean) => {},
  });

  const {
    showQuiz,
    setShowQuiz,
    quizModeSelected,
    setQuizModeSelected,
    quizSlideAnim,
    handleQuizModeSelect,
    handleChangeQuiz,
    swipePanResponder,
  } = useQuizNavigation({
    winWidth: effectiveWinWidth,
    initialShowQuiz: true,
    onQuizKindChange: (v) => quizNavCallbacksRef.current.onQuizKindChange(v),
    onShowQuizChange: (v) => quizNavCallbacksRef.current.onShowQuizChange(v),
  });

  const {
    quizMode,
    quizType,
    quizQuestion,
    selectedAnswer,
    quizScore,
    quizAnsweredCell,
    quizCorrectCell,
    quizSelectedCells,
    quizSelectedChoices,
    diatonicQuizKeyType,
    diatonicQuizChordSize,
    quizSelectedChordRoot,
    quizSelectedChordType,
    diatonicSelectedRoot,
    diatonicSelectedChordType,
    diatonicAllAnswers,
    diatonicEditingDegree,
    quizRevealNoteNames,
    handleQuizKindChange,
    handleQuizAnswer,
    handleChordQuizRootSelect,
    handleChordQuizTypeSelect,
    handleDiatonicAnswerRootSelect,
    handleDiatonicAnswerTypeSelect,
    handleDiatonicDegreeCardClick,
    handleDiatonicSubmitAll,
    handleFretboardQuizAnswer,
    handleNextQuestion,
    handleRetryQuestion,
    setDiatonicQuizKeyType,
    setDiatonicQuizChordSize,
    chordQuizTypes,
    handleChordQuizTypesChange,
    quizStrings,
    handleQuizStringsChange,
    quizKeys,
    handleQuizKeysChange,
    quizNoteNames,
    handleQuizNoteNamesChange,
    regenerateQuiz,
    handleShowQuizChange,
    handleSubmitChoice,
    handleSubmitChordChoice,
    handleSubmitFretboard,
  } = useQuiz({
    accidental,
    fretRange,
    rootNote,
    scaleType,
    showQuiz,
    onRecord: addRecord,
  });

  const { quizKindOptions, handleQuizKindDropdownChange } = useQuizViewModel({
    showQuiz,
    quizMode,
    quizType,
    t,
    onQuizKindChange: handleQuizKindChange,
  });

  // Wire up forwarding refs now that all hooks have been called
  quizNavCallbacksRef.current = {
    onQuizKindChange: handleQuizKindDropdownChange,
    onShowQuizChange: handleShowQuizChange,
  };

  useImperativeHandle(
    ref,
    () => ({
      onLeave: () => {
        handleShowQuizChange(false);
        setQuizModeSelected(false);
        setShowStats(false);
        setShowQuiz(false);
      },
      regenerate: regenerateQuiz,
    }),
    [handleShowQuizChange, setQuizModeSelected, setShowQuiz, regenerateQuiz],
  );

  const quizNoteOptions = [...getNotesByAccidental(accidental)];

  const quizEffectiveRootNote =
    quizMode === "chord" && quizType === "choice" && quizQuestion?.promptChordRoot
      ? quizQuestion.promptChordRoot
      : (quizQuestion?.promptQuizRoot ?? rootNote);

  const quizAccentColor =
    quizMode === "chord" || quizMode === "diatonic"
      ? QUIZ_ACCENT_COLORS.chordDiatonic
      : QUIZ_ACCENT_COLORS.other;

  const quizLayers = useMemo<LayerConfig[]>(() => {
    if (quizMode === "chord" && quizType === "choice") {
      const layer = createDefaultLayer("chord", "quiz-chord", quizAccentColor);
      layer.chordDisplayMode = "form";
      layer.chordType = quizQuestion?.promptChordType ?? "Major";
      return [layer];
    }
    return [];
  }, [quizMode, quizType, quizAccentColor, quizQuestion]);

  return (
    <View style={styles.quizScene}>
      <SceneHeader
        theme={theme}
        title={showStats || quizModeSelected ? undefined : t("tabs.quiz")}
        accidental={accidental}
        fretRange={fretRange}
        leftHanded={leftHanded}
        onBack={showStats ? handleCloseStats : quizModeSelected ? handleChangeQuiz : undefined}
        onThemeChange={onThemeChange}
        onFretRangeChange={onFretRangeChange}
        onAccidentalChange={onAccidentalChange}
        onLeftHandedChange={onLeftHandedChange}
      />
      <View style={styles.flex1}>
        {/* QuizPane (mode selection) always rendered as background */}
        <View style={[styles.flex1, { backgroundColor: bgColor }]}>
          <QuizSelectionScreen
            theme={theme}
            quizKindOptions={quizKindOptions}
            onQuizModeSelect={handleQuizModeSelect}
            onShowStats={handleOpenStats}
          />
        </View>

        {/* StatsPane slides over QuizPane with solid background */}
        {showStats && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: bgColor, transform: [{ translateX: statsSlideAnim }] },
            ]}
            {...statsSwipeResponder.panHandlers}
          >
            <StatsPane
              records={records}
              theme={theme}
              accidental={accidental}
              onClearRecords={clearRecords}
            />
          </Animated.View>
        )}

        {/* QuizActivePracticePane slides in with solid background */}
        {quizModeSelected && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: bgColor,
                transform: [{ translateX: quizSlideAnim }],
                borderTopLeftRadius: 28,
                borderBottomLeftRadius: 28,
                overflow: "hidden",
              },
            ]}
            {...swipePanResponder.panHandlers}
          >
            <QuizActivePracticePane
              isLandscape={isLandscape}
              theme={theme}
              accidental={accidental}
              baseLabelMode={baseLabelMode}
              fretRange={fretRange}
              quizEffectiveRootNote={quizEffectiveRootNote}
              quizLayers={quizLayers}
              quizAccentColor={quizAccentColor}
              quizQuestion={quizQuestion}
              quizType={quizType}
              quizMode={quizMode}
              quizAnsweredCell={quizAnsweredCell}
              quizCorrectCell={quizCorrectCell}
              quizSelectedCells={quizSelectedCells}
              quizRevealNoteNames={quizRevealNoteNames}
              quizStrings={quizStrings}
              leftHanded={leftHanded}
              onFretboardDoubleTap={onFretboardDoubleTap}
              onQuizCellClick={handleFretboardQuizAnswer}
              quizScore={quizScore}
              selectedAnswer={selectedAnswer}
              rootNote={rootNote}
              quizSelectedChoices={quizSelectedChoices}
              noteOptions={quizNoteOptions}
              quizSelectedChordRoot={quizSelectedChordRoot}
              quizSelectedChordType={quizSelectedChordType}
              diatonicSelectedRoot={diatonicSelectedRoot}
              diatonicSelectedChordType={diatonicSelectedChordType}
              diatonicAllAnswers={diatonicAllAnswers}
              diatonicEditingDegree={diatonicEditingDegree}
              diatonicQuizKeyType={diatonicQuizKeyType}
              diatonicQuizChordSize={diatonicQuizChordSize}
              chordQuizTypes={chordQuizTypes}
              availableChordQuizTypes={CHORD_QUIZ_TYPES_ALL}
              scaleType={scaleType}
              quizKeys={quizKeys}
              onQuizKeysChange={handleQuizKeysChange}
              quizNoteNames={quizNoteNames}
              onQuizNoteNamesChange={handleQuizNoteNamesChange}
              onChordQuizTypesChange={handleChordQuizTypesChange}
              onScaleTypeChange={(v) => {
                setScaleType(v as ScaleType);
                regenerateQuiz();
              }}
              onDiatonicQuizKeyTypeChange={(v) => {
                setDiatonicQuizKeyType(v);
                regenerateQuiz();
              }}
              onDiatonicQuizChordSizeChange={(v) => {
                setDiatonicQuizChordSize(v);
                regenerateQuiz();
              }}
              onAnswer={handleQuizAnswer}
              onSubmitChoice={handleSubmitChoice}
              onChordQuizRootSelect={handleChordQuizRootSelect}
              onChordQuizTypeSelect={handleChordQuizTypeSelect}
              onSubmitChordChoice={handleSubmitChordChoice}
              onDiatonicAnswerRootSelect={handleDiatonicAnswerRootSelect}
              onDiatonicAnswerTypeSelect={handleDiatonicAnswerTypeSelect}
              onDiatonicDegreeCardClick={handleDiatonicDegreeCardClick}
              onDiatonicSubmitAll={handleDiatonicSubmitAll}
              onSubmitFretboard={handleSubmitFretboard}
              onNextQuestion={handleNextQuestion}
              onRetryQuestion={handleRetryQuestion}
              onQuizStringsChange={handleQuizStringsChange}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
});

export default QuizScreen;

const styles = StyleSheet.create({
  quizScene: {
    flex: 1,
    overflow: "hidden",
  },
  flex1: {
    flex: 1,
  },
});
