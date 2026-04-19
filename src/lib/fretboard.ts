import type {
  Accidental,
  ChordDisplayMode,
  ChordType,
  TriadChordType,
  DegreeName,
  ScaleType,
} from "../types";

// 音名配列（半音12音）
export const NOTES_SHARP = [
  "C",
  "C♯",
  "D",
  "D♯",
  "E",
  "F",
  "F♯",
  "G",
  "G♯",
  "A",
  "A♯",
  "B",
] as const;
export const NOTES_FLAT = [
  "C",
  "D♭",
  "D",
  "E♭",
  "E",
  "F",
  "G♭",
  "G",
  "A♭",
  "A",
  "B♭",
  "B",
] as const;
const NOTES = NOTES_FLAT; // 後方互換

// スタンダードチューニング（6弦から1弦、開放弦の音名インデックス）
// 6弦=E2, 5弦=A2, 4弦=D3, 3弦=G3, 2弦=B3, 1弦=E4
export const OPEN_STRINGS = [4, 9, 2, 7, 11, 4] as const; // E, A, D, G, B, E

// フレット数（0〜14フレット = 15フレット分）
export const FRET_COUNT = 15;

// ポジションマーク（シングル: 3,5,7,9、ダブル: 12）
export const POSITION_MARKS: Record<number, "single" | "double"> = {
  3: "single",
  5: "single",
  7: "single",
  9: "single",
  12: "double",
};

// 指定弦・フレットの音名インデックスを返す
export function getNoteIndex(stringIndex: number, fret: number): number {
  return (OPEN_STRINGS[stringIndex] + fret) % 12;
}

// 指定弦・フレットの音名を返す
export function getNoteName(stringIndex: number, fret: number): string {
  return NOTES[getNoteIndex(stringIndex, fret)];
}

// 度数名配列（半音インターバル → 度数表記）
export const DEGREE_NAMES: DegreeName[] = [
  "P1", // 0: 完全1度
  "m2", // 1: 短2度
  "M2", // 2: 長2度
  "m3", // 3: 短3度
  "M3", // 4: 長3度
  "P4", // 5: 完全4度
  "b5", // 6: 減5度
  "P5", // 7: 完全5度
  "m6", // 9: 短6度
  "M6", // 10: 長6度
  "m7", // 11: 短7度
  "M7", // 12: 長7度
];

// 実際に使う度数マップ（0〜11の半音 → 度数名）
export const SEMITONE_TO_DEGREE: DegreeName[] = [
  "P1", // 0
  "m2", // 1
  "M2", // 2
  "m3", // 3
  "M3", // 4
  "P4", // 5
  "b5", // 6
  "P5", // 7
  "m6", // 8
  "M6", // 9
  "m7", // 10
  "M7", // 11
];

export const DEGREE_BY_SEMITONE: readonly DegreeName[] = SEMITONE_TO_DEGREE;

export const DEGREE_TO_SEMITONE: Readonly<Record<string, number>> = {
  P1: 0,
  m2: 1,
  M2: 2,
  m3: 3,
  M3: 4,
  P4: 5,
  b5: 6,
  P5: 7,
  m6: 8,
  M6: 9,
  m7: 10,
  M7: 11,
  b9: 1,
  "♭9": 1,
  "9": 2,
  "#9": 3,
  "♯9": 3,
  "11": 5,
  "#11": 6,
  "♯11": 6,
  b13: 8,
  "♭13": 8,
  "13": 9,
};

export const CUSTOM_DEGREE_CHIPS = [
  "P1",
  "m2",
  "M2",
  "m3",
  "M3",
  "P4",
  "b5",
  "P5",
  "m6",
  "M6",
  "m7",
  "M7",
  "♭9",
  "9",
  "♯9",
  "11",
  "♯11",
  "♭13",
  "13",
] as const;

export const DEGREE_LABEL_ORDER = [
  "P1",
  "m2",
  "M2",
  "m3",
  "M3",
  "P4",
  "b5",
  "P5",
  "m6",
  "M6",
  "m7",
  "M7",
  "b9",
  "9",
  "#9",
  "11",
  "#11",
  "b13",
  "13",
] as const;

export const CHORD_TYPES_CORE: ChordType[] = [
  "Major",
  "Minor",
  "5",
  "dim",
  "aug",
  "7th",
  "maj7",
  "m7",
  "m7(b5)",
  "dim7",
  "m(maj7)",
  "sus2",
  "sus4",
  "6",
  "m6",
  "9",
  "b9",
  "#9",
  "add9",
  "11",
  "#11",
  "add11",
  "add#11",
  "13",
  "b13",
];

export function getNotesByAccidental(accidental: Accidental) {
  return accidental === "sharp" ? NOTES_SHARP : NOTES_FLAT;
}

// 度数計算: (TargetNoteIndex - RootNoteIndex + 12) % 12
export function calcDegree(noteIndex: number, rootIndex: number): number {
  return (noteIndex - rootIndex + 12) % 12;
}

// 度数名を返す
export function getDegreeName(noteIndex: number, rootIndex: number): DegreeName {
  const semitone = calcDegree(noteIndex, rootIndex);
  return SEMITONE_TO_DEGREE[semitone];
}

// 度数の色マッピング
export const DEGREE_COLORS: Partial<Record<DegreeName, { bg: string; text: string }>> = {
  P1: { bg: "#ef4444", text: "#fff" }, // 赤: 完全1度
  P5: { bg: "#6b7280", text: "#fff" }, // グレー: 5度
  M3: { bg: "#22c55e", text: "#fff" }, // 緑: 長3度
  m3: { bg: "#a855f7", text: "#fff" }, // 紫: 短3度
  M7: { bg: "#f59e0b", text: "#fff" }, // 橙: 長7度
  m7: { bg: "#f97316", text: "#fff" }, // オレンジ: 短7度
  P4: { bg: "#06b6d4", text: "#fff" }, // シアン: 4度
  M2: { bg: "#84cc16", text: "#fff" }, // 黄緑: 長2度
  m2: { bg: "#ec4899", text: "#fff" }, // ピンク
  m6: { bg: "#8b5cf6", text: "#fff" },
  M6: { bg: "#10b981", text: "#fff" },
  b5: { bg: "#6b7280", text: "#fff" },
};

// ===== コードフォーム定義 =====
// 各コードの「フォーム」を相対フレット・弦のオフセットで定義
// rootString: 0=6弦, 1=5弦
// positions: [{string, fretOffset}] fretOffsetはルートフレットからの差分

interface FretPosition {
  string: number;
  fretOffset: number;
}

export interface FretCell {
  string: number;
  fret: number;
}

