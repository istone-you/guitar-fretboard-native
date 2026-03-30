import {
  NOTES_SHARP,
  NOTES_FLAT,
  NOTES,
  OPEN_STRINGS,
  FRET_COUNT,
  POSITION_MARKS,
  getNoteIndex,
  getNoteName,
  DEGREE_NAMES,
  SEMITONE_TO_DEGREE,
  calcDegree,
  getDegreeName,
  DEGREE_COLORS,
  CHORD_FORMS_6TH,
  CHORD_FORMS_5TH,
  POWER_CHORD_FORMS,
  TRIAD_STRING_SET_OPTIONS,
  TRIAD_INVERSION_OPTIONS,
  TRIAD_LAYOUT_OPTIONS,
  getTriadLayout,
  buildTriadVoicing,
  OPEN_CHORD_FORMS,
  getOpenChordForm,
  DIATONIC_CHORDS,
  getDiatonicChord,
  getDiatonicChordSemitones,
  MAJOR_SCALE_DEGREES,
  NATURAL_MINOR_SCALE_DEGREES,
  HARMONIC_MINOR_SCALE_DEGREES,
  MELODIC_MINOR_SCALE_DEGREES,
  DORIAN_SCALE_DEGREES,
  PHRYGIAN_SCALE_DEGREES,
  LYDIAN_SCALE_DEGREES,
  MIXOLYDIAN_SCALE_DEGREES,
  LOCRIAN_SCALE_DEGREES,
  isInMajorScale,
  isInNaturalMinorScale,
  getRootIndex,
  MINOR_PENTA_DEGREES,
  MAJOR_PENTA_DEGREES,
  isInPenta,
  BLUES_SCALE_DEGREES,
  SCALE_DEGREES,
  isInScale,
  isInBluesScale,
  CHORD_SEMITONES,
  getActiveOverlaySemitones,
  CAGED_FORMS,
  CAGED_ORDER,
  calcCagedPositions,
} from "../fretboard";
import type { ScaleType, ChordType, DegreeName } from "../../types";

// ===== Constants =====

describe("NOTES_SHARP", () => {
  it("has 12 notes", () => {
    expect(NOTES_SHARP).toHaveLength(12);
  });

  it("starts with C and ends with B", () => {
    expect(NOTES_SHARP[0]).toBe("C");
    expect(NOTES_SHARP[11]).toBe("B");
  });

  it("contains all sharp accidentals", () => {
    expect(NOTES_SHARP).toContain("C♯");
    expect(NOTES_SHARP).toContain("D♯");
    expect(NOTES_SHARP).toContain("F♯");
    expect(NOTES_SHARP).toContain("G♯");
    expect(NOTES_SHARP).toContain("A♯");
  });
});

describe("NOTES_FLAT", () => {
  it("has 12 notes", () => {
    expect(NOTES_FLAT).toHaveLength(12);
  });

  it("starts with C and ends with B", () => {
    expect(NOTES_FLAT[0]).toBe("C");
    expect(NOTES_FLAT[11]).toBe("B");
  });

  it("contains all flat accidentals", () => {
    expect(NOTES_FLAT).toContain("D♭");
    expect(NOTES_FLAT).toContain("E♭");
    expect(NOTES_FLAT).toContain("G♭");
    expect(NOTES_FLAT).toContain("A♭");
    expect(NOTES_FLAT).toContain("B♭");
  });
});

describe("NOTES (backward compat alias)", () => {
  it("is the same reference as NOTES_FLAT", () => {
    expect(NOTES).toBe(NOTES_FLAT);
  });
});

describe("OPEN_STRINGS", () => {
  it("has 6 strings", () => {
    expect(OPEN_STRINGS).toHaveLength(6);
  });

  it("represents standard tuning E-A-D-G-B-E", () => {
    // E=4, A=9, D=2, G=7, B=11, E=4
    expect(Array.from(OPEN_STRINGS)).toEqual([4, 9, 2, 7, 11, 4]);
  });
});

describe("FRET_COUNT", () => {
  it("is 15 (frets 0-14)", () => {
    expect(FRET_COUNT).toBe(15);
  });
});

describe("POSITION_MARKS", () => {
  it("marks frets 3, 5, 7, 9 as single", () => {
    expect(POSITION_MARKS[3]).toBe("single");
    expect(POSITION_MARKS[5]).toBe("single");
    expect(POSITION_MARKS[7]).toBe("single");
    expect(POSITION_MARKS[9]).toBe("single");
  });

  it("marks fret 12 as double", () => {
    expect(POSITION_MARKS[12]).toBe("double");
  });

  it("does not mark other frets", () => {
    expect(POSITION_MARKS[0]).toBeUndefined();
    expect(POSITION_MARKS[1]).toBeUndefined();
    expect(POSITION_MARKS[2]).toBeUndefined();
    expect(POSITION_MARKS[4]).toBeUndefined();
    expect(POSITION_MARKS[6]).toBeUndefined();
    expect(POSITION_MARKS[10]).toBeUndefined();
    expect(POSITION_MARKS[14]).toBeUndefined();
  });
});

// ===== getNoteIndex =====

