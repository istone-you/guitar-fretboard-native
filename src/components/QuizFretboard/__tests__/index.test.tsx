import React from "react";
import { render } from "@testing-library/react-native";
import QuizFretboard from "../index";

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

describe("QuizFretboard", () => {
  it("renders the Fretboard component", () => {
    const { getByTestId } = render(<QuizFretboard {...baseProps} />);
    expect(getByTestId("fretboard")).toBeTruthy();
  });

  it("passes all base props through to Fretboard", () => {
    render(<QuizFretboard {...baseProps} />);
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

  it("forces suppressRegularDisplay to true", () => {
    render(<QuizFretboard {...baseProps} />);
    expect(mockFretboard).toHaveBeenCalledWith(
      expect.objectContaining({ suppressRegularDisplay: true }),
    );
  });

  it("hides chord note labels when chord layer is enabled and quizAnswerMode is false", () => {
    const chordLayer = {
      id: "l1",
      type: "chord" as const,
      enabled: true,
      color: "#ffd700",
      chordDisplayMode: "form" as const,
      chordType: "Major" as const,
      onChordName: "C/E",
      triadInversion: "root" as const,
      diatonicKeyType: "major" as const,
      diatonicChordSize: "triad" as const,
      diatonicDegree: "I",
      cagedForms: new Set<string>(),
      scaleType: "major" as const,
      customMode: "note" as const,
      selectedNotes: new Set<string>(),
      selectedDegrees: new Set<string>(),
      hiddenCells: new Set<string>(),
      chordFrames: [],
    };
    render(<QuizFretboard {...baseProps} layers={[chordLayer]} quizAnswerMode={false} />);
    expect(mockFretboard).toHaveBeenCalledWith(
      expect.objectContaining({ hideChordNoteLabels: true }),
    );
  });

  it("shows chord note labels when chord layer is enabled and quizAnswerMode is true", () => {
    const chordLayer = {
      id: "l1",
      type: "chord" as const,
      enabled: true,
      color: "#ffd700",
      chordDisplayMode: "form" as const,
      chordType: "Major" as const,
      onChordName: "C/E",
      triadInversion: "root" as const,
      diatonicKeyType: "major" as const,
      diatonicChordSize: "triad" as const,
      diatonicDegree: "I",
      cagedForms: new Set<string>(),
      scaleType: "major" as const,
      customMode: "note" as const,
      selectedNotes: new Set<string>(),
      selectedDegrees: new Set<string>(),
      hiddenCells: new Set<string>(),
      chordFrames: [],
    };
    render(<QuizFretboard {...baseProps} layers={[chordLayer]} quizAnswerMode={true} />);
    expect(mockFretboard).toHaveBeenCalledWith(
      expect.objectContaining({ hideChordNoteLabels: false }),
    );
  });

  it("does not hide chord note labels when no chord layer exists", () => {
    render(<QuizFretboard {...baseProps} layers={[]} quizAnswerMode={false} />);
    expect(mockFretboard).toHaveBeenCalledWith(
      expect.objectContaining({ hideChordNoteLabels: false }),
    );
  });

  it("passes quiz-specific props through", () => {
    const quizCell = { stringIdx: 2, fret: 5 };
    const answeredCell = { stringIdx: 2, fret: 5 };
    const correctCell = { stringIdx: 2, fret: 5 };
    const onQuizCellClick = jest.fn();

    render(
      <QuizFretboard
        {...baseProps}
        quizModeActive={true}
        quizCell={quizCell}
        quizAnswerMode={true}
        quizTargetString={3}
        quizAnsweredCell={answeredCell}
        quizCorrectCell={correctCell}
        onQuizCellClick={onQuizCellClick}
      />,
    );
    expect(mockFretboard).toHaveBeenCalledWith(
      expect.objectContaining({
        quizModeActive: true,
        quizCell: quizCell,
        quizAnswerMode: true,
        quizTargetString: 3,
        quizAnsweredCell: answeredCell,
        quizCorrectCell: correctCell,
        onQuizCellClick: onQuizCellClick,
      }),
    );
  });

  it("passes quizSelectedCells through", () => {
    const selectedCells = [
      { stringIdx: 0, fret: 3 },
      { stringIdx: 1, fret: 5 },
    ];
    render(<QuizFretboard {...baseProps} quizSelectedCells={selectedCells} />);
    expect(mockFretboard).toHaveBeenCalledWith(
      expect.objectContaining({ quizSelectedCells: selectedCells }),
    );
  });

  it("passes quizRevealNoteNames through", () => {
    render(<QuizFretboard {...baseProps} quizRevealNoteNames={["C", "E", "G"]} />);
    expect(mockFretboard).toHaveBeenCalledWith(
      expect.objectContaining({ quizRevealNoteNames: ["C", "E", "G"] }),
    );
  });

  it("passes onNoteClick through", () => {
    const onNoteClick = jest.fn();
    render(<QuizFretboard {...baseProps} onNoteClick={onNoteClick} />);
    expect(mockFretboard).toHaveBeenCalledWith(expect.objectContaining({ onNoteClick }));
  });

  it("passes quizColor prop through", () => {
    render(<QuizFretboard {...baseProps} quizColor="#ff0000" />);
    expect(mockFretboard).toHaveBeenCalledWith(
      expect.objectContaining({
        quizColor: "#ff0000",
      }),
    );
  });
});
