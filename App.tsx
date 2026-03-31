import { useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import "./src/i18n";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
  // Layout: force screen rotation via ScreenOrientation
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const isLandscape = winWidth > winHeight;
  const rotatingRef = useRef(false);
  const [animDisabled, setAnimDisabled] = useState(false);

  const toggleLayout = useCallback(async () => {
    rotatingRef.current = true;
    setAnimDisabled(true);
    if (isLandscape) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    }
    setTimeout(() => {
      rotatingRef.current = false;
      setAnimDisabled(false);
    }, 500);
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
  const [cagedForms, setCagedForms] = useState(new Set(["E", "A"]));

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

  const handleNoteClick = (noteName: string) => {
    setRootNote(noteName);
    regenerateQuiz();
  };

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

  const { highlightedDegrees, handleAutoFilter, toggleDegree, resetHighlightedDegrees } =
    useDegreeFilter();

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
    regenerateQuiz,
    handleShowQuizChange,
    handleSubmitChoice,
    handleSubmitChordChoice,
    handleSubmitFretboard,
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
      rootNote,
      effectiveShowScale,
      scaleType,
      effectiveShowCaged,
      effectiveShowChord,
      chordDisplayMode,
      diatonicScaleType,
      diatonicDegree,
      chordType,
    ],
  );

  const overlayNotes = useMemo(() => {
    const notes = accidental === "sharp" ? NOTES_SHARP : NOTES_FLAT;
    const rootIndex = getRootIndex(rootNote);
    return [...overlaySemitones]
      .sort((a, b) => a - b)
      .map((semitone) => notes[(rootIndex + semitone) % 12]);
  }, [accidental, overlaySemitones, rootNote]);

  const DEGREE_BY_SEMITONE = [
    "P1",
    "m2",
    "M2",
    "m3",
    "M3",
    "P4",
    "b5",
    "P5",
    "m6",
    "M6",
    "m7",
    "M7",
  ];
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
    disableAnimation: isLandscape || animDisabled,
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

  const lastTapRef = useRef(0);
  const handleFretboardDoubleTap = useCallback(() => {
    if (showQuiz) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      toggleLayout();
    }
    lastTapRef.current = now;
  }, [showQuiz, toggleLayout]);

  const fretboardEl = (
    <View style={{ paddingVertical: isLandscape ? 2 : 8 }} onTouchEnd={handleFretboardDoubleTap}>
      {showQuiz ? (
        <QuizFretboard
          theme={theme}
          accidental={accidental}
          baseLabelMode={baseLabelMode}
          fretRange={fretRange}
          rootNote={quizEffectiveRootNote}
          showChord={quizMode === "chord" && quizType === "choice"}
          chordType={quizQuestion?.promptChordType ?? "Major"}
          chordDisplayMode="form"
          showScale={false}
          showCaged={false}
          cagedForms={new Set()}
          triadPosition="root"
          diatonicScaleType="major-triad"
          diatonicDegree="I"
          scaleType="major"
          chordColor="#0ea5e9"
          scaleColor="#ff69b6"
          cagedColor="#40e0d0"
          onNoteClick={() => {}}
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
          onNoteClick={() => {}}
          highlightedNotes={effectiveHighlightedNotes}
          highlightedDegrees={effectiveHighlightedDegrees}
        />
      )}
    </View>
  );

  const quizPanelEl =
    showQuiz && quizQuestion != null ? (
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
        onChordQuizTypesChange={(v) => {
          setChordQuizTypes(v);
          regenerateQuiz();
        }}
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
        quizSelectedCells={quizSelectedCells}
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
      onReset={() => {
        setAutoFilter(false);
        resetHighlightedDegrees();
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
        onPress={() => {
          setShowQuiz(false);
          handleShowQuizChange(false);
        }}
        activeOpacity={0.7}
      >
        <Image
          source={isDark ? GUITAR_ICON_DARK : GUITAR_ICON_LIGHT}
          style={[
            styles.tabIcon,
            {
              tintColor: !showQuiz
                ? isDark
                  ? "#38bdf8"
                  : "#0284c7"
                : isDark
                  ? "#6b7280"
                  : "#a8a29e",
            },
          ]}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => {
          setShowQuiz(true);
          handleShowQuizChange(true);
        }}
        activeOpacity={0.7}
      >
        <Image
          source={isDark ? QUIZ_ICON_DARK : QUIZ_ICON_LIGHT}
          style={[
            styles.tabIcon,
            {
              tintColor: showQuiz
                ? isDark
                  ? "#38bdf8"
                  : "#0284c7"
                : isDark
                  ? "#6b7280"
                  : "#a8a29e",
            },
          ]}
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

    return (
      <View
        style={[
          styles.safeArea,
          {
            backgroundColor: bgColor,
            paddingTop: insets.top,
            paddingLeft: Math.max(insets.left, 16),
          },
        ]}
      >
        <StatusBar
          translucent
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor="transparent"
        />

        {/* Info + fretboard block — centered vertically */}
        <View
          style={[
            styles.landscapeInfoOverlay,
            { marginTop: Math.max(0, (availH - 200 * fbScale) / 2) },
          ]}
        >
          <View style={styles.landscapeInfoBar}>
            <Text
              style={[styles.infoText, { color: isDark ? "#e5e7eb" : "#1c1917", marginRight: 6 }]}
            >
              {t("header.root")} {rootNote}
            </Text>
            {effectiveHighlightedNotes.size > 0 && baseLabelMode === "note" && (
              <View style={styles.infoChipsRow}>
                {[...effectiveHighlightedNotes].map((n) => (
                  <View
                    key={n}
                    style={[styles.infoChip, { borderColor: isDark ? "#93c5fd" : "#3b82f6" }]}
                  >
                    <Text style={[styles.infoChipText, { color: isDark ? "#93c5fd" : "#3b82f6" }]}>
                      {n}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {effectiveHighlightedDegrees.size > 0 && baseLabelMode === "degree" && (
              <View style={styles.infoChipsRow}>
                {[...effectiveHighlightedDegrees].map((d) => (
                  <View
                    key={d}
                    style={[styles.infoChip, { borderColor: isDark ? "#93c5fd" : "#3b82f6" }]}
                  >
                    <Text style={[styles.infoChipText, { color: isDark ? "#93c5fd" : "#3b82f6" }]}>
                      {d}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          {/* Info bar — line 2: layers */}
          {(effectiveShowScale || effectiveShowCaged || effectiveShowChord) && (
            <View style={styles.landscapeInfoBar}>
              {effectiveShowScale && (
                <View style={[styles.infoPill, { backgroundColor: scaleColor }]}>
                  <Text style={styles.infoPillText}>
                    {t(
                      `options.scale.${scaleType.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase())}`,
                    )}
                  </Text>
                </View>
              )}
              {effectiveShowCaged && (
                <View style={[styles.infoPill, { backgroundColor: cagedColor }]}>
                  <Text style={styles.infoPillText}>{[...cagedForms].join("")}</Text>
                </View>
              )}
              {effectiveShowChord && chordDisplayMode === "form" && (
                <View style={[styles.infoPill, { backgroundColor: chordColor }]}>
                  <Text style={styles.infoPillText}>{chordType}</Text>
                </View>
              )}
              {effectiveShowChord && chordDisplayMode === "power" && (
                <View style={[styles.infoPill, { backgroundColor: chordColor }]}>
                  <Text style={styles.infoPillText}>{t("options.chordDisplayMode.power")}</Text>
                </View>
              )}
              {effectiveShowChord && chordDisplayMode === "triad" && (
                <View style={[styles.infoPill, { backgroundColor: chordColor }]}>
                  <Text style={styles.infoPillText}>
                    {t("options.chordDisplayMode.triad")}({chordType}{" "}
                    {t(`options.triadInversions.${triadInversion}`)})
                  </Text>
                </View>
              )}
              {effectiveShowChord && chordDisplayMode === "diatonic" && (
                <View style={[styles.infoPill, { backgroundColor: chordColor }]}>
                  <Text style={styles.infoPillText}>
                    {t("options.chordDisplayMode.diatonic")}({diatonicDegree}{" "}
                    {t(
                      `options.diatonicKey.${diatonicKeyType === "natural-minor" ? "naturalMinor" : "major"}`,
                    )}{" "}
                    {t(`options.diatonicChordSize.${diatonicChordSize}`)})
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Fretboard */}
        <View style={{ flex: 1, overflow: "hidden" }}>
          <View
            style={{
              transform: [{ scale: fbScale }],
              transformOrigin: "top left",
            }}
          >
            {fretboardEl}
          </View>
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
  landscapeInfoOverlay: {},
  landscapeInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "700",
  },
  infoPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  infoPillText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  infoChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  infoChip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  infoChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
