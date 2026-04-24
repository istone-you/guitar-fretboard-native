import React from "react";
import { render, screen } from "@testing-library/react-native";
import DominantsPanel from "..";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("DominantsPanel", () => {
  const defaultProps = {
    theme: "light" as const,
    accidental: "sharp" as const,
    selectedIndex: 0,
    keyType: "major" as const,
  };

  it("renders the panel", () => {
    render(<DominantsPanel {...defaultProps} />);
    expect(screen.getByTestId("dominants-panel")).toBeTruthy();
  });

  it("shows V/I secondary dominant chip for C major", () => {
    render(<DominantsPanel {...defaultProps} />);
    expect(screen.getByTestId("dominants-panel-secdom-I")).toBeTruthy();
  });

  it("shows G7 as V/I for C major", () => {
    render(<DominantsPanel {...defaultProps} />);
    const chip = screen.getByTestId("dominants-panel-secdom-I");
    expect(chip.findByProps({ children: "G7" })).toBeTruthy();
  });
});