describe("getNoteIndex", () => {
  it("returns open string note index for fret 0", () => {
    // 6th string (index 0) open = E = 4
    expect(getNoteIndex(0, 0)).toBe(4);
    // 5th string (index 1) open = A = 9
    expect(getNoteIndex(1, 0)).toBe(9);
    // 4th string (index 2) open = D = 2
    expect(getNoteIndex(2, 0)).toBe(2);
    // 3rd string (index 3) open = G = 7
    expect(getNoteIndex(3, 0)).toBe(7);
    // 2nd string (index 4) open = B = 11
    expect(getNoteIndex(4, 0)).toBe(11);
    // 1st string (index 5) open = E = 4
    expect(getNoteIndex(5, 0)).toBe(4);
  });

  it("wraps around after 12 semitones", () => {
    // 6th string fret 12 should be same as open (E=4)
    expect(getNoteIndex(0, 12)).toBe(4);
    // 5th string fret 12 should be same as open (A=9)
    expect(getNoteIndex(1, 12)).toBe(9);
  });

  it("computes correct note for arbitrary fret", () => {
    // 6th string fret 5 = E+5 = A = 9
    expect(getNoteIndex(0, 5)).toBe(9);
    // 5th string fret 3 = A+3 = C = 0
    expect(getNoteIndex(1, 3)).toBe(0);
  });
});

// ===== getNoteName =====

describe("getNoteName", () => {
  it("returns correct note names for open strings", () => {
    expect(getNoteName(0, 0)).toBe("E"); // 6th string
    expect(getNoteName(1, 0)).toBe("A"); // 5th string
    expect(getNoteName(2, 0)).toBe("D"); // 4th string
    expect(getNoteName(3, 0)).toBe("G"); // 3rd string
    expect(getNoteName(4, 0)).toBe("B"); // 2nd string
    expect(getNoteName(5, 0)).toBe("E"); // 1st string
  });

  it("returns flat notation (uses NOTES_FLAT)", () => {
    // 6th string fret 1 = F
    expect(getNoteName(0, 1)).toBe("F");
    // 6th string fret 2 = F# / Gb -> should be Gb since NOTES=NOTES_FLAT
    expect(getNoteName(0, 2)).toBe("G♭");
  });
});

// ===== DEGREE_NAMES & SEMITONE_TO_DEGREE =====

describe("DEGREE_NAMES", () => {
  it("has 12 entries", () => {
    expect(DEGREE_NAMES).toHaveLength(12);
  });

  it("starts with P1 and ends with M7", () => {
    expect(DEGREE_NAMES[0]).toBe("P1");
    expect(DEGREE_NAMES[11]).toBe("M7");
  });
});

describe("SEMITONE_TO_DEGREE", () => {
  it("has 12 entries", () => {
    expect(SEMITONE_TO_DEGREE).toHaveLength(12);
  });

  it("maps semitone 0 to P1", () => {
    expect(SEMITONE_TO_DEGREE[0]).toBe("P1");
  });

  it("maps semitone 7 to P5", () => {
    expect(SEMITONE_TO_DEGREE[7]).toBe("P5");
  });

  it("maps semitone 4 to M3", () => {
    expect(SEMITONE_TO_DEGREE[4]).toBe("M3");
  });

  it("maps semitone 3 to m3", () => {
    expect(SEMITONE_TO_DEGREE[3]).toBe("m3");
  });
});

// ===== calcDegree =====

describe("calcDegree", () => {
  it("returns 0 when note equals root", () => {
    expect(calcDegree(5, 5)).toBe(0);
    expect(calcDegree(0, 0)).toBe(0);
  });

  it("returns correct semitone distance", () => {
    // C(0) to E(4) = 4 semitones (M3)
    expect(calcDegree(4, 0)).toBe(4);
    // C(0) to G(7) = 7 semitones (P5)
    expect(calcDegree(7, 0)).toBe(7);
  });

  it("wraps correctly when note < root", () => {
    // E(4) relative to A(9): (4 - 9 + 12) % 12 = 7 (P5)
    expect(calcDegree(4, 9)).toBe(7);
    // C(0) relative to G(7): (0 - 7 + 12) % 12 = 5 (P4)
    expect(calcDegree(0, 7)).toBe(5);
  });

  it("handles all 12 semitone distances from root 0", () => {
    for (let i = 0; i < 12; i++) {
      expect(calcDegree(i, 0)).toBe(i);
    }
  });
});

// ===== getDegreeName =====

describe("getDegreeName", () => {
  it("returns P1 for unison", () => {
    expect(getDegreeName(0, 0)).toBe("P1");
    expect(getDegreeName(5, 5)).toBe("P1");
  });

  it("returns M3 for major third", () => {
    expect(getDegreeName(4, 0)).toBe("M3"); // C to E
  });

  it("returns P5 for perfect fifth", () => {
    expect(getDegreeName(7, 0)).toBe("P5"); // C to G
  });

  it("works with wrapping", () => {
    // A(9) to E(4) = P5
    expect(getDegreeName(4, 9)).toBe("P5");
  });
});

// ===== DEGREE_COLORS =====

