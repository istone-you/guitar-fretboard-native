import "./src/i18n";
import * as ScreenOrientation from "expo-screen-orientation";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, StatusBar, StyleSheet } from "react-native";
import { useState, useMemo, useCallback, useRef } from "react";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import TabView from "react-native-bottom-tabs";
import LandscapeLayout from "@/components/LandscapeLayout";
import { usePersistedSetting } from "@/hooks/usePersistedSetting";
import { useLayerDerivedState } from "@/hooks/useLayerDerivedState";
import { useLayers } from "@/hooks/useLayers";
import { useOrientation } from "@/hooks/useOrientation";
import { getNotesByAccidental, getRootIndex, PROGRESSION_TEMPLATES } from "@/lib/fretboard";
import type { Theme, Accidental, BaseLabelMode } from "@/types";
import LayerPane from "@/screens/Layer";
import QuizScreen, { type QuizScreenHandle } from "@/screens/Quiz";
import FinderPane from "@/screens/Finder";
import TemplatesPane from "@/screens/Templates";
import { useLayerPresets } from "@/hooks/useLayerPresets";
import { useProgressionTemplates } from "@/hooks/useProgressionTemplates";

ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

const STORAGE_KEYS = {
  theme: "guiter:theme",
  accidental: "guiter:accidental",
  fretRange: "guiter:fret-range",
  leftHanded: "guiter:left-handed",
  perLayerRoot: "guiter:per-layer-root",
} as const;

export default function App() {
  const { t } = useTranslation();

  // Shared persisted settings
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
  const [perLayerRoot, setPerLayerRoot] = usePersistedSetting<boolean>(
    STORAGE_KEYS.perLayerRoot,
    false,
    (v) => String(v),
    (v) => v === "true",
  );

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

  // Presets & progression templates
  const { presets, savePreset, loadPreset, deletePreset } = useLayerPresets();
  const { customTemplates, saveTemplate, updateTemplate, deleteTemplate, reorderTemplates } =
    useProgressionTemplates();
  const allProgressionTemplates = useMemo(
    () => [
      ...PROGRESSION_TEMPLATES,
      ...customTemplates.map((ct) => ({ id: ct.id, name: ct.name, chords: ct.chords })),
    ],
    [customTemplates],
  );

  // Derived layer state
  const { effectiveLayers, overlaySemitones, overlayNotes, layerNoteLabelsMap } =
    useLayerDerivedState({
      layers,
      previewLayer,
      accidental,
      rootNote,
      baseLabelMode,
      progressionTemplates: allProgressionTemplates,
    });

  // Tab navigation
  const [tabIndex, setTabIndex] = useState(0);
  const quizScreenRef = useRef<QuizScreenHandle>(null);

  const handleAccidentalChange = useCallback(
    (mode: Accidental) => {
      const idx = getRootIndex(rootNote);
      const notes = getNotesByAccidental(mode);
      setRootNote(notes[idx]);
      setAccidental(mode);
    },
    [rootNote, setAccidental],
  );

  const lastTapRef = useRef(0);
  const handleFretboardDoubleTap = useCallback(() => {
    if (tabIndex === 3) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      toggleLayout();
    }
    lastTapRef.current = now;
  }, [tabIndex, toggleLayout]);

  const handleNoteClick = useCallback(
    (noteName: string) => {
      if (noteName !== rootNote && effectiveLayers.some((layer) => layer.enabled)) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setRootNote(noteName);
      quizScreenRef.current?.regenerate();
    },
    [rootNote, effectiveLayers],
  );

  const handleTabIndexChange = useCallback(
    (index: number) => {
      if (tabIndex === 3 && index !== 3) {
        quizScreenRef.current?.onLeave();
      }
      setTabIndex(index);
    },
    [tabIndex],
  );

  const isDark = theme === "dark";
  const bgColor = isDark ? "#000000" : "#ffffff";

  const routes = useMemo(
    () => [
      {
        key: "layer",
        title: t("tabs.layer"),
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
        key: "templates",
        title: t("tabs.templates"),
        focusedIcon: { sfSymbol: "tray.full.fill" } as const,
        unfocusedIcon: { sfSymbol: "tray.full" } as const,
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

  const sharedHeaderProps = {
    theme,
    accidental,
    fretRange,
    leftHanded,
    onThemeChange: setTheme,
    onFretRangeChange: setFretRange,
    onAccidentalChange: handleAccidentalChange,
    onLeftHandedChange: setLeftHanded,
  };

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
    presets,
    onSavePreset: savePreset,
    loadPreset,
    onDeletePreset: deletePreset,
    progressionTemplates: allProgressionTemplates,
  };

  const renderScene = ({ route }: { route: { key: string } }) => {
    if (route.key === "layer") {
      return (
        <LayerPane
          {...sharedMainPaneProps}
          {...sharedHeaderProps}
          isLandscape={isLandscape}
          disableAnimation={isLandscape || animDisabled}
          perLayerRoot={perLayerRoot}
          onPerLayerRootChange={setPerLayerRoot}
        />
      );
    }
    if (route.key === "finder") {
      return (
        <FinderPane
          {...sharedHeaderProps}
          baseLabelMode={baseLabelMode}
          rootNote={rootNote}
          layers={layers}
          onBaseLabelModeChange={setBaseLabelMode}
          onAddLayerAndNavigate={(layer) => {
            setTabIndex(0);
            setTimeout(() => handleAddLayer(layer), 0);
          }}
        />
      );
    }
    if (route.key === "templates") {
      return (
        <TemplatesPane
          {...sharedHeaderProps}
          layers={layers}
          customTemplates={customTemplates}
          onSaveTemplate={saveTemplate}
          onUpdateTemplate={updateTemplate}
          onDeleteTemplate={deleteTemplate}
          onReorderTemplates={reorderTemplates}
          onAddLayerAndNavigate={(layer) => {
            setTabIndex(0);
            setTimeout(() => handleAddLayer(layer), 0);
          }}
        />
      );
    }
    if (route.key === "quiz") {
      return (
        <QuizScreen
          ref={quizScreenRef}
          {...sharedHeaderProps}
          rootNote={rootNote}
          baseLabelMode={baseLabelMode}
          isLandscape={isLandscape}
          winWidth={winWidth}
          onFretboardDoubleTap={handleFretboardDoubleTap}
        />
      );
    }
    return null;
  };

  return (
    <SafeAreaProvider>
      {isLandscape ? (
        <LandscapeLayout {...sharedMainPaneProps} {...sharedHeaderProps} winHeight={winHeight} />
      ) : (
        <View style={[styles.safeArea, { backgroundColor: bgColor }]}>
          <StatusBar
            translucent
            barStyle={isDark ? "light-content" : "dark-content"}
            backgroundColor="transparent"
          />
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
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex1: { flex: 1 },
});
