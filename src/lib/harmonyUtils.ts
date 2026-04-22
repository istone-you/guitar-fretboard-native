import type { ChordType } from "../types";
import { DIATONIC_CHORDS, CHORD_SUFFIX_MAP, diatonicDegreeLabel } from "./fretboard";

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
