import { useMemo, useState, useCallback, useRef } from "react";
import { View, Animated, PanResponder, StatusBar, StyleSheet } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import * as Haptics from "expo-haptics";
import "./src/i18n";
import { useTranslation } from "react-i18next";
import TabView from "react-native-bottom-tabs";
import HeaderBar from "./src/components/AppHeader/index";
import LandscapeLayout from "./src/components/LandscapeLayout";
import { usePersistedSetting } from "./src/hooks/usePersistedSetting";
import { CHORD_QUIZ_TYPES_ALL, useQuiz } from "./src/hooks/useQuiz";
import { useLayerDerivedState } from "./src/hooks/useLayerDerivedState";
import { useQuizViewModel } from "./src/hooks/useQuizViewModel";
import { useLayers } from "./src/hooks/useLayers";
import { useOrientation } from "./src/hooks/useOrientation";
import { useQuizNavigation } from "./src/hooks/useQuizNavigation";
import { getNotesByAccidental, getRootIndex } from "./src/lib/fretboard";
import type { Theme, Accidental, BaseLabelMode, ScaleType } from "./src/types";
import { createDefaultLayer } from "./src/types";
import LayerPane from "./src/screens/Layer";
import QuizPane from "./src/screens/Quiz";
import QuizActivePracticePane from "./src/screens/Quiz/Active";
import StatsPane from "./src/screens/Quiz/Stats";
import FinderPane from "./src/screens/Finder";
import { useQuizRecords } from "./src/hooks/useQuizRecords";

const STORAGE_KEYS = {
  theme: "guiter:theme",
  accidental: "guiter:accidental",
  fretRange: "guiter:fret-range",
  leftHanded: "guiter:left-handed",
} as const;

