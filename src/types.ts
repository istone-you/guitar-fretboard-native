export type Theme = "dark" | "light";
export type Accidental = "sharp" | "flat";
export type BaseLabelMode = "note" | "degree";
export type ChordDisplayMode = "form" | "power" | "triad" | "diatonic";
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
  | "locrian";
export type ChordType =
  | "Major"
  | "Minor"
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
  | "aug";
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

export type QuizMode = "note" | "degree" | "chord" | "scale" | "diatonic";
export type QuizType = "choice" | "fretboard" | "all";

export interface DiatonicAnswerEntry {
  degree: string;
  root: string;
  chordType: ChordType;
  label: string;
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
  promptScaleRoot?: string;
  promptScaleType?: ScaleType;
  correctNoteNames?: string[];
  promptDiatonicKeyType?: "major" | "natural-minor";
  promptDiatonicChordSize?: "triad" | "seventh";
  diatonicChordTypeOptions?: ChordType[];
  diatonicAnswers?: DiatonicAnswerEntry[];
}
