import {
  getPivotChords,
  getRelatedKeys,
  getModeFamily,
  getDiatonicChordList,
  analyzeProgression,
  getCompatibleScales,
  getTensionsAndAvoids,
  getModalInterchangeChords,
  getChordsFromScale,
  getChordSuggestions,
  getDominantMotionPatterns,
} from "../harmonyUtils";

describe("getDiatonicChordList", () => {
  it("C major returns 7 chords starting from C", () => {
    const chords = getDiatonicChordList(0, "major");
    expect(chords).toHaveLength(7);
    expect(chords[0]).toMatchObject({ rootIndex: 0, chordType: "Major", degree: "I" });
    expect(chords[1]).toMatchObject({ rootIndex: 2, chordType: "Minor", degree: "II" });
    expect(chords[6]).toMatchObject({ rootIndex: 11, chordType: "dim", degree: "VII" });
  });

  it("A minor returns 7 chords starting from A", () => {
    const chords = getDiatonicChordList(9, "minor");
    expect(chords).toHaveLength(7);
    expect(chords[0]).toMatchObject({ rootIndex: 9, chordType: "Minor", degree: "I" });
    expect(chords[2]).toMatchObject({ rootIndex: 0, chordType: "Major", degree: "bIII" });
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

describe("getModalInterchangeChords", () => {
  it("C major returns 5 borrowed chords", () => {
    const chords = getModalInterchangeChords(0, "major");
    expect(chords).toHaveLength(5);
  });

  it("C major bVII is Bb major borrowed from Mixolydian", () => {
    const chords = getModalInterchangeChords(0, "major");
    const bVII = chords.find((c) => c.degreeLabel === "♭VII");
    expect(bVII).toBeDefined();
    expect(bVII?.rootIndex).toBe(10);
    expect(bVII?.chordType).toBe("Major");
    expect(bVII?.sourceMode).toBe("Mixolydian");
  });

  it("C major IIm(-5) is Ddim borrowed from Aeolian", () => {
    const chords = getModalInterchangeChords(0, "major");
    const dim = chords.find((c) => c.degreeLabel === "IIm(-5)");
    expect(dim).toBeDefined();
    expect(dim?.chordType).toBe("dim");
    expect(dim?.sourceMode).toBe("Aeolian");
  });

  it("A minor returns 5 borrowed chords", () => {
    const chords = getModalInterchangeChords(9, "minor");
    expect(chords).toHaveLength(5);
  });

  it("A minor V is E major borrowed from Ionian", () => {
    const chords = getModalInterchangeChords(9, "minor");
    const V = chords.find((c) => c.degreeLabel === "V");
    expect(V).toBeDefined();
    expect(V?.rootIndex).toBe(4);
    expect(V?.chordType).toBe("Major");
    expect(V?.sourceMode).toBe("Ionian");
  });
});

describe("getChordsFromScale", () => {
  it("C major scale produces 7 triads", () => {
    const chords = getChordsFromScale(0, "major");
    expect(chords).toHaveLength(7);
  });

  it("C major I degree is C Major triad", () => {
    const chords = getChordsFromScale(0, "major");
    const I = chords.find((c) => c.degreeOffset === 0);
    expect(I).toBeDefined();
    expect(I?.chordType).toBe("Major");
    expect(I?.degreeLabel).toBe("I");
  });

  it("C major VII degree is B dim triad", () => {
    const chords = getChordsFromScale(0, "major");
    const VII = chords.find((c) => c.degreeOffset === 11);
    expect(VII).toBeDefined();
    expect(VII?.chordType).toBe("dim");
    expect(VII?.degreeLabel).toBe("VIIm(-5)");
  });

  it("C major scale with seventh chord size returns 7th chords", () => {
    const chords = getChordsFromScale(0, "major", "seventh");
    expect(chords).toHaveLength(7);
    const I = chords.find((c) => c.degreeOffset === 0);
    expect(I?.chordType).toBe("maj7");
  });

  it("C natural minor scale produces 7 triads", () => {
    const chords = getChordsFromScale(0, "natural-minor");
    expect(chords).toHaveLength(7);
  });
});

describe("getChordSuggestions", () => {
  it("C Major returns entries in all 8 categories", () => {
    const suggestions = getChordSuggestions(0, "Major");
    const categories = new Set(suggestions.map((s) => s.category));
    expect(categories.has("diatonic")).toBe(true);
    expect(categories.has("two-five-entry")).toBe(true);
    expect(categories.has("secondary-dominant")).toBe(true);
    expect(categories.has("tritone-sub")).toBe(true);
    expect(categories.has("cadence")).toBe(true);
    expect(categories.has("backdoor")).toBe(true);
    expect(categories.has("passing")).toBe(true);
    expect(categories.has("borrowed")).toBe(true);
  });

  it("G7 tritone sub is D♭7 (rootIndex 1)", () => {
    // G7: rootIndex=7, inferred key=C major (V7 → key 5th above = C)
    const suggestions = getChordSuggestions(7, "7th");
    const tritoneSubs = suggestions.filter((s) => s.category === "tritone-sub");
    expect(tritoneSubs.length).toBeGreaterThan(0);
    // tritone sub of V7(G) = Db7 → rootIndex 1
    const vtritoneSub = tritoneSubs.find((s) => s.rootIndex === 1 && s.chordType === "7th");
    expect(vtritoneSub).toBeDefined();
  });

  it("C Major diatonic suggestions exclude self", () => {
    const suggestions = getChordSuggestions(0, "Major");
    const diatonic = suggestions.filter((s) => s.category === "diatonic");
    const hasSelf = diatonic.some((s) => s.rootIndex === 0 && s.chordType === "Major");
    expect(hasSelf).toBe(false);
  });

  it("C Major has secondary dominant A7 (rootIndex 9) for ii", () => {
    const suggestions = getChordSuggestions(0, "Major");
    const secDom = suggestions.filter((s) => s.category === "secondary-dominant");
    const a7 = secDom.find((s) => s.rootIndex === 9 && s.chordType === "7th");
    expect(a7).toBeDefined();
  });

  it("A Minor returns borrowed chords", () => {
    const suggestions = getChordSuggestions(9, "Minor");
    const borrowed = suggestions.filter((s) => s.category === "borrowed");
    expect(borrowed.length).toBeGreaterThan(0);
  });
});

describe("getDominantMotionPatterns", () => {
  it("C major returns all 7 pattern types", () => {
    const patterns = getDominantMotionPatterns(0, "major");
    const types = new Set(patterns.map((p) => p.type));
    expect(types.has("basic-V-I")).toBe(true);
    expect(types.has("two-five-one")).toBe(true);
    expect(types.has("secondary-dominant")).toBe(true);
    expect(types.has("tritone-sub")).toBe(true);
    expect(types.has("backdoor")).toBe(true);
    expect(types.has("dominant-chain")).toBe(true);
    expect(types.has("dim-resolution")).toBe(true);
  });

  it("C major basic-V-I has G7 → C", () => {
    const patterns = getDominantMotionPatterns(0, "major");
    const basicVI = patterns.find((p) => p.type === "basic-V-I");
    expect(basicVI).toBeDefined();
    expect(basicVI?.chords[0].rootIndex).toBe(7); // G
    expect(basicVI?.chords[0].chordType).toBe("7th");
    expect(basicVI?.chords[1].rootIndex).toBe(0); // C
    expect(basicVI?.chords[1].chordType).toBe("Major");
  });

  it("C major tritone-sub has Db7 (rootIndex 1) → C", () => {
    const patterns = getDominantMotionPatterns(0, "major");
    const tritoneSub = patterns.find((p) => p.type === "tritone-sub");
    expect(tritoneSub?.chords[0].rootIndex).toBe(1); // Db
    expect(tritoneSub?.chords[1].rootIndex).toBe(0); // C
  });

  it("C major backdoor has Bb7 (rootIndex 10) → C", () => {
    const patterns = getDominantMotionPatterns(0, "major");
    const backdoor = patterns.find((p) => p.type === "backdoor");
    expect(backdoor?.chords[0].rootIndex).toBe(10); // Bb
    expect(backdoor?.chords[1].rootIndex).toBe(0); // C
  });

  it("basic-V-I voice leading includes 3rd and 7th movements", () => {
    const patterns = getDominantMotionPatterns(0, "major");
    const basicVI = patterns.find((p) => p.type === "basic-V-I")!;
    expect(basicVI.voiceLeading.length).toBeGreaterThan(0);
    const roles = basicVI.voiceLeading.map((vl) => vl.role);
    expect(roles).toContain("third");
    expect(roles).toContain("seventh");
  });

  it("A minor basic-V-I has E7 → Am", () => {
    const patterns = getDominantMotionPatterns(9, "minor");
    const basicVI = patterns.find((p) => p.type === "basic-V-I");
    expect(basicVI?.chords[0].rootIndex).toBe(4); // E
    expect(basicVI?.chords[1].rootIndex).toBe(9); // A
    expect(basicVI?.chords[1].chordType).toBe("Minor");
  });
});