// 6弦ルートのバレーコードフォーム
export const CHORD_FORMS_6TH: Partial<Record<ChordType, FretPosition[]>> = {
  Major: [
    { string: 0, fretOffset: 0 }, // 6弦ルート
    { string: 1, fretOffset: 2 }, // 5弦
    { string: 2, fretOffset: 2 }, // 4弦
    { string: 3, fretOffset: 1 }, // 3弦
    { string: 4, fretOffset: 0 }, // 2弦
    { string: 5, fretOffset: 0 }, // 1弦
  ],
  Minor: [
    { string: 0, fretOffset: 0 },
    { string: 1, fretOffset: 2 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 0 },
    { string: 4, fretOffset: 0 },
    { string: 5, fretOffset: 0 },
  ],
  "7th": [
    { string: 0, fretOffset: 0 },
    { string: 1, fretOffset: 2 },
    { string: 2, fretOffset: 0 },
    { string: 3, fretOffset: 1 },
    { string: 4, fretOffset: 0 },
    { string: 5, fretOffset: 0 },
  ],
  maj7: [
    { string: 0, fretOffset: 0 },
    { string: 1, fretOffset: 2 },
    { string: 2, fretOffset: 1 },
    { string: 3, fretOffset: 1 },
    { string: 4, fretOffset: 0 },
    { string: 5, fretOffset: 0 },
  ],
  m7: [
    { string: 0, fretOffset: 0 },
    { string: 1, fretOffset: 2 },
    { string: 2, fretOffset: 0 },
    { string: 3, fretOffset: 0 },
    { string: 4, fretOffset: 0 },
    { string: 5, fretOffset: 0 },
  ],
  "m7(b5)": [
    { string: 0, fretOffset: 0 },
    { string: 1, fretOffset: 1 },
    { string: 2, fretOffset: 0 },
    { string: 3, fretOffset: 0 },
    { string: 4, fretOffset: -1 },
    { string: 5, fretOffset: 0 },
  ],
  dim7: [
    { string: 0, fretOffset: 0 },
    { string: 1, fretOffset: 1 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 0 },
    { string: 4, fretOffset: 2 },
    { string: 5, fretOffset: 0 },
  ],
  "m(maj7)": [
    { string: 0, fretOffset: 0 },
    { string: 1, fretOffset: 2 },
    { string: 2, fretOffset: 1 },
    { string: 3, fretOffset: 0 },
    { string: 4, fretOffset: 0 },
    { string: 5, fretOffset: 0 },
  ],
  sus2: [
    { string: 0, fretOffset: 0 },
    { string: 1, fretOffset: 2 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 4 },
    { string: 4, fretOffset: 0 },
    { string: 5, fretOffset: 0 },
  ],
  sus4: [
    { string: 0, fretOffset: 0 },
    { string: 1, fretOffset: 2 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 2 },
    { string: 4, fretOffset: 0 },
    { string: 5, fretOffset: 0 },
  ],
  "6": [
    { string: 0, fretOffset: 0 },
    { string: 1, fretOffset: 2 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 1 },
    { string: 4, fretOffset: 2 },
    { string: 5, fretOffset: 0 },
  ],
  m6: [
    { string: 0, fretOffset: 0 },
    { string: 1, fretOffset: 2 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 0 },
    { string: 4, fretOffset: 2 },
    { string: 5, fretOffset: 0 },
  ],
  dim: [
    { string: 0, fretOffset: 0 },
    { string: 1, fretOffset: 1 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 0 },
  ],
  aug: [
    { string: 0, fretOffset: 0 },
    { string: 1, fretOffset: 3 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 1 },
    { string: 4, fretOffset: 1 },
    { string: 5, fretOffset: 0 },
  ],
  // --- Tension chords ---
  "9": [
    { string: 0, fretOffset: 0 }, // R
    { string: 2, fretOffset: 0 }, // m7
    { string: 3, fretOffset: 1 }, // M3
    { string: 4, fretOffset: 0 }, // P5
    { string: 5, fretOffset: 2 }, // M9
  ],
  b9: [
    { string: 0, fretOffset: 0 }, // R
    { string: 2, fretOffset: 0 }, // m7
    { string: 3, fretOffset: 1 }, // M3
    { string: 5, fretOffset: 1 }, // b9
  ],
  "#9": [
    { string: 0, fretOffset: 0 }, // R
    { string: 2, fretOffset: 0 }, // m7
    { string: 3, fretOffset: 1 }, // M3
    { string: 5, fretOffset: 3 }, // #9
  ],
  maj9: [
    { string: 0, fretOffset: 0 }, // R
    { string: 2, fretOffset: 1 }, // M7
    { string: 3, fretOffset: 1 }, // M3
    { string: 4, fretOffset: 0 }, // P5
    { string: 5, fretOffset: 2 }, // M9
  ],
  m9: [
    { string: 0, fretOffset: 0 }, // R
    { string: 2, fretOffset: 0 }, // m7
    { string: 3, fretOffset: 0 }, // m3
    { string: 4, fretOffset: 0 }, // P5
    { string: 5, fretOffset: 2 }, // M9
  ],
  add9: [
    { string: 0, fretOffset: 0 }, // R
    { string: 1, fretOffset: 2 }, // P5
    { string: 2, fretOffset: 2 }, // R (octave)
    { string: 3, fretOffset: 1 }, // M3
    { string: 5, fretOffset: 2 }, // M9
  ],
  "7(b9)": [
    { string: 0, fretOffset: 0 }, // R
    { string: 2, fretOffset: 0 }, // m7
    { string: 3, fretOffset: 1 }, // M3
    { string: 5, fretOffset: 1 }, // b9
  ],
  "7(#9)": [
    { string: 0, fretOffset: 0 }, // R
    { string: 2, fretOffset: 0 }, // m7
    { string: 3, fretOffset: 1 }, // M3
    { string: 5, fretOffset: 3 }, // #9
  ],
  "11": [
    { string: 0, fretOffset: 0 }, // R
    { string: 2, fretOffset: 0 }, // m7
    { string: 3, fretOffset: -1 }, // M9
    { string: 4, fretOffset: -2 }, // P11
    { string: 5, fretOffset: 0 }, // R (octave)
  ],
  "#11": [
    { string: 0, fretOffset: 0 }, // R
    { string: 2, fretOffset: 0 }, // m7
    { string: 3, fretOffset: -1 }, // M9
    { string: 4, fretOffset: -1 }, // #11
    { string: 5, fretOffset: 0 }, // R (octave)
  ],
  add11: [
    { string: 0, fretOffset: 0 }, // R
    { string: 1, fretOffset: 2 }, // P5
    { string: 3, fretOffset: 1 }, // M3
    { string: 4, fretOffset: -2 }, // P11
  ],
  "add#11": [
    { string: 0, fretOffset: 0 }, // R
    { string: 1, fretOffset: 2 }, // P5
    { string: 3, fretOffset: 1 }, // M3
    { string: 4, fretOffset: -1 }, // #11
  ],
  m11: [
    { string: 0, fretOffset: 0 }, // R
    { string: 2, fretOffset: 0 }, // m7
    { string: 3, fretOffset: -1 }, // M9
    { string: 4, fretOffset: -2 }, // P11
    { string: 5, fretOffset: 0 }, // R (octave)
  ],
  "13": [
    { string: 0, fretOffset: 0 }, // R
    { string: 2, fretOffset: 0 }, // m7
    { string: 3, fretOffset: 1 }, // M3
    { string: 4, fretOffset: 2 }, // M13
    { string: 5, fretOffset: 2 }, // M9
  ],
  b13: [
    { string: 0, fretOffset: 0 }, // R
    { string: 2, fretOffset: 0 }, // m7
    { string: 3, fretOffset: 1 }, // M3
    { string: 4, fretOffset: 1 }, // b13
  ],
  maj13: [
    { string: 0, fretOffset: 0 }, // R
    { string: 2, fretOffset: 1 }, // M7
    { string: 3, fretOffset: 1 }, // M3
    { string: 4, fretOffset: 2 }, // M13
  ],
  m13: [
    { string: 0, fretOffset: 0 }, // R
    { string: 2, fretOffset: 0 }, // m7
    { string: 3, fretOffset: 0 }, // m3
    { string: 4, fretOffset: 2 }, // M13
  ],
  "6/9": [
    { string: 0, fretOffset: 0 }, // R
    { string: 1, fretOffset: 2 }, // P5
    { string: 3, fretOffset: 1 }, // M3
    { string: 4, fretOffset: 2 }, // M6
    { string: 5, fretOffset: 2 }, // M9
  ],
  "m6/9": [
    { string: 0, fretOffset: 0 }, // R
    { string: 1, fretOffset: 2 }, // P5
    { string: 3, fretOffset: 0 }, // m3
    { string: 4, fretOffset: 2 }, // M6
    { string: 5, fretOffset: 2 }, // M9
  ],
  "5": [
    { string: 0, fretOffset: 0 }, // 6弦ルート
    { string: 1, fretOffset: 2 }, // 5弦P5
  ],
};

// 5弦ルートのバレーコードフォーム
export const CHORD_FORMS_5TH: Partial<Record<ChordType, FretPosition[]>> = {
  "5": [
    { string: 1, fretOffset: 0 }, // 5弦ルート
    { string: 2, fretOffset: 2 }, // 4弦P5
  ],
  Major: [
    { string: 1, fretOffset: 0 }, // 5弦ルート
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 2 },
    { string: 4, fretOffset: 2 },
    { string: 5, fretOffset: 0 },
  ],
  Minor: [
    { string: 1, fretOffset: 0 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 2 },
    { string: 4, fretOffset: 1 },
    { string: 5, fretOffset: 0 },
  ],
  "7th": [
    { string: 1, fretOffset: 0 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 0 },
    { string: 4, fretOffset: 2 },
    { string: 5, fretOffset: 0 },
  ],
  maj7: [
    { string: 1, fretOffset: 0 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 1 },
    { string: 4, fretOffset: 2 },
    { string: 5, fretOffset: 0 },
  ],
  m7: [
    { string: 1, fretOffset: 0 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 0 },
    { string: 4, fretOffset: 1 },
    { string: 5, fretOffset: 0 },
  ],
  "m7(b5)": [
    { string: 1, fretOffset: 0 },
    { string: 2, fretOffset: 1 },
    { string: 3, fretOffset: 0 },
    { string: 4, fretOffset: 1 },
  ],
  dim7: [
    { string: 1, fretOffset: 0 },
    { string: 2, fretOffset: 1 },
    { string: 3, fretOffset: 2 },
    { string: 4, fretOffset: 1 },
    { string: 5, fretOffset: 2 },
  ],
  "m(maj7)": [
    { string: 1, fretOffset: 0 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 1 },
    { string: 4, fretOffset: 1 },
    { string: 5, fretOffset: 0 },
  ],
  sus2: [
    { string: 1, fretOffset: 0 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 2 },
    { string: 4, fretOffset: 0 },
    { string: 5, fretOffset: 0 },
  ],
  sus4: [
    { string: 1, fretOffset: 0 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 2 },
    { string: 4, fretOffset: 3 },
    { string: 5, fretOffset: 0 },
  ],
  "6": [
    { string: 1, fretOffset: 0 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 2 },
    { string: 4, fretOffset: 2 },
    { string: 5, fretOffset: 2 },
  ],
  m6: [
    { string: 1, fretOffset: 0 },
    { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 2 },
    { string: 4, fretOffset: 1 },
    { string: 5, fretOffset: 2 },
  ],
  dim: [
    { string: 1, fretOffset: 0 },
    { string: 2, fretOffset: 1 },
    { string: 3, fretOffset: 2 },
    { string: 4, fretOffset: 1 },
  ],
  aug: [
    { string: 1, fretOffset: 0 },
    { string: 2, fretOffset: 3 },
    { string: 3, fretOffset: 2 },
    { string: 4, fretOffset: 2 },
    { string: 5, fretOffset: 1 },
  ],
  // --- Tension chords (5th string root, verified voicings) ---
  "9": [
    { string: 1, fretOffset: 0 }, // R
    { string: 2, fretOffset: -1 }, // M3
    { string: 3, fretOffset: 0 }, // m7
    { string: 4, fretOffset: 0 }, // M9
    { string: 5, fretOffset: -3 }, // M3 (octave)
  ],
  b9: [
    { string: 1, fretOffset: 0 }, // R
    { string: 2, fretOffset: -1 }, // M3
    { string: 3, fretOffset: 0 }, // m7
    { string: 4, fretOffset: -1 }, // b9
    { string: 5, fretOffset: -3 }, // M3 (octave)
  ],
  "#9": [
    { string: 1, fretOffset: 0 }, // R
    { string: 2, fretOffset: -1 }, // M3
    { string: 3, fretOffset: 0 }, // m7
    { string: 4, fretOffset: 1 }, // #9
    { string: 5, fretOffset: -3 }, // M3 (octave)
  ],
  maj9: [
    { string: 1, fretOffset: 0 }, // R
    { string: 2, fretOffset: -1 }, // M3
    { string: 3, fretOffset: 1 }, // M7
    { string: 4, fretOffset: 0 }, // M9
  ],
  m9: [
    { string: 1, fretOffset: 0 }, // R
    { string: 2, fretOffset: -2 }, // m3
    { string: 3, fretOffset: 0 }, // m7
    { string: 4, fretOffset: 0 }, // M9
  ],
  add9: [
    { string: 1, fretOffset: 0 }, // R
    { string: 2, fretOffset: -1 }, // M3
    { string: 4, fretOffset: 0 }, // M9
    { string: 5, fretOffset: 0 }, // P5
  ],
  "7(b9)": [
    { string: 1, fretOffset: 0 }, // R
    { string: 2, fretOffset: -1 }, // M3
    { string: 3, fretOffset: 0 }, // m7
    { string: 4, fretOffset: -1 }, // b9
    { string: 5, fretOffset: -3 }, // M3 (octave)
  ],
  "7(#9)": [
    { string: 1, fretOffset: 0 }, // R
    { string: 2, fretOffset: -1 }, // M3
    { string: 3, fretOffset: 0 }, // m7
    { string: 4, fretOffset: 1 }, // #9
    { string: 5, fretOffset: -3 }, // M3 (octave)
  ],
  "11": [
    // user-provided: 53,33,24,11
    { string: 1, fretOffset: 0 }, // R
    { string: 3, fretOffset: 0 }, // m7
    { string: 4, fretOffset: 1 }, // m3
    { string: 5, fretOffset: -2 }, // P11
  ],
  "#11": [
    { string: 1, fretOffset: 0 }, // R
    { string: 3, fretOffset: 0 }, // m7
    { string: 4, fretOffset: 2 }, // M3
    { string: 5, fretOffset: -1 }, // #11
  ],
  add11: [
    { string: 1, fretOffset: 0 }, // R
    { string: 2, fretOffset: 2 }, // P5
    { string: 4, fretOffset: 2 }, // M3
    { string: 5, fretOffset: -2 }, // P11
  ],
  "add#11": [
    { string: 1, fretOffset: 0 }, // R
    { string: 2, fretOffset: 2 }, // P5
    { string: 4, fretOffset: 2 }, // M3
    { string: 5, fretOffset: -1 }, // #11
  ],
  m11: [
    { string: 1, fretOffset: 0 }, // R
    { string: 3, fretOffset: 0 }, // m7
    { string: 4, fretOffset: 1 }, // m3
    { string: 5, fretOffset: -2 }, // P11
  ],
  "13": [
    { string: 1, fretOffset: 0 }, // R
    { string: 3, fretOffset: 0 }, // m7
    { string: 4, fretOffset: 2 }, // M3
    { string: 5, fretOffset: 2 }, // M13
  ],
  b13: [
    { string: 1, fretOffset: 0 }, // R
    { string: 3, fretOffset: 0 }, // m7
    { string: 4, fretOffset: 2 }, // M3
    { string: 5, fretOffset: 1 }, // b13
  ],
  maj13: [
    { string: 1, fretOffset: 0 }, // R
    { string: 2, fretOffset: -1 }, // M3
    { string: 3, fretOffset: 1 }, // M7
    { string: 5, fretOffset: 2 }, // M13
  ],
  m13: [
    { string: 1, fretOffset: 0 }, // R
    { string: 2, fretOffset: -2 }, // m3
    { string: 3, fretOffset: 0 }, // m7
    { string: 5, fretOffset: 2 }, // M13
  ],
  "6/9": [
    { string: 1, fretOffset: 0 }, // R
    { string: 2, fretOffset: -1 }, // M3
    { string: 3, fretOffset: -1 }, // M6
    { string: 4, fretOffset: 0 }, // M9
    { string: 5, fretOffset: 0 }, // P5
  ],
  "m6/9": [
    { string: 1, fretOffset: 0 }, // R
    { string: 2, fretOffset: -2 }, // m3
    { string: 3, fretOffset: -1 }, // M6
    { string: 4, fretOffset: 0 }, // M9
    { string: 5, fretOffset: 0 }, // P5
  ],
};

