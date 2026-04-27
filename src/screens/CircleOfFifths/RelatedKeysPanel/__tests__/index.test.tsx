import React from "react";
import { render, screen } from "@testing-library/react-native";
import RelatedKeysPanel from "..";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("RelatedKeysPanel", () => {
  const defaultProps = {
    theme: "light" as const,
    accidental: "sharp" as const,
    selectedIndex: 0,
    keyType: "major" as const,
  };

  it("renders the panel", () => {
    render(<RelatedKeysPanel {...defaultProps} />);
    expect(screen.getByTestId("related-keys-panel")).toBeTruthy();
  });

  it("shows 5 related key cells", () => {
    render(<RelatedKeysPanel {...defaultProps} />);
    expect(screen.getByTestId("related-keys-cell-tonic")).toBeTruthy();
    expect(screen.getByTestId("related-keys-cell-dominant")).toBeTruthy();
    expect(screen.getByTestId("related-keys-cell-subdominant")).toBeTruthy();
    expect(screen.getByTestId("related-keys-cell-parallel")).toBeTruthy();
    expect(screen.getByTestId("related-keys-cell-doushu")).toBeTruthy();
  });

  it("shows C major's related keys correctly", () => {
    render(<RelatedKeysPanel {...defaultProps} />);
    // tonic = C, dominant = G, subdominant = F, parallel = Am, doushu = Cm
    const tonic = screen.getByTestId("related-keys-cell-tonic");
    expect(tonic.findByProps({ children: "C" })).toBeTruthy();
    const dominant = screen.getByTestId("related-keys-cell-dominant");
    expect(dominant.findByProps({ children: "G" })).toBeTruthy();
    const subdominant = screen.getByTestId("related-keys-cell-subdominant");
    expect(subdominant.findByProps({ children: "F" })).toBeTruthy();
    const parallel = screen.getByTestId("related-keys-cell-parallel");
    expect(parallel.findByProps({ children: "Am" })).toBeTruthy();
    const doushu = screen.getByTestId("related-keys-cell-doushu");
    expect(doushu.findByProps({ children: "Cm" })).toBeTruthy();
  });
});