describe("DEGREE_COLORS", () => {
  it("has color for P1 (root)", () => {
    expect(DEGREE_COLORS.P1).toBeDefined();
    expect(DEGREE_COLORS.P1!.bg).toBe("#ef4444");
  });

  it("has color for P5", () => {
    expect(DEGREE_COLORS.P5).toBeDefined();
    expect(DEGREE_COLORS.P5!.bg).toBe("#3b82f6");
  });

  it("has color for all 12 degrees", () => {
    const allDegrees: DegreeName[] = [
      "P1", "m2", "M2", "m3", "M3", "P4", "b5", "P5", "m6", "M6", "m7", "M7",
    ];
    for (const deg of allDegrees) {
      expect(DEGREE_COLORS[deg]).toBeDefined();
    }
  });
});

// ===== Chord Forms =====

describe("CHORD_FORMS_6TH", () => {
  it("has all 14 chord types", () => {
    const expectedTypes: ChordType[] = [
      "Major", "Minor", "7th", "maj7", "m7", "m7(b5)", "dim7",
      "m(maj7)", "sus2", "sus4", "6", "m6", "dim", "aug",
    ];
    for (const ct of expectedTypes) {
      expect(CHORD_FORMS_6TH[ct]).toBeDefined();
      expect(CHORD_FORMS_6TH[ct]!.length).toBeGreaterThan(0);
    }
  });

  it("Major form has 6 positions (all strings)", () => {
    expect(CHORD_FORMS_6TH.Major).toHaveLength(6);
  });

  it("Major form root is on string 0 with fretOffset 0", () => {
    expect(CHORD_FORMS_6TH.Major![0]).toEqual({ string: 0, fretOffset: 0 });
  });
});

describe("CHORD_FORMS_5TH", () => {
  it("has all 14 chord types", () => {
    const expectedTypes: ChordType[] = [
      "Major", "Minor", "7th", "maj7", "m7", "m7(b5)", "dim7",
      "m(maj7)", "sus2", "sus4", "6", "m6", "dim", "aug",
    ];
    for (const ct of expectedTypes) {
      expect(CHORD_FORMS_5TH[ct]).toBeDefined();
      expect(CHORD_FORMS_5TH[ct]!.length).toBeGreaterThan(0);
    }
  });

  it("Major form root is on string 1 with fretOffset 0", () => {
    expect(CHORD_FORMS_5TH.Major![0]).toEqual({ string: 1, fretOffset: 0 });
  });

  it("some forms have fewer than 6 positions (no 6th string)", () => {
    // m7(b5) on 5th string has only 4 positions
    expect(CHORD_FORMS_5TH["m7(b5)"]!.length).toBeLessThan(6);
  });
});

describe("POWER_CHORD_FORMS", () => {
  it("has forms for 6th string root (0) and 5th string root (1)", () => {
    expect(POWER_CHORD_FORMS[0]).toBeDefined();
    expect(POWER_CHORD_FORMS[1]).toBeDefined();
  });

  it("each form has 2 positions (root + fifth)", () => {
    expect(POWER_CHORD_FORMS[0]).toHaveLength(2);
    expect(POWER_CHORD_FORMS[1]).toHaveLength(2);
  });

  it("6th string form: root on string 0, fifth on string 1 offset +2", () => {
    expect(POWER_CHORD_FORMS[0][0]).toEqual({ string: 0, fretOffset: 0 });
    expect(POWER_CHORD_FORMS[0][1]).toEqual({ string: 1, fretOffset: 2 });
  });
});

// ===== Triad Options =====

describe("TRIAD_STRING_SET_OPTIONS", () => {
  it("has 4 options", () => {
    expect(TRIAD_STRING_SET_OPTIONS).toHaveLength(4);
  });

  it("maps 1-3 to string indices [3,4,5]", () => {
    const opt = TRIAD_STRING_SET_OPTIONS.find((o) => o.value === "1-3");
    expect(opt).toBeDefined();
    expect(opt!.strings).toEqual([3, 4, 5]);
  });

  it("maps 4-6 to string indices [0,1,2]", () => {
    const opt = TRIAD_STRING_SET_OPTIONS.find((o) => o.value === "4-6");
    expect(opt).toBeDefined();
    expect(opt!.strings).toEqual([0, 1, 2]);
  });
});

describe("TRIAD_INVERSION_OPTIONS", () => {
  it("has 3 options: root, first, second", () => {
    expect(TRIAD_INVERSION_OPTIONS).toHaveLength(3);
    expect(TRIAD_INVERSION_OPTIONS.map((o) => o.value)).toEqual(["root", "first", "second"]);
  });
});

describe("TRIAD_LAYOUT_OPTIONS", () => {
  it("has 12 options (4 string sets x 3 inversions)", () => {
    expect(TRIAD_LAYOUT_OPTIONS).toHaveLength(12);
  });

  it("first option is 1-3-root", () => {
    expect(TRIAD_LAYOUT_OPTIONS[0].value).toBe("1-3-root");
    expect(TRIAD_LAYOUT_OPTIONS[0].strings).toEqual([3, 4, 5]);
    expect(TRIAD_LAYOUT_OPTIONS[0].inversion).toBe("root");
  });

  it("last option is 4-6-second", () => {
    expect(TRIAD_LAYOUT_OPTIONS[11].value).toBe("4-6-second");
    expect(TRIAD_LAYOUT_OPTIONS[11].strings).toEqual([0, 1, 2]);
    expect(TRIAD_LAYOUT_OPTIONS[11].inversion).toBe("second");
  });
});

