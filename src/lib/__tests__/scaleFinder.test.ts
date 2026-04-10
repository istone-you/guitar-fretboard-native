import { identifyScales, scaleI18nKey } from "../scaleFinder";

describe("scaleI18nKey", () => {
  it("converts kebab-case to camelCase", () => {
    expect(scaleI18nKey("natural-minor")).toBe("naturalMinor");
    expect(scaleI18nKey("phrygian-dominant")).toBe("phrygianDominant");
    expect(scaleI18nKey("whole-tone")).toBe("wholeTone");
    expect(scaleI18nKey("major")).toBe("major");
  });
});

describe("identifyScales", () => {
  it("returns empty result when no notes selected", () => {
    const result = identifyScales(new Set(), "sharp", "C");
    expect(result.exact).toHaveLength(0);
    expect(result.containing).toHaveLength(0);
    expect(result.contained).toHaveLength(0);
  });

  it("exact match: C major scale notes → C major", () => {
    const notes = new Set(["C", "D", "E", "F", "G", "A", "B"]);
    const result = identifyScales(notes, "sharp", "C");
    const exactTypes = result.exact.map((m) => m.scaleType);
    expect(exactTypes).toContain("major");
    // ionian is skipped (alias of major)
    expect(exactTypes).not.toContain("ionian");
  });

  it("exact match: C natural minor scale notes → C natural-minor", () => {
    const notes = new Set(["C", "D", "D♯", "F", "G", "G♯", "A♯"]);
    const result = identifyScales(notes, "sharp", "C");
    const exactTypes = result.exact.map((m) => m.scaleType);
    expect(exactTypes).toContain("natural-minor");
    // aeolian is skipped (alias of natural-minor)
    expect(exactTypes).not.toContain("aeolian");
  });

  it("containing: C, E, G are contained in C major scale", () => {
    const notes = new Set(["C", "E", "G"]);
    const result = identifyScales(notes, "sharp", "C");
    const containingTypes = result.containing.map((m) => m.scaleType);
    expect(containingTypes).toContain("major");
  });

  it("containing: sorted by note count ascending", () => {
    const notes = new Set(["C", "E"]);
    const result = identifyScales(notes, "sharp", "C");
    for (let i = 1; i < result.containing.length; i++) {
      expect(result.containing[i].noteCount).toBeGreaterThanOrEqual(
        result.containing[i - 1].noteCount,
      );
    }
  });

  it("contained: major scale notes include minor pentatonic subset", () => {
    // Select all 7 notes of C major — C minor penta (C, Eb, F, G, Bb) is NOT a subset of C major
    // But C major penta (C, D, E, G, A) IS a subset of C major
    const notes = new Set(["C", "D", "E", "F", "G", "A", "B"]);
    const result = identifyScales(notes, "sharp", "C");
    const containedTypes = result.contained.map((m) => m.scaleType);
    expect(containedTypes).toContain("major-penta");
  });

  it("contained: sorted by note count descending", () => {
    const notes = new Set(["C", "D", "E", "F", "G", "A", "B"]);
    const result = identifyScales(notes, "sharp", "C");
    for (let i = 1; i < result.contained.length; i++) {
      expect(result.contained[i].noteCount).toBeLessThanOrEqual(result.contained[i - 1].noteCount);
    }
  });

  it("match includes root and scaleNotes", () => {
    const notes = new Set(["C", "D", "E", "F", "G", "A", "B"]);
    const result = identifyScales(notes, "sharp", "C");
    const major = result.exact.find((m) => m.scaleType === "major");
    expect(major).toBeDefined();
    expect(major!.root).toBe("C");
    expect(major!.scaleNotes).toContain("C");
    expect(major!.scaleNotes).toContain("G");
  });

  it("works with flat accidental", () => {
    // B♭ major: B♭, C, D, E♭, F, G, A
    const notes = new Set(["B♭", "C", "D", "E♭", "F", "G", "A"]);
    const result = identifyScales(notes, "flat", "B♭");
    const exactTypes = result.exact.map((m) => m.scaleType);
    expect(exactTypes).toContain("major");
  });

  it("respects root note for scale identification", () => {
    // C, D, E, F, G, A, B from root G — not a G major match (G major needs F#)
    const notes = new Set(["C", "D", "E", "F", "G", "A", "B"]);
    const result = identifyScales(notes, "sharp", "G");
    const exactTypes = result.exact.map((m) => m.scaleType);
    expect(exactTypes).not.toContain("major");
  });
});
