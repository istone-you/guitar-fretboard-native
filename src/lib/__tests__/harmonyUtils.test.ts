import {
  getPivotChords,
  getRelatedKeys,
  getModeFamily,
  getDiatonicChordList,
  analyzeProgression,
  getCompatibleScales,
  getTensionsAndAvoids,
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

describe("analyzeProgression", () => {
  it("returns empty array for empty input", () => {
    expect(analyzeProgression([])).toHaveLength(0);
  });

  it("returns up to 5 results sorted by score descending", () => {
    const chords = [
      { rootIndex: 0, chordType: "Major" as const },
      { rootIndex: 7, chordType: "Major" as const },
      { rootIndex: 5, chordType: "Major" as const },
    ];
    const results = analyzeProgression(chords);
    expect(results.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("identifies C major key for I-IV-V progression", () => {
    // C=0, F=5, G=7 — I, IV, V of C major
    const chords = [
      { rootIndex: 0, chordType: "Major" as const },
      { rootIndex: 5, chordType: "Major" as const },
      { rootIndex: 7, chordType: "Major" as const },
    ];
    const results = analyzeProgression(chords);
    const top = results[0];
    expect(top.score).toBe(1);
    expect(top.rootIndex).toBe(0);
    expect(top.keyType).toBe("major");
  });

  it("marks non-diatonic chords with isDiatonic false", () => {
    // C Major + D♭ Major (out of key for C major)
    const chords = [
      { rootIndex: 0, chordType: "Major" as const },
      { rootIndex: 1, chordType: "Major" as const },
    ];
    const results = analyzeProgression(chords);
    const cMajorResult = results.find((r) => r.rootIndex === 0 && r.keyType === "major");
    expect(cMajorResult?.chords[1].isDiatonic).toBe(false);
    expect(cMajorResult?.chords[1].degree).toBeUndefined();
  });

  it("provides degree and fn for diatonic chords", () => {
    const chords = [{ rootIndex: 0, chordType: "Major" as const }];
    const results = analyzeProgression(chords);
    const cMajorResult = results.find((r) => r.rootIndex === 0 && r.keyType === "major");
    const analyzed = cMajorResult?.chords[0];
    expect(analyzed?.isDiatonic).toBe(true);
    expect(analyzed?.degree).toBe("I");
    expect(analyzed?.fn).toBe("T");
  });
});

describe("getCompatibleScales", () => {
  it("returns an array of scale types for a single chord", () => {
    const scales = getCompatibleScales([{ rootIndex: 0, chordType: "Major" }], 0);
    expect(Array.isArray(scales)).toBe(true);
    expect(scales.length).toBeGreaterThan(0);
  });

  it("C major chord is compatible with C major scale", () => {
    const scales = getCompatibleScales([{ rootIndex: 0, chordType: "Major" }], 0);
    expect(scales).toContain("major");
  });

  it("C major chord is compatible with C ionian", () => {
    const scales = getCompatibleScales([{ rootIndex: 0, chordType: "Major" }], 0);
    expect(scales).toContain("ionian");
  });

  it("Am7 (rootIndex=9) + Cmaj (rootIndex=0) both fit in C major scale", () => {
    const scales = getCompatibleScales(
      [
        { rootIndex: 9, chordType: "m7" },
        { rootIndex: 0, chordType: "Major" },
      ],
      0,
    );
    expect(scales).toContain("major");
  });

  it("returns empty array when chords array is empty", () => {
    const scales = getCompatibleScales([], 0);
    expect(scales).toHaveLength(0);
  });

  it("returns empty array when chords array is empty regardless of root", () => {
    expect(getCompatibleScales([], 5)).toHaveLength(0);
  });

  it("combining incompatible chords reduces compatible scales", () => {
    const single = getCompatibleScales([{ rootIndex: 0, chordType: "Major" }], 0);
    const combined = getCompatibleScales(
      [
        { rootIndex: 0, chordType: "Major" },
        { rootIndex: 6, chordType: "Major" },
      ],
      0,
    );
    expect(combined.length).toBeLessThanOrEqual(single.length);
  });
});

describe("getTensionsAndAvoids", () => {
  it("Dm7 in C major marks B as avoid note (tritone with b3)", () => {
    const result = getTensionsAndAvoids(0, "major", 2, "m7");
    expect(result.avoidNotes).toEqual(
      expect.arrayContaining([expect.objectContaining({ noteIndex: 11 })]),
    );
  });

  it("Dm7 in C major does not include B in tensions", () => {
    const result = getTensionsAndAvoids(0, "major", 2, "m7");
    expect(result.tensions).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ noteIndex: 11 })]),
    );
  });

  it("FM7 in C major keeps avoid notes empty", () => {
    const result = getTensionsAndAvoids(0, "major", 5, "maj7");
    expect(result.avoidNotes).toHaveLength(0);
  });

  it("CM7 in C major has only F as avoid note", () => {
    const result = getTensionsAndAvoids(0, "major", 0, "maj7");
    expect(result.avoidNotes).toHaveLength(1);
    expect(result.avoidNotes[0]).toMatchObject({ noteIndex: 5 });
  });
});