interface TriadOption {
  value: string;
  label: string;
  strings: number[];
}

export const TRIAD_STRING_SET_OPTIONS: TriadOption[] = [
  { value: "1-3", label: "1~3弦", strings: [3, 4, 5] },
  { value: "2-4", label: "2~4弦", strings: [2, 3, 4] },
  { value: "3-5", label: "3~5弦", strings: [1, 2, 3] },
  { value: "4-6", label: "4~6弦", strings: [0, 1, 2] },
];

interface InversionOption {
  value: string;
  label: string;
}

export const TRIAD_INVERSION_OPTIONS: InversionOption[] = [
  { value: "root", label: "基本" },
  { value: "first", label: "第一転回" },
  { value: "second", label: "第二転回" },
];

interface TriadLayoutOption {
  value: string;
  label: string;
  strings: number[];
  inversion: string;
}

export const TRIAD_LAYOUT_OPTIONS: TriadLayoutOption[] = TRIAD_STRING_SET_OPTIONS.flatMap(
  (stringSet) =>
    TRIAD_INVERSION_OPTIONS.map((inversion) => ({
      value: `${stringSet.value}-${inversion.value}`,
      label: `${stringSet.label}（${inversion.label}）`,
      strings: stringSet.strings,
      inversion: inversion.value,
    })),
);

export function getTriadLayout(layoutValue: string): TriadLayoutOption {
  return (
    TRIAD_LAYOUT_OPTIONS.find((option) => option.value === layoutValue) ?? TRIAD_LAYOUT_OPTIONS[0]
  );
}

interface TriadShapeEntry {
  anchorString: number;
  positions: FretPosition[];
}

const TRIAD_SHAPES: Record<string, Partial<Record<TriadChordType, TriadShapeEntry>>> = {
  "1-3-root": {
    Major: {
      anchorString: 3,
      positions: [
        { string: 3, fretOffset: 0 },
        { string: 4, fretOffset: 0 },
        { string: 5, fretOffset: -2 },
      ],
    },
    Minor: {
      anchorString: 3,
      positions: [
        { string: 3, fretOffset: 0 },
        { string: 4, fretOffset: -1 },
        { string: 5, fretOffset: -2 },
      ],
    },
    Diminished: {
      anchorString: 3,
      positions: [
        { string: 3, fretOffset: 0 },
        { string: 4, fretOffset: -1 },
        { string: 5, fretOffset: -3 },
      ],
    },
    Augmented: {
      anchorString: 3,
      positions: [
        { string: 3, fretOffset: 0 },
        { string: 4, fretOffset: 0 },
        { string: 5, fretOffset: -1 },
      ],
    },
  },
  "1-3-first": {
    Major: {
      anchorString: 5,
      positions: [
        { string: 3, fretOffset: 1 },
        { string: 4, fretOffset: 0 },
        { string: 5, fretOffset: 0 },
      ],
    },
    Minor: {
      anchorString: 5,
      positions: [
        { string: 3, fretOffset: 0 },
        { string: 4, fretOffset: 0 },
        { string: 5, fretOffset: 0 },
      ],
    },
    Diminished: {
      anchorString: 5,
      positions: [
        { string: 3, fretOffset: 0 },
        { string: 4, fretOffset: -1 },
        { string: 5, fretOffset: 0 },
      ],
    },
    Augmented: {
      anchorString: 5,
      positions: [
        { string: 3, fretOffset: 1 },
        { string: 4, fretOffset: 1 },
        { string: 5, fretOffset: 0 },
      ],
    },
  },
  "1-3-second": {
    Major: {
      anchorString: 4,
      positions: [
        { string: 3, fretOffset: -1 },
        { string: 4, fretOffset: 0 },
        { string: 5, fretOffset: -1 },
      ],
    },
    Minor: {
      anchorString: 4,
      positions: [
        { string: 3, fretOffset: -1 },
        { string: 4, fretOffset: 0 },
        { string: 5, fretOffset: -2 },
      ],
    },
    Diminished: {
      anchorString: 4,
      positions: [
        { string: 3, fretOffset: -2 },
        { string: 4, fretOffset: 0 },
        { string: 5, fretOffset: -2 },
      ],
    },
    Augmented: {
      anchorString: 4,
      positions: [
        { string: 3, fretOffset: 0 },
        { string: 4, fretOffset: 0 },
        { string: 5, fretOffset: -1 },
      ],
    },
  },
  "2-4-root": {
    Major: {
      anchorString: 2,
      positions: [
        { string: 2, fretOffset: 0 },
        { string: 3, fretOffset: -1 },
        { string: 4, fretOffset: -2 },
      ],
    },
    Minor: {
      anchorString: 2,
      positions: [
        { string: 2, fretOffset: 0 },
        { string: 3, fretOffset: -2 },
        { string: 4, fretOffset: -2 },
      ],
    },
    Diminished: {
      anchorString: 2,
      positions: [
        { string: 2, fretOffset: 0 },
        { string: 3, fretOffset: -2 },
        { string: 4, fretOffset: -3 },
      ],
    },
    Augmented: {
      anchorString: 2,
      positions: [
        { string: 2, fretOffset: 0 },
        { string: 3, fretOffset: -1 },
        { string: 4, fretOffset: -1 },
      ],
    },
  },
  "2-4-first": {
    Major: {
      anchorString: 4,
      positions: [
        { string: 2, fretOffset: 1 },
        { string: 3, fretOffset: -1 },
        { string: 4, fretOffset: 0 },
      ],
    },
    Minor: {
      anchorString: 4,
      positions: [
        { string: 2, fretOffset: 0 },
        { string: 3, fretOffset: -1 },
        { string: 4, fretOffset: 0 },
      ],
    },
    Diminished: {
      anchorString: 4,
      positions: [
        { string: 2, fretOffset: -2 },
        { string: 3, fretOffset: -2 },
        { string: 4, fretOffset: 0 },
      ],
    },
    Augmented: {
      anchorString: 4,
      positions: [
        { string: 2, fretOffset: 1 },
        { string: 3, fretOffset: 0 },
        { string: 4, fretOffset: 0 },
      ],
    },
  },
  "2-4-second": {
    Major: {
      anchorString: 3,
      positions: [
        { string: 2, fretOffset: 0 },
        { string: 3, fretOffset: 0 },
        { string: 4, fretOffset: 0 },
      ],
    },
    Minor: {
      anchorString: 3,
      positions: [
        { string: 2, fretOffset: 0 },
        { string: 3, fretOffset: 0 },
        { string: 4, fretOffset: -1 },
      ],
    },
    Diminished: {
      anchorString: 3,
      positions: [
        { string: 2, fretOffset: -1 },
        { string: 3, fretOffset: 0 },
        { string: 4, fretOffset: -1 },
      ],
    },
    Augmented: {
      anchorString: 3,
      positions: [
        { string: 2, fretOffset: 1 },
        { string: 3, fretOffset: 0 },
        { string: 4, fretOffset: 0 },
      ],
    },
  },
  "3-5-root": {
    Major: {
      anchorString: 1,
      positions: [
        { string: 1, fretOffset: 0 },
        { string: 2, fretOffset: -1 },
        { string: 3, fretOffset: -3 },
      ],
    },
    Minor: {
      anchorString: 1,
      positions: [
        { string: 1, fretOffset: 0 },
        { string: 2, fretOffset: -2 },
        { string: 3, fretOffset: -3 },
      ],
    },
    Diminished: {
      anchorString: 1,
      positions: [
        { string: 1, fretOffset: 0 },
        { string: 2, fretOffset: 1 },
        { string: 3, fretOffset: 0 },
      ],
    },
    Augmented: {
      anchorString: 1,
      positions: [
        { string: 1, fretOffset: 0 },
        { string: 2, fretOffset: -1 },
        { string: 3, fretOffset: -2 },
      ],
    },
  },
  "3-5-first": {
    Major: {
      anchorString: 3,
      positions: [
        { string: 1, fretOffset: 2 },
        { string: 2, fretOffset: 0 },
        { string: 3, fretOffset: 0 },
      ],
    },
    Minor: {
      anchorString: 3,
      positions: [
        { string: 1, fretOffset: 1 },
        { string: 2, fretOffset: 0 },
        { string: 3, fretOffset: 0 },
      ],
    },
    Diminished: {
      anchorString: 3,
      positions: [
        { string: 1, fretOffset: 1 },
        { string: 2, fretOffset: -1 },
        { string: 3, fretOffset: 0 },
      ],
    },
    Augmented: {
      anchorString: 3,
      positions: [
        { string: 1, fretOffset: 2 },
        { string: 2, fretOffset: 1 },
        { string: 3, fretOffset: 0 },
      ],
    },
  },
  "3-5-second": {
    Major: {
      anchorString: 2,
      positions: [
        { string: 1, fretOffset: 0 },
        { string: 2, fretOffset: 0 },
        { string: 3, fretOffset: -1 },
      ],
    },
    Minor: {
      anchorString: 2,
      positions: [
        { string: 1, fretOffset: 0 },
        { string: 2, fretOffset: 0 },
        { string: 3, fretOffset: -2 },
      ],
    },
    Diminished: {
      anchorString: 2,
      positions: [
        { string: 1, fretOffset: -1 },
        { string: 2, fretOffset: 0 },
        { string: 3, fretOffset: -2 },
      ],
    },
    Augmented: {
      anchorString: 2,
      positions: [
        { string: 1, fretOffset: 1 },
        { string: 2, fretOffset: 0 },
        { string: 3, fretOffset: -1 },
      ],
    },
  },
  "4-6-root": {
    Major: {
      anchorString: 0,
      positions: [
        { string: 0, fretOffset: 0 },
        { string: 1, fretOffset: -1 },
        { string: 2, fretOffset: -3 },
      ],
    },
    Minor: {
      anchorString: 0,
      positions: [
        { string: 0, fretOffset: 0 },
        { string: 1, fretOffset: -2 },
        { string: 2, fretOffset: -3 },
      ],
    },
    Diminished: {
      anchorString: 0,
      positions: [
        { string: 0, fretOffset: 0 },
        { string: 1, fretOffset: -2 },
        { string: 2, fretOffset: -4 },
      ],
    },
    Augmented: {
      anchorString: 0,
      positions: [
        { string: 0, fretOffset: 0 },
        { string: 1, fretOffset: -1 },
        { string: 2, fretOffset: -2 },
      ],
    },
  },
  "4-6-first": {
    Major: {
      anchorString: 2,
      positions: [
        { string: 0, fretOffset: 2 },
        { string: 1, fretOffset: 0 },
        { string: 2, fretOffset: 0 },
      ],
    },
    Minor: {
      anchorString: 2,
      positions: [
        { string: 0, fretOffset: 1 },
        { string: 1, fretOffset: 0 },
        { string: 2, fretOffset: 0 },
      ],
    },
    Diminished: {
      anchorString: 2,
      positions: [
        { string: 0, fretOffset: 1 },
        { string: 1, fretOffset: -1 },
        { string: 2, fretOffset: 0 },
      ],
    },
    Augmented: {
      anchorString: 2,
      positions: [
        { string: 0, fretOffset: 2 },
        { string: 1, fretOffset: 1 },
        { string: 2, fretOffset: 0 },
      ],
    },
  },
  "4-6-second": {
    Major: {
      anchorString: 1,
      positions: [
        { string: 0, fretOffset: 0 },
        { string: 1, fretOffset: 0 },
        { string: 2, fretOffset: -1 },
      ],
    },
    Minor: {
      anchorString: 1,
      positions: [
        { string: 0, fretOffset: 0 },
        { string: 1, fretOffset: 0 },
        { string: 2, fretOffset: -2 },
      ],
    },
    Diminished: {
      anchorString: 1,
      positions: [
        { string: 0, fretOffset: -1 },
        { string: 1, fretOffset: 0 },
        { string: 2, fretOffset: -2 },
      ],
    },
    Augmented: {
      anchorString: 1,
      positions: [
        { string: 0, fretOffset: 1 },
        { string: 1, fretOffset: 0 },
        { string: 2, fretOffset: -1 },
      ],
    },
  },
};