// ===== getTriadLayout =====

describe("getTriadLayout", () => {
  it("returns matching layout option", () => {
    const layout = getTriadLayout("2-4-first");
    expect(layout.value).toBe("2-4-first");
    expect(layout.strings).toEqual([2, 3, 4]);
    expect(layout.inversion).toBe("first");
  });

  it("returns first option as fallback for unknown value", () => {
    const layout = getTriadLayout("nonexistent");
    expect(layout).toBe(TRIAD_LAYOUT_OPTIONS[0]);
  });
});

// ===== buildTriadVoicing =====

describe("buildTriadVoicing", () => {
  it("returns non-empty cells for a valid voicing", () => {
    // C Major on 1-3 strings, root position, rootIndex = 0 (C)
    const cells = buildTriadVoicing(0, "Major", "1-3-root");
    expect(cells.length).toBeGreaterThan(0);
    expect(cells).toHaveLength(3);
  });

  it("returns empty array for unknown layout", () => {
    const cells = buildTriadVoicing(0, "Major", "nonexistent");
    expect(cells).toEqual([]);
  });

  it("returns empty array for unknown chord type", () => {
    const cells = buildTriadVoicing(0, "UnknownChord", "1-3-root");
    expect(cells).toEqual([]);
  });

  it("all frets are within valid range [0, FRET_COUNT)", () => {
    const cells = buildTriadVoicing(0, "Major", "4-6-root");
    for (const cell of cells) {
      expect(cell.fret).toBeGreaterThanOrEqual(0);
      expect(cell.fret).toBeLessThan(FRET_COUNT);
    }
  });

  it("produces cells with correct strings for the layout", () => {
    const cells = buildTriadVoicing(9, "Minor", "2-4-root"); // A minor
    const strings = cells.map((c) => c.string).sort();
    expect(strings).toEqual([2, 3, 4]);
  });

  it("selects lowest position (smallest score)", () => {
    // For C major on 4-6 strings root position, root on string 0
    // anchorString is 0, C on string 0 is at fret 8 (E+8=C)
    const cells = buildTriadVoicing(0, "Major", "4-6-root");
    if (cells.length > 0) {
      const frets = cells.map((c) => c.fret);
      // Should pick lowest available position
      expect(Math.max(...frets)).toBeLessThan(FRET_COUNT);
    }
  });

  it("works for all 4 triad chord types on all layouts", () => {
    const chordTypes = ["Major", "Minor", "Diminished", "Augmented"];
    const layouts = TRIAD_LAYOUT_OPTIONS.map((o) => o.value);
    for (const ct of chordTypes) {
      for (const layout of layouts) {
        // rootIndex C=0
        const cells = buildTriadVoicing(0, ct, layout);
        // Should not throw; may be empty if no valid position exists
        expect(Array.isArray(cells)).toBe(true);
      }
    }
  });
});

// ===== OPEN_CHORD_FORMS & getOpenChordForm =====

describe("OPEN_CHORD_FORMS", () => {
  it("has Major open chords for C, D, E, G, A", () => {
    expect(OPEN_CHORD_FORMS.Major).toBeDefined();
    expect(Object.keys(OPEN_CHORD_FORMS.Major!)).toEqual(
      expect.arrayContaining(["C", "D", "E", "G", "A"]),
    );
  });

  it("has Minor open chords for D, E, A", () => {
    expect(OPEN_CHORD_FORMS.Minor).toBeDefined();
    expect(Object.keys(OPEN_CHORD_FORMS.Minor!)).toEqual(
      expect.arrayContaining(["D", "E", "A"]),
    );
  });
});

describe("getOpenChordForm", () => {
  it("returns C Major open chord form", () => {
    const form = getOpenChordForm(0, "Major"); // C=0
    expect(form).not.toBeNull();
    expect(form!.length).toBeGreaterThan(0);
  });

  it("returns null for non-existent open chord", () => {
    // F# Major doesn't have an open form
    const form = getOpenChordForm(6, "Major"); // F#/Gb = index 6
    expect(form).toBeNull();
  });

  it("returns null for chord type without open forms", () => {
    // "m(maj7)" has no open chord forms defined
    const form = getOpenChordForm(0, "m(maj7)");
    expect(form).toBeNull();
  });

  it("returns A minor open chord form", () => {
    const form = getOpenChordForm(9, "Minor"); // A=9
    expect(form).not.toBeNull();
  });

  it("returns E7 open chord form", () => {
    const form = getOpenChordForm(4, "7th"); // E=4
    expect(form).not.toBeNull();
  });
});

// ===== DIATONIC_CHORDS & getDiatonicChord =====

