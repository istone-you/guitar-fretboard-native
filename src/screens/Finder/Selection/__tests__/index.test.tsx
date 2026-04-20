import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import FinderSelection from "..";
import type { Theme } from "../../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../../../i18n", () => ({}));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light" },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../../../components/ui/Icon", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View /> };
});

const defaultProps = {
  theme: "dark" as Theme,
  onSelect: jest.fn(),
};

describe("FinderSelection (mode selection page)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    const { toJSON } = render(<FinderSelection {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it("shows identify card title", () => {
    render(<FinderSelection {...defaultProps} />);
    expect(screen.getByText("finder.homeIdentifyTitle")).toBeTruthy();
  });

  it("shows chord list card title", () => {
    render(<FinderSelection {...defaultProps} />);
    expect(screen.getByText("finder.homeChordListTitle")).toBeTruthy();
  });

  it("shows identify card description", () => {
    render(<FinderSelection {...defaultProps} />);
    expect(screen.getByText("finder.homeIdentifyDesc")).toBeTruthy();
  });

  it("shows chord list card description", () => {
    render(<FinderSelection {...defaultProps} />);
    expect(screen.getByText("finder.homeChordListDesc")).toBeTruthy();
  });

  it("calls onSelect('identify') when identify card is pressed", () => {
    render(<FinderSelection {...defaultProps} />);
    fireEvent.press(screen.getByText("finder.homeIdentifyTitle"));
    expect(defaultProps.onSelect).toHaveBeenCalledWith("identify");
  });

  it("calls onSelect('chord-list') when chord list card is pressed", () => {
    render(<FinderSelection {...defaultProps} />);
    fireEvent.press(screen.getByText("finder.homeChordListTitle"));
    expect(defaultProps.onSelect).toHaveBeenCalledWith("chord-list");
  });

  it("renders in light theme without crashing", () => {
    const { toJSON } = render(<FinderSelection {...defaultProps} theme="light" />);
    expect(toJSON()).toBeTruthy();
  });
});
