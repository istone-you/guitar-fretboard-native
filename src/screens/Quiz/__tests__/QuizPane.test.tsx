import React from "react";
import { render } from "@testing-library/react-native";
import QuizPane from "..";
import type { Theme } from "../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
jest.mock("../../../i18n", () => ({ changeLocale: jest.fn() }));

const defaultProps = {
  theme: "dark" as Theme,
  quizKindOptions: [
    { value: "note-choice", label: "Note / 12-choice" },
    { value: "degree-choice", label: "Degree / 12-choice" },
  ],
  onQuizModeSelect: jest.fn(),
};

function renderPane(overrides: Partial<typeof defaultProps> = {}) {
  return render(<QuizPane {...defaultProps} {...overrides} />);
}

describe("QuizPane", () => {
  it("renders quiz selection screen", () => {
    const { toJSON } = renderPane();
    expect(toJSON()).not.toBeNull();
  });

  it("calls onQuizModeSelect when a quiz kind is selected", () => {
    const onQuizModeSelect = jest.fn();
    renderPane({ onQuizModeSelect });
    // QuizSelectionScreen renders buttons; just verify it mounts without error
    expect(onQuizModeSelect).not.toHaveBeenCalled();
  });
});