describe("DIATONIC_CHORDS", () => {
  it("has 4 progressions", () => {
    expect(Object.keys(DIATONIC_CHORDS)).toEqual(
      expect.arrayContaining([
        "major-triad",
        "major-seventh",
        "natural-minor-triad",
        "natural-minor-seventh",
      ]),
    );
  });

  it("each progression has 7 chords", () => {
    for (const key of Object.keys(DIATONIC_CHORDS)) {
      expect(DIATONIC_CHORDS[key]).toHaveLength(7);
    }
  });

  it("major-triad I is Major", () => {
    const first = DIATONIC_CHORDS["major-triad"][0];
    expect(first.value).toBe("I");
    expect(first.offset).toBe(0);
    expect(first.chordType).toBe("Major");
  });

  it("major-triad vii is dim", () => {
    const last = DIATONIC_CHORDS["major-triad"][6];
    expect(last.value).toBe("vii");
    expect(last.chordType).toBe("dim");
  });
});

describe("getDiatonicChord", () => {
  it("returns root Major for I in major-triad with root C", () => {
    const result = getDiatonicChord(0, "major-triad", "I");
    expect(result.rootIndex).toBe(0); // C
    expect(result.chordType).toBe("Major");
  });

  it("returns ii Minor for major-triad with root C", () => {
    const result = getDiatonicChord(0, "major-triad", "ii");
    expect(result.rootIndex).toBe(2); // D
    expect(result.chordType).toBe("Minor");
  });

  it("returns V with correct root offset for major-triad key of G", () => {
    // G = index 7, V offset = 7, so root = (7+7)%12 = 2 = D
    const result = getDiatonicChord(7, "major-triad", "V");
    expect(result.rootIndex).toBe(2); // D
    expect(result.chordType).toBe("Major");
  });

  it("falls back to major-triad for unknown scale type", () => {
    const result = getDiatonicChord(0, "nonexistent-scale", "I");
    expect(result.rootIndex).toBe(0);
    expect(result.chordType).toBe("Major");
  });

  it("falls back to first chord for unknown degree value", () => {
    const result = getDiatonicChord(0, "major-triad", "nonexistent");
    expect(result.rootIndex).toBe(0);
    expect(result.chordType).toBe("Major");
  });

  it("works for natural-minor-seventh", () => {
    // Key of A minor (9), i = m7
    const result = getDiatonicChord(9, "natural-minor-seventh", "i");
    expect(result.rootIndex).toBe(9); // A
    expect(result.chordType).toBe("m7");
  });
});

describe("getDiatonicChordSemitones", () => {
  it("returns semitones for C major I chord", () => {
    const semitones = getDiatonicChordSemitones(0, "major-triad", "I");
    // I = C Major = {0, 4, 7}
    expect(semitones).toEqual(new Set([0, 4, 7]));
  });

  it("returns offset semitones for C major V chord", () => {
    const semitones = getDiatonicChordSemitones(0, "major-triad", "V");
    // V = G Major root at offset 7, chord tones {0,4,7} shifted by 7 = {7,11,2}
    expect(semitones).toEqual(new Set([7, 11, 2]));
  });

  it("returns semitones for C major ii chord", () => {
    const semitones = getDiatonicChordSemitones(0, "major-triad", "ii");
    // ii = D Minor at offset 2, chord tones {0,3,7} shifted by 2 = {2,5,9}
    expect(semitones).toEqual(new Set([2, 5, 9]));
  });
});

// ===== Scale Degrees =====

describe("Scale degree sets", () => {
  it("MAJOR_SCALE_DEGREES has 7 notes", () => {
    expect(MAJOR_SCALE_DEGREES.size).toBe(7);
    expect(MAJOR_SCALE_DEGREES).toEqual(new Set([0, 2, 4, 5, 7, 9, 11]));
  });

  it("NATURAL_MINOR_SCALE_DEGREES has 7 notes", () => {
    expect(NATURAL_MINOR_SCALE_DEGREES.size).toBe(7);
    expect(NATURAL_MINOR_SCALE_DEGREES).toEqual(new Set([0, 2, 3, 5, 7, 8, 10]));
  });

  it("HARMONIC_MINOR_SCALE_DEGREES differs from natural minor at 7th", () => {
    expect(HARMONIC_MINOR_SCALE_DEGREES).toEqual(new Set([0, 2, 3, 5, 7, 8, 11]));
    // Has M7 (11) instead of m7 (10)
    expect(HARMONIC_MINOR_SCALE_DEGREES.has(11)).toBe(true);
    expect(HARMONIC_MINOR_SCALE_DEGREES.has(10)).toBe(false);
  });

  it("MELODIC_MINOR_SCALE_DEGREES has raised 6th and 7th", () => {
    expect(MELODIC_MINOR_SCALE_DEGREES).toEqual(new Set([0, 2, 3, 5, 7, 9, 11]));
  });

  it("DORIAN_SCALE_DEGREES is correct", () => {
    expect(DORIAN_SCALE_DEGREES).toEqual(new Set([0, 2, 3, 5, 7, 9, 10]));
  });

  it("PHRYGIAN_SCALE_DEGREES is correct", () => {
    expect(PHRYGIAN_SCALE_DEGREES).toEqual(new Set([0, 1, 3, 5, 7, 8, 10]));
  });

  it("LYDIAN_SCALE_DEGREES has #4", () => {
    expect(LYDIAN_SCALE_DEGREES).toEqual(new Set([0, 2, 4, 6, 7, 9, 11]));
    expect(LYDIAN_SCALE_DEGREES.has(6)).toBe(true); // #4
    expect(LYDIAN_SCALE_DEGREES.has(5)).toBe(false); // no P4
  });

  it("MIXOLYDIAN_SCALE_DEGREES has b7", () => {
    expect(MIXOLYDIAN_SCALE_DEGREES).toEqual(new Set([0, 2, 4, 5, 7, 9, 10]));
  });

  it("LOCRIAN_SCALE_DEGREES has b2 and b5", () => {
    expect(LOCRIAN_SCALE_DEGREES).toEqual(new Set([0, 1, 3, 5, 6, 8, 10]));
  });

  it("MINOR_PENTA_DEGREES has 5 notes", () => {
    expect(MINOR_PENTA_DEGREES.size).toBe(5);
    expect(MINOR_PENTA_DEGREES).toEqual(new Set([0, 3, 5, 7, 10]));
  });

  it("MAJOR_PENTA_DEGREES has 5 notes", () => {
    expect(MAJOR_PENTA_DEGREES.size).toBe(5);
    expect(MAJOR_PENTA_DEGREES).toEqual(new Set([0, 2, 4, 7, 9]));
  });

  it("BLUES_SCALE_DEGREES has 6 notes (penta + b5)", () => {
    expect(BLUES_SCALE_DEGREES.size).toBe(6);
    expect(BLUES_SCALE_DEGREES).toEqual(new Set([0, 3, 5, 6, 7, 10]));
  });
});

