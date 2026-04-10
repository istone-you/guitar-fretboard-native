import React from "react";
import { render, screen } from "@testing-library/react-native";
import QuizActivePracticePane from "../index";
import type {
  Accidental,
  BaseLabelMode,
  ChordType,
  QuizMode,
  QuizType,
  ScaleType,
  Theme,
} from "../../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../../../../components/QuizFretboard", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View testID="quiz-fretboard" /> };
});

jest.mock("../../../../components/QuizPanel", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View testID="quiz-panel" /> };
});

jest.mock("../../../../components/ui/PracticePane", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ fretboard, children, fretboardHidden }: any) => (
      <View testID={fretboardHidden ? "practice-pane-hidden" : "practice-pane"}>
        {fretboard}
        {children}
      </View>
    ),
  };
});

const defaultProps = {
  isLandscape: false,
  theme: "light" as Theme,
  accidental: "sharp" as Accidental,
  baseLabelMode: "note" as BaseLabelMode,
  fretRange: [0, 12] as [number, number],
  quizEffectiveRootNote: "C",
  quizLayers: [],
  quizAccentColor: "#ff0000",
  quizQuestion: { stringIdx: 2, fret: 5, correct: "A", choices: [] },
  quizType: "choice" as QuizType,
  quizMode: "note" as QuizMode,
  quizAnsweredCell: null,
  quizCorrectCell: null,
  quizSelectedCells: [],
  quizRevealNoteNames: null,
  quizStrings: [0, 1, 2, 3, 4, 5],
  leftHanded: false,
  onFretboardDoubleTap: jest.fn(),
  onQuizCellClick: jest.fn(),
  quizScore: { correct: 0, total: 0 },
  selectedAnswer: null,
  rootNote: "C",
  quizSelectedChoices: [],
  noteOptions: [],
  quizSelectedChordRoot: null,
  quizSelectedChordType: null as ChordType | null,
  diatonicSelectedRoot: null,
  diatonicSelectedChordType: null as ChordType | null,
  diatonicAllAnswers: {} as Record<string, { root: string; chordType: ChordType }>,
  diatonicEditingDegree: null,
  diatonicQuizKeyType: "major" as const,
  diatonicQuizChordSize: "triad" as const,
  chordQuizTypes: [] as ChordType[],
  availableChordQuizTypes: [] as ChordType[],
  scaleType: "major" as ScaleType,
  quizKeys: [],
  onQuizKeysChange: jest.fn(),
  quizNoteNames: [],
  onQuizNoteNamesChange: jest.fn(),
  onChordQuizTypesChange: jest.fn(),
  onScaleTypeChange: jest.fn(),
  onDiatonicQuizKeyTypeChange: jest.fn(),
  onDiatonicQuizChordSizeChange: jest.fn(),
  onAnswer: jest.fn(),
  onSubmitChoice: jest.fn(),
  onChordQuizRootSelect: jest.fn(),
  onChordQuizTypeSelect: jest.fn(),
  onSubmitChordChoice: jest.fn(),
  onDiatonicAnswerRootSelect: jest.fn(),
  onDiatonicAnswerTypeSelect: jest.fn(),
  onDiatonicDegreeCardClick: jest.fn(),
  onDiatonicSubmitAll: jest.fn(),
  onSubmitFretboard: jest.fn(),
  onNextQuestion: jest.fn(),
  onRetryQuestion: jest.fn(),
  onQuizStringsChange: jest.fn(),
};

describe("QuizActivePracticePane", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders null when quizQuestion is null", () => {
    const { toJSON } = render(<QuizActivePracticePane {...defaultProps} quizQuestion={null} />);
    expect(toJSON()).toBeNull();
  });

  it("renders PracticePane when quizQuestion is provided", () => {
    render(<QuizActivePracticePane {...defaultProps} />);
    expect(screen.getByTestId("practice-pane")).toBeTruthy();
  });

  it("renders QuizFretboard", () => {
    render(<QuizActivePracticePane {...defaultProps} />);
    expect(screen.getByTestId("quiz-fretboard")).toBeTruthy();
  });

  it("renders QuizPanel", () => {
    render(<QuizActivePracticePane {...defaultProps} />);
    expect(screen.getByTestId("quiz-panel")).toBeTruthy();
  });

  it("hides fretboard when quizMode is diatonic", () => {
    render(<QuizActivePracticePane {...defaultProps} quizMode="diatonic" />);
    expect(screen.getByTestId("practice-pane-hidden")).toBeTruthy();
  });

  it("hides fretboard when quizMode is scale and quizType is choice", () => {
    render(<QuizActivePracticePane {...defaultProps} quizMode="scale" quizType="choice" />);
    expect(screen.getByTestId("practice-pane-hidden")).toBeTruthy();
  });

  it("shows fretboard when quizMode is scale and quizType is fretboard", () => {
    render(<QuizActivePracticePane {...defaultProps} quizMode="scale" quizType="fretboard" />);
    expect(screen.getByTestId("practice-pane")).toBeTruthy();
  });

  it("shows fretboard for note mode choice", () => {
    render(<QuizActivePracticePane {...defaultProps} quizMode="note" quizType="choice" />);
    expect(screen.getByTestId("practice-pane")).toBeTruthy();
  });

  it("renders without crashing in landscape mode", () => {
    expect(() => render(<QuizActivePracticePane {...defaultProps} isLandscape />)).not.toThrow();
  });

  it("renders without crashing in dark theme", () => {
    expect(() => render(<QuizActivePracticePane {...defaultProps} theme="dark" />)).not.toThrow();
  });
});
