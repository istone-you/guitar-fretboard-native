import type { ChordType, ScaleType } from "../types";
import {
  DIATONIC_CHORDS,
  CHORD_SUFFIX_MAP,
  diatonicDegreeLabel,
  CHORD_SEMITONES,
  SCALE_DEGREES,
  MAJOR_SCALE_DEGREES,
  NATURAL_MINOR_SCALE_DEGREES,
} from "./fretboard";

export type KeyType = "major" | "minor";

export interface DiatonicChordInfo {
  rootIndex: number;
  chordType: ChordType;
  degree: string;
  degreeLabel: string;
}

export interface PivotChord {
  rootIndex: number;
  chordType: ChordType;
  degreeInA: string;
  degreeLabelInA: string;
  degreeInB: string;
  degreeLabelInB: string;
}

export interface RelatedKey {
  relation: "relative" | "parallel" | "dominant" | "subdominant";
  rootIndex: number;
  keyType: KeyType;
}

export interface ModeFamilyEntry {
  scaleType: string;
  label: string;
  rootIndex: number;
  isCurrent: boolean;
}

export const CHURCH_MODES: ReadonlyArray<{ scaleType: string; offset: number; label: string }> = [
  { scaleType: "ionian", offset: 0, label: "Ionian" },
  { scaleType: "dorian", offset: 2, label: "Dorian" },
  { scaleType: "phrygian", offset: 4, label: "Phrygian" },
  { scaleType: "lydian", offset: 5, label: "Lydian" },
  { scaleType: "mixolydian", offset: 7, label: "Mixolydian" },
  { scaleType: "aeolian", offset: 9, label: "Aeolian" },
  { scaleType: "locrian", offset: 11, label: "Locrian" },
];

export function getDiatonicChordList(rootIndex: number, keyType: KeyType): DiatonicChordInfo[] {
  const scaleKey = keyType === "major" ? "major-triad" : "natural-minor-triad";
  const entries = DIATONIC_CHORDS[scaleKey] ?? [];
  return entries.map((entry) => ({
    rootIndex: (rootIndex + entry.offset) % 12,
    chordType: entry.chordType,
    degree: entry.value,
    degreeLabel: diatonicDegreeLabel(entry.value, { chordSize: "triad", keyType }),
  }));
}

export function getPivotChords(
  rootAIndex: number,
  keyTypeA: KeyType,
  rootBIndex: number,
  keyTypeB: KeyType,
): PivotChord[] {
  const chordsA = getDiatonicChordList(rootAIndex, keyTypeA);
  const chordsB = getDiatonicChordList(rootBIndex, keyTypeB);
  const result: PivotChord[] = [];
  for (const a of chordsA) {
    for (const b of chordsB) {
      if (a.rootIndex === b.rootIndex && a.chordType === b.chordType) {
        result.push({
          rootIndex: a.rootIndex,
          chordType: a.chordType,
          degreeInA: a.degree,
          degreeLabelInA: a.degreeLabel,
          degreeInB: b.degree,
          degreeLabelInB: b.degreeLabel,
        });
      }
    }
  }
  return result;
}

export function getRelatedKeys(rootIndex: number, keyType: KeyType): RelatedKey[] {
  if (keyType === "major") {
    return [
      { relation: "relative", rootIndex: (rootIndex + 9) % 12, keyType: "minor" },
      { relation: "parallel", rootIndex, keyType: "minor" },
      { relation: "dominant", rootIndex: (rootIndex + 7) % 12, keyType: "major" },
      { relation: "subdominant", rootIndex: (rootIndex + 5) % 12, keyType: "major" },
    ];
  }
  return [
    { relation: "relative", rootIndex: (rootIndex + 3) % 12, keyType: "major" },
    { relation: "parallel", rootIndex, keyType: "major" },
    { relation: "dominant", rootIndex: (rootIndex + 7) % 12, keyType: "minor" },
    { relation: "subdominant", rootIndex: (rootIndex + 5) % 12, keyType: "minor" },
  ];
}

export function getModeFamily(
  modeType: string,
  rootIndex: number,
): { parentRootIndex: number; modes: ModeFamilyEntry[] } {
  const currentMode = CHURCH_MODES.find((m) => m.scaleType === modeType);
  const offset = currentMode?.offset ?? 0;
  const parentRootIndex = (rootIndex - offset + 12) % 12;

  const modes: ModeFamilyEntry[] = CHURCH_MODES.map((m) => ({
    scaleType: m.scaleType,
    label: m.label,
    rootIndex: (parentRootIndex + m.offset) % 12,
    isCurrent: m.scaleType === modeType,
  }));

  return { parentRootIndex, modes };
}