// ===== SCALE_DEGREES map =====

describe("SCALE_DEGREES", () => {
  it("maps all ScaleType values", () => {
    const allScaleTypes: ScaleType[] = [
      "major", "natural-minor", "major-penta", "minor-penta", "blues",
      "harmonic-minor", "melodic-minor", "ionian", "dorian", "phrygian",
      "lydian", "mixolydian", "aeolian", "locrian",
    ];
    for (const st of allScaleTypes) {
      expect(SCALE_DEGREES[st]).toBeDefined();
      expect(SCALE_DEGREES[st].size).toBeGreaterThan(0);
    }
  });

  it("ionian equals major", () => {
    expect(SCALE_DEGREES.ionian).toBe(SCALE_DEGREES.major);
  });

  it("aeolian equals natural-minor", () => {
    expect(SCALE_DEGREES.aeolian).toBe(SCALE_DEGREES["natural-minor"]);
  });
});

// ===== isInMajorScale / isInNaturalMinorScale =====

describe("isInMajorScale", () => {
  it("returns true for all major scale degrees", () => {
    for (const s of [0, 2, 4, 5, 7, 9, 11]) {
      expect(isInMajorScale(s)).toBe(true);
    }
  });

  it("returns false for non-scale tones", () => {
    for (const s of [1, 3, 6, 8, 10]) {
      expect(isInMajorScale(s)).toBe(false);
    }
  });
});

describe("isInNaturalMinorScale", () => {
  it("returns true for all natural minor scale degrees", () => {
    for (const s of [0, 2, 3, 5, 7, 8, 10]) {
      expect(isInNaturalMinorScale(s)).toBe(true);
    }
  });

  it("returns false for non-scale tones", () => {
    for (const s of [1, 4, 6, 9, 11]) {
      expect(isInNaturalMinorScale(s)).toBe(false);
    }
  });
});

// ===== isInPenta =====

describe("isInPenta", () => {
  it("identifies minor pentatonic notes", () => {
    expect(isInPenta(0, "minor")).toBe(true);
    expect(isInPenta(3, "minor")).toBe(true);
    expect(isInPenta(5, "minor")).toBe(true);
    expect(isInPenta(7, "minor")).toBe(true);
    expect(isInPenta(10, "minor")).toBe(true);
    expect(isInPenta(4, "minor")).toBe(false);
  });

  it("identifies major pentatonic notes", () => {
    expect(isInPenta(0, "major")).toBe(true);
    expect(isInPenta(2, "major")).toBe(true);
    expect(isInPenta(4, "major")).toBe(true);
    expect(isInPenta(7, "major")).toBe(true);
    expect(isInPenta(9, "major")).toBe(true);
    expect(isInPenta(3, "major")).toBe(false);
  });
});

// ===== isInScale =====

describe("isInScale", () => {
  it("works for major scale", () => {
    expect(isInScale(0, "major")).toBe(true);
    expect(isInScale(1, "major")).toBe(false);
  });

  it("works for blues scale", () => {
    expect(isInScale(6, "blues")).toBe(true); // b5
    expect(isInScale(4, "blues")).toBe(false); // M3 not in blues
  });

  it("works for all scale types without throwing", () => {
    const allScaleTypes: ScaleType[] = [
      "major", "natural-minor", "major-penta", "minor-penta", "blues",
      "harmonic-minor", "melodic-minor", "ionian", "dorian", "phrygian",
      "lydian", "mixolydian", "aeolian", "locrian",
    ];
    for (const st of allScaleTypes) {
      // Root should always be in the scale
      expect(isInScale(0, st)).toBe(true);
    }
  });
});

// ===== isInBluesScale =====

describe("isInBluesScale", () => {
  it("returns true for blues scale notes", () => {
    for (const s of [0, 3, 5, 6, 7, 10]) {
      expect(isInBluesScale(s)).toBe(true);
    }
  });

  it("returns false for non-blues-scale notes", () => {
    for (const s of [1, 2, 4, 8, 9, 11]) {
      expect(isInBluesScale(s)).toBe(false);
    }
  });
});