export function buildTriadVoicing(
  rootIndex: number,
  chordType: string,
  layoutValue: string,
): FretCell[] {
  const shapeGroup = TRIAD_SHAPES[layoutValue];
  const shape = shapeGroup?.[chordType as TriadChordType];
  if (!shape) return [];

  let best: { cells: FretCell[]; score: number } | null = null;
  for (let anchorFret = 0; anchorFret < FRET_COUNT; anchorFret++) {
    if (getNoteIndex(shape.anchorString, anchorFret) !== rootIndex) continue;

    const cells = shape.positions.map(({ string, fretOffset }) => ({
      string,
      fret: anchorFret + fretOffset,
    }));

    if (cells.some(({ fret }) => fret < 0 || fret >= FRET_COUNT)) continue;

    const frets = cells.map((cell) => cell.fret);
    if (frets.length === 0) continue;
    const score = Math.max(...frets) * 10 + (Math.max(...frets) - Math.min(...frets));
    if (!best || score < best.score) {
      best = { cells, score };
    }
  }

  return best?.cells ?? [];
}

export const OPEN_CHORD_FORMS: Partial<Record<ChordType, Record<string, FretCell[]>>> = {
  Major: {
    C: [
      { string: 1, fret: 3 },
      { string: 2, fret: 2 },
      { string: 3, fret: 0 },
      { string: 4, fret: 1 },
      { string: 5, fret: 0 },
    ],
    D: [
      { string: 2, fret: 0 },
      { string: 3, fret: 2 },
      { string: 4, fret: 3 },
      { string: 5, fret: 2 },
    ],
    E: [
      { string: 0, fret: 0 },
      { string: 1, fret: 2 },
      { string: 2, fret: 2 },
      { string: 3, fret: 1 },
      { string: 4, fret: 0 },
      { string: 5, fret: 0 },
    ],
    G: [
      { string: 0, fret: 3 },
      { string: 1, fret: 2 },
      { string: 2, fret: 0 },
      { string: 3, fret: 0 },
      { string: 4, fret: 0 },
      { string: 5, fret: 3 },
    ],
    A: [
      { string: 1, fret: 0 },
      { string: 2, fret: 2 },
      { string: 3, fret: 2 },
      { string: 4, fret: 2 },
      { string: 5, fret: 0 },
    ],
  },
  Minor: {
    D: [
      { string: 2, fret: 0 },
      { string: 3, fret: 2 },
      { string: 4, fret: 3 },
      { string: 5, fret: 1 },
    ],
    E: [
      { string: 0, fret: 0 },
      { string: 1, fret: 2 },
      { string: 2, fret: 2 },
      { string: 3, fret: 0 },
      { string: 4, fret: 0 },
      { string: 5, fret: 0 },
    ],
    A: [
      { string: 1, fret: 0 },
      { string: 2, fret: 2 },
      { string: 3, fret: 2 },
      { string: 4, fret: 1 },
      { string: 5, fret: 0 },
    ],
  },
  "7th": {
    A: [
      { string: 1, fret: 0 },
      { string: 2, fret: 2 },
      { string: 3, fret: 0 },
      { string: 4, fret: 2 },
      { string: 5, fret: 0 },
    ],
    B: [
      { string: 1, fret: 2 },
      { string: 2, fret: 1 },
      { string: 3, fret: 2 },
      { string: 4, fret: 0 },
      { string: 5, fret: 2 },
    ],
    C: [
      { string: 1, fret: 3 },
      { string: 2, fret: 2 },
      { string: 3, fret: 3 },
      { string: 4, fret: 1 },
      { string: 5, fret: 0 },
    ],
    D: [
      { string: 2, fret: 0 },
      { string: 3, fret: 2 },
      { string: 4, fret: 1 },
      { string: 5, fret: 2 },
    ],
    E: [
      { string: 0, fret: 0 },
      { string: 1, fret: 2 },
      { string: 2, fret: 0 },
      { string: 3, fret: 1 },
      { string: 4, fret: 0 },
      { string: 5, fret: 0 },
    ],
    G: [
      { string: 0, fret: 1 },
      { string: 1, fret: 2 },
      { string: 2, fret: 0 },
      { string: 3, fret: 0 },
      { string: 4, fret: 0 },
      { string: 5, fret: 1 },
    ],
  },
  maj7: {
    A: [
      { string: 1, fret: 0 },
      { string: 2, fret: 2 },
      { string: 3, fret: 1 },
      { string: 4, fret: 2 },
      { string: 5, fret: 0 },
    ],
    C: [
      { string: 1, fret: 3 },
      { string: 2, fret: 2 },
      { string: 3, fret: 0 },
      { string: 4, fret: 0 },
      { string: 5, fret: 0 },
    ],
    E: [
      { string: 0, fret: 0 },
      { string: 1, fret: 2 },
      { string: 2, fret: 1 },
      { string: 3, fret: 1 },
      { string: 4, fret: 0 },
      { string: 5, fret: 0 },
    ],
    F: [
      { string: 0, fret: 1 },
      { string: 1, fret: 3 },
      { string: 2, fret: 2 },
      { string: 3, fret: 2 },
      { string: 4, fret: 1 },
      { string: 5, fret: 0 },
    ],
    G: [
      { string: 0, fret: 2 },
      { string: 1, fret: 0 },
      { string: 2, fret: 0 },
      { string: 3, fret: 0 },
      { string: 4, fret: 0 },
      { string: 5, fret: 2 },
    ],
  },
  m7: {
    A: [
      { string: 1, fret: 0 },
      { string: 2, fret: 2 },
      { string: 3, fret: 0 },
      { string: 4, fret: 1 },
      { string: 5, fret: 0 },
    ],
    D: [
      { string: 2, fret: 0 },
      { string: 3, fret: 2 },
      { string: 4, fret: 1 },
      { string: 5, fret: 1 },
    ],
    E: [
      { string: 0, fret: 0 },
      { string: 1, fret: 2 },
      { string: 2, fret: 0 },
      { string: 3, fret: 0 },
      { string: 4, fret: 0 },
      { string: 5, fret: 0 },
    ],
  },
  sus2: {
    A: [
      { string: 1, fret: 0 },
      { string: 2, fret: 2 },
      { string: 3, fret: 2 },
      { string: 4, fret: 0 },
      { string: 5, fret: 0 },
    ],
    D: [
      { string: 2, fret: 0 },
      { string: 3, fret: 2 },
      { string: 4, fret: 3 },
      { string: 5, fret: 0 },
    ],
    E: [
      { string: 0, fret: 0 },
      { string: 1, fret: 2 },
      { string: 2, fret: 4 },
      { string: 3, fret: 4 },
      { string: 4, fret: 0 },
      { string: 5, fret: 0 },
    ],
  },
  sus4: {
    A: [
      { string: 1, fret: 0 },
      { string: 2, fret: 2 },
      { string: 3, fret: 2 },
      { string: 4, fret: 3 },
      { string: 5, fret: 0 },
    ],
    D: [
      { string: 2, fret: 0 },
      { string: 3, fret: 2 },
      { string: 4, fret: 3 },
      { string: 5, fret: 3 },
    ],
    E: [
      { string: 0, fret: 0 },
      { string: 1, fret: 2 },
      { string: 2, fret: 2 },
      { string: 3, fret: 2 },
      { string: 4, fret: 0 },
      { string: 5, fret: 0 },
    ],
  },
  "6": {
    A: [
      { string: 1, fret: 0 },
      { string: 2, fret: 2 },
      { string: 3, fret: 2 },
      { string: 4, fret: 2 },
      { string: 5, fret: 2 },
    ],
    C: [
      { string: 1, fret: 3 },
      { string: 2, fret: 2 },
      { string: 3, fret: 2 },
      { string: 4, fret: 1 },
      { string: 5, fret: 0 },
    ],
    D: [
      { string: 2, fret: 0 },
      { string: 3, fret: 2 },
      { string: 4, fret: 0 },
      { string: 5, fret: 2 },
    ],
  },
  m6: {
    A: [
      { string: 1, fret: 0 },
      { string: 2, fret: 2 },
      { string: 3, fret: 2 },
      { string: 4, fret: 1 },
      { string: 5, fret: 2 },
    ],
    D: [
      { string: 2, fret: 0 },
      { string: 3, fret: 2 },
      { string: 4, fret: 0 },
      { string: 5, fret: 1 },
    ],
  },
  dim: {},
  aug: {
    E: [
      { string: 0, fret: 0 },
      { string: 1, fret: 3 },
      { string: 2, fret: 2 },
      { string: 3, fret: 1 },
      { string: 4, fret: 1 },
      { string: 5, fret: 0 },
    ],
  },
};

