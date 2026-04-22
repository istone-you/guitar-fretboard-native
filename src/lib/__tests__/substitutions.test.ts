import { getSubstitutions, SUBSTITUTION_CHORD_TYPES } from "../substitutions";

describe("getSubstitutions", () => {
  describe("ダイアトニック代理 (diatonic)", () => {
    it("Major → VIm a minor 3rd up (C → Am, rootIndex 9)", () => {
      const results = getSubstitutions(0, "Major"); // C
      const vim = results.find((r) => r.type === "diatonic" && r.rootIndex === 9);
      expect(vim).toBeDefined();
      expect(vim!.chordType).toBe("Minor");
    });

    it("Major → IIIm a major 3rd up (C → Em, rootIndex 4)", () => {
      const results = getSubstitutions(0, "Major"); // C
      const iiim = results.find((r) => r.type === "diatonic" && r.rootIndex === 4);
      expect(iiim).toBeDefined();
      expect(iiim!.chordType).toBe("Minor");
    });

    it("Major returns exactly 2 diatonic results", () => {
      const results = getSubstitutions(0, "Major");
      expect(results.filter((r) => r.type === "diatonic")).toHaveLength(2);
    });

    it("Minor → ♭III (Am → C, rootIndex 0)", () => {
      const results = getSubstitutions(9, "Minor"); // Am
      const biii = results.find((r) => r.type === "diatonic" && r.rootIndex === 0);
      expect(biii).toBeDefined();
      expect(biii!.chordType).toBe("Major");
    });

    it("Minor → ♭VI (Am → F, rootIndex 5)", () => {
      const results = getSubstitutions(9, "Minor"); // Am
      const bvi = results.find((r) => r.type === "diatonic" && r.rootIndex === 5);
      expect(bvi).toBeDefined();
      expect(bvi!.chordType).toBe("Major");
    });

    it("maj7 → VIm7 and IIIm7 (Cmaj7 → Am7 and Em7)", () => {
      const results = getSubstitutions(0, "maj7");
      const diatonics = results.filter((r) => r.type === "diatonic");
      expect(diatonics).toHaveLength(2);
      expect(diatonics.find((r) => r.rootIndex === 9)?.chordType).toBe("m7");
      expect(diatonics.find((r) => r.rootIndex === 4)?.chordType).toBe("m7");
    });

    it("m7 returns 2 diatonic results (Am7 → Cmaj7 and Fmaj7)", () => {
      const results = getSubstitutions(9, "m7");
      const diatonics = results.filter((r) => r.type === "diatonic");
      expect(diatonics).toHaveLength(2);
      expect(diatonics.find((r) => r.rootIndex === 0)?.chordType).toBe("maj7");
      expect(diatonics.find((r) => r.rootIndex === 5)?.chordType).toBe("maj7");
    });
  });

  describe("トライトーン代理 (tritone)", () => {
    it("7th → 7th a tritone away (G7 → D♭7)", () => {
      const results = getSubstitutions(7, "7th"); // G
      const tri = results.find((r) => r.type === "tritone");
      expect(tri!.rootIndex).toBe(1); // D♭
      expect(tri!.chordType).toBe("7th");
    });

    it("Major does not have tritone substitution", () => {
      const results = getSubstitutions(0, "Major");
      expect(results.find((r) => r.type === "tritone")).toBeUndefined();
    });
  });

  describe("SUBSTITUTION_CHORD_TYPES", () => {
    it("contains all 5 supported types", () => {
      expect(SUBSTITUTION_CHORD_TYPES).toHaveLength(5);
      expect(SUBSTITUTION_CHORD_TYPES).toContain("Major");
      expect(SUBSTITUTION_CHORD_TYPES).toContain("7th");
    });
  });
});
