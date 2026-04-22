import { useMemo } from "react";
import type { Accidental, BaseLabelMode, LayerConfig } from "../types";
import {
  CHORD_SEMITONES,
  DEGREE_BY_SEMITONE,
  DEGREE_LABEL_ORDER,
  DEGREE_TO_SEMITONE,
  PROGRESSION_TEMPLATES,
  SCALE_DEGREES,
  chordSuffix,
  getNotesByAccidental,
  getRootIndex,
  parseOnChord,
  getTemplateLength,
  resolveProgressionStep,
  type ProgressionTemplate,
} from "../lib/fretboard";

const normalizeDegreeLabel = (label: string) => label.replace("♭", "b").replace("♯", "#");

interface Params {
  layers: LayerConfig[];
  previewLayer: LayerConfig | null;
  accidental: Accidental;
  rootNote: string;
  baseLabelMode: BaseLabelMode;
  progressionTemplates?: ProgressionTemplate[];
}

export function useLayerDerivedState({
  layers,
  previewLayer,
  accidental,
  rootNote,
  baseLabelMode,
  progressionTemplates,
}: Params) {
  const allProgressionTemplates = progressionTemplates ?? PROGRESSION_TEMPLATES;
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
      if (layer.type === "caged") {
        const cagedSemitones =
          layer.cagedChordType === "minor" ? CHORD_SEMITONES.Minor : CHORD_SEMITONES.Major;
        for (const semitone of cagedSemitones ?? []) active.add(semitone);
        continue;
      }
      if (layer.type === "progression") {
        const template = allProgressionTemplates.find(
          (tp) => tp.id === (layer.progressionTemplateId ?? "251"),
        );
        if (!template) continue;
        const totalSteps = getTemplateLength(template);
        const currentStep = Math.min(
          Math.max(layer.progressionCurrentStep ?? 0, 0),
          totalSteps - 1,
        );
        const chord = resolveProgressionStep(keyRootIndex, template, currentStep);
        const chordSemitones = CHORD_SEMITONES[chord.chordType] ?? new Set<number>();
        for (const s of chordSemitones) {
          active.add((((chord.rootIndex + s - keyRootIndex + 12) % 12) + 12) % 12);
        }
        continue;
      }

      if (layer.type !== "chord") continue;

      let semitones: Set<number> | undefined;
      if (layer.chordDisplayMode === "on-chord") {
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
    const globalRootIndex = getRootIndex(rootNote);
    const useDegree = baseLabelMode === "degree";
    const map = new Map<string, string[]>();

    for (const l of effectiveLayers) {
      const rootIndex = l.layerRoot ? getRootIndex(l.layerRoot) : globalRootIndex;
      let semitones: number[] = [];
      if (l.type === "scale") {
        semitones = [...(SCALE_DEGREES[l.scaleType] ?? [])];
      } else if (l.type === "caged") {
        const cagedSemitones =
          l.cagedChordType === "minor" ? CHORD_SEMITONES.Minor : CHORD_SEMITONES.Major;
        semitones = [...(cagedSemitones ?? [])];
      } else if (l.type === "chord") {
        let s: Set<number> | undefined;
        if (l.chordDisplayMode === "on-chord") {
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
      } else if (l.type === "progression") {
        const template = allProgressionTemplates.find(
          (tp) => tp.id === (l.progressionTemplateId ?? "251"),
        );
        if (template) {
          const totalSteps = getTemplateLength(template);
          const currentStep = Math.min(Math.max(l.progressionCurrentStep ?? 0, 0), totalSteps - 1);
          const labels = Array.from({ length: totalSteps }, (_, idx) => {
            const chord = resolveProgressionStep(rootIndex, template, idx);
            const rootName = notes[chord.rootIndex];
            const label = `${rootName}${chordSuffix(chord.chordType)}`;
            return idx === currentStep ? `[${label}]` : label;
          });
          map.set(l.id, labels);
        } else {
          map.set(l.id, []);
        }
        continue;
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
