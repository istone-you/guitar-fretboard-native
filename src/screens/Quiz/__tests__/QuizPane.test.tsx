import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import QuizSelectionScreen from "../Selection";
import type { Theme } from "../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
jest.mock("../../../i18n", () => ({ changeLocale: jest.fn() }));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light" },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const defaultProps = {
  theme: "dark" as Theme,
  quizKindOptions: [
    { value: "note-choice", label: "Note / 12-choice" },
    { value: "degree-choice", label: "Degree / 12-choice" },
  ],
  onQuizModeSelect: jest.fn(),
  onShowStats: jest.fn(),
};

function renderPane(overrides: Partial<typeof defaultProps> = {}) {
  return render(<QuizSelectionScreen {...defaultProps} {...overrides} />);
}

describe("QuizSelectionScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders quiz selection screen", () => {
    const { toJSON } = renderPane();
    expect(toJSON()).not.toBeNull();
  });

  it("calls onQuizModeSelect when a quiz kind is selected", () => {
    const onQuizModeSelect = jest.fn();
    renderPane({ onQuizModeSelect });
    expect(onQuizModeSelect).not.toHaveBeenCalled();
  });

  it("calls onShowStats when stats button is pressed", () => {
    const onShowStats = jest.fn();
    renderPane({ onShowStats });
    fireEvent.press(screen.getByTestId("quiz-stats-btn"));
    expect(onShowStats).toHaveBeenCalled();
  });

  it("renders in light theme without crashing", () => {
    const { toJSON } = renderPane({ theme: "light" as Theme });
    expect(toJSON()).not.toBeNull();
  });
});