// ===== getRootIndex =====

describe("getRootIndex", () => {
  it("returns correct index for natural notes (sharp notation)", () => {
    expect(getRootIndex("C")).toBe(0);
    expect(getRootIndex("D")).toBe(2);
    expect(getRootIndex("E")).toBe(4);
    expect(getRootIndex("F")).toBe(5);
    expect(getRootIndex("G")).toBe(7);
    expect(getRootIndex("A")).toBe(9);
    expect(getRootIndex("B")).toBe(11);
  });

  it("returns correct index for sharp notes", () => {
    expect(getRootIndex("C♯")).toBe(1);
    expect(getRootIndex("D♯")).toBe(3);
    expect(getRootIndex("F♯")).toBe(6);
    expect(getRootIndex("G♯")).toBe(8);
    expect(getRootIndex("A♯")).toBe(10);
  });

  it("returns correct index for flat notes", () => {
    expect(getRootIndex("D♭")).toBe(1);
    expect(getRootIndex("E♭")).toBe(3);
    expect(getRootIndex("G♭")).toBe(6);
    expect(getRootIndex("A♭")).toBe(8);
    expect(getRootIndex("B♭")).toBe(10);
  });

  it("returns -1 for unknown note", () => {
    expect(getRootIndex("X")).toBe(-1);
    expect(getRootIndex("")).toBe(-1);
  });
});

// ===== CHORD_SEMITONES =====

describe("CHORD_SEMITONES", () => {
  it("Major triad has root, M3, P5", () => {
    expect(CHORD_SEMITONES.Major).toEqual(new Set([0, 4, 7]));
  });

  it("Minor triad has root, m3, P5", () => {
    expect(CHORD_SEMITONES.Minor).toEqual(new Set([0, 3, 7]));
  });

  it("7th has root, M3, P5, m7", () => {
    expect(CHORD_SEMITONES["7th"]).toEqual(new Set([0, 4, 7, 10]));
  });

  it("dim7 has root, m3, b5, dim7", () => {
    expect(CHORD_SEMITONES.dim7).toEqual(new Set([0, 3, 6, 9]));
  });

  it("power chord has root and P5 only", () => {
    expect(CHORD_SEMITONES.power).toEqual(new Set([0, 7]));
  });

  it("sus2 has root, M2, P5", () => {
    expect(CHORD_SEMITONES.sus2).toEqual(new Set([0, 2, 7]));
  });

  it("sus4 has root, P4, P5", () => {
    expect(CHORD_SEMITONES.sus4).toEqual(new Set([0, 5, 7]));
  });

  it("aug has root, M3, augmented 5th", () => {
    expect(CHORD_SEMITONES.aug).toEqual(new Set([0, 4, 8]));
  });

  it("dim has root, m3, b5", () => {
    expect(CHORD_SEMITONES.dim).toEqual(new Set([0, 3, 6]));
  });

  it("Diminished (triad type) equals dim", () => {
    expect(CHORD_SEMITONES.Diminished).toEqual(new Set([0, 3, 6]));
  });

  it("Augmented (triad type) equals aug", () => {
    expect(CHORD_SEMITONES.Augmented).toEqual(new Set([0, 4, 8]));
  });
});

// ===== getActiveOverlaySemitones =====

describe("getActiveOverlaySemitones", () => {
  const baseParams = {
    rootNote: "C",
    showScale: false,
    scaleType: "major" as ScaleType,
    showCaged: false,
    showChord: false,
    chordDisplayMode: "form" as const,
    diatonicScaleType: "major-triad",
    diatonicDegree: "I",
    chordType: "Major" as ChordType,
  };

  it("returns empty set when nothing is active", () => {
    const result = getActiveOverlaySemitones(baseParams);
    expect(result.size).toBe(0);
  });

  it("returns scale degrees when scale is shown", () => {
    const result = getActiveOverlaySemitones({
      ...baseParams,
      showScale: true,
      scaleType: "major",
    });
    expect(result).toEqual(MAJOR_SCALE_DEGREES);
  });

  it("returns Major triad semitones when CAGED is shown", () => {
    const result = getActiveOverlaySemitones({
      ...baseParams,
      showCaged: true,
    });
    expect(result).toEqual(new Set([0, 4, 7]));
  });

  it("returns chord semitones when chord form is shown", () => {
    const result = getActiveOverlaySemitones({
      ...baseParams,
      showChord: true,
      chordDisplayMode: "form",
      chordType: "Minor",
    });
    expect(result).toEqual(new Set([0, 3, 7]));
  });

  it("returns power chord semitones when power mode", () => {
    const result = getActiveOverlaySemitones({
      ...baseParams,
      showChord: true,
      chordDisplayMode: "power",
    });
    expect(result).toEqual(new Set([0, 7]));
  });

  it("returns diatonic chord semitones when diatonic mode", () => {
    const result = getActiveOverlaySemitones({
      ...baseParams,
      showChord: true,
      chordDisplayMode: "diatonic",
      diatonicScaleType: "major-triad",
      diatonicDegree: "I",
    });
    // I chord in C major = C Major = {0, 4, 7}
    expect(result).toEqual(new Set([0, 4, 7]));
  });

  it("merges semitones from multiple active overlays", () => {
    const result = getActiveOverlaySemitones({
      ...baseParams,
      showScale: true,
      scaleType: "minor-penta",
      showCaged: true,
    });
    // minor penta: {0, 3, 5, 7, 10} + CAGED Major: {0, 4, 7}
    expect(result).toEqual(new Set([0, 3, 4, 5, 7, 10]));
  });

  it("works with non-C root notes", () => {
    const result = getActiveOverlaySemitones({
      ...baseParams,
      rootNote: "G",
      showChord: true,
      chordDisplayMode: "diatonic",
      diatonicScaleType: "major-triad",
      diatonicDegree: "V",
    });
    // G major key, V = D Major. Root offset = (2 - 7 + 12) % 12 = 7
    // D Major tones {0,4,7} shifted by 7 = {7, 11, 2}
    expect(result).toEqual(new Set([7, 11, 2]));
  });
});

