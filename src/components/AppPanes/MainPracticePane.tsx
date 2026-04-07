import { View } from "react-native";
import LayerList from "../LayerSystem/LayerList";
import type { Accidental, LayerConfig, Theme } from "../../types";

interface MainPracticePaneProps {
  showQuiz: boolean;
  theme: Theme;
  rootNote: string;
  accidental: Accidental;
  layers: LayerConfig[];
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
  showQuiz,
  theme,
  rootNote,
  accidental,
  layers,
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
    <>
      {showQuiz && <View style={{ height: 100 }} />}
      {!showQuiz && (
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
      )}
    </>
  );
}
