import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import TabBar from "../index";

jest.mock("react-native-svg", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children }: any) => <View>{children}</View>,
    Path: () => null,
    Text: () => null,
    Circle: () => null,
    Line: () => null,
  };
});

const defaultProps = {
  isDark: false,
  showQuiz: false,
  showStats: false,
  showFinder: false,
  insetBottom: 0,
  onPressHome: jest.fn(),
  onPressFinder: jest.fn(),
  onPressQuiz: jest.fn(),
  onPressStats: jest.fn(),
};

function renderTabBar(overrides: Partial<typeof defaultProps> = {}) {
  return render(<TabBar {...defaultProps} {...overrides} />);
}

describe("TabBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders 4 tab buttons", () => {
    renderTabBar();
    expect(screen.getByTestId("tab-home")).toBeTruthy();
    expect(screen.getByTestId("tab-finder")).toBeTruthy();
    expect(screen.getByTestId("tab-quiz")).toBeTruthy();
    expect(screen.getByTestId("tab-stats")).toBeTruthy();
  });

  it("onPressHome is called when home tab is pressed", () => {
    const onPressHome = jest.fn();
    renderTabBar({ onPressHome });
    fireEvent.press(screen.getByTestId("tab-home"));
    expect(onPressHome).toHaveBeenCalledTimes(1);
  });

  it("onPressQuiz is called when quiz tab is pressed", () => {
    const onPressQuiz = jest.fn();
    renderTabBar({ onPressQuiz });
    fireEvent.press(screen.getByTestId("tab-quiz"));
    expect(onPressQuiz).toHaveBeenCalledTimes(1);
  });

  it("onPressStats is called when stats tab is pressed", () => {
    const onPressStats = jest.fn();
    renderTabBar({ onPressStats });
    fireEvent.press(screen.getByTestId("tab-stats"));
    expect(onPressStats).toHaveBeenCalledTimes(1);
  });

  it("renders without crashing in dark mode", () => {
    expect(() => renderTabBar({ isDark: true })).not.toThrow();
  });

  it("renders without crashing when showQuiz is true", () => {
    expect(() => renderTabBar({ showQuiz: true })).not.toThrow();
  });

  it("renders without crashing when showStats is true", () => {
    expect(() => renderTabBar({ showStats: true })).not.toThrow();
  });

  it("onPressFinder is called when finder tab is pressed", () => {
    const onPressFinder = jest.fn();
    renderTabBar({ onPressFinder });
    fireEvent.press(screen.getByTestId("tab-finder"));
    expect(onPressFinder).toHaveBeenCalledTimes(1);
  });

  it("renders without crashing when showFinder is true", () => {
    expect(() => renderTabBar({ showFinder: true })).not.toThrow();
  });

  it("applies bottom inset padding", () => {
    const { toJSON } = renderTabBar({ insetBottom: 34 });
    const json = toJSON() as any;
    expect(json.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ paddingBottom: 34 })]),
    );
  });
});