export function getOpenChordForm(rootIndex: number, chordType: ChordType): FretCell[] | null {
  return OPEN_CHORD_FORMS[chordType]?.[NOTES[rootIndex]] ?? null;
}

interface DiatonicChordEntry {
  value: string;
  offset: number;
  chordType: ChordType;
}

export const DIATONIC_CHORDS: Record<string, DiatonicChordEntry[]> = {
  "major-triad": [
    { value: "I", offset: 0, chordType: "Major" },
    { value: "ii", offset: 2, chordType: "Minor" },
    { value: "iii", offset: 4, chordType: "Minor" },
    { value: "IV", offset: 5, chordType: "Major" },
    { value: "V", offset: 7, chordType: "Major" },
    { value: "vi", offset: 9, chordType: "Minor" },
    { value: "vii", offset: 11, chordType: "dim" },
  ],
  "major-seventh": [
    { value: "I", offset: 0, chordType: "maj7" },
    { value: "ii", offset: 2, chordType: "m7" },
    { value: "iii", offset: 4, chordType: "m7" },
    { value: "IV", offset: 5, chordType: "maj7" },
    { value: "V", offset: 7, chordType: "7th" },
    { value: "vi", offset: 9, chordType: "m7" },
    { value: "vii", offset: 11, chordType: "m7(b5)" },
  ],
  "natural-minor-triad": [
    { value: "i", offset: 0, chordType: "Minor" },
    { value: "ii", offset: 2, chordType: "dim" },
    { value: "III", offset: 3, chordType: "Major" },
    { value: "iv", offset: 5, chordType: "Minor" },
    { value: "v", offset: 7, chordType: "Minor" },
    { value: "VI", offset: 8, chordType: "Major" },
    { value: "VII", offset: 10, chordType: "Major" },
  ],
  "natural-minor-seventh": [
    { value: "i", offset: 0, chordType: "m7" },
    { value: "ii", offset: 2, chordType: "m7(b5)" },
    { value: "III", offset: 3, chordType: "maj7" },
    { value: "iv", offset: 5, chordType: "m7" },
    { value: "v", offset: 7, chordType: "m7" },
    { value: "VI", offset: 8, chordType: "maj7" },
    { value: "VII", offset: 10, chordType: "7th" },
  ],
};

interface DiatonicChordResult {
  rootIndex: number;
  chordType: ChordType;
}

export function getDiatonicChord(
  rootIndex: number,
  scaleType: string,
  degreeValue: string,
): DiatonicChordResult {
  const progression = DIATONIC_CHORDS[scaleType] ?? DIATONIC_CHORDS["major-triad"];
  const selected = progression.find((item) => item.value === degreeValue) ?? progression[0];
  return {
    rootIndex: (rootIndex + selected.offset) % 12,
    chordType: selected.chordType,
  };
}

export function getDiatonicChordSemitones(
  rootIndex: number,
  scaleType: string,
  degreeValue: string,
): Set<number> {
  const chord = getDiatonicChord(rootIndex, scaleType, degreeValue);
  const rootOffset = (chord.rootIndex - rootIndex + 12) % 12;
  const chordSemitones = CHORD_SEMITONES[chord.chordType] ?? new Set<number>();
  return new Set([...chordSemitones].map((semitone) => (semitone + rootOffset) % 12));
}

// ===== スケールフォーム定義 =====
// メジャースケール（イオニアン）の度数パターン: R, M2, M3, P4, P5, M6, M7
export const MAJOR_SCALE_DEGREES = new Set([0, 2, 4, 5, 7, 9, 11]);
// ナチュラルマイナー（エオリアン）の度数パターン: R, M2, m3, P4, P5, m6, m7
export const NATURAL_MINOR_SCALE_DEGREES = new Set([0, 2, 3, 5, 7, 8, 10]);
export const HARMONIC_MINOR_SCALE_DEGREES = new Set([0, 2, 3, 5, 7, 8, 11]);
export const MELODIC_MINOR_SCALE_DEGREES = new Set([0, 2, 3, 5, 7, 9, 11]);
export const DORIAN_SCALE_DEGREES = new Set([0, 2, 3, 5, 7, 9, 10]);
export const PHRYGIAN_SCALE_DEGREES = new Set([0, 1, 3, 5, 7, 8, 10]);
export const LYDIAN_SCALE_DEGREES = new Set([0, 2, 4, 6, 7, 9, 11]);
export const MIXOLYDIAN_SCALE_DEGREES = new Set([0, 2, 4, 5, 7, 9, 10]);
export const LOCRIAN_SCALE_DEGREES = new Set([0, 1, 3, 5, 6, 8, 10]);

// スケールに含まれるか判定
export function isInMajorScale(semitone: number): boolean {
  return MAJOR_SCALE_DEGREES.has(semitone);
}

export function isInNaturalMinorScale(semitone: number): boolean {
  return NATURAL_MINOR_SCALE_DEGREES.has(semitone);
}

// ルート音のノートインデックスを返す（♯・♭どちらの表記でも対応）
export function getRootIndex(rootNote: string): number {
  const idx = NOTES_SHARP.indexOf(rootNote as (typeof NOTES_SHARP)[number]);
  return idx !== -1 ? idx : NOTES_FLAT.indexOf(rootNote as (typeof NOTES_FLAT)[number]);
}

// ===== ペンタトニックスケール =====
// マイナーペンタ: R, m3, P4, P5, m7 → 半音: 0, 3, 5, 7, 10
export const MINOR_PENTA_DEGREES = new Set([0, 3, 5, 7, 10]);
// メジャーペンタ: R, M2, M3, P5, M6 → 半音: 0, 2, 4, 7, 9
export const MAJOR_PENTA_DEGREES = new Set([0, 2, 4, 7, 9]);

export function isInPenta(semitone: number, type: "minor" | "major"): boolean {
  return type === "minor" ? MINOR_PENTA_DEGREES.has(semitone) : MAJOR_PENTA_DEGREES.has(semitone);
}

// ブルーノートスケール: R, m3, P4, b5, P5, m7 → 半音: 0, 3, 5, 6, 7, 10
export const BLUES_SCALE_DEGREES = new Set([0, 3, 5, 6, 7, 10]);

// フリジアンドミナント: R, m2, M3, P4, P5, m6, m7
const PHRYGIAN_DOMINANT_SCALE_DEGREES = new Set([0, 1, 4, 5, 7, 8, 10]);
// リディアンドミナント: R, M2, M3, b5, P5, M6, m7
const LYDIAN_DOMINANT_SCALE_DEGREES = new Set([0, 2, 4, 6, 7, 9, 10]);
// オルタード: R, m2, m3, M3, b5, m6, m7
const ALTERED_SCALE_DEGREES = new Set([0, 1, 3, 4, 6, 8, 10]);
// ホールトーン: R, M2, M3, b5, m6, m7
const WHOLE_TONE_SCALE_DEGREES = new Set([0, 2, 4, 6, 8, 10]);
// ディミニッシュ（コンディミ）: R, M2, m3, P4, b5, m6, M6, M7
const DIMINISHED_SCALE_DEGREES = new Set([0, 2, 3, 5, 6, 8, 9, 11]);

export const SCALE_DEGREES: Record<ScaleType, Set<number>> = {
  major: MAJOR_SCALE_DEGREES,
  "natural-minor": NATURAL_MINOR_SCALE_DEGREES,
  "major-penta": MAJOR_PENTA_DEGREES,
  "minor-penta": MINOR_PENTA_DEGREES,
  blues: BLUES_SCALE_DEGREES,
  "harmonic-minor": HARMONIC_MINOR_SCALE_DEGREES,
  "melodic-minor": MELODIC_MINOR_SCALE_DEGREES,
  ionian: MAJOR_SCALE_DEGREES,
  dorian: DORIAN_SCALE_DEGREES,
  phrygian: PHRYGIAN_SCALE_DEGREES,
  lydian: LYDIAN_SCALE_DEGREES,
  mixolydian: MIXOLYDIAN_SCALE_DEGREES,
  aeolian: NATURAL_MINOR_SCALE_DEGREES,
  locrian: LOCRIAN_SCALE_DEGREES,
  "phrygian-dominant": PHRYGIAN_DOMINANT_SCALE_DEGREES,
  "lydian-dominant": LYDIAN_DOMINANT_SCALE_DEGREES,
  altered: ALTERED_SCALE_DEGREES,
  "whole-tone": WHOLE_TONE_SCALE_DEGREES,
  diminished: DIMINISHED_SCALE_DEGREES,
};

export function isInScale(semitone: number, scaleType: ScaleType): boolean {
  return SCALE_DEGREES[scaleType]?.has(semitone) ?? false;
}

