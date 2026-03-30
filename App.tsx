import { useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  Animated,
} from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import "./src/i18n";
import AppHeader from "./src/components/AppHeader/index";
import FretboardHeader from "./src/components/FretboardHeader/index";
import FretboardFooter from "./src/components/FretboardFooter/index";
import LayerControls from "./src/components/LayerControls/index";
import NormalFretboard from "./src/components/NormalFretboard/index";
import QuizFretboard from "./src/components/QuizFretboard/index";
import QuizPanel from "./src/components/QuizPanel/index";
import { useDegreeFilter } from "./src/hooks/useDegreeFilter";
import { useDiatonicSelection } from "./src/hooks/useDiatonicSelection";
import { usePersistedSetting } from "./src/hooks/usePersistedSetting";
import { CHORD_QUIZ_TYPES_ALL, useQuiz } from "./src/hooks/useQuiz";
import {
  NOTES_SHARP,
  NOTES_FLAT,
  getActiveOverlaySemitones,
  getRootIndex,
} from "./src/logic/fretboard";
import type {
  Theme,
  Accidental,
  BaseLabelMode,
  ChordDisplayMode,
  ScaleType,
  ChordType,
} from "./src/types";

const GUITAR_ICON_DARK = require("./public/guiter_dark.png");
const GUITAR_ICON_LIGHT = require("./public/guiter.png");
const QUIZ_ICON_DARK = require("./public/quiz_dark.png");
const QUIZ_ICON_LIGHT = require("./public/quiz.png");

const DEFAULT_CHORD_QUIZ_TYPES: ChordType[] = ["Major", "Minor", "7th", "maj7", "m7"];

const STORAGE_KEYS = {
  theme: "guiter:theme",
  accidental: "guiter:accidental",
  fretRange: "guiter:fret-range",
  scaleColor: "guiter:scale-color",
  cagedColor: "guiter:caged-color",
  chordColor: "guiter:chord-color",
} as const;

