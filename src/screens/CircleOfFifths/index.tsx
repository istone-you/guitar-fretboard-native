import { useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SceneHeader from "../../components/AppHeader/SceneHeader";
import type { Accidental, LayerConfig, Theme } from "../../types";
import { createDefaultLayer } from "../../types";
import { getRootIndex, getNotesByAccidental } from "../../lib/fretboard";
import CircleWheel, { type CircleOverlayKey } from "./CircleWheel";
import CircleHeader from "./CircleHeader";
import OverlayLegend from "./OverlayLegend";
import { MAJOR_KEYS, MINOR_KEYS, semitoneToCirclePosition, type KeyType } from "./lib/circleData";
import { getColors, pickNextLayerColor } from "../../themes/design";

const DIATONIC_TEMPLATE_ID: Record<KeyType, string> = {
  major: "diatonicMajorTriad",
  minor: "diatonicMinorTriad",
};

export interface CirclePaneProps {
  theme: Theme;
  accidental: Accidental;
  fretRange: [number, number];
  leftHanded?: boolean;
  onThemeChange: (theme: Theme) => void;
  onFretRangeChange: (range: [number, number]) => void;
  onAccidentalChange: (accidental: Accidental) => void;
  onLeftHandedChange: (value: boolean) => void;
  selectedIndex: number;
  keyType: KeyType;
  activeOverlay: CircleOverlayKey | null;
  onSelectedIndexChange: (index: number) => void;
  onKeyTypeChange: (keyType: KeyType) => void;
  onActiveOverlayChange: (overlay: CircleOverlayKey | null) => void;
  layers?: LayerConfig[];
  globalRootNote?: string;
  onAddLayerAndNavigate?: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

export default function CirclePane({
  theme,
  accidental,
  fretRange,
  leftHanded,
  onThemeChange,
  onFretRangeChange,
  onAccidentalChange,
  onLeftHandedChange,
  selectedIndex,
  keyType,
  activeOverlay,
  onSelectedIndexChange,
  onKeyTypeChange,
  onActiveOverlayChange,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: CirclePaneProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = getColors(theme === "dark");
  const notes = getNotesByAccidental(accidental);

  const handleSelectSegment = useCallback(
    (index: number, nextKeyType?: KeyType) => {
      onSelectedIndexChange(index);
      if (nextKeyType) onKeyTypeChange(nextKeyType);
    },
    [onSelectedIndexChange, onKeyTypeChange],
  );

  // Root note currently shown in the key picker (e.g., "C" for C major, "A" for A minor).
  const selectedRootNote = (() => {
    const majorName = MAJOR_KEYS[selectedIndex].split("/")[0];
    if (keyType === "major") {
      const idx = getRootIndex(majorName);
      return notes[idx];
    }
    const minorName = MINOR_KEYS[selectedIndex].split("/")[0].replace(/m$/u, "");
    const idx = getRootIndex(minorName);
    return notes[idx];
  })();

  const handleRootNoteChange = useCallback(
    (note: string) => {
      const semitone = getRootIndex(note);
      const relMajorSemitone = keyType === "minor" ? (semitone + 3) % 12 : semitone;
      onSelectedIndexChange(semitoneToCirclePosition(relMajorSemitone));
    },
    [keyType, onSelectedIndexChange],
  );

  const handleAddLayer = useCallback(() => {
    if (!onAddLayerAndNavigate || !layers) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const color = pickNextLayerColor(layers);
    const layer = createDefaultLayer("progression", `layer-${Date.now()}`, color);
    layer.progressionTemplateId = DIATONIC_TEMPLATE_ID[keyType];
    if (selectedRootNote !== globalRootNote) {
      layer.layerRoot = selectedRootNote;
      onEnablePerLayerRoot?.();
    }
    onAddLayerAndNavigate(layer);
  }, [
    onAddLayerAndNavigate,
    layers,
    keyType,
    selectedRootNote,
    globalRootNote,
    onEnablePerLayerRoot,
  ]);

  const isLayerFull = (layers?.length ?? 0) >= 3;

  return (
    <View style={[styles.container, { backgroundColor: colors.pageBg }]}>
      <SceneHeader
        theme={theme}
        title={t("circle.title")}
        accidental={accidental}
        fretRange={fretRange}
        leftHanded={leftHanded}
        onThemeChange={onThemeChange}
        onFretRangeChange={onFretRangeChange}
        onAccidentalChange={onAccidentalChange}
        onLeftHandedChange={onLeftHandedChange}
      />

      <CircleHeader
        theme={theme}
        accidental={accidental}
        rootNote={selectedRootNote}
        keyType={keyType}
        onRootNoteChange={handleRootNoteChange}
        onKeyTypeChange={onKeyTypeChange}
        onAddLayer={onAddLayerAndNavigate ? handleAddLayer : undefined}
        isLayerFull={isLayerFull}
        activeOverlay={activeOverlay}
        onActiveOverlayChange={onActiveOverlayChange}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(24, insets.bottom) + 96 },
        ]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.wheelWrap}>
          <CircleWheel
            theme={theme}
            keyType={keyType}
            selectedIndex={selectedIndex}
            activeOverlay={activeOverlay}
            onSelect={handleSelectSegment}
          />
        </View>

        <OverlayLegend theme={theme} activeOverlay={activeOverlay} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
    alignItems: "stretch",
  },
  wheelWrap: {
    marginBottom: 8,
  },
});
