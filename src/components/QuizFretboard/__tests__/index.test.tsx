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
  showChord: false,
  chordDisplayMode: "form" as const,
  showScale: true,
  scaleType: "major" as const,
  showCaged: false,
  cagedForms: new Set<string>(),
  chordType: "Major" as const,
  triadPosition: "1-3",
  diatonicScaleType: "major",
  diatonicDegree: "I",
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
        chordType: "Major",
      }),
    );
  });

  it("forces showScale to false", () => {
    render(<QuizFretboard {...baseProps} showScale={true} />);
    expect(mockFretboard).toHaveBeenCalledWith(expect.objectContaining({ showScale: false }));
  });

  it("forces showCaged to false", () => {
    render(<QuizFretboard {...baseProps} showCaged={true} />);
    expect(mockFretboard).toHaveBeenCalledWith(expect.objectContaining({ showCaged: false }));
  });

  it("forces highlightedDegrees to empty Set", () => {
    render(<QuizFretboard {...baseProps} highlightedDegrees={new Set(["P1", "P5"])} />);
    const passedProps = mockFretboard.mock.calls[0][0];
    expect(passedProps.highlightedDegrees.size).toBe(0);
  });

  it("forces suppressRegularDisplay to true", () => {
    render(<QuizFretboard {...baseProps} />);
    expect(mockFretboard).toHaveBeenCalledWith(
      expect.objectContaining({ suppressRegularDisplay: true }),
    );
  });

  it("hides chord note labels when showChord is true and quizAnswerMode is false", () => {
    render(<QuizFretboard {...baseProps} showChord={true} quizAnswerMode={false} />);
    expect(mockFretboard).toHaveBeenCalledWith(
      expect.objectContaining({ hideChordNoteLabels: true }),
    );
  });

  it("shows chord note labels when showChord is true and quizAnswerMode is true", () => {
    render(<QuizFretboard {...baseProps} showChord={true} quizAnswerMode={true} />);
    expect(mockFretboard).toHaveBeenCalledWith(
      expect.objectContaining({ hideChordNoteLabels: false }),
    );
  });

  it("does not hide chord note labels when showChord is false", () => {
    render(<QuizFretboard {...baseProps} showChord={false} quizAnswerMode={false} />);
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

  it("passes custom color props through", () => {
    render(
      <QuizFretboard
        {...baseProps}
        chordColor="#ff0000"
        scaleColor="#00ff00"
        cagedColor="#0000ff"
      />,
    );
    expect(mockFretboard).toHaveBeenCalledWith(
      expect.objectContaining({
        chordColor: "#ff0000",
        scaleColor: "#00ff00",
        cagedColor: "#0000ff",
      }),
    );
  });
});
