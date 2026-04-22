import { useRef, useState } from "react";
import { View, Animated, PanResponder, StyleSheet, useWindowDimensions } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../i18n";
import SceneHeader from "../../components/AppHeader/SceneHeader";
import { getColors } from "../../themes/design";
import type { Theme, Accidental, BaseLabelMode, LayerConfig } from "../../types";
import FinderSelection from "./Selection";
import IdentifyPane from "./IdentifyPane";
import ChordBrowser from "./ChordBrowser";
import DiatonicBrowser from "./DiatonicBrowser";
import SubstitutionFinder from "./SubstitutionFinder";
import CapoFinder from "./CapoFinder";
import ModulationFinder from "./ModulationFinder";
import RelatedKeysBrowser from "./RelatedKeysBrowser";
import ModeBrowser from "./ModeBrowser";
import type { FinderMode } from "./types";

export interface FinderPaneProps {
  theme: Theme;
  accidental: Accidental;
  baseLabelMode: BaseLabelMode;
  fretRange: [number, number];
  rootNote: string;
  leftHanded?: boolean;
  layers: LayerConfig[];
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onBaseLabelModeChange: (mode: BaseLabelMode) => void;
  onEnablePerLayerRoot?: () => void;
  // Header props
  onThemeChange: (theme: Theme) => void;
  onFretRangeChange: (range: [number, number]) => void;
  onAccidentalChange: (accidental: Accidental) => void;
  onLeftHandedChange: (value: boolean) => void;
}

export default function FinderPane({
  theme,
  accidental,
  baseLabelMode,
  fretRange,
  rootNote,
  leftHanded,
  layers,
  onAddLayerAndNavigate,
  onBaseLabelModeChange,
  onEnablePerLayerRoot,
  onThemeChange,
  onFretRangeChange,
  onAccidentalChange,
  onLeftHandedChange,
}: FinderPaneProps) {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const isDark = theme === "dark";
  const bgColor = getColors(isDark).pageBg;

  const [selectedMode, setSelectedMode] = useState<FinderMode | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const selectedModeRef = useRef(selectedMode);
  selectedModeRef.current = selectedMode;
  const handleBackRef = useRef(() => {});

  const handleSelect = (mode: FinderMode) => {
    setSelectedMode(mode);
    slideAnim.setValue(screenWidth);
    setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();
    }, 0);
  };

  const handleBack = () => {
    Animated.timing(slideAnim, {
      toValue: screenWidth,
      duration: 120,
      useNativeDriver: true,
    }).start(() => setSelectedMode(null));
  };
  handleBackRef.current = handleBack;

  const swipePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        selectedModeRef.current !== null && g.dx > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (g.dx > 0) slideAnim.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > 80 || (g.dx > 30 && g.vx > 0.5)) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          handleBackRef.current();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 9,
            tension: 160,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 9,
          tension: 160,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  return (
    <View style={styles.root}>
      <SceneHeader
        theme={theme}
        title={selectedMode ? undefined : t("tabs.finder")}
        accidental={accidental}
        fretRange={fretRange}
        leftHanded={leftHanded}
        onBack={selectedMode ? handleBack : undefined}
        onThemeChange={onThemeChange}
        onFretRangeChange={onFretRangeChange}
        onAccidentalChange={onAccidentalChange}
        onLeftHandedChange={onLeftHandedChange}
      />
      <View style={styles.content}>
        <FinderSelection theme={theme} onSelect={handleSelect} />
        {selectedMode !== null && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: bgColor,
                transform: [{ translateX: slideAnim }],
                borderTopLeftRadius: 28,
                borderBottomLeftRadius: 28,
                overflow: "hidden",
              },
            ]}
            {...swipePanResponder.panHandlers}
          >
            {selectedMode === "identify" ? (
              <IdentifyPane
                theme={theme}
                accidental={accidental}
                baseLabelMode={baseLabelMode}
                fretRange={fretRange}
                rootNote={rootNote}
                leftHanded={leftHanded}
                layers={layers}
                onAddLayerAndNavigate={onAddLayerAndNavigate}
                onBaseLabelModeChange={onBaseLabelModeChange}
              />
            ) : selectedMode === "chord-list" ? (
              <ChordBrowser
                theme={theme}
                accidental={accidental}
                layers={layers}
                globalRootNote={rootNote}
                onAddLayerAndNavigate={onAddLayerAndNavigate}
                onEnablePerLayerRoot={onEnablePerLayerRoot}
              />
            ) : selectedMode === "diatonic" ? (
              <DiatonicBrowser
                theme={theme}
                accidental={accidental}
                layers={layers}
                globalRootNote={rootNote}
                onAddLayerAndNavigate={onAddLayerAndNavigate}
                onEnablePerLayerRoot={onEnablePerLayerRoot}
              />
            ) : selectedMode === "substitution" ? (
              <SubstitutionFinder
                theme={theme}
                accidental={accidental}
                layers={layers}
                globalRootNote={rootNote}
                onAddLayerAndNavigate={onAddLayerAndNavigate}
                onEnablePerLayerRoot={onEnablePerLayerRoot}
              />
            ) : selectedMode === "modulation" ? (
              <ModulationFinder
                theme={theme}
                accidental={accidental}
                layers={layers}
                globalRootNote={rootNote}
                onAddLayerAndNavigate={onAddLayerAndNavigate}
                onEnablePerLayerRoot={onEnablePerLayerRoot}
              />
            ) : selectedMode === "related-keys" ? (
              <RelatedKeysBrowser
                theme={theme}
                accidental={accidental}
                layers={layers}
                globalRootNote={rootNote}
                onAddLayerAndNavigate={onAddLayerAndNavigate}
                onEnablePerLayerRoot={onEnablePerLayerRoot}
              />
            ) : selectedMode === "modes" ? (
              <ModeBrowser
                theme={theme}
                accidental={accidental}
                layers={layers}
                globalRootNote={rootNote}
                onAddLayerAndNavigate={onAddLayerAndNavigate}
                onEnablePerLayerRoot={onEnablePerLayerRoot}
              />
            ) : (
              <CapoFinder theme={theme} accidental={accidental} />
            )}
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
