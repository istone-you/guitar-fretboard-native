import type { ChordType } from "../types";

export type SubstitutionType = "tonic" | "subdominant" | "dominant";

export interface SubstitutionResult {
  type: SubstitutionType;
  rootIndex: number;
  chordType: ChordType;
}

// トニック代理: Major / maj7 → VIm（+9）・IIIm（+4）
const TONIC_MAP: Partial<Record<ChordType, { semitoneOffset: number; chordType: ChordType }[]>> = {
  Major: [
    { semitoneOffset: 9, chordType: "Minor" }, // VIm（平行短調）
    { semitoneOffset: 4, chordType: "Minor" }, // IIIm（中音）
  ],
  maj7: [
    { semitoneOffset: 9, chordType: "m7" }, // VIm7
    { semitoneOffset: 4, chordType: "m7" }, // IIIm7
  ],
};

// サブドミナント代理: Minor / m7 → IVmaj（+3）
const SUBDOMINANT_MAP: Partial<
  Record<ChordType, { semitoneOffset: number; chordType: ChordType }>
> = {
  Minor: { semitoneOffset: 3, chordType: "Major" }, // IIm → IV
  m7: { semitoneOffset: 3, chordType: "maj7" }, // IIm7 → IVmaj7
};

// ドミナント代理: 7th → ♭II7（+6, トライトーン代理）
const DOMINANT_TYPES = new Set<ChordType>(["7th"]);

export const SUBSTITUTION_CHORD_TYPES: ChordType[] = ["Major", "Minor", "maj7", "m7", "7th"];

export const SUBSTITUTION_CHORD_LABELS: Partial<Record<ChordType, string>> = {
  Major: "Maj",
  Minor: "m",
  maj7: "maj7",
  m7: "m7",
  "7th": "7",
};

export function getSubstitutions(rootIndex: number, chordType: ChordType): SubstitutionResult[] {
  const results: SubstitutionResult[] = [];

  const tonicSubs = TONIC_MAP[chordType];
  if (tonicSubs) {
    for (const sub of tonicSubs) {
      results.push({
        type: "tonic",
        rootIndex: (rootIndex + sub.semitoneOffset) % 12,
        chordType: sub.chordType,
      });
    }
  }

  const subdominantSub = SUBDOMINANT_MAP[chordType];
  if (subdominantSub) {
    results.push({
      type: "subdominant",
      rootIndex: (rootIndex + subdominantSub.semitoneOffset) % 12,
      chordType: subdominantSub.chordType,
    });
  }

  if (DOMINANT_TYPES.has(chordType)) {
    results.push({ type: "dominant", rootIndex: (rootIndex + 6) % 12, chordType: "7th" });
  }

  return results;
}
