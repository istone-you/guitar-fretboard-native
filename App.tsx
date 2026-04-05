import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from "react-native";
import Svg, { Path, Line, Text as SvgText } from "react-native-svg";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import * as Haptics from "expo-haptics";
import "./src/i18n";
import { useTranslation } from "react-i18next";
import HeaderBar from "./src/components/AppHeader/index";
import NormalFretboard from "./src/components/NormalFretboard/index";
import QuizFretboard from "./src/components/QuizFretboard/index";
import QuizPanel from "./src/components/QuizPanel/index";

import { usePersistedSetting } from "./src/hooks/usePersistedSetting";
import { CHORD_QUIZ_TYPES_ALL, useQuiz } from "./src/hooks/useQuiz";
import {
  NOTES_SHARP,
  NOTES_FLAT,
  CHORD_SEMITONES,
  SCALE_DEGREES,
  getDiatonicChordSemitones,
  parseOnChord,
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
import { createDefaultLayer } from "./src/types";
import LayerList from "./src/components/LayerSystem/LayerList";

const DEFAULT_CHORD_QUIZ_TYPES: ChordType[] = ["Major", "Minor", "7th", "maj7", "m7"];

const DEGREE_BY_SEMITONE = ["P1", "m2", "M2", "m3", "M3", "P4", "b5", "P5", "m6", "M6", "m7", "M7"];
const DEGREE_LABEL_ORDER = [
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
  "b9",
  "9",
  "#9",
  "11",
  "#11",
  "b13",
  "13",
] as const;

const normalizeDegreeLabel = (label: string) => label.replace("♭", "b").replace("♯", "#");

function BounceActionButton({
  label,
  onPress,
  style,
  textStyle,
}: {
  label: string;
  onPress: () => void;
  style: any;
  textStyle: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const bounce = () => {
    scale.stopAnimation();
    scale.setValue(0.92);
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={() => {
        bounce();
        onPress();
      }}
      activeOpacity={0.9}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        <Text style={textStyle}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const STORAGE_KEYS = {
  theme: "guiter:theme",
  accidental: "guiter:accidental",
  fretRange: "guiter:fret-range",
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
    "light",
    (v) => v,
    (v) => v as Theme,
  );
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

  // Cell edit mode (hide dots / create chord frames)
  const [cellEditMode, setCellEditMode] = useState<"hide" | "frame" | null>(null);
  const [cellEditLayerId, setCellEditLayerId] = useState<string | null>(null);
  const [editingCells, setEditingCells] = useState<Set<string>>(new Set());
  const [cellEditBounceKey, setCellEditBounceKey] = useState<string | null>(null);
  const [cellEditBounceTick, setCellEditBounceTick] = useState(0);
  const [reopenLayerId, setReopenLayerId] = useState<string | null>(null);
  const [cellEditUiVisible, setCellEditUiVisible] = useState(false);
  const cellEditAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (cellEditMode) {
      setCellEditUiVisible(true);
      Animated.timing(cellEditAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(cellEditAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setCellEditUiVisible(false);
    });
  }, [cellEditMode]);

  // Layers with preview merged
  const effectiveLayers = useMemo(() => {
    if (!previewLayer) return layers;
    const existing = layers.find((l) => l.id === previewLayer.id);
    if (existing) return layers.map((l) => (l.id === previewLayer.id ? previewLayer : l));
    return [...layers, previewLayer];
  }, [layers, previewLayer]);

  const handleStartCellEdit = (
    mode: "hide" | "frame",
    layerId: string,
    draftLayer?: LayerConfig,
  ) => {
    setCellEditMode(mode);
    setCellEditLayerId(layerId);
    if (draftLayer) setPreviewLayer(draftLayer);
    const layer =
      draftLayer ??
      (previewLayer && previewLayer.id === layerId ? previewLayer : null) ??
      layers.find((l) => l.id === layerId);
    if (mode === "hide" && layer) {
      setEditingCells(new Set(layer.hiddenCells));
    } else {
      setEditingCells(new Set());
    }
  };

  const handleCellToggle = (cellKey: string) => {
    setCellEditBounceKey(cellKey);
    setCellEditBounceTick((prev) => prev + 1);
    setEditingCells((prev) => {
      const next = new Set(prev);
      if (next.has(cellKey)) next.delete(cellKey);
      else next.add(cellKey);
      return next;
    });
  };

  const handleCellEditDone = () => {
    if (cellEditLayerId) {
      if (cellEditMode === "hide") {
        const target =
          (previewLayer && previewLayer.id === cellEditLayerId ? previewLayer : null) ??
          layers.find((l) => l.id === cellEditLayerId);
        if (target) {
          const updatedLayer = {
            ...target,
            hiddenCells: editingCells,
          };
          handleUpdateLayer(cellEditLayerId, updatedLayer);
          setPreviewLayer(updatedLayer);
        }
      } else if (cellEditMode === "frame" && editingCells.size > 0) {
        const target =
          (previewLayer && previewLayer.id === cellEditLayerId ? previewLayer : null) ??
          layers.find((l) => l.id === cellEditLayerId);
        if (target) {
          const updatedLayer = {
            ...target,
            chordFrames: [...target.chordFrames, { cells: [...editingCells] }],
          };
          handleUpdateLayer(cellEditLayerId, updatedLayer);
          setPreviewLayer(updatedLayer);
        }
      }
    }
    const layerId = cellEditLayerId;
    setCellEditMode(null);
    setCellEditLayerId(null);
    setEditingCells(new Set());
    setReopenLayerId(layerId);
  };

  const handleCellEditCancel = () => {
    const layerId = cellEditLayerId;
    setCellEditMode(null);
    setCellEditLayerId(null);
    setEditingCells(new Set());
    setReopenLayerId(layerId);
  };

  const handleCellEditReset = () => {
    setEditingCells(new Set());
    if (cellEditMode === "hide" && cellEditLayerId) {
      const target =
        (previewLayer && previewLayer.id === cellEditLayerId ? previewLayer : null) ??
        layers.find((l) => l.id === cellEditLayerId);
      if (target) {
        const updatedLayer = { ...target, hiddenCells: new Set<string>() };
        handleUpdateLayer(cellEditLayerId, updatedLayer);
        setPreviewLayer(updatedLayer);
      }
    } else if (cellEditMode === "frame" && cellEditLayerId) {
      const target =
        (previewLayer && previewLayer.id === cellEditLayerId ? previewLayer : null) ??
        layers.find((l) => l.id === cellEditLayerId);
      if (target) {
        const updatedLayer = { ...target, chordFrames: [] };
        handleUpdateLayer(cellEditLayerId, updatedLayer);
        setPreviewLayer(updatedLayer);
      }
    }
  };

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
      if (layer.type !== "chord") continue;

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
      } else if (layer.chordDisplayMode === "on-chord") {
        const parsed = parseOnChord(layer.onChordName);
        semitones = parsed ? CHORD_SEMITONES[parsed.chordType] : undefined;
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

  // Per-layer note/degree labels for display below fretboard
  const layerNoteLabelsMap = useMemo(() => {
    const notes = accidental === "sharp" ? NOTES_SHARP : NOTES_FLAT;
    const rootIndex = getRootIndex(rootNote);
    const useDegree = baseLabelMode === "degree";
    const map = new Map<string, string[]>();
    for (const l of effectiveLayers) {
      let semitones: number[] = [];
      if (l.type === "scale") {
        semitones = [...(SCALE_DEGREES[l.scaleType] ?? [])];
      } else if (l.type === "chord") {
        let s: Set<number> | undefined;
        if (l.chordDisplayMode === "power") {
          s = CHORD_SEMITONES.power;
        } else if (l.chordDisplayMode === "diatonic") {
          s = getDiatonicChordSemitones(
            rootIndex,
            `${l.diatonicKeyType}-${l.diatonicChordSize}`,
            l.diatonicDegree,
          );
        } else if (l.chordDisplayMode === "caged") {
          s = CHORD_SEMITONES.Major;
        } else if (l.chordDisplayMode === "on-chord") {
          const parsed = parseOnChord(l.onChordName);
          s = parsed ? CHORD_SEMITONES[parsed.chordType] : undefined;
        } else {
          s = CHORD_SEMITONES[l.chordType];
        }
        semitones = [...(s ?? [])];
      } else if (l.type === "custom") {
        if (l.customMode === "note") {
          for (const n of l.selectedNotes) {
            const ni = (notes as readonly string[]).indexOf(n);
            if (ni >= 0) semitones.push((ni - rootIndex + 12) % 12);
          }
        } else {
          const DEGREE_TO_SEMITONE: Record<string, number> = {
            P1: 0,
            m2: 1,
            M2: 2,
            m3: 3,
            M3: 4,
            P4: 5,
            b5: 6,
            P5: 7,
            m6: 8,
            M6: 9,
            m7: 10,
            M7: 11,
            b9: 1,
            "♭9": 1,
            "9": 2,
            "#9": 3,
            "♯9": 3,
            "11": 5,
            "#11": 6,
            "♯11": 6,
            b13: 8,
            "♭13": 8,
            "13": 9,
          };
          for (const d of l.selectedDegrees) {
            const di = DEGREE_TO_SEMITONE[d];
            if (di !== undefined) semitones.push(di);
          }
        }
      }
      const sorted = semitones.sort((a, b) => a - b);
      if (useDegree && l.type === "custom" && l.customMode === "degree") {
        const normalized = [...new Set([...l.selectedDegrees].map(normalizeDegreeLabel))];
        const orderIndex = new Map<string, number>(DEGREE_LABEL_ORDER.map((d, i) => [d, i]));
        normalized.sort((a, b) => (orderIndex.get(a) ?? 999) - (orderIndex.get(b) ?? 999));
        map.set(l.id, normalized);
      } else {
        map.set(
          l.id,
          useDegree
            ? sorted.map((s) => DEGREE_BY_SEMITONE[s])
            : sorted.map((s) => notes[(rootIndex + s) % 12]),
        );
      }
    }
    return map;
  }, [effectiveLayers, accidental, rootNote, baseLabelMode]);

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
    if (showQuiz || cellEditUiVisible) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      toggleLayout();
    }
    lastTapRef.current = now;
  }, [showQuiz, cellEditUiVisible, toggleLayout]);

  const quizAccentColor = quizMode === "chord" || quizMode === "diatonic" ? "#40E0D0" : "#ff69b6";

  // Temporary chord layer for quiz mode
  const quizLayers = useMemo(() => {
    if (quizMode === "chord" && quizType === "choice") {
      const layer = createDefaultLayer("chord", "quiz-chord", quizAccentColor);
      layer.chordDisplayMode = "form";
      layer.chordType = quizQuestion?.promptChordType ?? "Major";
      return [layer];
    }
    return [];
  }, [quizMode, quizType, quizAccentColor, quizQuestion?.promptChordType]);

  const fretboardEl = (
    <View style={{ paddingVertical: isLandscape ? 2 : 8 }} onTouchEnd={handleFretboardDoubleTap}>
      {showQuiz ? (
        <QuizFretboard
          theme={theme}
          accidental={accidental}
          baseLabelMode={baseLabelMode}
          fretRange={fretRange}
          rootNote={quizEffectiveRootNote}
          layers={quizLayers}
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
        />
      ) : (
        <NormalFretboard
          {...commonFretboardProps}
          rootNote={rootNote}
          onNoteClick={() => {}}
          cellEditMode={cellEditMode}
          cellEditLayerId={cellEditLayerId}
          editingCells={editingCells}
          cellEditBounceKey={cellEditBounceKey}
          cellEditBounceTick={cellEditBounceTick}
          onCellToggle={handleCellToggle}
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
          source={isDark ? require("./public/guiter_dark.png") : require("./public/guiter.png")}
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
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
            stroke={showQuiz ? (isDark ? "#e5e7eb" : "#1c1917") : isDark ? "#6b7280" : "#a8a29e"}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <SvgText
            x="12"
            y="16"
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill={showQuiz ? (isDark ? "#e5e7eb" : "#1c1917") : isDark ? "#6b7280" : "#a8a29e"}
          >
            Q
          </SvgText>
        </Svg>
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
          </View>
          {/* New layer system info pills */}
          {effectiveLayers.some((l) => l.enabled) && (
            <View style={styles.landscapeInfoBar}>
              {effectiveLayers
                .filter((l) => l.enabled)
                .map((l) => {
                  let label: string;
                  if (l.type === "custom") {
                    const items =
                      l.customMode === "note" ? [...l.selectedNotes] : [...l.selectedDegrees];
                    label = items.length > 0 ? items.join(", ") : t("layers.custom");
                  } else if (l.type === "scale") {
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
                    } else if (l.chordDisplayMode === "on-chord") {
                      label = `${mode}: ${l.onChordName}`;
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
        barStyle={cellEditUiVisible ? "light-content" : isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
      />
      <View
        style={{
          backgroundColor: headerBg,
          paddingTop: insets.top,
        }}
        pointerEvents={cellEditUiVisible ? "none" : "auto"}
      >
        {cellEditUiVisible && (
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.45)",
              zIndex: 10,
              opacity: cellEditAnim,
            }}
          />
        )}
        <HeaderBar
          theme={theme}
          rootNote={rootNote}
          accidental={accidental}
          baseLabelMode={baseLabelMode}
          showQuiz={showQuiz}
          rootChangeDisabled={!quizRootChangeEnabled}
          onBaseLabelModeChange={setBaseLabelMode}
          onRootNoteChange={quizRootChangeEnabled ? handleNoteClick : () => {}}
          quizKindValue={quizKindValue}
          quizKindOptions={quizKindOptions}
          onQuizKindChange={handleQuizKindDropdownChange}
          fretRange={fretRange}
          onThemeChange={setTheme}
          onFretRangeChange={setFretRange}
          onAccidentalChange={handleAccidentalChange}
        />
      </View>

      <View style={{ flex: 1, overflow: "hidden" }}>
        <View style={{ position: "relative" }}>
          <View>{fretboardEl}</View>
        </View>
        <View style={{ flex: 1, position: "relative" }}>
          {quizPanelEl}
          {showQuiz && <View style={{ height: 100 }} />}
          {!showQuiz && (
            <View>
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
                previewLayer={previewLayer}
                overlayNotes={overlayNotes}
                overlaySemitones={overlaySemitones}
                layerNoteLabels={layerNoteLabelsMap}
                onStartCellEdit={handleStartCellEdit}
                reopenLayerId={reopenLayerId}
                onClearReopenLayerId={() => setReopenLayerId(null)}
              />
            </View>
          )}
          {cellEditUiVisible && (
            <Animated.View
              pointerEvents="auto"
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: "rgba(0,0,0,0.5)",
                  opacity: cellEditAnim,
                  zIndex: 5,
                },
              ]}
            />
          )}
          {cellEditUiVisible && (
            <Animated.View
              pointerEvents="box-none"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                zIndex: 6,
                opacity: cellEditAnim,
                transform: [
                  {
                    translateY: cellEditAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [24, 0],
                    }),
                  },
                ],
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                }}
              >
                <BounceActionButton
                  label={t("layers.cancel")}
                  onPress={handleCellEditCancel}
                  style={{
                    minWidth: 104,
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isDark ? "#374151" : "#d6d3d1",
                    backgroundColor: isDark ? "#111" : "#f5f5f4",
                  }}
                  textStyle={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: isDark ? "#e5e7eb" : "#1c1917",
                  }}
                />
                <BounceActionButton
                  label={t("layers.reset")}
                  onPress={handleCellEditReset}
                  style={{
                    minWidth: 104,
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.25)",
                    backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "rgba(254,226,226,0.7)",
                  }}
                  textStyle={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: isDark ? "#f87171" : "#ef4444",
                  }}
                />
                <BounceActionButton
                  label={t("layers.confirm")}
                  onPress={handleCellEditDone}
                  style={{
                    minWidth: 104,
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: isDark ? "#e5e7eb" : "#1c1917",
                  }}
                  textStyle={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: isDark ? "#1c1917" : "#fff",
                  }}
                />
              </View>
            </Animated.View>
          )}
        </View>
      </View>

      {!cellEditUiVisible && tabBarEl}
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
