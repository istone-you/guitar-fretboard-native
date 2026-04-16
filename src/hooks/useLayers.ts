import { useState } from "react";
import type { LayerConfig } from "../types";
import { MAX_LAYERS } from "../types";

export function useLayers() {
  const [slots, setSlots] = useState<(LayerConfig | null)[]>([null, null, null]);
  const [previewLayer, setPreviewLayer] = useState<LayerConfig | null>(null);

  const layers = slots.filter((s): s is LayerConfig => s !== null);

  const handleAddLayer = (layer: LayerConfig, slotIndex?: number) =>
    setSlots((prev) => {
      if (slotIndex != null && slotIndex >= 0 && slotIndex < MAX_LAYERS) {
        const next = [...prev];
        next[slotIndex] = layer;
        return next;
      }
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

  const handleLoadPreset = (preset: LayerConfig[]) => {
    const next: (LayerConfig | null)[] = [null, null, null];
    preset.forEach((l, i) => {
      if (i < MAX_LAYERS) next[i] = l;
    });
    setSlots(next);
  };

  const handleReorderLayer = (orderedIds: string[]) =>
    setSlots((prev) => {
      const layerMap = new Map(
        prev.filter((s): s is LayerConfig => s !== null).map((s) => [s.id, s]),
      );
      const next: (LayerConfig | null)[] = orderedIds.map((id) =>
        id.startsWith("empty-slot-") ? null : (layerMap.get(id) ?? null),
      );
      while (next.length < MAX_LAYERS) next.push(null);
      return next.slice(0, MAX_LAYERS) as (LayerConfig | null)[];
    });

  return {
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
  };
}
