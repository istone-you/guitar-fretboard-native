import type { ChordType } from "../types";
import type { KeyType } from "./harmonyUtils";

export type { KeyType };
export type SubstitutionType = "tonic" | "subdominant" | "dominant";

export interface SubstitutionResult {
  type: SubstitutionType;
  rootIndex: number;
  chordType: ChordType;
}

export const SUBSTITUTION_CHORD_TYPES: ChordType[] = ["Major", "Minor", "maj7", "m7", "7th"];

export const SUBSTITUTION_CHORD_LABELS: Partial<Record<ChordType, string>> = {
  Major: "M",
  Minor: "m",
  maj7: "maj7",
  m7: "m7",
  "7th": "7",
};

export function getSubstitutions(
  keyRootIndex: number,
  keyType: KeyType,
  chordRootIndex: number,
  chordType: ChordType,
): SubstitutionResult[] {
  const results: SubstitutionResult[] = [];
  const degree = (chordRootIndex - keyRootIndex + 12) % 12;

  if (keyType === "major") {
    if (degree === 0 && chordType === "Major") {
      results.push({ type: "tonic", rootIndex: (keyRootIndex + 9) % 12, chordType: "Minor" });
      results.push({ type: "tonic", rootIndex: (keyRootIndex + 4) % 12, chordType: "Minor" });
    } else if (degree === 0 && chordType === "maj7") {
      results.push({ type: "tonic", rootIndex: (keyRootIndex + 9) % 12, chordType: "m7" });
      results.push({ type: "tonic", rootIndex: (keyRootIndex + 4) % 12, chordType: "m7" });
    } else if (degree === 9 && chordType === "Minor") {
      results.push({ type: "tonic", rootIndex: keyRootIndex, chordType: "Major" });
    } else if (degree === 9 && chordType === "m7") {
      results.push({ type: "tonic", rootIndex: keyRootIndex, chordType: "maj7" });
    } else if (degree === 4 && chordType === "Minor") {
      results.push({ type: "tonic", rootIndex: keyRootIndex, chordType: "Major" });
    } else if (degree === 4 && chordType === "m7") {
      results.push({ type: "tonic", rootIndex: keyRootIndex, chordType: "maj7" });
    } else if (degree === 2 && chordType === "Minor") {
      results.push({ type: "subdominant", rootIndex: (keyRootIndex + 5) % 12, chordType: "Major" });
    } else if (degree === 2 && chordType === "m7") {
      results.push({ type: "subdominant", rootIndex: (keyRootIndex + 5) % 12, chordType: "maj7" });
    } else if (degree === 5 && chordType === "Major") {
      results.push({ type: "subdominant", rootIndex: (keyRootIndex + 2) % 12, chordType: "Minor" });
    } else if (degree === 5 && chordType === "maj7") {
      results.push({ type: "subdominant", rootIndex: (keyRootIndex + 2) % 12, chordType: "m7" });
    } else if (degree === 7 && chordType === "7th") {
      results.push({ type: "dominant", rootIndex: (chordRootIndex + 6) % 12, chordType: "7th" });
    } else if (degree === 1 && chordType === "7th") {
      results.push({ type: "dominant", rootIndex: (keyRootIndex + 7) % 12, chordType: "7th" });
    }
  } else {
    if (degree === 0 && chordType === "Minor") {
      results.push({ type: "tonic", rootIndex: (keyRootIndex + 3) % 12, chordType: "Major" });
    } else if (degree === 0 && chordType === "m7") {
      results.push({ type: "tonic", rootIndex: (keyRootIndex + 3) % 12, chordType: "maj7" });
    } else if (degree === 3 && chordType === "Major") {
      results.push({ type: "tonic", rootIndex: keyRootIndex, chordType: "Minor" });
    } else if (degree === 3 && chordType === "maj7") {
      results.push({ type: "tonic", rootIndex: keyRootIndex, chordType: "m7" });
    } else if (degree === 5 && chordType === "Minor") {
      results.push({ type: "subdominant", rootIndex: (keyRootIndex + 8) % 12, chordType: "Major" });
    } else if (degree === 5 && chordType === "m7") {
      results.push({ type: "subdominant", rootIndex: (keyRootIndex + 8) % 12, chordType: "maj7" });
    } else if (degree === 8 && chordType === "Major") {
      results.push({ type: "subdominant", rootIndex: (keyRootIndex + 5) % 12, chordType: "Minor" });
    } else if (degree === 8 && chordType === "maj7") {
      results.push({ type: "subdominant", rootIndex: (keyRootIndex + 5) % 12, chordType: "m7" });
    } else if (degree === 7 && chordType === "7th") {
      results.push({ type: "dominant", rootIndex: (chordRootIndex + 6) % 12, chordType: "7th" });
    } else if (degree === 1 && chordType === "7th") {
      results.push({ type: "dominant", rootIndex: (keyRootIndex + 7) % 12, chordType: "7th" });
    }
  }

  return results;
}
