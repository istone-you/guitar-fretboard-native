import React from "react";
import { render, screen } from "@testing-library/react-native";
import RangeSlider from "../index";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light" },
}));

const defaultProps = {
  value: [2, 10] as [number, number],
  min: 0,
  max: 14,
  onChange: jest.fn(),
  isDark: false,
};

describe("RangeSlider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    expect(() => render(<RangeSlider {...defaultProps} />)).not.toThrow();
  });

  it("displays the min thumb value", () => {
    render(<RangeSlider {...defaultProps} value={[3, 11]} />);
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("displays the max thumb value", () => {
    render(<RangeSlider {...defaultProps} value={[3, 11]} />);
    expect(screen.getByText("11")).toBeTruthy();
  });

  it("renders in dark mode without crashing", () => {
    expect(() => render(<RangeSlider {...defaultProps} isDark />)).not.toThrow();
  });

  it("renders with min value of 0", () => {
    render(<RangeSlider {...defaultProps} value={[0, 14]} />);
    expect(screen.getByText("0")).toBeTruthy();
    expect(screen.getByText("14")).toBeTruthy();
  });
});