function AppContent() {
  const insets = useSafeAreaInsets();
  // Root note
  const [rootNote, setRootNote] = useState("C");
  // Fret range
  const [fretRange, setFretRange] = usePersistedSetting<[number, number]>(
    STORAGE_KEYS.fretRange,
    [0, 12],
    (value) => `${value[0]}-${value[1]}`,
    (stored) => {
      const [rawMin, rawMax] = stored.split("-").map(Number);
      if (
        Number.isInteger(rawMin) && Number.isInteger(rawMax) &&
        rawMin >= 0 && rawMax <= 14 && rawMin < rawMax
      ) return [rawMin, rawMax];
      return [0, 14];
    },
  );
  // Layout: force screen rotation via ScreenOrientation
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const isLandscape = winWidth > winHeight;
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const panelSlideAnim = useRef(new Animated.Value(0)).current; // 0 = open, 1 = closed

  const toggleRightPanel = useCallback(() => {
    const toValue = rightPanelOpen ? 1 : 0;
    setRightPanelOpen(!rightPanelOpen);
    Animated.timing(panelSlideAnim, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [rightPanelOpen, panelSlideAnim]);

  const toggleLayout = useCallback(async () => {
    if (isLandscape) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    }
  }, [isLandscape]);

  // Auto filter
  const [autoFilter, setAutoFilter] = useState(false);
  // Quiz
  const [showQuiz, setShowQuiz] = useState(false);
  const [chordQuizTypes, setChordQuizTypes] = useState<ChordType[]>(DEFAULT_CHORD_QUIZ_TYPES);
  // Display settings
  const [accidental, setAccidental] = usePersistedSetting<Accidental>(
    STORAGE_KEYS.accidental,
    "flat",
    (v) => v,
    (v) => v as Accidental,
  );
  const [baseLabelMode, setBaseLabelMode] = useState<BaseLabelMode>("note");
  const [theme, setTheme] = usePersistedSetting<Theme>(
    STORAGE_KEYS.theme,
    "dark",
    (v) => v,
    (v) => v as Theme,
  );
  // Layer colors
  const [scaleColor, setScaleColor] = usePersistedSetting<string>(
    STORAGE_KEYS.scaleColor,
    "#ff69b6",
    (v) => v,
    (v) => v,
  );
  const [cagedColor, setCagedColor] = usePersistedSetting<string>(
    STORAGE_KEYS.cagedColor,
    "#40e0d0",
    (v) => v,
    (v) => v,
  );
  const [chordColor, setChordColor] = usePersistedSetting<string>(
    STORAGE_KEYS.chordColor,
    "#ffd700",
    (v) => v,
    (v) => v,
  );

  const [highlightedOverlayNotes, setHighlightedOverlayNotes] = useState<Set<string>>(new Set());

  // Layer display flags
  const [showChord, setShowChord] = useState(false);
  const [showScale, setShowScale] = useState(false);
  const [showCaged, setShowCaged] = useState(false);
  const [showLayers, setShowLayers] = useState(true);

  // Chord settings
  const [chordDisplayMode, setChordDisplayMode] = useState<ChordDisplayMode>("form");
  const [chordType, setChordType] = useState<ChordType>("Major");
  const [triadInversion, setTriadInversion] = useState("root");
  const {
    diatonicKeyType,
    diatonicChordSize,
    diatonicDegree,
    setDiatonicDegree,
    handleDiatonicKeyTypeChange,
    handleDiatonicChordSizeChange,
  } = useDiatonicSelection();

  const [scaleType, setScaleType] = useState<ScaleType>("major");
  const [cagedForms, setCagedForms] = useState(new Set(["E"]));

  const toggleCagedForm = (key: string) => {
    setCagedForms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleAccidentalChange = (mode: Accidental) => {
    const idx = getRootIndex(rootNote);
    const notes = mode === "sharp" ? NOTES_SHARP : NOTES_FLAT;
    setRootNote(notes[idx]);
    setAccidental(mode);
  };

  const handleNoteClick = (noteName: string) => setRootNote(noteName);

  const handleToggleOverlayNoteHighlight = (note: string) => {
    setHighlightedOverlayNotes((current) => {
      const next = new Set(current);
      if (next.has(note)) next.delete(note);
      else next.add(note);
      return next;
    });
  };

  const handleSetOverlayNoteHighlights = (notes: string[]) => {
    setHighlightedOverlayNotes(new Set(notes));
  };

  const {
    highlightedDegrees,
    handleAutoFilter,
    toggleDegree,
    resetHighlightedDegrees,
    highlightAllDegrees,
  } = useDegreeFilter();

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
    fretboardAllStrings,
    setFretboardAllStrings,
  } = useQuiz({
    accidental,
    chordQuizTypes,
    fretRange,
    rootNote,
    scaleType,
    showQuiz,
  });

  const diatonicScaleType = `${diatonicKeyType}-${diatonicChordSize}`;
  const effectiveShowScale = showLayers && showScale;
  const effectiveShowCaged = showLayers && showCaged;
  const effectiveShowChord = showLayers && showChord;

  const overlaySemitones = useMemo(
    () =>
      getActiveOverlaySemitones({
        rootNote,
        showScale: effectiveShowScale,
        scaleType,
        showCaged: effectiveShowCaged,
        showChord: effectiveShowChord,
        chordDisplayMode,
        diatonicScaleType,
        diatonicDegree,
        chordType,
      }),
    [
      rootNote, effectiveShowScale, scaleType, effectiveShowCaged,
      effectiveShowChord, chordDisplayMode, diatonicScaleType, diatonicDegree, chordType,
    ],
  );

  const overlayNotes = useMemo(() => {
    const notes = accidental === "sharp" ? NOTES_SHARP : NOTES_FLAT;
    const rootIndex = getRootIndex(rootNote);
    return [...overlaySemitones]
      .sort((a, b) => a - b)
      .map((semitone) => notes[(rootIndex + semitone) % 12]);
  }, [accidental, overlaySemitones, rootNote]);

  // Auto-filter: derived state computed during render, no useEffect
  const DEGREE_BY_SEMITONE = ["P1","m2","M2","m3","M3","P4","b5","P5","m6","M6","m7","M7"];
  const effectiveHighlightedDegrees = useMemo(() => {
    if (!autoFilter) return highlightedDegrees;
    if (overlaySemitones.size === 0) return new Set<string>();
    return new Set(DEGREE_BY_SEMITONE.filter((_, i) => overlaySemitones.has(i)));
  }, [autoFilter, highlightedDegrees, overlaySemitones]);

  const effectiveHighlightedNotes = useMemo(() => {
    if (!autoFilter) return highlightedOverlayNotes;
    return new Set(overlayNotes);
  }, [autoFilter, highlightedOverlayNotes, overlayNotes]);

  const quizRootChangeEnabled =
    !showQuiz || quizMode === "degree" || quizMode === "scale" || quizMode === "diatonic";

  const quizNoteOptions = accidental === "sharp" ? [...NOTES_SHARP] : [...NOTES_FLAT];

  const allNotes = useMemo(() => {
    const notes = accidental === "sharp" ? NOTES_SHARP : NOTES_FLAT;
    const rootIdx = getRootIndex(rootNote);
    return [...notes.slice(rootIdx), ...notes.slice(0, rootIdx)];
  }, [accidental, rootNote]);

  const isDark = theme === "dark";
  const bgColor = isDark ? "#030712" : "#f3f4f6";
  const headerBg = isDark ? "#111111" : "#fafaf9";

  // Common fretboard props
  const commonFretboardProps = {
    theme,
    accidental,
    baseLabelMode,
    fretRange,
    showChord: effectiveShowChord,
    chordDisplayMode,
    showScale: effectiveShowScale,
    scaleType,
    showCaged: effectiveShowCaged,
    cagedForms,
    chordType,
    triadPosition: triadInversion,
    diatonicScaleType,
    diatonicDegree,
    chordColor,
    scaleColor,
    cagedColor,
  };

  const quizEffectiveRootNote =
    quizMode === "chord" && quizType === "choice" && quizQuestion?.promptChordRoot
      ? quizQuestion.promptChordRoot
      : rootNote;

  // ── Shared JSX pieces ──────────────────────────────────────────

  const fretboardHeaderEl = (
    <FretboardHeader
      theme={theme}
      rootNote={rootNote}
      accidental={accidental}
      baseLabelMode={baseLabelMode}
      showQuiz={showQuiz}
      rootChangeDisabled={!quizRootChangeEnabled}
      onBaseLabelModeChange={setBaseLabelMode}
      onRootNoteChange={quizRootChangeEnabled ? handleNoteClick : () => {}}
    />
  );

  const fretboardEl = (
    <View style={{ paddingVertical: isLandscape ? 2 : 8 }}>
      {showQuiz ? (
        <QuizFretboard
          {...commonFretboardProps}
          showChord={false}
          showScale={false}
          showCaged={false}
          rootNote={quizEffectiveRootNote}
          onNoteClick={handleNoteClick}
          quizModeActive={quizQuestion != null}
          quizCell={
            quizQuestion != null &&
            quizType !== "fretboard" &&
            quizMode !== "chord" &&
            quizMode !== "scale" &&
            quizMode !== "diatonic"
              ? { stringIdx: quizQuestion.stringIdx, fret: quizQuestion.fret }
              : undefined
          }
          quizAnswerMode={quizType === "fretboard"}
          quizTargetString={
            quizType === "fretboard" &&
            (quizMode === "note" || quizMode === "degree") &&
            !fretboardAllStrings &&
            quizQuestion != null
              ? quizQuestion.stringIdx
              : undefined
          }
          quizAnsweredCell={quizAnsweredCell}
          quizCorrectCell={quizCorrectCell}
          quizSelectedCells={quizSelectedCells}
          onQuizCellClick={handleFretboardQuizAnswer}
          quizRevealNoteNames={quizRevealNoteNames}
          highlightedNotes={new Set<string>()}
          highlightedDegrees={new Set<string>()}
        />
      ) : (
        <NormalFretboard
          {...commonFretboardProps}
          rootNote={rootNote}
          onNoteClick={handleNoteClick}
          highlightedNotes={effectiveHighlightedNotes}
          highlightedDegrees={effectiveHighlightedDegrees}
        />
      )}
    </View>
  );

  const quizPanelEl = showQuiz && quizQuestion != null ? (
    <QuizPanel
      theme={theme}
      mode={quizMode}
      quizType={quizType}
      question={quizQuestion}
      score={quizScore}
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
      onKindChange={handleQuizKindChange}
      onChordQuizTypesChange={setChordQuizTypes}
      onScaleTypeChange={(v) => setScaleType(v as ScaleType)}
      onDiatonicQuizKeyTypeChange={(v) => setDiatonicQuizKeyType(v)}
      onDiatonicQuizChordSizeChange={(v) => setDiatonicQuizChordSize(v)}
      onAnswer={handleQuizAnswer}
      onChordQuizRootSelect={handleChordQuizRootSelect}
      onChordQuizTypeSelect={handleChordQuizTypeSelect}
      onDiatonicAnswerRootSelect={handleDiatonicAnswerRootSelect}
      onDiatonicAnswerTypeSelect={handleDiatonicAnswerTypeSelect}
      onDiatonicDegreeCardClick={handleDiatonicDegreeCardClick}
      onDiatonicSubmitAll={handleDiatonicSubmitAll}
      onNextQuestion={handleNextQuestion}
      onRetryQuestion={handleRetryQuestion}
      fretboardAllStrings={fretboardAllStrings}
      onFretboardAllStringsChange={setFretboardAllStrings}
    />
  ) : null;

  const footerFilterEl = (
    <FretboardFooter
      theme={theme}
      baseLabelMode={baseLabelMode}
      showQuiz={showQuiz}
      allNotes={allNotes}
      overlayNotes={overlayNotes}
      highlightedOverlayNotes={effectiveHighlightedNotes}
      highlightedDegrees={effectiveHighlightedDegrees}
      onAutoFilter={() =>
        handleAutoFilter({
          rootNote,
          showScale: effectiveShowScale,
          scaleType,
          showCaged: effectiveShowCaged,
          showChord: effectiveShowChord,
          chordDisplayMode,
          diatonicScaleType,
          diatonicDegree,
          chordType,
        })
      }
      onResetOrHighlightAll={() => {
        if (effectiveHighlightedDegrees.size > 0) {
          setAutoFilter(false);
          resetHighlightedDegrees();
        } else {
          highlightAllDegrees();
        }
      }}
      autoFilter={autoFilter}
      onAutoFilterChange={setAutoFilter}
      onSetOverlayNoteHighlights={handleSetOverlayNoteHighlights}
      onToggleOverlayNoteHighlight={handleToggleOverlayNoteHighlight}
      onToggleDegree={toggleDegree}
    />
  );

  const layerControlsEl = !showQuiz ? (
    <LayerControls
      theme={theme}
      rootNote={rootNote}
      accidental={accidental}
      showLayers={showLayers}
      setShowLayers={setShowLayers}
      showChord={showChord}
      setShowChord={setShowChord}
      chordDisplayMode={chordDisplayMode}
      setChordDisplayMode={(v) => setChordDisplayMode(v as ChordDisplayMode)}
      showScale={showScale}
      setShowScale={setShowScale}
      scaleType={scaleType}
      setScaleType={(v) => setScaleType(v as ScaleType)}
      showCaged={showCaged}
      setShowCaged={setShowCaged}
      cagedForms={cagedForms}
      toggleCagedForm={toggleCagedForm}
      chordType={chordType}
      setChordType={(v) => setChordType(v as ChordType)}
      triadInversion={triadInversion}
      setTriadInversion={setTriadInversion}
      diatonicKeyType={diatonicKeyType}
      setDiatonicKeyType={handleDiatonicKeyTypeChange}
      diatonicChordSize={diatonicChordSize}
      setDiatonicChordSize={handleDiatonicChordSizeChange}
      diatonicDegree={diatonicDegree}
      setDiatonicDegree={setDiatonicDegree}
      scaleColor={scaleColor}
      setScaleColor={setScaleColor}
      cagedColor={cagedColor}
      setCagedColor={setCagedColor}
      chordColor={chordColor}
      setChordColor={setChordColor}
    />
  ) : null;

  const tabBarEl = (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: isDark ? "#111111" : "#fafaf9",
          borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4",
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => setShowQuiz(false)}
        activeOpacity={0.7}
      >
        <Image
          source={isDark ? GUITAR_ICON_DARK : GUITAR_ICON_LIGHT}
          style={[styles.tabIcon, { tintColor: !showQuiz ? (isDark ? "#38bdf8" : "#0284c7") : isDark ? "#6b7280" : "#a8a29e" }]}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => setShowQuiz(true)}
        activeOpacity={0.7}
      >
        <Image
          source={isDark ? QUIZ_ICON_DARK : QUIZ_ICON_LIGHT}
          style={[styles.tabIcon, { tintColor: showQuiz ? (isDark ? "#38bdf8" : "#0284c7") : isDark ? "#6b7280" : "#a8a29e" }]}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );

  // ── Layout ──────────────────────────────────────────────────────

  if (isLandscape) {
    // Fretboard: scale uniformly to fit available height (keep portrait proportions)
    // Fretboard only (footer is outside the scaled area)
    const availH = winHeight - 44;
    const fbScale = (availH * 0.85) / 200;

    // Right panel: render content at portrait width, scale to fit panel
    const portraitW = winHeight; // portrait screen width = landscape screen height
    const panelW = Math.round(winWidth * 0.4);
    const panelScale = panelW / portraitW;

    return (
      <View style={[styles.safeArea, { backgroundColor: bgColor, paddingTop: insets.top }]}>
        <StatusBar translucent barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" />

        <View style={{ flex: 1, flexDirection: "row" }}>
          {/* Left: fretboard full height — tap to close panel */}
          <Pressable style={{ flex: 1, paddingLeft: Math.max(insets.left, 16) }} onPress={() => { if (rightPanelOpen) toggleRightPanel(); }}>
            {/* Top bar */}
            <View style={[styles.landscapeTopBar, { borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4" }]}>
              <TouchableOpacity onPress={toggleLayout} style={{ padding: 6 }} activeOpacity={0.7}>
                <View style={[styles.lockIcon, { borderColor: isDark ? "#9ca3af" : "#78716c" }]}>
                  <View style={[styles.lockBarPortrait, { backgroundColor: isDark ? "#9ca3af" : "#78716c" }]} />
                </View>
              </TouchableOpacity>
              {fretboardHeaderEl}
            </View>

            {/* Scaled fretboard — full remaining height */}
            <View style={{ flex: 1, overflow: "hidden" }}>
              <View style={{ transform: [{ scale: fbScale }], transformOrigin: "top left", marginTop: 4 }}>
                {fretboardEl}
              </View>
            </View>
          </Pressable>

          {/* Right panel + toggle — single animated container, slides together */}
          <Animated.View style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            flexDirection: "row",
            alignItems: "center",
            transform: [{ translateX: panelSlideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, panelW],
            }) }],
          }}>
            <TouchableOpacity
              onPress={toggleRightPanel}
              style={[styles.panelToggle, {
                backgroundColor: isDark ? "#1f2937" : "#e7e5e4",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "#d6d3d1",
              }]}
              activeOpacity={0.7}
            >
              <View style={[styles.panelToggleArrow, {
                borderLeftColor: rightPanelOpen ? (isDark ? "#9ca3af" : "#78716c") : "transparent",
                borderRightColor: rightPanelOpen ? "transparent" : (isDark ? "#9ca3af" : "#78716c"),
              }]} />
            </TouchableOpacity>

            <View style={[styles.rightPanel, {
              width: panelW,
              borderLeftColor: isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4",
              backgroundColor: isDark ? "#0a0f1a" : "#f3f4f6",
            }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{
                  width: portraitW,
                  transform: [{ scale: panelScale }],
                  transformOrigin: "top left",
                }}>
                  {footerFilterEl}
                  {quizPanelEl}
                  {layerControlsEl}
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </View>
    );
  }

  // Portrait layout
  return (
    <View style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <StatusBar
        translucent
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
      />
      <View style={{ backgroundColor: headerBg, paddingTop: insets.top }}>
        <AppHeader
          theme={theme}
          fretRange={fretRange}
          accidental={accidental}
          isLandscape={isLandscape}
          onToggleLayout={toggleLayout}
          onThemeChange={setTheme}
          onFretRangeChange={setFretRange}
          onAccidentalChange={handleAccidentalChange}
        />
      </View>

      <View style={{ flex: 1, overflow: "hidden" }}>
        {fretboardHeaderEl}
        {fretboardEl}
        {quizPanelEl}
        {footerFilterEl}
        {layerControlsEl}
      </View>

      {tabBarEl}
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
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  tabIcon: {
    width: 28,
    height: 28,
  },
  // Landscape
  landscapeTopBar: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 8,
  },
  rightPanel: {
    flex: 1,
    borderLeftWidth: 1,
    overflow: "hidden",
  },
  panelToggle: {
    width: 36,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  panelToggleArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  lockIcon: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  lockBarPortrait: {
    width: 7,
    height: 12,
    borderRadius: 1,
  },
  lockBarLandscape: {
    width: 12,
    height: 7,
    borderRadius: 1,
  },
});