// コード種別ごとの構成音（半音）
export const CHORD_SEMITONES: Record<string, Set<number>> = {
  Major: new Set([0, 4, 7]),
  Minor: new Set([0, 3, 7]),
  "7th": new Set([0, 4, 7, 10]),
  maj7: new Set([0, 4, 7, 11]),
  m7: new Set([0, 3, 7, 10]),
  "m7(b5)": new Set([0, 3, 6, 10]),
  dim7: new Set([0, 3, 6, 9]),
  "m(maj7)": new Set([0, 3, 7, 11]),
  Diminished: new Set([0, 3, 6]),
  Augmented: new Set([0, 4, 8]),
  sus2: new Set([0, 2, 7]),
  sus4: new Set([0, 5, 7]),
  "6": new Set([0, 4, 7, 9]),
  m6: new Set([0, 3, 7, 9]),
  dim: new Set([0, 3, 6]),
  aug: new Set([0, 4, 8]),
  "5": new Set([0, 7]),
  // --- Tension chords ---
  "9": new Set([0, 4, 7, 10, 2]), // R, M3, P5, m7, M9
  b9: new Set([0, 4, 7, 10, 1]), // R, M3, P5, m7, b9
  "#9": new Set([0, 4, 7, 10, 3]), // R, M3, P5, m7, #9
  maj9: new Set([0, 4, 7, 11, 2]), // R, M3, P5, M7, M9
  m9: new Set([0, 3, 7, 10, 2]), // R, m3, P5, m7, M9
  add9: new Set([0, 4, 7, 2]), // R, M3, P5, M9
  "7(b9)": new Set([0, 4, 7, 10, 1]), // R, M3, P5, m7, m9
  "7(#9)": new Set([0, 4, 7, 10, 3]), // R, M3, P5, m7, #9
  "11": new Set([0, 4, 7, 10, 2, 5]), // R, M3, P5, m7, M9, P11
  "#11": new Set([0, 4, 7, 10, 6]), // R, M3, P5, m7, #11
  add11: new Set([0, 4, 7, 5]), // R, M3, P5, P11
  "add#11": new Set([0, 4, 7, 6]), // R, M3, P5, #11
  m11: new Set([0, 3, 7, 10, 2, 5]), // R, m3, P5, m7, M9, P11
  "13": new Set([0, 4, 7, 10, 2, 9]), // R, M3, P5, m7, M9, M13
  b13: new Set([0, 4, 7, 10, 8]), // R, M3, P5, m7, b13
  maj13: new Set([0, 4, 7, 11, 2, 9]), // R, M3, P5, M7, M9, M13
  m13: new Set([0, 3, 7, 10, 2, 9]), // R, m3, P5, m7, M9, M13
  "6/9": new Set([0, 4, 7, 9, 2]), // R, M3, P5, M6, M9
  "m6/9": new Set([0, 3, 7, 9, 2]), // R, m3, P5, M6, M9
};

interface ActiveOverlaySemitoneParams {
  rootNote: string;
  showScale: boolean;
  scaleType: ScaleType;
  showCaged: boolean;
  showChord: boolean;
  chordDisplayMode: ChordDisplayMode;
  diatonicScaleType: string;
  diatonicDegree: string;
  chordType: ChordType;
}

export function getActiveOverlaySemitones({
  rootNote,
  showScale,
  scaleType,
  showCaged,
  showChord,
  chordDisplayMode,
  diatonicScaleType,
  diatonicDegree,
  chordType,
}: ActiveOverlaySemitoneParams): Set<number> {
  const active = new Set<number>();
  const keyRootIndex = getRootIndex(rootNote);

  if (showScale) {
    for (const semitone of SCALE_DEGREES[scaleType] ?? []) active.add(semitone);
  }

  if (showCaged) {
    for (const semitone of CHORD_SEMITONES.Major) active.add(semitone);
  }

  if (showChord) {
    let semitones: Set<number> | undefined;
    if (chordDisplayMode === "diatonic") {
      semitones = getDiatonicChordSemitones(keyRootIndex, diatonicScaleType, diatonicDegree);
    } else {
      semitones = CHORD_SEMITONES[chordType];
    }

    for (const semitone of semitones ?? []) active.add(semitone);
  }

  return active;
}

export function isInBluesScale(semitone: number): boolean {
  return BLUES_SCALE_DEGREES.has(semitone);
}

// ===== CAGEDシステム =====
// 各フォームをオープンコードの形から定義
// anchorString: ルート音を探す基準弦（0=6弦, 1=5弦, 2=4弦）
// positions: ルート位置からの相対フレットオフセット + 度数ラベル
//   degree: 'R'=ルート, '3'=長3度, '5'=完全5度
const CAGED_COLOR = "#6366f1";

interface CagedFormPosition {
  string: number;
  fretOffset: number;
  degree: string;
}

interface CagedForm {
  label: string;
  color: string;
  anchorString: number;
  positions: CagedFormPosition[];
}

export interface CagedPositionValue {
  color: string;
  degree: string;
}

export const CAGED_FORMS: Record<string, CagedForm> = {
  // オープンEコード形: 0-2-2-1-0-0
  E: {
    label: "E",
    color: CAGED_COLOR,
    anchorString: 0,
    positions: [
      { string: 0, fretOffset: 0, degree: "R" },
      { string: 1, fretOffset: 2, degree: "5" },
      { string: 2, fretOffset: 2, degree: "R" },
      { string: 3, fretOffset: 1, degree: "3" },
      { string: 4, fretOffset: 0, degree: "5" },
      { string: 5, fretOffset: 0, degree: "R" },
    ],
  },
  // オープンDコード形: x-x-0-2-3-2
  D: {
    label: "D",
    color: CAGED_COLOR,
    anchorString: 2,
    positions: [
      { string: 2, fretOffset: 0, degree: "R" },
      { string: 3, fretOffset: 2, degree: "5" },
      { string: 4, fretOffset: 3, degree: "R" },
      { string: 5, fretOffset: 2, degree: "3" },
    ],
  },
  // オープンCコード形: x-3-2-0-1-0
  C: {
    label: "C",
    color: CAGED_COLOR,
    anchorString: 1,
    positions: [
      { string: 1, fretOffset: 0, degree: "R" },
      { string: 2, fretOffset: -1, degree: "3" },
      { string: 3, fretOffset: -3, degree: "5" },
      { string: 4, fretOffset: -2, degree: "R" },
      { string: 5, fretOffset: -3, degree: "3" },
    ],
  },
  // オープンAコード形: x-0-2-2-2-0
  A: {
    label: "A",
    color: CAGED_COLOR,
    anchorString: 1,
    positions: [
      { string: 1, fretOffset: 0, degree: "R" },
      { string: 2, fretOffset: 2, degree: "5" },
      { string: 3, fretOffset: 2, degree: "R" },
      { string: 4, fretOffset: 2, degree: "3" },
      { string: 5, fretOffset: 0, degree: "5" },
    ],
  },
  // オープンGコード形: 3-2-0-0-0-3
  G: {
    label: "G",
    color: CAGED_COLOR,
    anchorString: 0,
    positions: [
      { string: 0, fretOffset: 0, degree: "R" },
      { string: 1, fretOffset: -1, degree: "3" },
      { string: 2, fretOffset: -3, degree: "5" },
      { string: 3, fretOffset: -3, degree: "R" },
      { string: 4, fretOffset: -3, degree: "3" },
      { string: 5, fretOffset: 0, degree: "R" },
    ],
  },
};

// CAGED表示順（ネック上で低フレット→高フレットの順）
export const CAGED_ORDER = ["C", "A", "G", "E", "D"] as const;

// コードレイヤーCAGEDモード用: フォームのセル一覧を返す
// コードレイヤーCAGEDモード用（CAGEDレイヤーとは独立）
const CHORD_CAGED_FORMS: Record<
  string,
  { anchorString: number; positions: { string: number; fretOffset: number }[] }
> = {
  E: {
    anchorString: 0,
    positions: [
      { string: 0, fretOffset: 0 },
      { string: 1, fretOffset: 2 },
      { string: 2, fretOffset: 2 },
      { string: 3, fretOffset: 1 },
      { string: 4, fretOffset: 0 },
      { string: 5, fretOffset: 0 },
    ],
  },
  D: {
    anchorString: 2,
    positions: [
      { string: 2, fretOffset: 0 },
      { string: 3, fretOffset: 2 },
      { string: 4, fretOffset: 3 },
      { string: 5, fretOffset: 2 },
    ],
  },
  C: {
    anchorString: 1,
    positions: [
      { string: 1, fretOffset: 0 },
      { string: 2, fretOffset: -1 },
      { string: 3, fretOffset: -3 },
      { string: 4, fretOffset: -2 },
      { string: 5, fretOffset: -3 },
    ],
  },
  A: {
    anchorString: 1,
    positions: [
      { string: 1, fretOffset: 0 },
      { string: 2, fretOffset: 2 },
      { string: 3, fretOffset: 2 },
      { string: 4, fretOffset: 2 },
      { string: 5, fretOffset: 0 },
    ],
  },
  G: {
    anchorString: 0,
    positions: [
      { string: 0, fretOffset: 0 },
      { string: 1, fretOffset: -1 },
      { string: 2, fretOffset: -3 },
      { string: 3, fretOffset: -3 },
      { string: 4, fretOffset: -3 },
      { string: 5, fretOffset: 0 },
    ],
  },
};

export const CHORD_CAGED_ORDER = ["C", "A", "G", "E", "D"] as const;

// マイナーCAGEDフォーム（メジャーの3度を半音下げ）
const CHORD_CAGED_MINOR_FORMS: Record<
  string,
  { anchorString: number; positions: { string: number; fretOffset: number }[] }
> = {
  E: {
    anchorString: 0,
    positions: [
      { string: 0, fretOffset: 0 },
      { string: 1, fretOffset: 2 },
      { string: 2, fretOffset: 2 },
      { string: 3, fretOffset: 0 },
      { string: 4, fretOffset: 0 },
      { string: 5, fretOffset: 0 },
    ],
  },
  D: {
    anchorString: 2,
    positions: [
      { string: 2, fretOffset: 0 },
      { string: 3, fretOffset: 2 },
      { string: 4, fretOffset: 3 },
      { string: 5, fretOffset: 1 },
    ],
  },
  C: {
    anchorString: 1,
    positions: [
      { string: 1, fretOffset: 0 },
      { string: 2, fretOffset: -2 },
      { string: 3, fretOffset: -3 },
      { string: 4, fretOffset: -2 },
      { string: 5, fretOffset: -4 },
    ],
  },
  A: {
    anchorString: 1,
    positions: [
      { string: 1, fretOffset: 0 },
      { string: 2, fretOffset: 2 },
      { string: 3, fretOffset: 2 },
      { string: 4, fretOffset: 1 },
      { string: 5, fretOffset: 0 },
    ],
  },
  G: {
    anchorString: 0,
    positions: [
      { string: 0, fretOffset: 0 },
      { string: 1, fretOffset: -2 },
      { string: 2, fretOffset: -3 },
      { string: 3, fretOffset: -3 },
      { string: 4, fretOffset: -4 },
      { string: 5, fretOffset: 0 },
    ],
  },
};

export function getCagedFormCells(
  formKey: string,
  rootIndex: number,
  chordType: "major" | "minor" = "major",
): FretCell[] {
  const forms = chordType === "minor" ? CHORD_CAGED_MINOR_FORMS : CHORD_CAGED_FORMS;
  const form = forms[formKey];
  if (!form) return [];
  for (let f = 0; f < FRET_COUNT; f++) {
    if (getNoteIndex(form.anchorString, f) !== rootIndex) continue;
    const cells = form.positions.map(({ string, fretOffset }) => ({
      string,
      fret: f + fretOffset,
    }));
    if (cells.every(({ fret }) => fret >= 0 && fret < FRET_COUNT)) return cells;
  }
  return [];
}

