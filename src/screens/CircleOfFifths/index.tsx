import { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Accidental, ChordType, LayerConfig, Theme } from "../../types";
import { createDefaultLayer } from "../../types";
import { getRootIndex, getNotesByAccidental } from "../../lib/fretboard";
import ChordDiagram, { getAllChordForms } from "../../components/ui/ChordDiagram";
import FinderDetailSheet from "../../components/ui/FinderDetailSheet";
import CircleWheel, { type CircleOverlayKey } from "./CircleWheel";
import CircleHeader from "./CircleHeader";
import DominantsPanel from "./DominantsPanel";
import KeyInfoPanel from "./KeyInfoPanel";
import ModalInterchangePanel from "./ModalInterchangePanel";
import OverlayLegend from "./OverlayLegend";
import RelatedKeysPanel from "./RelatedKeysPanel";
import { MAJOR_KEYS, MINOR_KEYS, semitoneToCirclePosition, type KeyType } from "./lib/circleData";
import { getColors, pickNextLayerColor } from "../../themes/design";

export interface CircleChordDetail {
  rootIndex: number;
  chordType: ChordType;
  chordName: string;
  subtitle?: string;
}

const DIATONIC_TEMPLATE_ID: Record<KeyType, string> = {
  major: "diatonicMajorTriad",
  minor: "diatonicMinorTriad",
};

export interface CirclePaneProps {
  theme: Theme;
  accidental: Accidental;
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
  const insets = useSafeAreaInsets();
  const colors = getColors(theme === "dark");
  const notes = getNotesByAccidental(accidental);
  const { width: screenWidth } = useWindowDimensions();

  const FORM_GAP = 8;
  const formWidth = Math.floor((screenWidth - 32 - FORM_GAP * 2) / 3);

  const [pendingChord, setPendingChord] = useState<CircleChordDetail | null>(null);

  const handleChordTap = useCallback((detail: CircleChordDetail) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingChord(detail);
  }, []);

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

  const handleAddChordLayer = useCallback(() => {
    if (!pendingChord || !onAddLayerAndNavigate || !layers) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const color = pickNextLayerColor(layers);
    const layer = createDefaultLayer("chord", `layer-${Date.now()}`, color);
    layer.chordDisplayMode = "form";
    layer.chordType = pendingChord.chordType;
    if (notes[pendingChord.rootIndex] !== globalRootNote) {
      layer.layerRoot = notes[pendingChord.rootIndex];
      onEnablePerLayerRoot?.();
    }
    onAddLayerAndNavigate(layer);
  }, [pendingChord, onAddLayerAndNavigate, layers, notes, globalRootNote, onEnablePerLayerRoot]);

  const isLayerFull = (layers?.length ?? 0) >= 3;

  return (
    <View style={[styles.container, { backgroundColor: colors.pageBg }]}>
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

        {activeOverlay === "relatedKeys" && (
          <RelatedKeysPanel
            theme={theme}
            accidental={accidental}
            selectedIndex={selectedIndex}
            keyType={keyType}
            onChordTap={handleChordTap}
          />
        )}
        {activeOverlay === "diatonic" && (
          <KeyInfoPanel
            theme={theme}
            accidental={accidental}
            selectedIndex={selectedIndex}
            keyType={keyType}
            onChordTap={handleChordTap}
          />
        )}
        {activeOverlay === "dominants" && (
          <DominantsPanel
            theme={theme}
            accidental={accidental}
            selectedIndex={selectedIndex}
            keyType={keyType}
            onChordTap={handleChordTap}
          />
        )}
        {activeOverlay === "modalInterchange" && (
          <ModalInterchangePanel
            theme={theme}
            accidental={accidental}
            selectedIndex={selectedIndex}
            keyType={keyType}
            onChordTap={handleChordTap}
          />
        )}
      </ScrollView>

      <FinderDetailSheet
        visible={pendingChord !== null}
        onClose={() => setPendingChord(null)}
        theme={theme}
        title={pendingChord?.chordName ?? ""}
        subtitle={pendingChord?.subtitle}
        mediaContent={
          pendingChord &&
          getAllChordForms(pendingChord.rootIndex, pendingChord.chordType).length > 0 ? (
            <View style={styles.modalDiagrams}>
              {getAllChordForms(pendingChord.rootIndex, pendingChord.chordType).map((cells, fi) => (
                <ChordDiagram
                  key={fi}
                  cells={cells}
                  rootIndex={pendingChord.rootIndex}
                  theme={theme}
                  width={formWidth}
                />
              ))}
            </View>
          ) : null
        }
        isFull={isLayerFull}
        onAddLayer={onAddLayerAndNavigate ? handleAddChordLayer : undefined}
      />
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
  modalDiagrams: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
