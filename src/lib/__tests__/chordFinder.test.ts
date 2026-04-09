import { identifyChords } from "../chordFinder";

describe("identifyChords", () => {
  it("returns empty result for empty set", () => {
    const result = identifyChords(new Set(), "sharp", "C");
    expect(result.exact).toHaveLength(0);
    expect(result.partial).toHaveLength(0);
  });

  it("exact match: C major triad (C, E, G)", () => {
    const result = identifyChords(new Set(["C", "E", "G"]), "sharp", "C");
    const exactNames = result.exact.map((m) => m.chordName);
    expect(exactNames).toContain("C Major");
  });

  it("exact match: C minor triad (C, E♭, G) with flat accidental", () => {
    const result = identifyChords(new Set(["C", "E♭", "G"]), "flat", "C");
    const exactNames = result.exact.map((m) => m.chordName);
    expect(exactNames).toContain("C Minor");
  });

  it("partial match: C and E are subset of Major, min7, etc.", () => {
    const result = identifyChords(new Set(["C", "E"]), "sharp", "C");
    const partialNames = result.partial.map((m) => m.chordName);
    expect(partialNames).toContain("C Major");
  });

  it("no exact match when selected notes don't form a chord", () => {
    const result = identifyChords(new Set(["C", "D"]), "sharp", "C");
    expect(result.exact).toHaveLength(0);
  });

  it("exact matches are sorted by noteCount descending (richer first)", () => {
    // Add C dominant 7th notes — should appear before triad in exact list
    const result = identifyChords(new Set(["C", "E", "G", "A♯"]), "sharp", "C");
    expect(result.exact.length).toBeGreaterThan(0);
    for (let i = 1; i < result.exact.length; i++) {
      expect(result.exact[i - 1].noteCount).toBeGreaterThanOrEqual(result.exact[i].noteCount);
    }
  });

  it("partial matches are sorted by noteCount ascending (closest to completion first)", () => {
    const result = identifyChords(new Set(["C", "E"]), "sharp", "C");
    expect(result.partial.length).toBeGreaterThan(0);
    for (let i = 1; i < result.partial.length; i++) {
      expect(result.partial[i - 1].noteCount).toBeLessThanOrEqual(result.partial[i].noteCount);
    }
  });

  it("chordNotes contains note names in semitone order", () => {
    const result = identifyChords(new Set(["C", "E", "G"]), "sharp", "C");
    const major = result.exact.find((m) => m.chordName === "C Major");
    expect(major).toBeDefined();
    expect(major!.chordNotes).toEqual(["C", "E", "G"]);
  });

  it("chordDegrees contains degree names", () => {
    const result = identifyChords(new Set(["C", "E", "G"]), "sharp", "C");
    const major = result.exact.find((m) => m.chordName === "C Major");
    expect(major).toBeDefined();
    expect(major!.chordDegrees).toEqual(["P1", "M3", "P5"]);
  });

  it("root is not in exact when selected is superset of chord", () => {
    // C, E, G, D — D is not in Major chord
    const result = identifyChords(new Set(["C", "D", "E", "G"]), "sharp", "C");
    const exactNames = result.exact.map((m) => m.chordName);
    expect(exactNames).not.toContain("C Major");
  });

  it("skips duplicate chord types (dim, aug, b9, #9)", () => {
    const result = identifyChords(new Set(["C", "E", "G"]), "sharp", "C");
    const allNames = [...result.exact, ...result.partial].map((m) => m.chordType);
    expect(allNames).not.toContain("dim");
    expect(allNames).not.toContain("aug");
    expect(allNames).not.toContain("b9");
    expect(allNames).not.toContain("#9");
  });

  it("works with non-C root (G major: G, B, D)", () => {
    const result = identifyChords(new Set(["G", "B", "D"]), "sharp", "G");
    const exactNames = result.exact.map((m) => m.chordName);
    expect(exactNames).toContain("G Major");
  });

  it("flat accidental: B♭ major (B♭, D, F)", () => {
    const result = identifyChords(new Set(["B♭", "D", "F"]), "flat", "B♭");
    const exactNames = result.exact.map((m) => m.chordName);
    expect(exactNames).toContain("B♭ Major");
  });
});
