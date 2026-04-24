import React from "react";
import { render, screen } from "@testing-library/react-native";
import ModalInterchangePanel from "..";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("ModalInterchangePanel", () => {
  const defaultProps = {
    theme: "light" as const,
    accidental: "flat" as const,
    selectedIndex: 0,
    keyType: "major" as const,
  };

  it("renders the panel", () => {
    render(<ModalInterchangePanel {...defaultProps} />);
    expect(screen.getByTestId("modal-interchange-panel")).toBeTruthy();
  });

  it("shows 5 borrowed chord chips for C major", () => {
    render(<ModalInterchangePanel {...defaultProps} />);
    expect(screen.getByTestId("modal-interchange-panel-IIm(-5)")).toBeTruthy();
    expect(screen.getByTestId("modal-interchange-panel-♭III")).toBeTruthy();
    expect(screen.getByTestId("modal-interchange-panel-IVm")).toBeTruthy();
    expect(screen.getByTestId("modal-interchange-panel-♭VI")).toBeTruthy();
    expect(screen.getByTestId("modal-interchange-panel-♭VII")).toBeTruthy();
  });

  it("shows correct chord names for C major borrowed chords", () => {
    render(<ModalInterchangePanel {...defaultProps} />);
    // ♭III = E♭
    const flatIII = screen.getByTestId("modal-interchange-panel-♭III");
    expect(flatIII.findByProps({ children: "E♭" })).toBeTruthy();
    // IVm = Fm
    const iv = screen.getByTestId("modal-interchange-panel-IVm");
    expect(iv.findByProps({ children: "Fm" })).toBeTruthy();
    // ♭VI = A♭
    const flatVI = screen.getByTestId("modal-interchange-panel-♭VI");
    expect(flatVI.findByProps({ children: "A♭" })).toBeTruthy();
    // ♭VII = B♭
    const flatVII = screen.getByTestId("modal-interchange-panel-♭VII");
    expect(flatVII.findByProps({ children: "B♭" })).toBeTruthy();
  });

  it("shows V as borrowed chord for A minor (from parallel major)", () => {
    render(<ModalInterchangePanel {...defaultProps} keyType="minor" />);
    const v = screen.getByTestId("modal-interchange-panel-V");
    expect(v.findByProps({ children: "E" })).toBeTruthy();
  });
});
