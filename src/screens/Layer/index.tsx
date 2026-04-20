import { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import LayerList from "../../components/LayerList";
import NormalFretboard from "../../components/NormalFretboard";
import PracticePane from "../../components/ui/PracticePane";
import FretboardControls from "../../components/FretboardControls";
import SceneHeader from "../../components/AppHeader/SceneHeader";
import type { Accidental, BaseLabelMode, LayerConfig, Theme } from "../../types";
import type { LayerPreset } from "../../hooks/useLayerPresets";
import type { ProgressionTemplate } from "../../lib/fretboard";

export interface LayerPaneProps {
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
  onPreviewLayer: (layer: LayerConfig | null) => void;
  onReorderLayer: (orderedIds: string[]) => void;
  onLoadPreset: (layers: LayerConfig[]) => void;
  onRootNoteChange: (note: string) => void;
  onBaseLabelModeChange: (mode: BaseLabelMode) => void;
  presets: LayerPreset[];
  onSavePreset: (name: string, layers: LayerConfig[]) => void;
  loadPreset: (id: string) => LayerConfig[] | null;
  onDeletePreset?: (id: string) => void;
  progressionTemplates?: ProgressionTemplate[];
  hidePresetButton?: boolean;
  // Header props
  onThemeChange: (theme: Theme) => void;
  onFretRangeChange: (range: [number, number]) => void;
  onAccidentalChange: (accidental: Accidental) => void;
  onLeftHandedChange: (value: boolean) => void;
}

export default function LayerPane({
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
  onPreviewLayer,
  onReorderLayer,
  onLoadPreset,
  onRootNoteChange,
  onBaseLabelModeChange,
  presets,
  onSavePreset,
  loadPreset,
  onDeletePreset,
  progressionTemplates,
  hidePresetButton,
  onThemeChange,
  onFretRangeChange,
  onAccidentalChange,
  onLeftHandedChange,
}: LayerPaneProps) {
  const { t } = useTranslation();
  const [presetModalVisible, setPresetModalVisible] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <SceneHeader
        theme={theme}
        title={t("tabs.layer")}
        accidental={accidental}
        fretRange={fretRange}
        leftHanded={leftHanded}
        onThemeChange={onThemeChange}
        onFretRangeChange={onFretRangeChange}
        onAccidentalChange={onAccidentalChange}
        onLeftHandedChange={onLeftHandedChange}
      />
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
            progressionTemplates={progressionTemplates}
          />
        }
        controls={
          <FretboardControls
            theme={theme}
            rootNote={rootNote}
            accidental={accidental}
            baseLabelMode={baseLabelMode}
            onRootNoteChange={onRootNoteChange}
            onBaseLabelModeChange={onBaseLabelModeChange}
            onPresetPress={hidePresetButton ? undefined : () => setPresetModalVisible(true)}
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
            onPreviewLayer={onPreviewLayer}
            onReorderLayer={onReorderLayer}
            previewLayer={previewLayer}
            overlayNotes={overlayNotes}
            overlaySemitones={overlaySemitones}
            layerNoteLabels={layerNoteLabelsMap}
            onLoadPreset={onLoadPreset}
            presetModalVisible={presetModalVisible}
            onPresetModalClose={() => setPresetModalVisible(false)}
            presets={presets}
            onSavePreset={onSavePreset}
            loadPreset={loadPreset}
            onDeletePreset={onDeletePreset}
            progressionTemplates={progressionTemplates}
          />
        </View>
      </PracticePane>
    </View>
  );
}
