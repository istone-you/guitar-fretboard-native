export type Theme = "dark" | "light";
export type Accidental = "sharp" | "flat";
export type BaseLabelMode = "note" | "degree";
export type ChordDisplayMode = "form" | "triad" | "on-chord";
export type ScaleType =
  | "major"
  | "natural-minor"
  | "major-penta"
  | "minor-penta"
  | "blues"
  | "harmonic-minor"
  | "melodic-minor"
  | "ionian"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "aeolian"
  | "locrian"
  | "phrygian-dominant"
  | "lydian-dominant"
  | "altered"
  | "whole-tone"
  | "diminished";
export type ChordType =
  | "Major"
  | "Minor"
  | "5"
  | "7th"
  | "maj7"
  | "m7"
  | "m7(b5)"
  | "dim7"
  | "m(maj7)"
  | "sus2"
  | "sus4"
  | "6"
  | "m6"
  | "dim"
  | "aug"
  | "9"
  | "b9"
  | "#9"
  | "maj9"
  | "m9"
  | "add9"
  | "7(b9)"
  | "7(#9)"
  | "11"
  | "#11"
  | "add11"
  | "add#11"
  | "m11"
  | "13"
  | "b13"
  | "maj13"
  | "m13"
  | "6/9"
  | "m6/9"
  | "7sus4"
  | "m(add9)";
export type TriadChordType = "Major" | "Minor" | "Diminished" | "Augmented";
export type DegreeName =
  | "P1"
  | "m2"
  | "M2"
  | "m3"
  | "M3"
  | "P4"
  | "b5"
  | "P5"
  | "m6"
  | "M6"
  | "m7"
  | "M7";

export interface ProgressionChord {
  degree: string;
  chordType: ChordType;
}

// ===== Layer system =====
export type LayerType = "scale" | "chord" | "caged" | "custom" | "progression";

export const MAX_LAYERS = 3;

export interface LayerConfig {
  id: string;
  type: LayerType;
  color: string;
  enabled: boolean;
  // Scale settings
  scaleType: ScaleType;
  // Chord settings
  chordDisplayMode: ChordDisplayMode;
  chordType: ChordType;
  onChordName: string;
  triadInversion: string;
  cagedForms: Set<string>;
  cagedChordType: "major" | "minor";
  showChordFrame?: boolean;
  // Marker settings
  customMode: "note" | "degree";
  selectedNotes: Set<string>;
  selectedDegrees: Set<string>;
  hiddenCells: Set<string>;
  chordFrames: { cells: string[] }[];
  // Progression settings (optional for backwards compatibility with partial mocks/presets)
  progressionTemplateId?: string;
  progressionCurrentStep?: number;
  progressionShowPrevGhost?: boolean;
  progressionShowNextGhost?: boolean;
}

export function createDefaultLayer(type: LayerType, id: string, color: string): LayerConfig {
  return {
    id,
    type,
    color,
    enabled: true,
    scaleType: "major",
    chordDisplayMode: "form",
    chordType: "Major",
    onChordName: "C/E",
    triadInversion: "root",
    cagedForms: new Set(["C", "A", "G", "E", "D"]),
    cagedChordType: "major",
    showChordFrame: type !== "progression",
    customMode: "note",
    selectedNotes: new Set(),
    selectedDegrees: new Set(),
    hiddenCells: new Set(),
    chordFrames: [],
    progressionTemplateId: "251",
    progressionCurrentStep: 0,
    progressionShowPrevGhost: false,
    progressionShowNextGhost: false,
  };
}

export type QuizMode = "note" | "degree" | "chord" | "scale" | "diatonic";
export type QuizType = "choice" | "fretboard" | "all";

export interface DiatonicAnswerEntry {
  degree: string;
  root: string;
  chordType: ChordType;
  label: string;
}

export interface QuizRecord {
  mode: QuizMode;
  correct: boolean;
  noteName?: string;
  degreeLabel?: string;
  stringIdx?: number;
  fret?: number;
  chordType?: ChordType;
  scaleType?: ScaleType;
}

export interface QuizQuestion {
  stringIdx: number;
  fret: number;
  correct: string;
  choices: string[];
  answerLabel?: string;
  promptDegree?: DegreeName;
  promptChordLabel?: string;
  promptChordRoot?: string;
  promptChordType?: ChordType;
  promptQuizRoot?: string;
  promptScaleRoot?: string;
  promptScaleType?: ScaleType;
  correctNoteNames?: string[];
  promptQuizStrings?: number[];
  promptDiatonicKeyType?: "major" | "natural-minor";
  promptDiatonicChordSize?: "triad" | "seventh";
  diatonicChordTypeOptions?: ChordType[];
  diatonicAnswers?: DiatonicAnswerEntry[];
}
