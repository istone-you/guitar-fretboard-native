import { useMemo } from "react";
import type { Accidental, BaseLabelMode, LayerConfig } from "../types";
import {
  CHORD_SEMITONES,
  DEGREE_BY_SEMITONE,
  DEGREE_LABEL_ORDER,
  DEGREE_TO_SEMITONE,
  SCALE_DEGREES,
  getDiatonicChordSemitones,
  getNotesByAccidental,
  getRootIndex,
  parseOnChord,
} from "../logic/fretboard";

const normalizeDegreeLabel = (label: string) => label.replace("♭", "b").replace("♯", "#");

interface Params {
  layers: LayerConfig[];
  previewLayer: LayerConfig | null;
  accidental: Accidental;
  rootNote: string;
  baseLabelMode: BaseLabelMode;
}

export function useLayerDerivedState({
  layers,
  previewLayer,
  accidental,
  rootNote,
  baseLabelMode,
}: Params) {
  const effectiveLayers = useMemo(() => {
    if (!previewLayer) return layers;
    const existing = layers.find((l) => l.id === previewLayer.id);
    if (existing) return layers.map((l) => (l.id === previewLayer.id ? previewLayer : l));
    return [...layers, previewLayer];
  }, [layers, previewLayer]);

  const enabledCustomLayers = useMemo(
    () => effectiveLayers.filter((layer) => layer.enabled),
    [effectiveLayers],
  );

  const overlaySemitones = useMemo(() => {
    const active = new Set<number>();
    const keyRootIndex = getRootIndex(rootNote);

    for (const layer of enabledCustomLayers) {
      if (layer.type === "scale") {
        for (const semitone of SCALE_DEGREES[layer.scaleType] ?? []) active.add(semitone);
        continue;
      }
      if (layer.type !== "chord") continue;

      let semitones: Set<number> | undefined;
      if (layer.chordDisplayMode === "power") {
        semitones = CHORD_SEMITONES.power;
      } else if (layer.chordDisplayMode === "diatonic") {
        semitones = getDiatonicChordSemitones(
          keyRootIndex,
          `${layer.diatonicKeyType}-${layer.diatonicChordSize}`,
          layer.diatonicDegree,
        );
      } else if (layer.chordDisplayMode === "caged") {
        semitones = CHORD_SEMITONES.Major;
      } else if (layer.chordDisplayMode === "on-chord") {
        const parsed = parseOnChord(layer.onChordName);
        semitones = parsed ? CHORD_SEMITONES[parsed.chordType] : undefined;
      } else {
        semitones = CHORD_SEMITONES[layer.chordType];
      }

      for (const semitone of semitones ?? []) active.add(semitone);
    }

    return active;
  }, [rootNote, enabledCustomLayers]);

  const overlayNotes = useMemo(() => {
    const notes = getNotesByAccidental(accidental);
    const rootIndex = getRootIndex(rootNote);
    return [...overlaySemitones]
      .sort((a, b) => a - b)
      .map((semitone) => notes[(rootIndex + semitone) % 12]);
  }, [accidental, overlaySemitones, rootNote]);

  const layerNoteLabelsMap = useMemo(() => {
    const notes = getNotesByAccidental(accidental);
    const rootIndex = getRootIndex(rootNote);
    const useDegree = baseLabelMode === "degree";
    const map = new Map<string, string[]>();

    for (const l of effectiveLayers) {
      let semitones: number[] = [];
      if (l.type === "scale") {
        semitones = [...(SCALE_DEGREES[l.scaleType] ?? [])];
      } else if (l.type === "chord") {
        let s: Set<number> | undefined;
        if (l.chordDisplayMode === "power") {
          s = CHORD_SEMITONES.power;
        } else if (l.chordDisplayMode === "diatonic") {
          s = getDiatonicChordSemitones(
            rootIndex,
            `${l.diatonicKeyType}-${l.diatonicChordSize}`,
            l.diatonicDegree,
          );
        } else if (l.chordDisplayMode === "caged") {
          s = CHORD_SEMITONES.Major;
        } else if (l.chordDisplayMode === "on-chord") {
          const parsed = parseOnChord(l.onChordName);
          s = parsed ? CHORD_SEMITONES[parsed.chordType] : undefined;
        } else {
          s = CHORD_SEMITONES[l.chordType];
        }
        semitones = [...(s ?? [])];
      } else if (l.type === "custom") {
        if (l.customMode === "note") {
          for (const n of l.selectedNotes) {
            const ni = (notes as readonly string[]).indexOf(n);
            if (ni >= 0) semitones.push((ni - rootIndex + 12) % 12);
          }
        } else {
          for (const d of l.selectedDegrees) {
            const di = DEGREE_TO_SEMITONE[d];
            if (di !== undefined) semitones.push(di);
          }
        }
      }

      const sorted = semitones.sort((a, b) => a - b);
      if (useDegree && l.type === "custom" && l.customMode === "degree") {
        const normalized = [...new Set([...l.selectedDegrees].map(normalizeDegreeLabel))];
        const orderIndex = new Map<string, number>(DEGREE_LABEL_ORDER.map((d, i) => [d, i]));
        normalized.sort((a, b) => (orderIndex.get(a) ?? 999) - (orderIndex.get(b) ?? 999));
        map.set(l.id, normalized);
      } else {
        map.set(
          l.id,
          useDegree
            ? sorted.map((s) => DEGREE_BY_SEMITONE[s])
            : sorted.map((s) => notes[(rootIndex + s) % 12]),
        );
      }
    }

    return map;
  }, [effectiveLayers, accidental, rootNote, baseLabelMode]);

  return {
    effectiveLayers,
    overlaySemitones,
    overlayNotes,
    layerNoteLabelsMap,
  };
}