// ===== オンコード (slash chord) =====

export const ON_CHORD_LIST: string[] = [
  // C-based
  "C/D",
  "C/B♭",
  "C/B",
  "C/E",
  "C/G",
  "C/F",
  "C7/B♭",
  "Cm/E♭",
  "Cm6/D",
  "CM7/D",
  "C7/E",
  "Cm7/B♭",
  "CM7/B",
  // C♯-based
  "C♯m7/B",
  "C♯m7/E",
  "C♯m/A♯",
  "C♯mM7/C",
  "C♯mM7/B♯",
  "C♯m7/B",
  "C♯/F",
  // D-based
  "D/C",
  "D/A",
  "D/E",
  "D/G",
  "D/F♯",
  "Dadd9/A",
  "Dadd9/B",
  "Dadd9/C",
  "Dadd9/F♯",
  "Dsus4/C",
  "D7/F♯",
  "Dm7/C",
  "Dm7/G",
  "Dm/C",
  "Dm/B",
  "DM7/A",
  "Dm7/F♯",
  "Dm7/F",
  "D♭/E♭",
  "Dm/F",
  "D7/C",
  "Dm6/B",
  "DmM7/C♯",
  // D♯-based
  "D♯/D",
  "D♯M7/D",
  "D♯m7/B♭",
  // E-based
  "E/B",
  "E/F♯",
  "E/G♯",
  "E7sus4/B",
  "Em7/A",
  "Em7/B",
  "Em7/D",
  "EM7/D♯",
  "Em/B",
  "E7/G♯",
  "EmM7/D♯",
  "Edim7/A♯",
  "E/D",
  "E♭m7/A♭",
  "E7/B",
  "E♭/B♭",
  "Em/G",
  "EmM7/E♭",
  "Em6/C♯",
  "Em6/D♭",
  // F-based
  "F/A",
  "F/E♭",
  "F/G",
  "F/C",
  "F/E",
  "Fm7/A♭",
  "Fm7/D",
  "FM7/G",
  "Fm/C",
  "Fdim7/C",
  // F♯-based
  "F♯7/A♯",
  "F♯7/E",
  "F♯m7/B",
  "F♯m7/E",
  "F♯m/C♯",
  "F♯m/D♯",
  "F♯m7/C♯",
  "F♯m7/A",
  "F♯/C♯",
  "F♯7/B♭",
  // G-based
  "G/A",
  "G/B",
  "G/D",
  "G/F",
  "G/E",
  "G/F♯",
  "G6/F",
  "G6/F♯",
  "Gm/B♭",
  "Gadd9/F♯",
  "GM7/F♯",
  "G/C",
  "Gm/A",
  "Gm6/A",
  "Gm7/C",
  "G7/F",
  "Gsus4/C",
  "GM7/E",
  // G♭-based
  "G♭M7/A♭",
  "G♭/A♭",
  // G♯-based
  "G♯/B♭",
  "G♯m7/F♯",
  "G♯m7/G",
  "G♯m7/B",
  "G♯m7/D♯",
  "G♯7/D♯",
  // A♭-based
  "A♭/C",
  // A-based
  "A/B",
  "A/F♯",
  "A/E",
  "A/C♯",
  "A/G",
  "A/G♯",
  "A7/G",
  "A7/C♯",
  "AM7/E",
  "Am/C",
  "Am7/D",
  "Am7/G",
  "Am/G",
  "Am/F♯",
  "Am/B",
  "A7sus4/E",
  "A7/E",
  "Am/D",
  "Am/E",
  "Am7♭5/E♭",
  "A7/D♭",
  // B♭-based
  "B♭/C",
  "B♭/D",
  "B♭m/D♭",
  "B♭/A",
  // B-based
  "B/A",
  "B/D♯",
  "B/E",
  "Bm/A",
  "Bm/D",
  "Bm7/E",
  "Bm7/A",
  "Bm7♭5/F",
  "B7/A",
  "B7/F♯",
  "B7/E♭",
  "B7/D♯",
  "B/C♯",
];

function getNoteIndexByName(name: string): number {
  // Normalize: replace unicode sharp/flat with ASCII for matching
  const normalized = name.replace("♯", "#").replace("♭", "b");
  // Try direct match with sharp array
  const sharpIdx = NOTES_SHARP.indexOf(name as (typeof NOTES_SHARP)[number]);
  if (sharpIdx >= 0) return sharpIdx;
  // Try direct match with flat array
  const flatIdx = NOTES_FLAT.indexOf(name as (typeof NOTES_FLAT)[number]);
  if (flatIdx >= 0) return flatIdx;
  // Try converting ASCII sharp to unicode
  if (normalized.includes("#")) {
    const withSharp = normalized.replace("#", "♯");
    const idx = NOTES_SHARP.indexOf(withSharp as (typeof NOTES_SHARP)[number]);
    if (idx >= 0) return idx;
  }
  // Try converting ASCII flat to unicode
  if (normalized.length > 1 && normalized.includes("b")) {
    const withFlat = normalized.replace("b", "♭");
    const idx = NOTES_FLAT.indexOf(withFlat as (typeof NOTES_FLAT)[number]);
    if (idx >= 0) return idx;
  }
  return -1;
}

export function getOnChordListForRoot(rootNote: string): string[] {
  const rootIdx = getNoteIndexByName(rootNote);
  if (rootIdx === -1) return [];
  return ON_CHORD_LIST.filter((name) => {
    const parsed = parseOnChord(name);
    if (!parsed) return false;
    const chordRootIdx = getNoteIndexByName(parsed.chordRoot);
    return chordRootIdx === rootIdx;
  });
}

export function parseOnChord(
  name: string,
): { chordRoot: string; chordType: string; bassNote: string } | null {
  const slashIdx = name.indexOf("/");
  if (slashIdx === -1) return null;
  const upper = name.substring(0, slashIdx);
  const bassNote = name.substring(slashIdx + 1);

  // Extract root note (1 or 2 chars: C, C#, D♭, E♭, etc.)
  let rootEnd = 1;
  if (
    upper.length > 1 &&
    (upper[1] === "#" || upper[1] === "♯" || upper[1] === "b" || upper[1] === "♭")
  ) {
    rootEnd = 2;
  }
  const chordRoot = upper.substring(0, rootEnd);
  const chordSuffix = upper.substring(rootEnd);

  // Map suffix to ChordType
  let chordType = "Major";
  if (chordSuffix === "m") chordType = "Minor";
  else if (chordSuffix === "7") chordType = "7th";
  else if (chordSuffix === "M7") chordType = "maj7";
  else if (chordSuffix === "m7") chordType = "m7";
  else if (chordSuffix === "m7♭5" || chordSuffix === "m7b5") chordType = "m7(b5)";
  else if (chordSuffix === "dim7") chordType = "dim7";
  else if (chordSuffix === "mM7") chordType = "m(maj7)";
  else if (chordSuffix === "sus2") chordType = "sus2";
  else if (chordSuffix === "sus4") chordType = "sus4";
  else if (chordSuffix === "6") chordType = "6";
  else if (chordSuffix === "m6") chordType = "m6";
  else if (chordSuffix === "dim") chordType = "dim";
  else if (chordSuffix === "aug") chordType = "aug";
  else if (chordSuffix === "add9") chordType = "add9";
  else if (chordSuffix === "7sus4") chordType = "7th";
  else if (chordSuffix === "" || chordSuffix === "maj") chordType = "Major";

  return { chordRoot, chordType, bassNote };
}

function deduplicateCells(cells: FretCell[]): FretCell[] {
  const uniq = new Map<string, FretCell>();
  for (const c of cells) {
    const key = `${c.string}-${c.fret}`;
    if (!uniq.has(key)) uniq.set(key, c);
  }
  return [...uniq.values()];
}

// Returns a single voicing: open chord (or lowest barre) + bass note
export function getOnChordVoicings(onChordName: string): FretCell[][] {
  const parsed = parseOnChord(onChordName);
  if (!parsed) return [];

  const chordRootIdx = getNoteIndexByName(parsed.chordRoot);
  if (chordRootIdx === -1) return [];

  const bassIdx = getNoteIndexByName(parsed.bassNote);
  if (bassIdx === -1) return [];

  // 1. Try open chord form first
  let baseForm: FretCell[] | null = null;
  const openForm = getOpenChordForm(chordRootIdx, parsed.chordType as ChordType);
  if (openForm && openForm.length >= 2) {
    baseForm = openForm;
  }

  // 2. If no open form, use lowest-fret barre chord (across both root strings)
  if (!baseForm) {
    let bestFret = FRET_COUNT;
    for (const rootStringIdx of [0, 1]) {
      const fullForm = (rootStringIdx === 0 ? CHORD_FORMS_6TH : CHORD_FORMS_5TH)[
        parsed.chordType as ChordType
      ];
      if (!fullForm) continue;
      for (let f = 0; f < FRET_COUNT; f++) {
        if (getNoteIndex(rootStringIdx, f) !== chordRootIdx) continue;
        if (f >= bestFret) continue; // already have a lower one
        const cells: FretCell[] = [];
        for (const { string, fretOffset } of fullForm) {
          const fret = f + fretOffset;
          if (fret >= 0 && fret < FRET_COUNT) cells.push({ string, fret });
        }
        if (cells.length >= 2) {
          baseForm = cells;
          bestFret = f;
        }
      }
    }
  }

  if (!baseForm) return [];

  // Find best bass note across all strings at or below the chord form
  const frettedInForm = baseForm.map((c) => c.fret).filter((f) => f > 0);
  const formCenter =
    frettedInForm.length > 0 ? frettedInForm.reduce((a, b) => a + b, 0) / frettedInForm.length : 0;
  const highestFormString = Math.max(...baseForm.map((c) => c.string));

  // Collect all valid bass candidates across all strings
  const allBassCandidates: { string: number; fret: number; score: number }[] = [];
  for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
    // Bass must be on a string lower than (or equal to) the highest chord string
    // and there must be at least 2 chord cells above it
    const upperCount = baseForm.filter((c) => c.string > stringIdx).length;
    if (upperCount < 2) continue;

    for (let f = 0; f < FRET_COUNT; f++) {
      if (getNoteIndex(stringIdx, f) !== bassIdx) continue;

      // Playability: fretted notes must be within 4 frets of each other
      const upperFretted = baseForm
        .filter((c) => c.string > stringIdx)
        .map((c) => c.fret)
        .filter((fr) => fr > 0);
      if (f > 0 && upperFretted.length > 0) {
        const allFretted = [...upperFretted, f];
        const span = Math.max(...allFretted) - Math.min(...allFretted);
        if (span > 4) continue;
      }

      // Score: prefer lower strings (bass should be low), then close to form, open bonus
      const distToForm = Math.abs(f - formCenter);
      const lowerStringBonus = (5 - stringIdx) * -3; // lower string = more negative = better
      const openBonus = f === 0 ? -5 : 0;
      const score = distToForm + lowerStringBonus + openBonus;
      allBassCandidates.push({ string: stringIdx, fret: f, score });
    }
  }

  if (allBassCandidates.length === 0) return [];

  // Pick best bass candidate
  allBassCandidates.sort((a, b) => a.score - b.score);
  const { string: bassStr, fret: bassFr } = allBassCandidates[0];
  const bestBass = { string: bassStr, fret: bassFr };

  if (!bestBass) return [];

  // Build voicing: bass + chord cells above bass string
  // If bass is on the same string as the chord's lowest note, replace it
  const upperCells = baseForm.filter((c) => c.string > bestBass!.string);
  if (upperCells.length < 1) return [];

  const voicing = deduplicateCells([bestBass, ...upperCells]);
  return [voicing];
}

