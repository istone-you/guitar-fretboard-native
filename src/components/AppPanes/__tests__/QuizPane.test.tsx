import React from "react";
import { render } from "@testing-library/react-native";
import QuizPane from "../QuizPane";
import type { ChordType, QuizMode, QuizType, ScaleType, Theme, QuizQuestion } from "../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
jest.mock("../../../i18n", () => ({ changeLocale: jest.fn() }));

jest.mock("../../QuizPanel", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => <View testID="quiz-panel" {...props} />,
  };
});

const baseQuestion: QuizQuestion = {
  stringIdx: 1,
  fret: 3,
  correct: "C",
  choices: ["C", "D", "E", "F"],
};

const defaultProps = {
  showQuiz: true,
  theme: "dark" as Theme,
  quizMode: "note" as QuizMode,
  quizType: "choice" as QuizType,
  quizQuestion: baseQuestion as QuizQuestion | null,
  quizScore: { correct: 0, total: 0 },
  selectedAnswer: null as string | null,
  rootNote: "C",
  quizSelectedChoices: [] as string[],
  noteOptions: ["C", "D", "E", "F", "G", "A", "B"],
  quizSelectedChordRoot: null as string | null,
  quizSelectedChordType: null as ChordType | null,
  diatonicSelectedRoot: null as string | null,
  diatonicSelectedChordType: null as ChordType | null,
  diatonicAllAnswers: {} as Record<string, { root: string; chordType: ChordType }>,
  diatonicEditingDegree: null as string | null,
  diatonicQuizKeyType: "major" as const,
  diatonicQuizChordSize: "triad" as const,
  chordQuizTypes: ["Major", "Minor"] as ChordType[],
  availableChordQuizTypes: ["Major", "Minor", "7th"] as ChordType[],
  scaleType: "major" as ScaleType,
  quizSelectedCells: [] as { stringIdx: number; fret: number }[],
  fretboardAllStrings: false,
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
  onFretboardAllStringsChange: jest.fn(),
};

function renderPane(overrides: Partial<typeof defaultProps> = {}) {
  return render(<QuizPane {...defaultProps} {...overrides} />);
}

describe("QuizPane", () => {
  it("returns null when showQuiz is false", () => {
    const { toJSON } = renderPane({ showQuiz: false });
    expect(toJSON()).toBeNull();
  });

  it("returns null when quizQuestion is null", () => {
    const { toJSON } = renderPane({ showQuiz: true, quizQuestion: null });
    expect(toJSON()).toBeNull();
  });

  it("renders QuizPanel when showQuiz is true and quizQuestion exists", () => {
    const { getByTestId } = renderPane({ showQuiz: true, quizQuestion: baseQuestion });
    expect(getByTestId("quiz-panel")).toBeTruthy();
  });

  it("passes theme and mode props to QuizPanel", () => {
    const { getByTestId } = renderPane({
      showQuiz: true,
      quizQuestion: baseQuestion,
      theme: "light",
      quizMode: "degree",
    });
    const panel = getByTestId("quiz-panel");
    expect(panel.props.theme).toBe("light");
    expect(panel.props.mode).toBe("degree");
  });

  it("passes score to QuizPanel", () => {
    const score = { correct: 3, total: 5 };
    const { getByTestId } = renderPane({
      showQuiz: true,
      quizQuestion: baseQuestion,
      quizScore: score,
    });
    const panel = getByTestId("quiz-panel");
    expect(panel.props.score).toEqual(score);
  });
});
