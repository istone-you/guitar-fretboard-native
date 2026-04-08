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
import Svg, { Path, Line, Text as SvgText } from "react-native-svg";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import * as Haptics from "expo-haptics";
import "./src/i18n";
import { useTranslation } from "react-i18next";
import HeaderBar from "./src/components/AppHeader/index";
import { usePersistedSetting } from "./src/hooks/usePersistedSetting";
import { CHORD_QUIZ_TYPES_ALL, useQuiz } from "./src/hooks/useQuiz";
import { useLayerDerivedState } from "./src/hooks/useLayerDerivedState";
import { useQuizViewModel } from "./src/hooks/useQuizViewModel";
import { getNotesByAccidental, getRootIndex } from "./src/logic/fretboard";
import type {
  Theme,
  Accidental,
  BaseLabelMode,
  ScaleType,
  ChordType,
  LayerConfig,
} from "./src/types";
import { createDefaultLayer, MAX_LAYERS } from "./src/types";
import FretboardPane from "./src/components/AppPanes/FretboardPane";
import MainPracticePane from "./src/components/AppPanes/MainPracticePane";
import QuizPane from "./src/components/AppPanes/QuizPane";

const STORAGE_KEYS = {
  theme: "guiter:theme",
  accidental: "guiter:accidental",
  fretRange: "guiter:fret-range",
  leftHanded: "guiter:left-handed",
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

  const rotateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleLayout = useCallback(async () => {
    if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current);
    rotatingRef.current = true;
    setAnimDisabled(true);
    if (isLandscape) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    }
    rotateTimerRef.current = setTimeout(() => {
      rotatingRef.current = false;
      setAnimDisabled(false);
      rotateTimerRef.current = null;
    }, 500);
  }, [isLandscape]);

  // Quiz
  const [showQuiz, setShowQuiz] = useState(false);
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
  // Left-handed mode
  const [leftHanded, setLeftHanded] = usePersistedSetting<boolean>(
    STORAGE_KEYS.leftHanded,
    false,
    (v) => String(v),
    (v) => v === "true",
  );
  // New layer system
  // Fixed 3-slot layer system: each slot is either a layer or null
  const [slots, setSlots] = useState<(LayerConfig | null)[]>([null, null, null]);
  const layers = slots.filter((s): s is LayerConfig => s !== null);

  const handleAddLayer = (layer: LayerConfig, slotIndex?: number) =>
    setSlots((prev) => {
      if (slotIndex != null && slotIndex >= 0 && slotIndex < MAX_LAYERS) {
        const next = [...prev];
        next[slotIndex] = layer;
        return next;
      }
      // Fallback: fill first empty slot
      const emptyIdx = prev.indexOf(null);
      if (emptyIdx >= 0) {
        const next = [...prev];
        next[emptyIdx] = layer;
        return next;
      }
      return prev;
    });
  const handleUpdateLayer = (id: string, layer: LayerConfig) =>
    setSlots((prev) => prev.map((s) => (s?.id === id ? { ...layer, id } : s)));
  const handleRemoveLayer = (id: string) =>
    setSlots((prev) => prev.map((s) => (s?.id === id ? null : s)));
  const handleToggleLayer = (id: string) =>
    setSlots((prev) => prev.map((s) => (s?.id === id ? { ...s, enabled: !s.enabled } : s)));
  const handleReorderLayers = (reordered: (LayerConfig | null)[]) => setSlots(reordered);
  const handleLoadPreset = (preset: LayerConfig[]) => {
    const next: (LayerConfig | null)[] = [null, null, null];
    preset.forEach((l, i) => {
      if (i < MAX_LAYERS) next[i] = l;
    });
    setSlots(next);
  };
  const [previewLayer, setPreviewLayer] = useState<LayerConfig | null>(null);

  const [scaleType, setScaleType] = useState<ScaleType>("major");

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
  });

  const { effectiveLayers, overlaySemitones, overlayNotes, layerNoteLabelsMap } =
    useLayerDerivedState({
      layers,
      previewLayer,
      accidental,
      rootNote,
      baseLabelMode,
    });

  const { quizRootChangeEnabled, quizKindValue, quizKindOptions, handleQuizKindDropdownChange } =
    useQuizViewModel({
      showQuiz,
      quizMode,
      quizType,
      t,
      onQuizKindChange: handleQuizKindChange,
    });

  const quizNoteOptions = [...getNotesByAccidental(accidental)];

  const isDark = theme === "dark";
  const bgColor = isDark ? "#030712" : "#f3f4f6";
  const headerBg = isDark ? "#111111" : "#fafaf9";

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
  }, [quizMode, quizType, quizAccentColor, quizQuestion]);

  const fretboardEl = (
    <FretboardPane
      showQuiz={showQuiz}
      isLandscape={isLandscape}
      theme={theme}
      accidental={accidental}
      baseLabelMode={baseLabelMode}
      fretRange={fretRange}
      rootNote={rootNote}
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
      layers={effectiveLayers}
      disableAnimation={isLandscape || animDisabled}
      leftHanded={leftHanded}
      onFretboardDoubleTap={handleFretboardDoubleTap}
      onQuizCellClick={handleFretboardQuizAnswer}
    />
  );

  const quizPanelEl = (
    <QuizPane
      showQuiz={showQuiz}
      theme={theme}
      quizMode={quizMode}
      quizType={quizType}
      quizQuestion={quizQuestion}
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
      quizSelectedCells={quizSelectedCells}
      quizStrings={quizStrings}
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
                  } else if (l.type === "caged") {
                    const ct = l.cagedChordType === "minor" ? "m" : "";
                    label = `CAGED${ct}: ${[...l.cagedForms].join(", ") || "-"}`;
                  } else {
                    const mode = t(`options.chordDisplayMode.${l.chordDisplayMode}`);
                    if (l.chordDisplayMode === "power") {
                      label = mode;
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
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
      />
      <View
        style={{
          backgroundColor: headerBg,
          paddingTop: insets.top,
        }}
      >
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
          leftHanded={leftHanded}
          onLeftHandedChange={setLeftHanded}
        />
      </View>

      <View style={{ flex: 1, overflow: "hidden" }}>
        <View style={{ position: "relative" }}>
          <View>{fretboardEl}</View>
        </View>
        <View style={{ flex: 1, position: "relative" }}>
          {quizPanelEl}
          <MainPracticePane
            showQuiz={showQuiz}
            theme={theme}
            rootNote={rootNote}
            accidental={accidental}
            layers={layers}
            slots={slots}
            previewLayer={previewLayer}
            overlayNotes={overlayNotes}
            overlaySemitones={overlaySemitones}
            layerNoteLabelsMap={layerNoteLabelsMap}
            isDark={isDark}
            onAddLayer={handleAddLayer}
            onUpdateLayer={handleUpdateLayer}
            onRemoveLayer={handleRemoveLayer}
            onToggleLayer={handleToggleLayer}
            onReorderLayers={handleReorderLayers}
            onPreviewLayer={setPreviewLayer}
            onLoadPreset={handleLoadPreset}
          />
        </View>
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