// Flat version for overlay dots
export function getOnChordCells(onChordName: string, _rootIndex: number): FretCell[] {
  const voicings = getOnChordVoicings(onChordName);
  const all: FretCell[] = [];
  for (const v of voicings) all.push(...v);
  return deduplicateCells(all);
}

// コードレイヤー用: コードフォームのセル一覧を返す（既存レイヤーとは独立）
export function getChordLayerCells(
  rootIndex: number,
  chordDisplayMode: ChordDisplayMode,
  chordType: ChordType,
  triadInversion: string,
  diatonicScaleType: string,
  diatonicDegree: string,
  onChordName: string = "C/E",
): FretCell[] {
  const dedupeCells = (input: FretCell[]): FretCell[] => {
    const uniq = new Map<string, FretCell>();
    for (const cell of input) {
      const key = `${cell.string}-${cell.fret}`;
      if (!uniq.has(key)) uniq.set(key, cell);
    }
    return [...uniq.values()];
  };

  if (chordDisplayMode === "on-chord") {
    return getOnChordCells(onChordName, rootIndex);
  }

  const effectiveDisplayMode = chordDisplayMode === "diatonic" ? "form" : chordDisplayMode;
  let effectiveRootIndex = rootIndex;
  let effectiveChordType = chordType;
  if (chordDisplayMode === "diatonic") {
    const chord = getDiatonicChord(rootIndex, diatonicScaleType, diatonicDegree);
    effectiveRootIndex = chord.rootIndex;
    effectiveChordType = chord.chordType;
  }

  if (chordDisplayMode === "triad") {
    const cells: FretCell[] = [];
    for (const opt of TRIAD_STRING_SET_OPTIONS) {
      const layoutValue = `${opt.value}-${triadInversion}`;
      cells.push(...buildTriadVoicing(rootIndex, chordType, layoutValue));
    }
    return dedupeCells(cells);
  }

  const cells: FretCell[] = [];
  for (const rootStringIdx of [0, 1]) {
    const fullForm = (rootStringIdx === 0 ? CHORD_FORMS_6TH : CHORD_FORMS_5TH)[effectiveChordType];
    if (!fullForm) continue;
    let rootFret = -1;
    for (let f = 0; f < FRET_COUNT; f++) {
      if (getNoteIndex(rootStringIdx, f) === effectiveRootIndex) {
        rootFret = f;
        break;
      }
    }
    if (rootFret === -1) continue;
    for (const { string, fretOffset } of fullForm) {
      const fret = rootFret + fretOffset;
      if (fret >= 0 && fret < FRET_COUNT) cells.push({ string, fret });
    }
  }

  // Open chord form
  if (effectiveDisplayMode === "form") {
    const openForm = getOpenChordForm(effectiveRootIndex, effectiveChordType);
    if (openForm) {
      const existingKeys = new Set(cells.map((c) => `${c.string}-${c.fret}`));
      const isOverlap = openForm.every((c) => existingKeys.has(`${c.string}-${c.fret}`));
      if (!isOverlap) cells.push(...openForm);
    }
  }

  return dedupeCells(cells);
}

// 指定フォームの表示セルを返す: Map<"string-fret", { color, degree }>
export function calcCagedPositions(
  formKey: string,
  rootIndex: number,
): Map<string, CagedPositionValue> {
  const form = CAGED_FORMS[formKey];
  if (!form) return new Map();

  const map = new Map<string, CagedPositionValue>();

  // anchor弦でルートが出現するフレットを全探索
  for (let f = 0; f < FRET_COUNT; f++) {
    if (getNoteIndex(form.anchorString, f) !== rootIndex) continue;

    // このルートフレットを基準にフォームの全ポジションを展開
    for (const { string, fretOffset, degree } of form.positions) {
      const fret = f + fretOffset;
      if (fret < 0 || fret >= FRET_COUNT) continue;
      const key = `${string}-${fret}`;
      // すでに登録済みなら上書きしない（Rを優先）
      if (!map.has(key) || degree === "R") {
        map.set(key, { color: form.color, degree });
      }
    }
  }

  return map;
}

// ===== Progression Layer =====

export interface ProgressionTemplate {
  id: string;
  name: string;
  degrees: string[];
}

/**
 * ダイアトニック度数の内部値 → 表示ラベル変換。
 * chordSize を渡すと 4和音ラベル（maj7, m7, V7 等）になる。
 */
export function diatonicDegreeLabel(
  degree: string,
  context?: { chordSize?: "triad" | "seventh"; keyType?: "major" | "minor" },
): string {
  const size = context?.chordSize ?? "triad";
  const key = context?.keyType ?? (degree === degree.toLowerCase() ? "minor" : "major");
  const scaleKey = `${key === "minor" ? "natural-minor" : "major"}-${size}`;

  const MAPS: Record<string, Record<string, string>> = {
    "major-triad": {
      I: "I",
      ii: "IIm",
      iii: "IIIm",
      IV: "IV",
      V: "V",
      vi: "VIm",
      vii: "VIIm(-5)",
    },
    "major-seventh": {
      I: "Imaj7",
      ii: "IIm7",
      iii: "IIIm7",
      IV: "IVmaj7",
      V: "V7",
      vi: "VIm7",
      vii: "VIIm7(-5)",
    },
    "natural-minor-triad": {
      i: "Im",
      ii: "IIm(-5)",
      III: "♭III",
      iv: "IVm",
      v: "Vm",
      VI: "♭VI",
      VII: "♭VII",
    },
    "natural-minor-seventh": {
      i: "Im7",
      ii: "IIm7(-5)",
      III: "♭IIImaj7",
      iv: "IVm7",
      v: "Vm7",
      VI: "♭VImaj7",
      VII: "♭VII7",
    },
  };
  return MAPS[scaleKey]?.[degree] ?? degree;
}

/**
 * ProgressionTemplate の表示名を返す。
 * - ビルトイン: 度数から自動生成（例: ["ii","V","I"] → "IIm-V-I"）
 * - "blues" のみ例外で name をそのまま使用
 * - "tpl-" 始まりのカスタムテンプレートは name をそのまま使用
 */
export function templateDisplayName(template: ProgressionTemplate): string {
  if (template.id.startsWith("tpl-") || template.id === "blues") return template.name;
  return template.degrees.map((d) => diatonicDegreeLabel(d)).join("-");
}

export const PROGRESSION_TEMPLATES: ProgressionTemplate[] = [
  { id: "145", name: "I-IV-V", degrees: ["I", "IV", "V"] },
  { id: "251", name: "ii-V-I", degrees: ["ii", "V", "I"] },
  { id: "1625", name: "I-vi-ii-V", degrees: ["I", "vi", "ii", "V"] },
  { id: "pop", name: "I-V-vi-IV", degrees: ["I", "V", "vi", "IV"] },
  { id: "andalusian", name: "i-VII-VI-VII", degrees: ["i", "VII", "VI", "VII"] },
  {
    id: "blues",
    name: "12bar blues",
    degrees: ["I", "IV", "I", "I", "IV", "IV", "I", "I", "V", "IV", "I", "V"],
  },
];

/**
 * Resolves a progression degree string (e.g. "ii", "V", "I") to an absolute
 * rootIndex and chordType, given a key root and key type.
 *
 * - Uses DIATONIC_CHORDS for standard lookup.
 * - Special-cases "V" in minor context as the harmonic-minor dominant chord.
 * - Falls back to case-insensitive match, then to root Major.
 */
export function resolveProgressionDegree(
  keyRootIndex: number,
  keyType: "major" | "minor",
  chordSize: "triad" | "seventh",
  degree: string,
): { rootIndex: number; chordType: ChordType } {
  const scaleKey = `${keyType === "minor" ? "natural-minor" : "major"}-${chordSize}`;
  const progression = DIATONIC_CHORDS[scaleKey] ?? DIATONIC_CHORDS["major-triad"];
  const found = progression.find((item) => item.value === degree);
  if (found) {
    return {
      rootIndex: (keyRootIndex + found.offset) % 12,
      chordType: found.chordType,
    };
  }
  // "V" in minor → harmonic-minor dominant (offset 7, dominant 7th / major triad)
  if (degree === "V" && keyType === "minor") {
    return {
      rootIndex: (keyRootIndex + 7) % 12,
      chordType: chordSize === "seventh" ? "7th" : "Major",
    };
  }
  // Case-insensitive fallback (e.g. "iv" matches "IV")
  const fallback = progression.find((item) => item.value.toLowerCase() === degree.toLowerCase());
  if (fallback) {
    return {
      rootIndex: (keyRootIndex + fallback.offset) % 12,
      chordType: fallback.chordType,
    };
  }
  return { rootIndex: keyRootIndex, chordType: "Major" };
}

export const CHORD_SUFFIX_MAP: Record<ChordType, string> = {
  Major: "",
  Minor: "m",
  "5": "5",
  "7th": "7",
  maj7: "maj7",
  m7: "m7",
  "m7(b5)": "m7(b5)",
  dim7: "dim7",
  "m(maj7)": "m(maj7)",
  sus2: "sus2",
  sus4: "sus4",
  "6": "6",
  m6: "m6",
  dim: "dim",
  aug: "aug",
  "9": "9",
  b9: "7(b9)",
  "#9": "7(#9)",
  maj9: "maj9",
  m9: "m9",
  add9: "add9",
  "7(b9)": "7(b9)",
  "7(#9)": "7(#9)",
  "11": "11",
  "#11": "7(#11)",
  add11: "add11",
  "add#11": "add(#11)",
  m11: "m11",
  "13": "13",
  b13: "7(b13)",
  maj13: "maj13",
  m13: "m13",
  "6/9": "6/9",
  "m6/9": "m6/9",
};

export function chordSuffix(chordType: ChordType): string {
  return CHORD_SUFFIX_MAP[chordType] ?? chordType;
}
