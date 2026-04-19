import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LayerConfig } from "../types";

const STORAGE_KEY = "guiter:layer-presets";

export interface LayerPreset {
  id: string;
  name: string;
  layers: Record<string, unknown>[];
  createdAt: number;
}

function serializeLayer(layer: LayerConfig): Record<string, unknown> {
  return {
    ...layer,
    cagedForms: [...layer.cagedForms],
    selectedNotes: [...layer.selectedNotes],
    selectedDegrees: [...layer.selectedDegrees],
    hiddenCells: [...layer.hiddenCells],
  };
}

function deserializeLayer(raw: Record<string, unknown>): LayerConfig {
  return {
    ...(raw as unknown as LayerConfig),
    cagedForms: new Set(raw.cagedForms as string[]),
    cagedChordType: (raw.cagedChordType as "major" | "minor") ?? "major",
    selectedNotes: new Set(raw.selectedNotes as string[]),
    selectedDegrees: new Set(raw.selectedDegrees as string[]),
    hiddenCells: new Set(raw.hiddenCells as string[]),
    chordFrames: (raw.chordFrames as { cells: string[] }[]) ?? [],
  };
}

export function useLayerPresets() {
  const [presets, setPresets] = useState<LayerPreset[]>(() => {
    // Kick off async load
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          setPresets(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    });
    return [];
  });

  const persist = (next: LayerPreset[]) => {
    setPresets(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const savePreset = (name: string, layers: LayerConfig[]) => {
    const preset: LayerPreset = {
      id: `preset-${Date.now()}`,
      name,
      layers: layers.map(serializeLayer),
      createdAt: Date.now(),
    };
    persist([preset, ...presets]);
  };

  const loadPreset = (id: string): LayerConfig[] | null => {
    const preset = presets.find((p) => p.id === id);
    if (!preset) return null;
    return preset.layers.map((raw, i) => ({
      ...deserializeLayer(raw),
      id: `layer-${Date.now()}-${i}`,
    }));
  };

  const deletePreset = (id: string) => {
    persist(presets.filter((p) => p.id !== id));
  };

  const renamePreset = (id: string, name: string) => {
    persist(presets.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const updatePreset = (id: string, name: string, layers: LayerConfig[]) => {
    persist(
      presets.map((p) => (p.id === id ? { ...p, name, layers: layers.map(serializeLayer) } : p)),
    );
  };

  const reorderPresets = (orderedIds: string[]) => {
    const map = new Map(presets.map((p) => [p.id, p]));
    persist(orderedIds.map((id) => map.get(id)!).filter(Boolean));
  };

  return {
    presets,
    savePreset,
    loadPreset,
    deletePreset,
    renamePreset,
    updatePreset,
    reorderPresets,
  };
}
