import { SCALE_DEGREES, NOTES_SHARP, NOTES_FLAT, getRootIndex } from "./fretboard";
import type { Accidental, ScaleType } from "../types";

// ionian = major, aeolian = natural-minor — skip aliases to avoid duplicates
const SKIP_SCALE_TYPES = new Set<ScaleType>(["ionian", "aeolian"]);

export interface ScaleMatch {
  scaleName: string;
  scaleType: ScaleType;
  root: string;
  noteCount: number;
  scaleNotes: string[];
}

export interface ScaleFinderResult {
  exact: ScaleMatch[];
  containing: ScaleMatch[]; // scale ⊇ selected (含む)
  contained: ScaleMatch[]; // scale ⊂ selected (含まれる)
}

/** kebab-case ScaleType → camelCase i18n key */
export function scaleI18nKey(scaleType: string): string {
  return scaleType.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function identifyScales(
  selectedNoteNames: Set<string>,
  accidental: Accidental,
  rootNote: string,
): ScaleFinderResult {
  if (selectedNoteNames.size === 0) return { exact: [], containing: [], contained: [] };

  const notes = accidental === "sharp" ? NOTES_SHARP : NOTES_FLAT;
  const rootIndex = getRootIndex(rootNote);
  const rootName = notes[rootIndex];

  const selectedIndices = new Set<number>();
  for (const name of selectedNoteNames) {
    const idx = (notes as readonly string[]).indexOf(name);
    if (idx >= 0) selectedIndices.add(idx);
  }

  if (selectedIndices.size === 0) return { exact: [], containing: [], contained: [] };

  const selectedArr = [...selectedIndices];
  const exact: ScaleMatch[] = [];
  const containing: ScaleMatch[] = [];
  const contained: ScaleMatch[] = [];

  for (const [scaleType, semitones] of Object.entries(SCALE_DEGREES) as [
    ScaleType,
    Set<number>,
  ][]) {
    if (SKIP_SCALE_TYPES.has(scaleType)) continue;

    const semitoneArr = [...semitones].sort((a, b) => a - b);
    const scaleIndicesOrdered = semitoneArr.map((s) => (rootIndex + s) % 12);
    const scaleIndices = new Set<number>(scaleIndicesOrdered);
    const scaleNotes = scaleIndicesOrdered.map((i) => notes[i]);

    const match: ScaleMatch = {
      scaleName: `${rootName} ${scaleType}`,
      scaleType,
      root: rootName,
      noteCount: scaleIndicesOrdered.length,
      scaleNotes,
    };

    // Exact match: selected === scale
    if (
      selectedArr.length === scaleIndicesOrdered.length &&
      selectedArr.every((i) => scaleIndices.has(i))
    ) {
      exact.push(match);
      continue;
    }

    // Containing (含む): selected ⊂ scale
    if (
      selectedArr.length < scaleIndicesOrdered.length &&
      selectedArr.every((i) => scaleIndices.has(i))
    ) {
      containing.push(match);
      continue;
    }

    // Contained (含まれる): scale ⊂ selected
    if (
      scaleIndicesOrdered.length < selectedArr.length &&
      scaleIndicesOrdered.every((i) => selectedIndices.has(i))
    ) {
      contained.push(match);
    }
  }

  exact.sort((a, b) => a.noteCount - b.noteCount);
  containing.sort((a, b) => a.noteCount - b.noteCount);
  contained.sort((a, b) => b.noteCount - a.noteCount);

  return { exact, containing, contained };
}
