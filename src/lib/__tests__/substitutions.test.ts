import { getSubstitutions, SUBSTITUTION_CHORD_TYPES } from "../substitutions";

describe("getSubstitutions", () => {
  describe("メジャーキー - トニック代理 (tonic)", () => {
    it("I (C Major in C major) → VIm (Am) + IIIm (Em)", () => {
      const results = getSubstitutions(0, "major", 0, "Major");
      const tonics = results.filter((r) => r.type === "tonic");
      expect(tonics).toHaveLength(2);
      expect(tonics.find((r) => r.rootIndex === 9)?.chordType).toBe("Minor");
      expect(tonics.find((r) => r.rootIndex === 4)?.chordType).toBe("Minor");
    });

    it("Imaj7 (Cmaj7 in C major) → VIm7 + IIIm7", () => {
      const results = getSubstitutions(0, "major", 0, "maj7");
      const tonics = results.filter((r) => r.type === "tonic");
      expect(tonics).toHaveLength(2);
      expect(tonics.find((r) => r.rootIndex === 9)?.chordType).toBe("m7");
      expect(tonics.find((r) => r.rootIndex === 4)?.chordType).toBe("m7");
    });

    it("VIm (Am in C major) → I (C Major)", () => {
      const results = getSubstitutions(0, "major", 9, "Minor");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "tonic", rootIndex: 0, chordType: "Major" });
    });

    it("VIm7 (Am7 in C major) → Imaj7 (Cmaj7)", () => {
      const results = getSubstitutions(0, "major", 9, "m7");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "tonic", rootIndex: 0, chordType: "maj7" });
    });

    it("IIIm (Em in C major) → I (C Major)", () => {
      const results = getSubstitutions(0, "major", 4, "Minor");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "tonic", rootIndex: 0, chordType: "Major" });
    });

    it("IIIm7 (Em7 in C major) → Imaj7 (Cmaj7)", () => {
      const results = getSubstitutions(0, "major", 4, "m7");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "tonic", rootIndex: 0, chordType: "maj7" });
    });
  });

  describe("メジャーキー - サブドミナント代理 (subdominant)", () => {
    it("IIm (Dm in C major) → IV (F Major)", () => {
      const results = getSubstitutions(0, "major", 2, "Minor");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "subdominant", rootIndex: 5, chordType: "Major" });
    });

    it("IIm7 (Dm7 in C major) → IVmaj7 (Fmaj7)", () => {
      const results = getSubstitutions(0, "major", 2, "m7");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "subdominant", rootIndex: 5, chordType: "maj7" });
    });

    it("IV (F in C major) → IIm (Dm)", () => {
      const results = getSubstitutions(0, "major", 5, "Major");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "subdominant", rootIndex: 2, chordType: "Minor" });
    });

    it("IVmaj7 (Fmaj7 in C major) → IIm7 (Dm7)", () => {
      const results = getSubstitutions(0, "major", 5, "maj7");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "subdominant", rootIndex: 2, chordType: "m7" });
    });
  });

  describe("メジャーキー - ドミナント代理 (dominant)", () => {
    it("V7 (G7 in C major) → ♭II7 (D♭7, rootIndex 1)", () => {
      const results = getSubstitutions(0, "major", 7, "7th");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "dominant", rootIndex: 1, chordType: "7th" });
    });

    it("♭II7 (D♭7 in C major) → V7 (G7, rootIndex 7)", () => {
      const results = getSubstitutions(0, "major", 1, "7th");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "dominant", rootIndex: 7, chordType: "7th" });
    });
  });

  describe("メジャーキー - 非ダイアトニックコードは空", () => {
    it("非ダイアトニックな度数では代理なし", () => {
      expect(getSubstitutions(0, "major", 6, "Major")).toHaveLength(0);
    });

    it("ダイアトニックな度数でもコードタイプが合わなければ代理なし", () => {
      expect(getSubstitutions(0, "major", 0, "7th")).toHaveLength(0);
    });
  });

  describe("マイナーキー - トニック代理 (tonic)", () => {
    it("i (Cm in C minor) → III (E♭ Major)", () => {
      const results = getSubstitutions(0, "minor", 0, "Minor");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "tonic", rootIndex: 3, chordType: "Major" });
    });

    it("im7 (Cm7 in C minor) → IIImaj7 (E♭maj7)", () => {
      const results = getSubstitutions(0, "minor", 0, "m7");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "tonic", rootIndex: 3, chordType: "maj7" });
    });

    it("III (E♭ in C minor) → i (Cm)", () => {
      const results = getSubstitutions(0, "minor", 3, "Major");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "tonic", rootIndex: 0, chordType: "Minor" });
    });

    it("IIImaj7 (E♭maj7 in C minor) → im7 (Cm7)", () => {
      const results = getSubstitutions(0, "minor", 3, "maj7");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "tonic", rootIndex: 0, chordType: "m7" });
    });
  });

  describe("マイナーキー - サブドミナント代理 (subdominant)", () => {
    it("iv (Fm in C minor) → VI (A♭ Major)", () => {
      const results = getSubstitutions(0, "minor", 5, "Minor");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "subdominant", rootIndex: 8, chordType: "Major" });
    });

    it("VI (A♭ in C minor) → iv (Fm)", () => {
      const results = getSubstitutions(0, "minor", 8, "Major");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "subdominant", rootIndex: 5, chordType: "Minor" });
    });

    it("ivm7 (Fm7 in C minor) → VImaj7 (A♭maj7)", () => {
      const results = getSubstitutions(0, "minor", 5, "m7");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "subdominant", rootIndex: 8, chordType: "maj7" });
    });

    it("VImaj7 (A♭maj7 in C minor) → ivm7 (Fm7)", () => {
      const results = getSubstitutions(0, "minor", 8, "maj7");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "subdominant", rootIndex: 5, chordType: "m7" });
    });
  });

  describe("マイナーキー - ドミナント代理 (dominant)", () => {
    it("V7 (G7 in C minor) → ♭II7 (D♭7)", () => {
      const results = getSubstitutions(0, "minor", 7, "7th");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "dominant", rootIndex: 1, chordType: "7th" });
    });

    it("♭II7 (D♭7 in C minor) → V7 (G7)", () => {
      const results = getSubstitutions(0, "minor", 1, "7th");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ type: "dominant", rootIndex: 7, chordType: "7th" });
    });
  });

  describe("SUBSTITUTION_CHORD_TYPES", () => {
    it("5種類のコードタイプを含む", () => {
      expect(SUBSTITUTION_CHORD_TYPES).toHaveLength(5);
      expect(SUBSTITUTION_CHORD_TYPES).toContain("Major");
      expect(SUBSTITUTION_CHORD_TYPES).toContain("7th");
    });
  });
});
