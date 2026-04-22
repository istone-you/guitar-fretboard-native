import {
  getPivotChords,
  getRelatedKeys,
  getModeFamily,
  getDiatonicChordList,
} from "../harmonyUtils";

describe("getDiatonicChordList", () => {
  it("C major returns 7 chords starting from C", () => {
    const chords = getDiatonicChordList(0, "major");
    expect(chords).toHaveLength(7);
    expect(chords[0]).toMatchObject({ rootIndex: 0, chordType: "Major", degree: "I" });
    expect(chords[1]).toMatchObject({ rootIndex: 2, chordType: "Minor", degree: "ii" });
    expect(chords[6]).toMatchObject({ rootIndex: 11, chordType: "dim", degree: "vii" });
  });

  it("A minor returns 7 chords starting from A", () => {
    const chords = getDiatonicChordList(9, "minor");
    expect(chords).toHaveLength(7);
    expect(chords[0]).toMatchObject({ rootIndex: 9, chordType: "Minor", degree: "i" });
    expect(chords[2]).toMatchObject({ rootIndex: 0, chordType: "Major", degree: "III" });
  });
});

describe("getPivotChords", () => {
  it("C major and G major share 4 pivot chords", () => {
    const pivots = getPivotChords(0, "major", 7, "major");
    const rootChordPairs = pivots.map((p) => `${p.rootIndex}:${p.chordType}`).sort();
    expect(rootChordPairs).toEqual(["0:Major", "4:Minor", "7:Major", "9:Minor"].sort());
  });

  it("includes degree labels for each key", () => {
    const pivots = getPivotChords(0, "major", 7, "major");
    const cMajorPivot = pivots.find((p) => p.rootIndex === 0 && p.chordType === "Major");
    expect(cMajorPivot?.degreeLabelInA).toBe("I");
    expect(cMajorPivot?.degreeLabelInB).toBe("IV");
  });

  it("same key returns all 7 diatonic chords", () => {
    const pivots = getPivotChords(0, "major", 0, "major");
    expect(pivots).toHaveLength(7);
  });

  it("C major and A minor share pivot chords", () => {
    const pivots = getPivotChords(0, "major", 9, "minor");
    expect(pivots.length).toBeGreaterThan(0);
  });
});

describe("getRelatedKeys", () => {
  it("C major returns 4 related keys", () => {
    const related = getRelatedKeys(0, "major");
    expect(related).toHaveLength(4);
  });

  it("C major relative minor is A minor", () => {
    const related = getRelatedKeys(0, "major");
    const relative = related.find((r) => r.relation === "relative");
    expect(relative).toMatchObject({ rootIndex: 9, keyType: "minor" });
  });

  it("C major parallel minor is C minor", () => {
    const related = getRelatedKeys(0, "major");
    const parallel = related.find((r) => r.relation === "parallel");
    expect(parallel).toMatchObject({ rootIndex: 0, keyType: "minor" });
  });

  it("C major dominant key is G major", () => {
    const related = getRelatedKeys(0, "major");
    const dominant = related.find((r) => r.relation === "dominant");
    expect(dominant).toMatchObject({ rootIndex: 7, keyType: "major" });
  });

  it("C major subdominant key is F major", () => {
    const related = getRelatedKeys(0, "major");
    const subdominant = related.find((r) => r.relation === "subdominant");
    expect(subdominant).toMatchObject({ rootIndex: 5, keyType: "major" });
  });

  it("A minor relative major is C major", () => {
    const related = getRelatedKeys(9, "minor");
    const relative = related.find((r) => r.relation === "relative");
    expect(relative).toMatchObject({ rootIndex: 0, keyType: "major" });
  });
});

describe("getModeFamily", () => {
  it("D Dorian has parent C (index 0)", () => {
    const { parentRootIndex } = getModeFamily("dorian", 2);
    expect(parentRootIndex).toBe(0);
  });

  it("D Dorian family has 7 modes", () => {
    const { modes } = getModeFamily("dorian", 2);
    expect(modes).toHaveLength(7);
  });

  it("D Dorian marks dorian as current", () => {
    const { modes } = getModeFamily("dorian", 2);
    const current = modes.find((m) => m.isCurrent);
    expect(current?.scaleType).toBe("dorian");
    expect(current?.rootIndex).toBe(2);
  });

  it("D Dorian family starts with C Ionian", () => {
    const { modes } = getModeFamily("dorian", 2);
    expect(modes[0]).toMatchObject({ scaleType: "ionian", rootIndex: 0 });
  });

  it("C Ionian has parent C", () => {
    const { parentRootIndex } = getModeFamily("ionian", 0);
    expect(parentRootIndex).toBe(0);
  });

  it("B Locrian has parent C major", () => {
    const { parentRootIndex } = getModeFamily("locrian", 11);
    expect(parentRootIndex).toBe(0);
  });
});
