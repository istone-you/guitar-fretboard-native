import { View } from "react-native";
import LayerList from "../../components/LayerList";
import NormalFretboard from "../../components/NormalFretboard";
import PracticePane from "../../components/ui/PracticePane";
import type { Accidental, BaseLabelMode, LayerConfig, Theme } from "../../types";

interface MainPracticePaneProps {
  isLandscape: boolean;
  theme: Theme;
  accidental: Accidental;
  baseLabelMode: BaseLabelMode;
  fretRange: [number, number];
  rootNote: string;
  layers: LayerConfig[];
  disableAnimation: boolean;
  leftHanded?: boolean;
  onFretboardDoubleTap: () => void;
  previewLayer: LayerConfig | null;
  overlayNotes: string[];
  overlaySemitones: Set<number>;
  layerNoteLabelsMap: Map<string, string[]>;
  isDark: boolean;
  slots: (LayerConfig | null)[];
  onAddLayer: (layer: LayerConfig, slotIndex?: number) => void;
  onUpdateLayer: (id: string, layer: LayerConfig) => void;
  onRemoveLayer: (id: string) => void;
  onToggleLayer: (id: string) => void;
  onReorderLayers: (slots: (LayerConfig | null)[]) => void;
  onPreviewLayer: (layer: LayerConfig | null) => void;
  onLoadPreset: (layers: LayerConfig[]) => void;
}

export default function MainPracticePane({
  isLandscape,
  theme,
  accidental,
  baseLabelMode,
  fretRange,
  rootNote,
  layers,
  disableAnimation,
  leftHanded,
  onFretboardDoubleTap,
  previewLayer,
  overlayNotes,
  overlaySemitones,
  layerNoteLabelsMap,
  slots,
  onAddLayer,
  onUpdateLayer,
  onRemoveLayer,
  onToggleLayer,
  onReorderLayers,
  onPreviewLayer,
  onLoadPreset,
}: MainPracticePaneProps) {
  return (
    <PracticePane
      isLandscape={isLandscape}
      onFretboardDoubleTap={onFretboardDoubleTap}
      fretboard={
        <NormalFretboard
          theme={theme}
          accidental={accidental}
          baseLabelMode={baseLabelMode}
          fretRange={fretRange}
          rootNote={rootNote}
          layers={layers}
          disableAnimation={disableAnimation}
          leftHanded={leftHanded}
          onNoteClick={() => {}}
        />
      }
    >
      <View>
        <LayerList
          theme={theme}
          rootNote={rootNote}
          accidental={accidental}
          layers={layers}
          slots={slots}
          onAddLayer={onAddLayer}
          onUpdateLayer={onUpdateLayer}
          onRemoveLayer={onRemoveLayer}
          onToggleLayer={onToggleLayer}
          onReorderLayers={onReorderLayers}
          onPreviewLayer={onPreviewLayer}
          previewLayer={previewLayer}
          overlayNotes={overlayNotes}
          overlaySemitones={overlaySemitones}
          layerNoteLabels={layerNoteLabelsMap}
          onLoadPreset={onLoadPreset}
        />
      </View>
    </PracticePane>
  );
}