function AppContent() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Settings
  const [rootNote, setRootNote] = useState("C");
  const [fretRange, setFretRange] = usePersistedSetting<[number, number]>(
    STORAGE_KEYS.fretRange,
    [0, 12],
    (value) => `${value[0]}-${value[1]}`,
    (stored) => {
      const [rawMin, rawMax] = stored.split("-").map(Number);
      if (
        Number.isInteger(rawMin) &&
        Number.isInteger(rawMax) &&
        rawMin >= 0 &&
        rawMax <= 14 &&
        rawMin < rawMax
      )
        return [rawMin, rawMax];
      return [0, 14];
    },
  );
  const [accidental, setAccidental] = usePersistedSetting<Accidental>(
    STORAGE_KEYS.accidental,
    "flat",
    (v) => v,
    (v) => v as Accidental,
  );
  const [baseLabelMode, setBaseLabelMode] = useState<BaseLabelMode>("note");
  const [theme, setTheme] = usePersistedSetting<Theme>(
    STORAGE_KEYS.theme,
    "light",
    (v) => v,
    (v) => v as Theme,
  );
  const [leftHanded, setLeftHanded] = usePersistedSetting<boolean>(
    STORAGE_KEYS.leftHanded,
    false,
    (v) => String(v),
    (v) => v === "true",
  );
  const [showFinder, setShowFinder] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const statsSlideAnim = useRef(new Animated.Value(0)).current;
  const [finderRoot, setFinderRoot] = useState<string | null>(null);
  const [finderNotes, setFinderNotes] = useState<Set<string>>(new Set());
  const [finderDotColor, setFinderDotColor] = usePersistedSetting(
    "guiter:finder-dot-color",
    "#ff69b6",
    (v) => v,
    (v) => v,
  );
  const [scaleType, setScaleType] = useState<ScaleType>("major");
  const { records, addRecord, clearRecords } = useQuizRecords();

  // Layout
  const { isLandscape, toggleLayout, animDisabled, winWidth, winHeight } = useOrientation();

  // Layers
  const {
    slots,
    layers,
    previewLayer,
    setPreviewLayer,
    handleAddLayer,
    handleUpdateLayer,
    handleRemoveLayer,
    handleToggleLayer,
    handleLoadPreset,
    handleReorderLayer,
  } = useLayers();

  // Forwarding refs to break the circular dependency between
  // useQuizNavigation (owns showQuiz) and useQuiz/useQuizViewModel
  // (need showQuiz but provide the callbacks useQuizNavigation needs).
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
    winWidth,
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

  const { effectiveLayers, overlaySemitones, overlayNotes, layerNoteLabelsMap } =
    useLayerDerivedState({
      layers,
      previewLayer,
      accidental,
      rootNote,
      baseLabelMode,
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

  const handleOpenStats = useCallback(() => {
    statsSlideAnim.setValue(winWidth);
    setShowStats(true);
    setTimeout(() => {
      Animated.timing(statsSlideAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();
    }, 0);
  }, [statsSlideAnim, winWidth]);

  const handleCloseStats = useCallback(() => {
    Animated.timing(statsSlideAnim, {
      toValue: winWidth,
      duration: 120,
      useNativeDriver: true,
    }).start(() => setShowStats(false));
  }, [statsSlideAnim, winWidth]);

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

  const quizNoteOptions = [...getNotesByAccidental(accidental)];

  const isDark = theme === "dark";
  const bgColor = isDark ? "#000000" : "#ffffff";
  const headerBg = bgColor;

  const handleAccidentalChange = (mode: Accidental) => {
    const idx = getRootIndex(rootNote);
    const notes = getNotesByAccidental(mode);
    setRootNote(notes[idx]);
    setAccidental(mode);
  };

  const handleNoteClick = (noteName: string) => {
    if (noteName !== rootNote && effectiveLayers.some((layer) => layer.enabled)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRootNote(noteName);
    regenerateQuiz();
  };

  const quizEffectiveRootNote =
    quizMode === "chord" && quizType === "choice" && quizQuestion?.promptChordRoot
      ? quizQuestion.promptChordRoot
      : (quizQuestion?.promptQuizRoot ?? rootNote);

  const lastTapRef = useRef(0);
  const handleFretboardDoubleTap = useCallback(() => {
    if (showQuiz) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      toggleLayout();
    }
    lastTapRef.current = now;
  }, [showQuiz, toggleLayout]);

  const quizAccentColor = quizMode === "chord" || quizMode === "diatonic" ? "#40E0D0" : "#ff69b6";

  const quizLayers = useMemo(() => {
    if (quizMode === "chord" && quizType === "choice") {
      const layer = createDefaultLayer("chord", "quiz-chord", quizAccentColor);
      layer.chordDisplayMode = "form";
      layer.chordType = quizQuestion?.promptChordType ?? "Major";
      return [layer];
    }
    return [];
  }, [quizMode, quizType, quizAccentColor, quizQuestion]);

  const sharedMainPaneProps = {
    theme,
    accidental,
    baseLabelMode,
    fretRange,
    rootNote,
    layers: effectiveLayers,
    leftHanded,
    onFretboardDoubleTap: handleFretboardDoubleTap,
    previewLayer,
    overlayNotes,
    overlaySemitones,
    layerNoteLabelsMap,
    isDark,
    slots,
    onAddLayer: handleAddLayer,
    onUpdateLayer: handleUpdateLayer,
    onRemoveLayer: handleRemoveLayer,
    onToggleLayer: handleToggleLayer,
    onPreviewLayer: setPreviewLayer,
    onReorderLayer: handleReorderLayer,
    onLoadPreset: handleLoadPreset,
    onRootNoteChange: handleNoteClick,
    onBaseLabelModeChange: setBaseLabelMode,
  };

  // ── Tab navigation ─────────────────────────────────────────────
  // Derive tab index from existing state (0=home, 1=finder, 2=quiz)
  const tabIndex = showFinder ? 1 : showQuiz ? 2 : 0;

  const routes = useMemo(
    () => [
      {
        key: "home",
        title: t("tabs.home"),
        focusedIcon: require("./public/guiter.png"),
        unfocusedIcon: require("./public/guiter.png"),
      },
      {
        key: "finder",
        title: t("tabs.finder"),
        focusedIcon: { sfSymbol: "magnifyingglass" } as const,
        unfocusedIcon: { sfSymbol: "magnifyingglass" } as const,
      },
      {
        key: "quiz",
        title: t("tabs.quiz"),
        focusedIcon: { sfSymbol: "questionmark.circle.fill" } as const,
        unfocusedIcon: { sfSymbol: "questionmark.circle" } as const,
      },
    ],
    [t],
  );

  const handleTabIndexChange = useCallback(
    (index: number) => {
      setCurrentTabIndex(index);
      if (index === 0) {
        setShowFinder(false);
        setShowStats(false);
        handleShowQuizChange(false);
        setShowQuiz(false);
      } else if (index === 1) {
        setShowFinder(true);
        setShowStats(false);
        handleShowQuizChange(false);
        setShowQuiz(false);
      } else if (index === 2) {
        if (showQuiz) return;
        setShowFinder(false);
        setShowStats(false);
        setShowQuiz(true);
        setQuizModeSelected(false);
      }
    },
    [
      showQuiz,
      setShowFinder,
      setShowQuiz,
      setQuizModeSelected,
      handleShowQuizChange,
      setCurrentTabIndex,
    ],
  );

  const renderScene = ({ route }: { route: { key: string } }) => {
    if (route.key === "home") {
      return (
        <LayerPane
          {...sharedMainPaneProps}
          isLandscape={isLandscape}
          disableAnimation={isLandscape || animDisabled}
        />
      );
    }
    if (route.key === "finder") {
      return (
        <FinderPane
          theme={theme}
          accidental={accidental}
          baseLabelMode={baseLabelMode}
          fretRange={fretRange}
          rootNote={rootNote}
          leftHanded={leftHanded}
          finderRoot={finderRoot}
          finderNotes={finderNotes}
          onFinderRootChange={setFinderRoot}
          onFinderNotesChange={setFinderNotes}
          dotColor={finderDotColor}
          onDotColorChange={setFinderDotColor}
          layers={layers}
          onBaseLabelModeChange={setBaseLabelMode}
          onAddLayerAndNavigate={(layer) => {
            setShowFinder(false);
            setTimeout(() => handleAddLayer(layer), 0);
          }}
        />
      );
    }
    if (route.key === "quiz") {
      return (
        <View style={styles.quizScene} {...swipePanResponder.panHandlers}>
          {/* QuizPane always rendered as background */}
          <View style={[styles.flex1, { backgroundColor: bgColor }]}>
            <QuizPane
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

          {/* QuizActivePracticePane slides in with solid background; QuizPane visible from side during swipe */}
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
                onFretboardDoubleTap={handleFretboardDoubleTap}
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
      );
    }
    return null;
  };

  // ── Landscape ──────────────────────────────────────────────────
  if (isLandscape) {
    return <LandscapeLayout {...sharedMainPaneProps} winHeight={winHeight} theme={theme} />;
  }

  // ── Portrait ───────────────────────────────────────────────────
  return (
    <View style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <StatusBar
        translucent
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
      />
      <View style={{ paddingTop: insets.top, backgroundColor: headerBg }}>
        <HeaderBar
          theme={theme}
          title={
            showStats || (showQuiz && quizModeSelected)
              ? undefined
              : currentTabIndex === 1
                ? t("tabs.finder")
                : currentTabIndex === 2
                  ? t("tabs.quiz")
                  : t("tabs.home")
          }
          accidental={accidental}
          onBack={
            showStats
              ? handleCloseStats
              : showQuiz && quizModeSelected
                ? handleChangeQuiz
                : undefined
          }
          fretRange={fretRange}
          onThemeChange={setTheme}
          onFretRangeChange={setFretRange}
          onAccidentalChange={handleAccidentalChange}
          leftHanded={leftHanded}
          onLeftHandedChange={setLeftHanded}
        />
      </View>

      <View style={styles.flex1}>
        <TabView
          navigationState={{ index: tabIndex, routes }}
          renderScene={renderScene}
          onIndexChange={handleTabIndexChange}
          hapticFeedbackEnabled
          disablePageAnimations
        />
      </View>
    </View>
  );
}

// Lock to portrait on startup
ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  quizScene: {
    flex: 1,
    overflow: "hidden",
  },
});