export function chordDisplayName(
  rootIndex: number,
  chordType: ChordType,
  notes: readonly string[],
): string {
  return `${notes[rootIndex]}${CHORD_SUFFIX_MAP[chordType] ?? ""}`;
}

// ── Progression Analyzer ──────────────────────────────────────────────────────

type DiatonicFn = "T" | "SD" | "D";

const MAJOR_DIATONIC = [
  { offset: 0, chordType: "Major" as ChordType, degree: "I", fn: "T" as DiatonicFn },
  { offset: 2, chordType: "Minor" as ChordType, degree: "ii", fn: "SD" as DiatonicFn },
  { offset: 4, chordType: "Minor" as ChordType, degree: "iii", fn: "T" as DiatonicFn },
  { offset: 5, chordType: "Major" as ChordType, degree: "IV", fn: "SD" as DiatonicFn },
  { offset: 7, chordType: "Major" as ChordType, degree: "V", fn: "D" as DiatonicFn },
  { offset: 9, chordType: "Minor" as ChordType, degree: "vi", fn: "T" as DiatonicFn },
  { offset: 11, chordType: "Diminished" as ChordType, degree: "vii°", fn: "D" as DiatonicFn },
  { offset: 0, chordType: "maj7" as ChordType, degree: "Imaj7", fn: "T" as DiatonicFn },
  { offset: 2, chordType: "m7" as ChordType, degree: "iim7", fn: "SD" as DiatonicFn },
  { offset: 4, chordType: "m7" as ChordType, degree: "iiim7", fn: "T" as DiatonicFn },
  { offset: 5, chordType: "maj7" as ChordType, degree: "IVmaj7", fn: "SD" as DiatonicFn },
  { offset: 7, chordType: "7th" as ChordType, degree: "V7", fn: "D" as DiatonicFn },
  { offset: 9, chordType: "m7" as ChordType, degree: "vim7", fn: "T" as DiatonicFn },
  { offset: 11, chordType: "m7(b5)" as ChordType, degree: "viiø7", fn: "D" as DiatonicFn },
];

const MINOR_DIATONIC = [
  { offset: 0, chordType: "Minor" as ChordType, degree: "i", fn: "T" as DiatonicFn },
  { offset: 2, chordType: "Diminished" as ChordType, degree: "ii°", fn: "SD" as DiatonicFn },
  { offset: 3, chordType: "Major" as ChordType, degree: "III", fn: "T" as DiatonicFn },
  { offset: 5, chordType: "Minor" as ChordType, degree: "iv", fn: "SD" as DiatonicFn },
  { offset: 7, chordType: "Minor" as ChordType, degree: "v", fn: "D" as DiatonicFn },
  { offset: 8, chordType: "Major" as ChordType, degree: "VI", fn: "SD" as DiatonicFn },
  { offset: 10, chordType: "Major" as ChordType, degree: "VII", fn: "T" as DiatonicFn },
  { offset: 0, chordType: "m7" as ChordType, degree: "im7", fn: "T" as DiatonicFn },
  { offset: 2, chordType: "m7(b5)" as ChordType, degree: "iiø7", fn: "SD" as DiatonicFn },
  { offset: 3, chordType: "maj7" as ChordType, degree: "IIImaj7", fn: "T" as DiatonicFn },
  { offset: 5, chordType: "m7" as ChordType, degree: "ivm7", fn: "SD" as DiatonicFn },
  { offset: 7, chordType: "m7" as ChordType, degree: "vm7", fn: "D" as DiatonicFn },
  { offset: 8, chordType: "maj7" as ChordType, degree: "VImaj7", fn: "SD" as DiatonicFn },
  { offset: 10, chordType: "7th" as ChordType, degree: "VII7", fn: "T" as DiatonicFn },
];

export interface AnalyzedChord {
  rootIndex: number;
  chordType: ChordType;
  degree?: string;
  fn?: DiatonicFn;
  isDiatonic: boolean;
  secDomTarget?: string; // e.g. "V", "ii" — display as "V/V", "V/ii"
  borrowedDegree?: string; // e.g. "♭VII", "iv" — display as "借用 ♭VII"
}

const DOMINANT_CHORD_TYPES = new Set<ChordType>(["Major", "7th"]);

const CHROMATIC_NUMS: Record<number, string> = {
  0: "I",
  1: "♭II",
  2: "II",
  3: "♭III",
  4: "III",
  5: "IV",
  6: "♭V",
  7: "V",
  8: "♭VI",
  9: "VI",
  10: "♭VII",
  11: "VII",
};

function chromaticDegreeLabel(offset: number, chordType: ChordType): string {
  const num = CHROMATIC_NUMS[offset] ?? "?";
  if (chordType === "Minor" || chordType === "m7" || chordType === "m7(b5)")
    return num.toLowerCase();
  if (chordType === "dim" || chordType === "dim7") return num.toLowerCase() + "°";
  return num;
}

