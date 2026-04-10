import {
  CHORD_SEMITONES,
  NOTES_SHARP,
  NOTES_FLAT,
  getRootIndex,
  SEMITONE_TO_DEGREE,
} from "./fretboard";
import type { Accidental } from "../types";

// Duplicate entries in CHORD_SEMITONES — skip in favour of canonical names
const SKIP_CHORD_TYPES = new Set(["dim", "aug", "b9", "#9"]);

export interface ChordMatch {
  chordName: string;
  root: string;
  chordType: string;
  noteCount: number;
  chordNotes: string[];
  chordDegrees: string[];
}

export interface ChordFinderResult {
  exact: ChordMatch[];
  containing: ChordMatch[];
  contained: ChordMatch[];
}

export function identifyChords(
  selectedNoteNames: Set<string>,
  accidental: Accidental,
  rootNote: string,
): ChordFinderResult {
  if (selectedNoteNames.size === 0) return { exact: [], containing: [], contained: [] };

  const notes = accidental === "sharp" ? NOTES_SHARP : NOTES_FLAT;
  const rootIndex = getRootIndex(rootNote);
  const rootName = notes[rootIndex];

  // Convert selected note names to chromatic indices (0–11)
  const selectedIndices = new Set<number>();
  for (const name of selectedNoteNames) {
    const idx = (notes as readonly string[]).indexOf(name);
    if (idx >= 0) selectedIndices.add(idx);
  }

  if (selectedIndices.size === 0) return { exact: [], containing: [], contained: [] };

  const selectedArr = [...selectedIndices];
  const exact: ChordMatch[] = [];
  const containing: ChordMatch[] = []; // chord ⊃ selected (含む)
  const contained: ChordMatch[] = []; // chord ⊂ selected (含まれる)

  for (const [chordType, semitones] of Object.entries(CHORD_SEMITONES)) {
    if (SKIP_CHORD_TYPES.has(chordType)) continue;

    // Build chord note indices in semitone order, then map to note names and degrees
    const semitoneArr = [...semitones];
    const chordIndicesOrdered = semitoneArr.map((s) => (rootIndex + s) % 12);
    const chordIndices = new Set<number>(chordIndicesOrdered);
    const chordNotes = chordIndicesOrdered.map((i) => notes[i]);
    const chordDegrees = semitoneArr.map((s) => SEMITONE_TO_DEGREE[s]);

    const match = {
      chordName: `${rootName} ${chordType}`,
      root: rootName,
      chordType,
      noteCount: chordIndicesOrdered.length,
      chordNotes,
      chordDegrees,
    };

    // Exact match: selected === chord
    if (
      selectedArr.length === chordIndicesOrdered.length &&
      selectedArr.every((i) => chordIndices.has(i))
    ) {
      exact.push(match);
      continue;
    }

    // Containing (含む): selected ⊂ chord
    if (
      selectedArr.length < chordIndicesOrdered.length &&
      selectedArr.every((i) => chordIndices.has(i))
    ) {
      containing.push(match);
      continue;
    }

    // Contained (含まれる): chord ⊂ selected
    if (
      chordIndicesOrdered.length < selectedArr.length &&
      chordIndicesOrdered.every((i) => selectedIndices.has(i))
    ) {
      contained.push(match);
    }
  }

  // Exact: note count descending (richer chords first)
  // Containing: note count ascending (closest to completion first)
  // Contained: note count descending (richest sub-chord first)
  exact.sort((a, b) => b.noteCount - a.noteCount);
  containing.sort((a, b) => a.noteCount - b.noteCount);
  contained.sort((a, b) => b.noteCount - a.noteCount);

  return { exact, containing, contained };
}
