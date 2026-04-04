import React from "react";
import { render } from "@testing-library/react-native";
import NormalFretboard from "../index";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

jest.mock("../../../i18n", () => ({}));

const mockFretboard = jest.fn((_props: any) => {
  const { View } = require("react-native");
  return <View testID="fretboard" />;
});

jest.mock("../../ui/Fretboard", () => ({
  __esModule: true,
  default: (props: any) => mockFretboard(props),
}));

const baseProps = {
  theme: "dark" as const,
  rootNote: "C",
  accidental: "sharp" as const,
  baseLabelMode: "note" as const,
  fretRange: [0, 14] as [number, number],
  onNoteClick: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("NormalFretboard", () => {
  it("renders the Fretboard component", () => {
    const { getByTestId } = render(<NormalFretboard {...baseProps} />);
    expect(getByTestId("fretboard")).toBeTruthy();
  });

  it("passes all props through to Fretboard", () => {
    render(<NormalFretboard {...baseProps} />);
    expect(mockFretboard).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: "dark",
        rootNote: "C",
        accidental: "sharp",
        baseLabelMode: "note",
        fretRange: [0, 14],
      }),
    );
  });

  it("forces quizModeActive to false", () => {
    render(<NormalFretboard {...baseProps} />);
    expect(mockFretboard).toHaveBeenCalledWith(expect.objectContaining({ quizModeActive: false }));
  });

  it("forces quizCell to undefined", () => {
    render(<NormalFretboard {...baseProps} />);
    expect(mockFretboard).toHaveBeenCalledWith(expect.objectContaining({ quizCell: undefined }));
  });

  it("forces quizAnswerMode to false", () => {
    render(<NormalFretboard {...baseProps} />);
    expect(mockFretboard).toHaveBeenCalledWith(expect.objectContaining({ quizAnswerMode: false }));
  });

  it("forces quizTargetString to undefined", () => {
    render(<NormalFretboard {...baseProps} />);
    expect(mockFretboard).toHaveBeenCalledWith(
      expect.objectContaining({ quizTargetString: undefined }),
    );
  });

  it("forces quizAnsweredCell to null", () => {
    render(<NormalFretboard {...baseProps} />);
    expect(mockFretboard).toHaveBeenCalledWith(expect.objectContaining({ quizAnsweredCell: null }));
  });

  it("forces quizCorrectCell to null", () => {
    render(<NormalFretboard {...baseProps} />);
    expect(mockFretboard).toHaveBeenCalledWith(expect.objectContaining({ quizCorrectCell: null }));
  });

  it("forces onQuizCellClick to undefined", () => {
    render(<NormalFretboard {...baseProps} />);
    expect(mockFretboard).toHaveBeenCalledWith(
      expect.objectContaining({ onQuizCellClick: undefined }),
    );
  });

  it("forces suppressRegularDisplay to false", () => {
    render(<NormalFretboard {...baseProps} />);
    expect(mockFretboard).toHaveBeenCalledWith(
      expect.objectContaining({ suppressRegularDisplay: false }),
    );
  });

  it("passes layers prop through", () => {
    render(<NormalFretboard {...baseProps} layers={[]} />);
    expect(mockFretboard).toHaveBeenCalledWith(
      expect.objectContaining({
        layers: [],
      }),
    );
  });
});
