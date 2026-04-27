import {
  MAJOR_KEYS,
  MINOR_FLAT5_KEYS,
  MINOR_KEYS,
  KEY_SIGNATURES,
  getCircleAccidental,
  getDiatonicOverlayCells,
  getModalInterchangeCells,
  getRelatedKeyCells,
  getSecondaryDominantCells,
  keyRootSemitone,
  semitoneToCirclePosition,
} from "../circleData";

describe("circleData", () => {
  it("has 12 entries for major/minor/signature arrays", () => {
    expect(MAJOR_KEYS).toHaveLength(12);
    expect(MINOR_KEYS).toHaveLength(12);
    expect(MINOR_FLAT5_KEYS).toHaveLength(12);
    expect(KEY_SIGNATURES).toHaveLength(12);
  });

  it("uses sharp names for right half and flat names for left half", () => {
    expect(MAJOR_KEYS).toEqual([
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
    ]);
    expect(MINOR_KEYS[3]).toBe("F♯m");
    expect(MINOR_KEYS[7]).toBe("B♭m");
    expect(MINOR_KEYS[9]).toBe("Cm");
  });

  it("maps key signatures by index correctly", () => {
    expect(KEY_SIGNATURES[0]).toBe(0);
    expect(KEY_SIGNATURES[1]).toBe(1);
    expect(KEY_SIGNATURES[6]).toBe(6);
    expect(KEY_SIGNATURES[7]).toBe(-5);
    expect(KEY_SIGNATURES[11]).toBe(-1);
  });

  it("returns sharp accidental for right-half positions", () => {
    expect(getCircleAccidental(0)).toBe("sharp");
    expect(getCircleAccidental(5)).toBe("sharp");
    expect(getCircleAccidental(6)).toBe("sharp");
  });

  it("returns flat accidental for left-half positions", () => {
    expect(getCircleAccidental(7)).toBe("flat");
    expect(getCircleAccidental(9)).toBe("flat");
    expect(getCircleAccidental(11)).toBe("flat");
  });

  it("converts semitones to circle positions", () => {
    expect(semitoneToCirclePosition(0)).toBe(0); // C
    expect(semitoneToCirclePosition(7)).toBe(1); // G
    expect(semitoneToCirclePosition(2)).toBe(2); // D
    expect(semitoneToCirclePosition(5)).toBe(11); // F
    expect(semitoneToCirclePosition(11)).toBe(5); // B
  });

  it("computes key root semitone from selected index", () => {
    expect(keyRootSemitone(0, "major")).toBe(0); // C major
    expect(keyRootSemitone(1, "major")).toBe(7); // G major
    expect(keyRootSemitone(11, "major")).toBe(5); // F major
    expect(keyRootSemitone(0, "minor")).toBe(9); // A minor
    expect(keyRootSemitone(9, "minor")).toBe(0); // C minor (E♭ major position)
  });

  describe("getRelatedKeyCells", () => {
    it("returns C major's related keys", () => {
      const cells = getRelatedKeyCells(0, "major");
      expect(cells).toEqual([
        { ring: "major", position: 0, relation: "tonic" }, // C
        { ring: "major", position: 1, relation: "dominant" }, // G
        { ring: "major", position: 11, relation: "subdominant" }, // F
        { ring: "minor", position: 0, relation: "parallel" }, // Am
        { ring: "minor", position: 9, relation: "doushu" }, // Cm
      ]);
    });

    it("returns A minor's related keys", () => {
      const cells = getRelatedKeyCells(0, "minor");
      expect(cells).toEqual([
        { ring: "minor", position: 0, relation: "tonic" }, // Am
        { ring: "minor", position: 1, relation: "dominant" }, // Em
        { ring: "minor", position: 11, relation: "subdominant" }, // Dm
        { ring: "major", position: 0, relation: "parallel" }, // C
        { ring: "major", position: 3, relation: "doushu" }, // A major
      ]);
    });
  });

  describe("getDiatonicOverlayCells", () => {
    it("returns C major's 7 diatonic cells", () => {
      const cells = getDiatonicOverlayCells(0, "major");
      expect(cells).toEqual([
        { ring: "major", position: 0, fn: "T", degreeLabel: "I" }, // C
        { ring: "minor", position: 11, fn: "SD", degreeLabel: "IIm" }, // Dm
        { ring: "minor", position: 1, fn: "T", degreeLabel: "IIIm" }, // Em
        { ring: "major", position: 11, fn: "SD", degreeLabel: "IV" }, // F
        { ring: "major", position: 1, fn: "D", degreeLabel: "V" }, // G
        { ring: "minor", position: 0, fn: "T", degreeLabel: "VIm" }, // Am
        { ring: "flat5", position: 0, fn: "D", degreeLabel: "VIIm(-5)" }, // Bm(♭5)
      ]);
    });

    it("returns A minor's 7 diatonic cells (natural minor)", () => {
      const cells = getDiatonicOverlayCells(0, "minor");
      expect(cells).toEqual([
        { ring: "minor", position: 0, fn: "T", degreeLabel: "Im" }, // Am
        { ring: "flat5", position: 0, fn: "SD", degreeLabel: "IIm(-5)" }, // Bm(♭5)
        { ring: "major", position: 0, fn: "T", degreeLabel: "♭III" }, // C
        { ring: "minor", position: 11, fn: "SD", degreeLabel: "IVm" }, // Dm
        { ring: "minor", position: 1, fn: "D", degreeLabel: "Vm" }, // Em
        { ring: "major", position: 11, fn: "SD", degreeLabel: "♭VI" }, // F
        { ring: "major", position: 1, fn: "T", degreeLabel: "♭VII" }, // G
      ]);
    });
  });

  describe("getModalInterchangeCells", () => {
    it("returns C major's 5 borrowed chords from parallel minor", () => {
      const cells = getModalInterchangeCells(0, "major");
      expect(cells).toHaveLength(5);
      // IIm(-5) = Dm(♭5): root D(2), flat5 offset+1 → semitoneToCirclePosition(3)=9
      expect(cells.find((c) => c.degreeLabel === "IIm(-5)")).toEqual({
        ring: "flat5",
        position: 9,
        degreeLabel: "IIm(-5)",
      });
      // bIII = E♭: root Eb(3), major offset+0 → semitoneToCirclePosition(3)=9
      expect(cells.find((c) => c.degreeLabel === "♭III")).toEqual({
        ring: "major",
        position: 9,
        degreeLabel: "♭III",
      });
      // IVm = Fm: root F(5), minor offset+3 → semitoneToCirclePosition(8)=8
      expect(cells.find((c) => c.degreeLabel === "IVm")).toEqual({
        ring: "minor",
        position: 8,
        degreeLabel: "IVm",
      });
      // bVI = A♭: root Ab(8), major offset+0 → semitoneToCirclePosition(8)=8
      expect(cells.find((c) => c.degreeLabel === "♭VI")).toEqual({
        ring: "major",
        position: 8,
        degreeLabel: "♭VI",
      });
      // bVII = B♭: root Bb(10), major offset+0 → semitoneToCirclePosition(10)=10
      expect(cells.find((c) => c.degreeLabel === "♭VII")).toEqual({
        ring: "major",
        position: 10,
        degreeLabel: "♭VII",
      });
    });

    it("returns A minor's 5 borrowed chords from parallel major", () => {
      const cells = getModalInterchangeCells(0, "minor");
      expect(cells).toHaveLength(5);
      // V = E major: root E(4), major offset+0 → semitoneToCirclePosition(4)=4
      expect(cells.find((c) => c.degreeLabel === "V")).toEqual({
        ring: "major",
        position: 4,
        degreeLabel: "V",
      });
    });
  });

  describe("getSecondaryDominantCells", () => {
    it("maps C major's secondary dominants to circle positions", () => {
      const cells = getSecondaryDominantCells(0, "major");
      // V/I = G (pos 1)
      const vOfI = cells.find((c) => c.targetDegreeLabel === "I");
      expect(vOfI).toEqual({ targetDegreeLabel: "I", secDomPosition: 1 });
      // V/II = A (pos 3)
      const vOfIi = cells.find((c) => c.targetDegreeLabel === "II");
      expect(vOfIi).toEqual({ targetDegreeLabel: "II", secDomPosition: 3 });
      // V/V = D (pos 2)
      const vOfV = cells.find((c) => c.targetDegreeLabel === "V");
      expect(vOfV).toEqual({ targetDegreeLabel: "V", secDomPosition: 2 });
    });

    it("excludes diminished (VII°) target", () => {
      const cells = getSecondaryDominantCells(0, "major");
      expect(cells.find((c) => c.targetDegreeLabel === "VII")).toBeUndefined();
    });
  });
});
