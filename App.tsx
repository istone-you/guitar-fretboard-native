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
import * as Haptics from "expo-haptics";
import "./src/i18n";
import { useTranslation } from "react-i18next";
import HeaderBar from "./src/components/AppHeader/index";
import FretboardFooter from "./src/components/FretboardFooter/index";
import NormalFretboard from "./src/components/NormalFretboard/index";
import QuizFretboard from "./src/components/QuizFretboard/index";
import QuizPanel from "./src/components/QuizPanel/index";
import HowToUseOverlay, {
  type HowToUsePositions,
  type ElementPosition,
} from "./src/components/HowToUseOverlay";
import { useDegreeFilter } from "./src/hooks/useDegreeFilter";
import { usePersistedSetting } from "./src/hooks/usePersistedSetting";
import { CHORD_QUIZ_TYPES_ALL, useQuiz } from "./src/hooks/useQuiz";
import {
  NOTES_SHARP,
  NOTES_FLAT,
  CHORD_SEMITONES,
  SCALE_DEGREES,
  getDiatonicChordSemitones,
  getRootIndex,
} from "./src/logic/fretboard";
import type {
  Theme,
  Accidental,
  BaseLabelMode,
  ScaleType,
  ChordType,
  QuizMode,
  QuizType,
  LayerConfig,
} from "./src/types";
import LayerList from "./src/components/LayerSystem/LayerList";

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
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [howToUsePositions, setHowToUsePositions] = useState<HowToUsePositions>({});

  // Refs for measuring UI element positions
  const rootStepperRef = useRef<View>(null);
  const labelToggleRef = useRef<View>(null);
  const fretboardAreaRef = useRef<View>(null);
  const chipAreaRef = useRef<View>(null);
  const filterBtnRef = useRef<View>(null);
  const quizSelectorRef = useRef<View>(null);

  const measureElement = (
    ref: React.RefObject<View | null>,
  ): Promise<ElementPosition | undefined> =>
    new Promise((resolve) => {
      if (!ref.current) {
        resolve(undefined);
        return;
      }
      ref.current.measureInWindow((x, y, w, h) => resolve({ x, y, w, h }));
    });

  const openHowToUse = async () => {
    const [rootStepper, labelToggle, quizSelector, fretboard, chipArea, filterBtn] =
      await Promise.all([
        measureElement(rootStepperRef),
        measureElement(labelToggleRef),
        measureElement(quizSelectorRef),
        measureElement(fretboardAreaRef),
        measureElement(chipAreaRef),
        measureElement(filterBtnRef),
      ]);
    setHowToUsePositions({
      rootStepper,
      labelToggle,
      quizSelector,
      fretboard,
      chipArea,
      filterBtn,
    });
    setShowHowToUse(true);
  };
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
    "light",
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

  // New layer system
  const [layers, setLayers] = useState<LayerConfig[]>([]);
  const handleAddLayer = (layer: LayerConfig) => setLayers((prev) => [...prev, layer]);
  const handleUpdateLayer = (id: string, layer: LayerConfig) =>
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...layer, id } : l)));
  const handleRemoveLayer = (id: string) => setLayers((prev) => prev.filter((l) => l.id !== id));
  const handleToggleLayer = (id: string) =>
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l)));
  const handleReorderLayers = (reordered: LayerConfig[]) => setLayers(reordered);
  const [previewLayer, setPreviewLayer] = useState<LayerConfig | null>(null);

  // Layers with preview merged
  const effectiveLayers = useMemo(() => {
    if (!previewLayer) return layers;
    const existing = layers.find((l) => l.id === previewLayer.id);
    if (existing) return layers.map((l) => (l.id === previewLayer.id ? previewLayer : l));
    return [...layers, previewLayer];
  }, [layers, previewLayer]);

  const [scaleType, setScaleType] = useState<ScaleType>("major");

  const handleAccidentalChange = (mode: Accidental) => {
    const idx = getRootIndex(rootNote);
    const notes = mode === "sharp" ? NOTES_SHARP : NOTES_FLAT;
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

  const { highlightedDegrees, toggleDegree, resetHighlightedDegrees, setHighlightedDegrees } =
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

  const enabledCustomLayers = useMemo(
    () => effectiveLayers.filter((layer) => layer.enabled),
    [effectiveLayers],
  );

  const overlaySemitones = useMemo(() => {
    const active = new Set<number>();
    const keyRootIndex = getRootIndex(rootNote);
    for (const layer of enabledCustomLayers) {
      if (layer.type === "scale") {
        for (const semitone of SCALE_DEGREES[layer.scaleType] ?? []) active.add(semitone);
        continue;
      }

      let semitones: Set<number> | undefined;
      if (layer.chordDisplayMode === "power") {
        semitones = CHORD_SEMITONES.power;
      } else if (layer.chordDisplayMode === "diatonic") {
        semitones = getDiatonicChordSemitones(
          keyRootIndex,
          `${layer.diatonicKeyType}-${layer.diatonicChordSize}`,
          layer.diatonicDegree,
        );
      } else if (layer.chordDisplayMode === "caged") {
        semitones = CHORD_SEMITONES.Major;
      } else {
        semitones = CHORD_SEMITONES[layer.chordType];
      }

      for (const semitone of semitones ?? []) active.add(semitone);
    }

    return active;
  }, [rootNote, enabledCustomLayers]);

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

  const prevAutoFilterKey = useRef("");
  const autoFilterKey = autoFilter
    ? `${[...overlayNotes].sort().join()}|${[...overlaySemitones].sort().join()}`
    : "";
  if (
    autoFilter &&
    autoFilterKey !== prevAutoFilterKey.current &&
    prevAutoFilterKey.current !== ""
  ) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  prevAutoFilterKey.current = autoFilterKey;

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

  // Quiz kind selector for header
  const quizKindValue = `${quizMode}-${quizType}`;
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
  const handleQuizKindDropdownChange = (value: string) => {
    const parts = value.split("-");
    const newType = parts[parts.length - 1] as QuizType;
    const newMode = parts.slice(0, -1).join("-") as QuizMode;
    handleQuizKindChange(newMode, newType);
  };

  // Common fretboard props
  const commonFretboardProps = {
    theme,
    accidental,
    baseLabelMode,
    fretRange,
    showChord: false,
    chordDisplayMode: "form" as const,
    showScale: false,
    scaleType,
    showCaged: false,
    cagedForms: new Set<string>(),
    chordType: "Major" as const,
    triadPosition: "root",
    diatonicScaleType: "major-triad",
    diatonicDegree: "I",
    chordColor,
    scaleColor,
    cagedColor,
    layers: effectiveLayers,
    disableAnimation: isLandscape || animDisabled,
  };

  const quizEffectiveRootNote =
    quizMode === "chord" && quizType === "choice" && quizQuestion?.promptChordRoot
      ? quizQuestion.promptChordRoot
      : rootNote;

  // ── Shared JSX pieces ──────────────────────────────────────────

  const lastTapRef = useRef(0);
  const handleFretboardDoubleTap = useCallback(() => {
    if (showQuiz) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      toggleLayout();
    }
    lastTapRef.current = now;
  }, [showQuiz, toggleLayout]);

  const quizAccentColor = quizMode === "chord" || quizMode === "diatonic" ? chordColor : scaleColor;

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
          chordColor={quizAccentColor}
          scaleColor="#ff69b6"
          cagedColor="#40e0d0"
          quizColor={quizAccentColor}
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
        setHighlightedDegrees(new Set(DEGREE_BY_SEMITONE.filter((_, i) => overlaySemitones.has(i))))
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
      filterBtnRef={filterBtnRef}
      chipAreaRef={chipAreaRef}
    />
  );

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
                  ? "#e5e7eb"
                  : "#1c1917"
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
                  ? "#e5e7eb"
                  : "#1c1917"
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
                    style={[styles.infoChip, { borderColor: isDark ? "#d1d5db" : "#44403c" }]}
                  >
                    <Text style={[styles.infoChipText, { color: isDark ? "#d1d5db" : "#44403c" }]}>
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
                    style={[styles.infoChip, { borderColor: isDark ? "#d1d5db" : "#44403c" }]}
                  >
                    <Text style={[styles.infoChipText, { color: isDark ? "#d1d5db" : "#44403c" }]}>
                      {d}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          {/* New layer system info pills */}
          {effectiveLayers.some((l) => l.enabled) && (
            <View style={styles.landscapeInfoBar}>
              {effectiveLayers
                .filter((l) => l.enabled)
                .map((l) => {
                  let label: string;
                  if (l.type === "scale") {
                    label = t(
                      `options.scale.${l.scaleType.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase())}`,
                    );
                  } else {
                    const mode = t(`options.chordDisplayMode.${l.chordDisplayMode}`);
                    if (l.chordDisplayMode === "power") {
                      label = mode;
                    } else if (l.chordDisplayMode === "caged") {
                      label = `${mode}: ${[...l.cagedForms].join(", ")}`;
                    } else if (l.chordDisplayMode === "diatonic") {
                      label = `${mode}(${l.diatonicDegree} ${t(`options.diatonicKey.${l.diatonicKeyType === "natural-minor" ? "naturalMinor" : "major"}`)} ${t(`options.diatonicChordSize.${l.diatonicChordSize}`)})`;
                    } else if (l.chordDisplayMode === "triad") {
                      label = `${mode}(${l.chordType} ${t(`options.triadInversions.${l.triadInversion}`)})`;
                    } else {
                      label = `${mode}: ${l.chordType}`;
                    }
                  }
                  return (
                    <View key={l.id} style={[styles.infoPill, { backgroundColor: l.color }]}>
                      <Text style={styles.infoPillText}>{label}</Text>
                    </View>
                  );
                })}
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
        <HeaderBar
          theme={theme}
          rootNote={rootNote}
          accidental={accidental}
          baseLabelMode={baseLabelMode}
          showQuiz={showQuiz}
          rootChangeDisabled={!quizRootChangeEnabled}
          rootStepperRef={rootStepperRef}
          labelToggleRef={labelToggleRef}
          onBaseLabelModeChange={setBaseLabelMode}
          onRootNoteChange={quizRootChangeEnabled ? handleNoteClick : () => {}}
          quizKindValue={quizKindValue}
          quizKindOptions={quizKindOptions}
          onQuizKindChange={handleQuizKindDropdownChange}
          quizSelectorRef={quizSelectorRef}
          fretRange={fretRange}
          onThemeChange={setTheme}
          onFretRangeChange={setFretRange}
          onAccidentalChange={handleAccidentalChange}
          onShowHowToUse={openHowToUse}
        />
      </View>

      <View style={{ flex: 1, overflow: "hidden" }}>
        <View ref={fretboardAreaRef}>{fretboardEl}</View>
        {quizPanelEl}
        {footerFilterEl}
        {!showQuiz && (
          <LayerList
            theme={theme}
            rootNote={rootNote}
            accidental={accidental}
            layers={layers}
            onAddLayer={handleAddLayer}
            onUpdateLayer={handleUpdateLayer}
            onRemoveLayer={handleRemoveLayer}
            onToggleLayer={handleToggleLayer}
            onReorderLayers={handleReorderLayers}
            onPreviewLayer={setPreviewLayer}
          />
        )}
      </View>

      {tabBarEl}

      {showHowToUse && (
        <HowToUseOverlay
          theme={theme}
          showQuiz={showQuiz}
          positions={howToUsePositions}
          onClose={() => setShowHowToUse(false)}
        />
      )}
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
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.15)",
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
