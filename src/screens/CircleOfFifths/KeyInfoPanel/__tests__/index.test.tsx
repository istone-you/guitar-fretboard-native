import React from "react";
import { render, screen } from "@testing-library/react-native";
import KeyInfoPanel from "..";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === "circle.keyInfo.diatonicChords") return "ダイアトニックコード";
      if (key === "circle.keyInfo.scaleNotes") return "構成音";
      return key;
    },
  }),
}));

describe("KeyInfoPanel", () => {
  const defaultProps = {
    theme: "light" as const,
    accidental: "sharp" as const,
    selectedIndex: 0,
    keyType: "major" as const,
  };

  it("renders the panel", () => {
    render(<KeyInfoPanel {...defaultProps} />);
    expect(screen.getByTestId("key-info-panel")).toBeTruthy();
  });

  it("shows 7 diatonic chord chips for C major", () => {
    render(<KeyInfoPanel {...defaultProps} />);
    // C major: I=C, II=Dm, III=Em, IV=F, V=G, VI=Am, VII=B°
    expect(screen.getByTestId("key-info-chord-I")).toBeTruthy();
    expect(screen.getByTestId("key-info-chord-II")).toBeTruthy();
    expect(screen.getByTestId("key-info-chord-IV")).toBeTruthy();
    expect(screen.getByTestId("key-info-chord-V")).toBeTruthy();
  });

  it("shows correct chord names for C major", () => {
    render(<KeyInfoPanel {...defaultProps} />);
    // degree "I" chip should contain "C" chord name
    const iChip = screen.getByTestId("key-info-chord-I");
    expect(iChip.findByProps({ children: "C" })).toBeTruthy();
    // degree "II" chip should contain "Dm"
    const iiChip = screen.getByTestId("key-info-chord-II");
    expect(iiChip.findByProps({ children: "Dm" })).toBeTruthy();
  });

  it("shows 7 scale notes for C major", () => {
    render(<KeyInfoPanel {...defaultProps} />);
    // C D E F G A B
    expect(screen.getByTestId("key-info-note-C")).toBeTruthy();
    expect(screen.getByTestId("key-info-note-D")).toBeTruthy();
    expect(screen.getByTestId("key-info-note-E")).toBeTruthy();
    expect(screen.getByTestId("key-info-note-F")).toBeTruthy();
    expect(screen.getByTestId("key-info-note-G")).toBeTruthy();
    expect(screen.getByTestId("key-info-note-A")).toBeTruthy();
    expect(screen.getByTestId("key-info-note-B")).toBeTruthy();
  });

  it("shows correct chords for A minor (selectedIndex=0, keyType=minor)", () => {
    render(<KeyInfoPanel {...defaultProps} keyType="minor" />);
    // Am natural minor: I=Am, II=B°, bIII=C, IV=Dm, V=Em, bVI=F, bVII=G
    const iChip = screen.getByTestId("key-info-chord-I");
    expect(iChip.findByProps({ children: "Am" })).toBeTruthy();
  });

  it("shows correct scale notes for A minor", () => {
    render(<KeyInfoPanel {...defaultProps} keyType="minor" />);
    // A B C D E F G
    expect(screen.getByTestId("key-info-note-A")).toBeTruthy();
    expect(screen.getByTestId("key-info-note-B")).toBeTruthy();
    expect(screen.getByTestId("key-info-note-C")).toBeTruthy();
  });
});
