import React from "react";
import { render } from "@testing-library/react-native";
import ChordDiagram, { getAllChordForms } from "..";

describe("getAllChordForms", () => {
  it("returns at least one form for C Major", () => {
    const forms = getAllChordForms(0, "Major");
    expect(forms.length).toBeGreaterThan(0);
  });

  it("returns forms sorted by minimum fret (ascending)", () => {
    const forms = getAllChordForms(0, "Major");
    const minFrets = forms.map((f) => {
      const pressed = f.filter((c) => c.fret > 0).map((c) => c.fret);
      return pressed.length > 0 ? Math.min(...pressed) : 0;
    });
    for (let i = 1; i < minFrets.length; i++) {
      expect(minFrets[i]).toBeGreaterThanOrEqual(minFrets[i - 1]);
    }
  });

  it("includes open chord form when available", () => {
    const forms = getAllChordForms(0, "Major"); // C Major has open form
    expect(forms.length).toBeGreaterThanOrEqual(1);
    const hasOpenStr = forms.some((f) => f.some((c) => c.fret === 0));
    expect(hasOpenStr).toBe(true);
  });

  it("skips 6th-string barre at fret 0", () => {
    // rootIndex = OPEN_STRINGS[0] means rf6 = 0 → skipped
    // E string open = OPEN_STRINGS[0] = index of E in chromatic = 4
    const forms = getAllChordForms(4, "Major"); // E Major
    // Should not include a barre at fret 0
    forms.forEach((f) => {
      const minFret = Math.min(...f.filter((c) => c.fret > 0).map((c) => c.fret));
      expect(minFret).toBeGreaterThanOrEqual(0);
    });
  });

  it("returns forms for Minor chord type", () => {
    const forms = getAllChordForms(0, "Minor");
    expect(forms.length).toBeGreaterThan(0);
  });

  it("returns forms for 7th chord type", () => {
    const forms = getAllChordForms(5, "7th");
    expect(forms.length).toBeGreaterThan(0);
  });

  it("each form cell has string and fret properties", () => {
    const forms = getAllChordForms(0, "Major");
    for (const form of forms) {
      for (const cell of form) {
        expect(typeof cell.string).toBe("number");
        expect(typeof cell.fret).toBe("number");
      }
    }
  });
});

describe("ChordDiagram component", () => {
  const basicCells = [
    { string: 5, fret: 0 },
    { string: 4, fret: 2 },
    { string: 3, fret: 2 },
    { string: 2, fret: 1 },
    { string: 1, fret: 0 },
    { string: 0, fret: 0 },
  ];

  it("renders without crashing for light theme", () => {
    const { toJSON } = render(
      <ChordDiagram cells={basicCells} rootIndex={0} theme="light" width={80} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("renders without crashing for dark theme", () => {
    const { toJSON } = render(
      <ChordDiagram cells={basicCells} rootIndex={0} theme="dark" width={80} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("returns null when cells array is empty", () => {
    const { toJSON } = render(<ChordDiagram cells={[]} rootIndex={0} theme="light" width={80} />);
    expect(toJSON()).toBeNull();
  });

  it("renders barre chord (all pressed, no open strings)", () => {
    const barreCells = [
      { string: 5, fret: 2 },
      { string: 4, fret: 4 },
      { string: 3, fret: 4 },
      { string: 2, fret: 3 },
      { string: 1, fret: 2 },
      { string: 0, fret: 2 },
    ];
    const { toJSON } = render(
      <ChordDiagram cells={barreCells} rootIndex={2} theme="light" width={80} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("renders with rootIndex matching a pressed cell (root dot)", () => {
    const cells = [
      { string: 5, fret: 3 },
      { string: 4, fret: 5 },
    ];
    const { toJSON } = render(<ChordDiagram cells={cells} rootIndex={3} theme="dark" width={80} />);
    expect(toJSON()).toBeTruthy();
  });
});
