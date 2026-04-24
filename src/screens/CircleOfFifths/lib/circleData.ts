import { getSecondaryDominants } from "../../../lib/harmonyUtils";
import type { Accidental } from "../../../types";

export type KeyType = "major" | "minor";

export type RingName = "major" | "minor" | "flat5";

export type DiatonicFn = "T" | "SD" | "D";

export type RelatedKeyRelation = "tonic" | "dominant" | "subdominant" | "parallel";

export const MAJOR_KEYS = [
  "C",
  "G",
  "D",
  "A",
  "E",
  "B",
  "F♯/G♭",
  "D♭",
  "A♭",
  "E♭",
  "B♭",
  "F",
] as const;

export const MINOR_KEYS = [
  "Am",
  "Em",
  "Bm",
  "F♯m",
  "C♯m",
  "G♯m",
  "D♯m/E♭m",
  "B♭m",
  "Fm",
  "Cm",
  "Gm",
  "Dm",
] as const;

export const MINOR_FLAT5_KEYS = [
  "Bm(♭5)",
  "F♯m(♭5)",
  "C♯m(♭5)",
  "G♯m(♭5)",
  "D♯m(♭5)",
  "A♯m(♭5)",
  "E♯m(♭5)/Fm(♭5)",
  "Cm(♭5)",
  "Gm(♭5)",
  "Dm(♭5)",
  "Am(♭5)",
  "Em(♭5)",
] as const;

export const KEY_SIGNATURES = [0, 1, 2, 3, 4, 5, 6, -5, -4, -3, -2, -1] as const;

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

export function getCircleAccidental(index: number): Accidental {
  return index >= 7 ? "flat" : "sharp";
}

export function formatRingSignatureLabel(count: number): string {
  if (count === 0) return "0";
  if (count === 6) return "±6";
  if (count > 0) return `♯×${count}`;
  return `♭×${Math.abs(count)}`;
}

export function formatCenterSignatureLabel(
  count: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (count === 0) return t("circle.noAccidentals");
  if (count > 0 && count < 6) return t("circle.sharps", { count });
  if (count < 0) return t("circle.flats", { count: Math.abs(count) });
  return `${t("circle.sharps", { count: 6 })} / ${t("circle.flats", { count: 6 })}`;
}

// Convert a chromatic semitone (C=0) to its circle-of-fifths position (C=0, G=1, ...).
// The inverse (circle position → semitone) uses the same formula because 7 is self-inverse mod 12.
export function semitoneToCirclePosition(semitone: number): number {
  return mod12(semitone * 7);
}

// Given a circle position (0-11) and keyType, return the chromatic semitone of the key's root note.
// Major at K → position-to-semitone; Minor at K → relative major's root + 9.
export function keyRootSemitone(selectedIndex: number, keyType: KeyType): number {
  const majorRoot = semitoneToCirclePosition(selectedIndex); // 7 is self-inverse mod 12
  return keyType === "major" ? majorRoot : mod12(majorRoot + 9);
}

export interface RelatedKeyCell {
  ring: "major" | "minor";
  position: number;
  relation: RelatedKeyRelation;
}

export function getRelatedKeyCells(selectedIndex: number, keyType: KeyType): RelatedKeyCell[] {
  const K = mod12(selectedIndex);
  const primaryRing: "major" | "minor" = keyType === "major" ? "major" : "minor";
  const relativeRing: "major" | "minor" = keyType === "major" ? "minor" : "major";
  return [
    { ring: primaryRing, position: K, relation: "tonic" },
    { ring: primaryRing, position: mod12(K + 1), relation: "dominant" },
    { ring: primaryRing, position: mod12(K - 1), relation: "subdominant" },
    { ring: relativeRing, position: K, relation: "parallel" },
  ];
}

export interface DiatonicOverlayCell {
  ring: RingName;
  position: number;
  fn: DiatonicFn;
  degreeLabel: string;
}

const MAJOR_DIATONIC_CELLS: ReadonlyArray<{
  ring: RingName;
  positionDelta: -1 | 0 | 1;
  fn: DiatonicFn;
  degreeLabel: string;
}> = [
  { ring: "major", positionDelta: 0, fn: "T", degreeLabel: "I" },
  { ring: "minor", positionDelta: -1, fn: "SD", degreeLabel: "ii" },
  { ring: "minor", positionDelta: 1, fn: "T", degreeLabel: "iii" },
  { ring: "major", positionDelta: -1, fn: "SD", degreeLabel: "IV" },
  { ring: "major", positionDelta: 1, fn: "D", degreeLabel: "V" },
  { ring: "minor", positionDelta: 0, fn: "T", degreeLabel: "vi" },
  { ring: "flat5", positionDelta: 0, fn: "D", degreeLabel: "vii°" },
];

const MINOR_DIATONIC_CELLS: ReadonlyArray<{
  ring: RingName;
  positionDelta: -1 | 0 | 1;
  fn: DiatonicFn;
  degreeLabel: string;
}> = [
  { ring: "minor", positionDelta: 0, fn: "T", degreeLabel: "i" },
  { ring: "flat5", positionDelta: 0, fn: "SD", degreeLabel: "ii°" },
  { ring: "major", positionDelta: 0, fn: "T", degreeLabel: "♭III" },
  { ring: "minor", positionDelta: -1, fn: "SD", degreeLabel: "iv" },
  { ring: "minor", positionDelta: 1, fn: "D", degreeLabel: "v" },
  { ring: "major", positionDelta: -1, fn: "SD", degreeLabel: "♭VI" },
  { ring: "major", positionDelta: 1, fn: "T", degreeLabel: "♭VII" },
];

export function getDiatonicOverlayCells(
  selectedIndex: number,
  keyType: KeyType,
): DiatonicOverlayCell[] {
  const K = mod12(selectedIndex);
  const template = keyType === "major" ? MAJOR_DIATONIC_CELLS : MINOR_DIATONIC_CELLS;
  return template.map((entry) => ({
    ring: entry.ring,
    position: mod12(K + entry.positionDelta),
    fn: entry.fn,
    degreeLabel: entry.degreeLabel,
  }));
}

export interface SecondaryDominantCell {
  targetDegreeLabel: string;
  secDomPosition: number;
  tritoneSubPosition: number;
}

export function getSecondaryDominantCells(
  selectedIndex: number,
  keyType: KeyType,
): SecondaryDominantCell[] {
  const rootSemitone = keyRootSemitone(selectedIndex, keyType);
  return getSecondaryDominants(rootSemitone, keyType).map((entry) => ({
    targetDegreeLabel: entry.targetDegree,
    secDomPosition: semitoneToCirclePosition(entry.secDomRootIndex),
    tritoneSubPosition: semitoneToCirclePosition(entry.tritoneSubRootIndex),
  }));
}