function findSecondaryDominantTarget(
  chordOffset: number,
  chordType: ChordType,
  diatonic: { offset: number; chordType: ChordType; degree: string }[],
): string | undefined {
  if (!DOMINANT_CHORD_TYPES.has(chordType)) return undefined;
  const targetOffset = (chordOffset - 7 + 12) % 12;
  // Only use triad entries for clean degree labels; skip diminished targets
  const target = diatonic.find(
    (d) =>
      d.offset === targetOffset &&
      (d.chordType === "Major" || d.chordType === "Minor") &&
      !d.degree.includes("7"),
  );
  return target?.degree;
}

function findBorrowedDegree(
  chordOffset: number,
  chordType: ChordType,
  parallelDiatonic: { offset: number; chordType: ChordType }[],
): string | undefined {
  const match = parallelDiatonic.find((d) => d.offset === chordOffset && d.chordType === chordType);
  if (!match) return undefined;
  return chromaticDegreeLabel(chordOffset, chordType);
}

export interface KeyAnalysisResult {
  rootIndex: number;
  keyType: "major" | "minor";
  score: number;
  chords: AnalyzedChord[];
}

export function analyzeProgression(
  chords: { rootIndex: number; chordType: ChordType }[],
): KeyAnalysisResult[] {
  if (chords.length === 0) return [];
  const results: KeyAnalysisResult[] = [];
  for (let root = 0; root < 12; root++) {
    for (const keyType of ["major", "minor"] as const) {
      const diatonic = keyType === "major" ? MAJOR_DIATONIC : MINOR_DIATONIC;
      const parallelDiatonic = keyType === "major" ? MINOR_DIATONIC : MAJOR_DIATONIC;
      const analyzedChords: AnalyzedChord[] = chords.map(({ rootIndex: cRoot, chordType }) => {
        const offset = (cRoot - root + 12) % 12;
        const match = diatonic.find((d) => d.offset === offset && d.chordType === chordType);
        if (match) {
          return {
            rootIndex: cRoot,
            chordType,
            degree: match.degree,
            fn: match.fn,
            isDiatonic: true,
          };
        }
        const secDomTarget = findSecondaryDominantTarget(offset, chordType, diatonic);
        const borrowedDegree = findBorrowedDegree(offset, chordType, parallelDiatonic);
        return { rootIndex: cRoot, chordType, isDiatonic: false, secDomTarget, borrowedDegree };
      });
      const score = analyzedChords.filter((c) => c.isDiatonic).length / chords.length;
      results.push({ rootIndex: root, keyType, score, chords: analyzedChords });
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

export function getCompatibleScales(
  chords: { rootIndex: number; chordType: ChordType }[],
  referenceRootIndex: number,
): ScaleType[] {
  if (chords.length === 0) return [];
  const requiredPCs = new Set<number>();
  for (const { rootIndex, chordType } of chords) {
    const tones = CHORD_SEMITONES[chordType];
    if (!tones) continue;
    for (const tone of tones) requiredPCs.add((rootIndex + tone) % 12);
  }
  return (Object.entries(SCALE_DEGREES) as [ScaleType, Set<number>][])
    .filter(([, scaleDegrees]) => {
      const scalePCs = new Set([...scaleDegrees].map((d) => (referenceRootIndex + d) % 12));
      return [...requiredPCs].every((pc) => scalePCs.has(pc));
    })
    .map(([scaleType]) => scaleType);
}

// ── Tensions and Avoid Notes ──────────────────────────────────────────────────

export interface TensionNote {
  noteIndex: number; // absolute note index mod 12
  interval: number; // semitones above chord root (0-11)
}

export interface TensionAvoidResult {
  chordTones: TensionNote[];
  tensions: TensionNote[];
  avoidNotes: TensionNote[];
}

export function getTensionsAndAvoids(
  keyRootIndex: number,
  keyType: KeyType,
  chordRootIndex: number,
  chordType: ChordType,
): TensionAvoidResult {
  const scaleSet = keyType === "major" ? MAJOR_SCALE_DEGREES : NATURAL_MINOR_SCALE_DEGREES;
  const scaleNotes = [...scaleSet].map((s) => (keyRootIndex + s) % 12);

  const chordSet = CHORD_SEMITONES[chordType] ?? new Set<number>();
  const chordNotesList = [...chordSet].map((s) => (chordRootIndex + s) % 12);
  const chordNoteSet = new Set(chordNotesList);

  const chordTones: TensionNote[] = chordNotesList
    .map((noteIndex) => ({
      noteIndex,
      interval: (noteIndex - chordRootIndex + 12) % 12,
    }))
    .sort((a, b) => a.interval - b.interval);

  const tensions: TensionNote[] = [];
  const avoidNotes: TensionNote[] = [];
  const thirdTritoneTargets = new Set<number>();
  for (const chordTone of chordTones) {
    if (chordTone.interval === 3 || chordTone.interval === 4) {
      thirdTritoneTargets.add((chordTone.noteIndex + 6) % 12);
    }
  }

  for (const note of scaleNotes) {
    if (chordNoteSet.has(note)) continue;
    const interval = (note - chordRootIndex + 12) % 12;
    const isB9Avoid = chordNotesList.some((ct) => (note - ct + 12) % 12 === 1);
    const isTritoneAvoid = thirdTritoneTargets.has(note);
    const isAvoid = isB9Avoid || isTritoneAvoid;
    const entry: TensionNote = { noteIndex: note, interval };
    if (isAvoid) {
      avoidNotes.push(entry);
    } else {
      tensions.push(entry);
    }
  }

  tensions.sort((a, b) => a.interval - b.interval);
  avoidNotes.sort((a, b) => a.interval - b.interval);

  return { chordTones, tensions, avoidNotes };
}

// ── Secondary Dominants ───────────────────────────────────────────────────────

export interface SecondaryDominantEntry {
  targetDegree: string; // e.g. "ii", "IV", "V"
  targetRootIndex: number;
  targetChordType: ChordType;
  secDomRootIndex: number; // dominant of target = (targetRootIndex + 7) % 12
  tritoneSubRootIndex: number; // (secDomRootIndex + 6) % 12
}

const DIM_CHORD_TYPES = new Set<ChordType>(["dim", "m7(b5)"]);

export function getSecondaryDominants(
  keyRootIndex: number,
  keyType: KeyType,
): SecondaryDominantEntry[] {
  const diatonicChords = getDiatonicChordList(keyRootIndex, keyType);
  return diatonicChords
    .filter((chord) => !DIM_CHORD_TYPES.has(chord.chordType))
    .map((chord) => {
      const secDomRootIndex = (chord.rootIndex + 7) % 12;
      const tritoneSubRootIndex = (secDomRootIndex + 6) % 12;
      return {
        targetDegree: chord.degree,
        targetRootIndex: chord.rootIndex,
        targetChordType: chord.chordType,
        secDomRootIndex,
        tritoneSubRootIndex,
      };
    });
}

// ── Find Key From Chords ──────────────────────────────────────────────────────

const OFFSET_TO_CHROMATIC: Record<number, string> = {
  0: "I",
  1: "bII",
  2: "II",
  3: "bIII",
  4: "III",
  5: "IV",
  6: "bV",
  7: "V",
  8: "bVI",
  9: "VI",
  10: "bVII",
  11: "VII",
};

export interface KeyFromChordsMatch {
  rootIndex: number;
  keyType: KeyType;
  score: number;
  total: number;
  matchedChords: { rootIndex: number; chordType: ChordType; degree: string }[];
}

export function findKeyFromChords(
  chords: { rootIndex: number; chordType: ChordType }[],
): KeyFromChordsMatch[] {
  if (chords.length === 0) return [];

  const majorEntries = [...DIATONIC_CHORDS["major-triad"], ...DIATONIC_CHORDS["major-seventh"]];
  const minorEntries = [
    ...DIATONIC_CHORDS["natural-minor-triad"],
    ...DIATONIC_CHORDS["natural-minor-seventh"],
  ];

  const results: KeyFromChordsMatch[] = [];

  for (let keyRoot = 0; keyRoot < 12; keyRoot++) {
    for (const keyType of ["major", "minor"] as const) {
      const entries = keyType === "major" ? majorEntries : minorEntries;

      const matchedChords: { rootIndex: number; chordType: ChordType; degree: string }[] = [];

      for (const chord of chords) {
        const match = entries.find(
          (entry) =>
            (keyRoot + entry.offset) % 12 === chord.rootIndex &&
            entry.chordType === chord.chordType,
        );
        if (match) {
          matchedChords.push({
            rootIndex: chord.rootIndex,
            chordType: chord.chordType,
            degree: OFFSET_TO_CHROMATIC[match.offset] ?? match.value,
          });
        }
      }

      const score = matchedChords.length;
      if (score > 0) {
        results.push({
          rootIndex: keyRoot,
          keyType,
          score,
          total: chords.length,
          matchedChords,
        });
      }
    }
  }

  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // major before minor as tiebreaker
    if (a.keyType === "major" && b.keyType !== "major") return -1;
    if (b.keyType === "major" && a.keyType !== "major") return 1;
    return 0;
  });
}
