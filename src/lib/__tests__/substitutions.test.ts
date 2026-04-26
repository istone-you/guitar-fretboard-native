import { getSubstitutions, SUBSTITUTION_CHORD_TYPES } from "../substitutions";

describe("getSubstitutions", () => {
  describe("トニック代理 (tonic)", () => {
    it("Major → VIm (C → Am, rootIndex 9)", () => {
      const results = getSubstitutions(0, "Major");
      const vim = results.find((r) => r.type === "tonic" && r.rootIndex === 9);
      expect(vim).toBeDefined();
      expect(vim!.chordType).toBe("Minor");
    });

    it("Major → IIIm (C → Em, rootIndex 4)", () => {
      const results = getSubstitutions(0, "Major");
      const iiim = results.find((r) => r.type === "tonic" && r.rootIndex === 4);
      expect(iiim).toBeDefined();
      expect(iiim!.chordType).toBe("Minor");
    });

    it("Major returns exactly 2 tonic results", () => {
      const results = getSubstitutions(0, "Major");
      expect(results.filter((r) => r.type === "tonic")).toHaveLength(2);
    });

    it("maj7 → VIm7 and IIIm7 (Cmaj7 → Am7 and Em7)", () => {
      const results = getSubstitutions(0, "maj7");
      const tonics = results.filter((r) => r.type === "tonic");
      expect(tonics).toHaveLength(2);
      expect(tonics.find((r) => r.rootIndex === 9)?.chordType).toBe("m7");
      expect(tonics.find((r) => r.rootIndex === 4)?.chordType).toBe("m7");
    });

    it("Minor does not have tonic substitution", () => {
      const results = getSubstitutions(9, "Minor");
      expect(results.find((r) => r.type === "tonic")).toBeUndefined();
    });

    it("7th does not have tonic substitution", () => {
      const results = getSubstitutions(7, "7th");
      expect(results.find((r) => r.type === "tonic")).toBeUndefined();
    });
  });

  describe("サブドミナント代理 (subdominant)", () => {
    it("Minor → IVmaj (Dm → F, rootIndex 5)", () => {
      const results = getSubstitutions(2, "Minor"); // Dm
      const sub = results.find((r) => r.type === "subdominant");
      expect(sub).toBeDefined();
      expect(sub!.rootIndex).toBe(5); // F
      expect(sub!.chordType).toBe("Major");
    });

    it("m7 → IVmaj7 (Dm7 → Fmaj7, rootIndex 5)", () => {
      const results = getSubstitutions(2, "m7"); // Dm7
      const sub = results.find((r) => r.type === "subdominant");
      expect(sub).toBeDefined();
      expect(sub!.rootIndex).toBe(5); // F
      expect(sub!.chordType).toBe("maj7");
    });

    it("Major does not have subdominant substitution", () => {
      const results = getSubstitutions(0, "Major");
      expect(results.find((r) => r.type === "subdominant")).toBeUndefined();
    });

    it("7th does not have subdominant substitution", () => {
      const results = getSubstitutions(7, "7th");
      expect(results.find((r) => r.type === "subdominant")).toBeUndefined();
    });
  });

  describe("ドミナント代理 (dominant)", () => {
    it("7th → ♭II7 a tritone away (G7 → D♭7)", () => {
      const results = getSubstitutions(7, "7th"); // G
      const sub = results.find((r) => r.type === "dominant");
      expect(sub).toBeDefined();
      expect(sub!.rootIndex).toBe(1); // D♭
      expect(sub!.chordType).toBe("7th");
    });

    it("Major does not have dominant substitution", () => {
      const results = getSubstitutions(0, "Major");
      expect(results.find((r) => r.type === "dominant")).toBeUndefined();
    });

    it("Minor does not have dominant substitution", () => {
      const results = getSubstitutions(9, "Minor");
      expect(results.find((r) => r.type === "dominant")).toBeUndefined();
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