// ===== CAGED System =====

describe("CAGED_FORMS", () => {
  it("has all 5 CAGED forms", () => {
    expect(Object.keys(CAGED_FORMS)).toEqual(
      expect.arrayContaining(["C", "A", "G", "E", "D"]),
    );
  });

  it("each form has label, color, anchorString, and positions", () => {
    for (const key of Object.keys(CAGED_FORMS)) {
      const form = CAGED_FORMS[key];
      expect(form.label).toBe(key);
      expect(form.color).toBe("#6366f1");
      expect(typeof form.anchorString).toBe("number");
      expect(form.positions.length).toBeGreaterThan(0);
    }
  });

  it("E form is anchored on string 0 (6th string)", () => {
    expect(CAGED_FORMS.E.anchorString).toBe(0);
  });

  it("A form is anchored on string 1 (5th string)", () => {
    expect(CAGED_FORMS.A.anchorString).toBe(1);
  });

  it("D form is anchored on string 2 (4th string)", () => {
    expect(CAGED_FORMS.D.anchorString).toBe(2);
  });

  it("positions have degree labels R, 3, or 5", () => {
    for (const key of Object.keys(CAGED_FORMS)) {
      for (const pos of CAGED_FORMS[key].positions) {
        expect(["R", "3", "5"]).toContain(pos.degree);
      }
    }
  });
});

describe("CAGED_ORDER", () => {
  it("is C-A-G-E-D", () => {
    expect(Array.from(CAGED_ORDER)).toEqual(["C", "A", "G", "E", "D"]);
  });
});

// ===== calcCagedPositions =====

describe("calcCagedPositions", () => {
  it("returns non-empty map for valid form and root", () => {
    // E form with root E (index 4)
    const positions = calcCagedPositions("E", 4);
    expect(positions.size).toBeGreaterThan(0);
  });

  it("returns empty map for unknown form key", () => {
    const positions = calcCagedPositions("X", 0);
    expect(positions.size).toBe(0);
  });

  it("position keys are in 'string-fret' format", () => {
    const positions = calcCagedPositions("E", 4);
    for (const key of positions.keys()) {
      expect(key).toMatch(/^\d+-\d+$/);
    }
  });

  it("all positions have color and degree", () => {
    const positions = calcCagedPositions("A", 9);
    for (const value of positions.values()) {
      expect(value.color).toBe("#6366f1");
      expect(["R", "3", "5"]).toContain(value.degree);
    }
  });

  it("does not include frets outside [0, FRET_COUNT)", () => {
    const positions = calcCagedPositions("G", 0);
    for (const key of positions.keys()) {
      const [, fretStr] = key.split("-");
      const fret = parseInt(fretStr, 10);
      expect(fret).toBeGreaterThanOrEqual(0);
      expect(fret).toBeLessThan(FRET_COUNT);
    }
  });

  it("contains multiple anchor fret occurrences across the fretboard", () => {
    // E form with root C (index 0), anchor string 0 (6th string)
    // C on 6th string: fret 8 (E+8 = C)
    const positions = calcCagedPositions("E", 0);
    expect(positions.size).toBeGreaterThan(0);

    // Check that root position exists at fret 8 on string 0
    expect(positions.has("0-8")).toBe(true);
    const rootPos = positions.get("0-8");
    expect(rootPos!.degree).toBe("R");
  });

  it("R degree takes priority when overlapping", () => {
    // This tests the logic: "if (!map.has(key) || degree === 'R') then set"
    // The E form root on string 0 at fret 0 with rootIndex=4 (E) should always be R
    const positions = calcCagedPositions("E", 4);
    const rootPos = positions.get("0-0");
    expect(rootPos).toBeDefined();
    expect(rootPos!.degree).toBe("R");
  });

  it("works for all CAGED forms with all 12 root notes", () => {
    for (const formKey of ["C", "A", "G", "E", "D"]) {
      for (let rootIdx = 0; rootIdx < 12; rootIdx++) {
        const positions = calcCagedPositions(formKey, rootIdx);
        // Should not throw, and should have positions
        expect(positions.size).toBeGreaterThan(0);
      }
    }
  });
});
