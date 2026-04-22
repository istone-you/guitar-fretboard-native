import type { ChordType } from "../types";

export type SubstitutionType = "diatonic" | "tritone";

export interface SubstitutionResult {
  type: SubstitutionType;
  rootIndex: number;
  chordType: ChordType;
}

// 平行調 (VIm / ♭III): 共通音2つ、最も使われるダイアトニック代理
const RELATIVE_MAP: Partial<Record<ChordType, { semitoneOffset: number; chordType: ChordType }>> = {
  Major: { semitoneOffset: 9, chordType: "Minor" },
  Minor: { semitoneOffset: 3, chordType: "Major" },
  maj7: { semitoneOffset: 9, chordType: "m7" },
  m7: { semitoneOffset: 3, chordType: "maj7" },
};

// 同機能代理 (IIIm / ♭VI): 共通音2つ、トニック/サブドミナント機能の代理
const DIATONIC_MAP: Partial<Record<ChordType, { semitoneOffset: number; chordType: ChordType }>> = {
  Major: { semitoneOffset: 4, chordType: "Minor" },
  Minor: { semitoneOffset: 8, chordType: "Major" },
  maj7: { semitoneOffset: 4, chordType: "m7" },
  m7: { semitoneOffset: 8, chordType: "maj7" },
};

// トライトーン代理の対象コードタイプ（ドミナント7th系のみ）
const TRITONE_TYPES = new Set<ChordType>(["7th"]);

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

  const relative = RELATIVE_MAP[chordType];
  if (relative) {
    results.push({
      type: "diatonic",
      rootIndex: (rootIndex + relative.semitoneOffset) % 12,
      chordType: relative.chordType,
    });
  }

  const diatonic = DIATONIC_MAP[chordType];
  if (diatonic) {
    results.push({
      type: "diatonic",
      rootIndex: (rootIndex + diatonic.semitoneOffset) % 12,
      chordType: diatonic.chordType,
    });
  }

  if (TRITONE_TYPES.has(chordType)) {
    results.push({ type: "tritone", rootIndex: (rootIndex + 6) % 12, chordType: "7th" });
  }

  return results;
}
