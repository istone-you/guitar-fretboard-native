import React from "react";
import { render } from "@testing-library/react-native";
import FretboardPane from "../FretboardPane";
import type {
  Accidental,
  BaseLabelMode,
  LayerConfig,
  QuizMode,
  QuizType,
  Theme,
} from "../../../types";
import type { QuizQuestion } from "../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
jest.mock("../../../i18n", () => ({ changeLocale: jest.fn() }));

jest.mock("../../NormalFretboard", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => <View testID="normal-fretboard" {...props} />,
  };
});

jest.mock("../../QuizFretboard", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => <View testID="quiz-fretboard" {...props} />,
  };
});

const baseQuestion: QuizQuestion = {
  stringIdx: 2,
  fret: 5,
  correct: "A",
  choices: ["A", "B", "C", "D"],
};

const defaultProps = {
  showQuiz: false,
  isLandscape: false,
  theme: "dark" as Theme,
  accidental: "sharp" as Accidental,
  baseLabelMode: "note" as BaseLabelMode,
  fretRange: [0, 14] as [number, number],
  rootNote: "C",
  quizEffectiveRootNote: "C",
  quizLayers: [] as LayerConfig[],
  quizAccentColor: "#3b82f6",
  quizQuestion: null as QuizQuestion | null,
  quizType: "choice" as QuizType,
  quizMode: "note" as QuizMode,
  quizAnsweredCell: null,
  quizCorrectCell: null,
  quizSelectedCells: [],
  quizRevealNoteNames: null,
  quizStrings: [0, 1, 2, 3, 4, 5],
  layers: [] as LayerConfig[],
  disableAnimation: false,
  cellEditMode: null as "hide" | "frame" | null,
  cellEditLayerId: null as string | null,
  editingCells: new Set<string>(),
  cellEditBounceKey: null as string | null,
  cellEditBounceTick: 0,
  onFretboardDoubleTap: jest.fn(),
  onQuizCellClick: jest.fn(),
  onCellToggle: jest.fn(),
};

function renderPane(overrides: Partial<typeof defaultProps> = {}) {
  return render(<FretboardPane {...defaultProps} {...overrides} />);
}

describe("FretboardPane", () => {
  it("renders NormalFretboard when showQuiz is false", () => {
    const { getByTestId, queryByTestId } = renderPane({ showQuiz: false });
    expect(getByTestId("normal-fretboard")).toBeTruthy();
    expect(queryByTestId("quiz-fretboard")).toBeNull();
  });

  it("renders QuizFretboard when showQuiz is true", () => {
    const { getByTestId, queryByTestId } = renderPane({ showQuiz: true });
    expect(getByTestId("quiz-fretboard")).toBeTruthy();
    expect(queryByTestId("normal-fretboard")).toBeNull();
  });

  it("passes quizCell when quizType is choice and mode is note", () => {
    const { getByTestId } = renderPane({
      showQuiz: true,
      quizQuestion: baseQuestion,
      quizType: "choice",
      quizMode: "note",
    });
    const fb = getByTestId("quiz-fretboard");
    expect(fb.props.quizCell).toEqual({ stringIdx: 2, fret: 5 });
  });

  it("does not pass quizCell when quizType is fretboard", () => {
    const { getByTestId } = renderPane({
      showQuiz: true,
      quizQuestion: baseQuestion,
      quizType: "fretboard",
      quizMode: "note",
    });
    const fb = getByTestId("quiz-fretboard");
    expect(fb.props.quizCell).toBeUndefined();
  });

  it("does not pass quizCell when quizMode is chord", () => {
    const { getByTestId } = renderPane({
      showQuiz: true,
      quizQuestion: baseQuestion,
      quizType: "choice",
      quizMode: "chord",
    });
    const fb = getByTestId("quiz-fretboard");
    expect(fb.props.quizCell).toBeUndefined();
  });

  it("does not pass quizCell when quizMode is scale", () => {
    const { getByTestId } = renderPane({
      showQuiz: true,
      quizQuestion: baseQuestion,
      quizType: "choice",
      quizMode: "scale",
    });
    const fb = getByTestId("quiz-fretboard");
    expect(fb.props.quizCell).toBeUndefined();
  });

  it("does not pass quizCell when quizMode is diatonic", () => {
    const { getByTestId } = renderPane({
      showQuiz: true,
      quizQuestion: baseQuestion,
      quizType: "choice",
      quizMode: "diatonic",
    });
    const fb = getByTestId("quiz-fretboard");
    expect(fb.props.quizCell).toBeUndefined();
  });

  it("passes quizTargetString when single string mode", () => {
    const { getByTestId } = renderPane({
      showQuiz: true,
      quizQuestion: baseQuestion,
      quizType: "fretboard",
      quizMode: "note",
      quizStrings: [2],
    });
    const fb = getByTestId("quiz-fretboard");
    expect(fb.props.quizTargetString).toBe(2);
  });

  it("does not pass quizTargetString when multi-string mode", () => {
    const { getByTestId } = renderPane({
      showQuiz: true,
      quizQuestion: baseQuestion,
      quizType: "fretboard",
      quizMode: "note",
      quizStrings: [0, 1, 2, 3, 4, 5],
    });
    const fb = getByTestId("quiz-fretboard");
    expect(fb.props.quizTargetString).toBeUndefined();
  });

  it("does not pass quizTargetString when quizType is choice", () => {
    const { getByTestId } = renderPane({
      showQuiz: true,
      quizQuestion: baseQuestion,
      quizType: "choice",
      quizMode: "note",
      quizStrings: [0, 1, 2, 3, 4, 5],
    });
    const fb = getByTestId("quiz-fretboard");
    expect(fb.props.quizTargetString).toBeUndefined();
  });

  it("does not pass quizTargetString when quizMode is chord", () => {
    const { getByTestId } = renderPane({
      showQuiz: true,
      quizQuestion: baseQuestion,
      quizType: "fretboard",
      quizMode: "chord",
      quizStrings: [0, 1, 2, 3, 4, 5],
    });
    const fb = getByTestId("quiz-fretboard");
    expect(fb.props.quizTargetString).toBeUndefined();
  });

  it("passes rootNote to NormalFretboard", () => {
    const { getByTestId } = renderPane({ showQuiz: false, rootNote: "G" });
    expect(getByTestId("normal-fretboard").props.rootNote).toBe("G");
  });

  it("passes quizEffectiveRootNote to QuizFretboard", () => {
    const { getByTestId } = renderPane({ showQuiz: true, quizEffectiveRootNote: "D" });
    expect(getByTestId("quiz-fretboard").props.rootNote).toBe("D");
  });
});
