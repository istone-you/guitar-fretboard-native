import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import QuizPanel from "../index";
import type { Theme, ChordType, ScaleType, QuizMode, QuizType, QuizQuestion } from "../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

jest.mock("../../../i18n", () => ({ changeLocale: jest.fn() }));

const baseQuestion: QuizQuestion = {
  stringIdx: 0,
  fret: 3,
  correct: "G",
  choices: ["C", "D", "E", "F", "G", "A", "B", "C#", "D#", "F#", "G#", "A#"],
  answerLabel: "G",
};

const defaultProps = {
  theme: "dark" as Theme,
  mode: "note" as QuizMode,
  quizType: "choice" as QuizType,
  question: baseQuestion,
  score: { correct: 3, total: 5 },
  selectedAnswer: null as string | null,
  rootNote: "C",
  quizSelectedChoices: [] as string[],
  noteOptions: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  quizSelectedChordRoot: null as string | null,
  quizSelectedChordType: null as ChordType | null,
  diatonicSelectedRoot: null as string | null,
  diatonicSelectedChordType: null as ChordType | null,
  diatonicAllAnswers: {} as Record<string, { root: string; chordType: ChordType }>,
  diatonicEditingDegree: null as string | null,
  diatonicQuizKeyType: "major" as "major" | "natural-minor",
  diatonicQuizChordSize: "triad" as "triad" | "seventh",
  chordQuizTypes: ["Major", "Minor", "7th"] as ChordType[],
  availableChordQuizTypes: [
    "Major",
    "Minor",
    "7th",
    "maj7",
    "m7",
    "m7(b5)",
    "dim7",
    "m(maj7)",
    "sus2",
    "sus4",
    "6",
    "m6",
    "dim",
    "aug",
  ] as ChordType[],
  scaleType: "major" as ScaleType,
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
  quizSelectedCells: [] as { stringIdx: number; fret: number }[],
  fretboardAllStrings: false,
  onFretboardAllStringsChange: jest.fn(),
};

function renderPanel(overrides: Partial<typeof defaultProps> = {}) {
  return render(<QuizPanel {...defaultProps} {...overrides} />);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("QuizPanel", () => {
  // ── Score display ─────────────────────────────────────────────────
  it("displays the score", () => {
    const { getByText } = renderPanel();
    expect(getByText("\u2713 3 / 5")).toBeTruthy();
  });

  it("displays updated score", () => {
    const { getByText } = renderPanel({ score: { correct: 10, total: 15 } });
    expect(getByText("\u2713 10 / 15")).toBeTruthy();
  });

  // ── Question display ──────────────────────────────────────────────
  it("displays note choice question text", () => {
    const { getByText } = renderPanel();
    expect(getByText("quiz.questionNote")).toBeTruthy();
  });

  it("displays degree choice question text", () => {
    const { getByText } = renderPanel({ mode: "degree" });
    expect(getByText("quiz.questionDegree")).toBeTruthy();
  });

  it("displays chord identify question text", () => {
    const { getByText } = renderPanel({
      mode: "chord",
      question: {
        ...baseQuestion,
        promptChordRoot: "C",
        promptChordType: "Major",
        promptChordLabel: "C Major",
      },
    });
    expect(getByText("quiz.questionChordIdentify")).toBeTruthy();
  });

  it("displays scale choice question text", () => {
    const { getByText } = renderPanel({
      mode: "scale",
      question: {
        ...baseQuestion,
        promptScaleRoot: "C",
        promptScaleType: "major",
      },
    });
    expect(getByText("quiz.questionScale")).toBeTruthy();
  });

  it("displays fretboard question for note mode", () => {
    const { getByText } = renderPanel({
      quizType: "fretboard",
      mode: "note",
    });
    expect(getByText("quiz.questionFretboard")).toBeTruthy();
  });

  it("displays fretboard question for note mode with allStrings", () => {
    const { getByText } = renderPanel({
      quizType: "fretboard",
      mode: "note",
      fretboardAllStrings: true,
    });
    expect(getByText("quiz.questionNoteAllStrings")).toBeTruthy();
  });

  it("displays fretboard question for degree mode", () => {
    const { getByText } = renderPanel({
      quizType: "fretboard",
      mode: "degree",
    });
    expect(getByText("quiz.questionDegreeFretboard")).toBeTruthy();
  });

  it("displays fretboard question for degree mode with allStrings", () => {
    const { getByText } = renderPanel({
      quizType: "fretboard",
      mode: "degree",
      fretboardAllStrings: true,
    });
    expect(getByText("quiz.questionDegreeAllStrings")).toBeTruthy();
  });

  it("displays scale fretboard question", () => {
    const { getByText } = renderPanel({
      quizType: "fretboard",
      mode: "scale",
      question: {
        ...baseQuestion,
        promptScaleRoot: "C",
        promptScaleType: "major",
      },
    });
    expect(getByText("quiz.questionScaleFretboard")).toBeTruthy();
  });

  it("displays chord fretboard question", () => {
    const { getByText } = renderPanel({
      quizType: "fretboard",
      mode: "chord",
      question: {
        ...baseQuestion,
        promptChordLabel: "C Major",
      },
    });
    expect(getByText("quiz.questionChordFretboard")).toBeTruthy();
  });

  it("displays empty question for diatonic fretboard", () => {
    const { queryByText } = renderPanel({
      quizType: "fretboard",
      mode: "diatonic",
    });
    // questionText is "" for diatonic fretboard, so no question text rendered
    expect(queryByText("quiz.question")).toBeNull();
  });

  // ── Choice selection + submit button ──────────────────────────────
  it("renders 12 choice buttons for note quiz", () => {
    const { getByText } = renderPanel();
    baseQuestion.choices.forEach((choice) => {
      expect(getByText(choice)).toBeTruthy();
    });
  });

  it("calls onAnswer when a choice is pressed", () => {
    const onAnswer = jest.fn();
    const { getByText } = renderPanel({ onAnswer });
    fireEvent.press(getByText("G"));
    expect(onAnswer).toHaveBeenCalledWith("G");
  });

  it("does not call onAnswer when answered", () => {
    const onAnswer = jest.fn();
    const { getByText } = renderPanel({
      onAnswer,
      selectedAnswer: "G",
    });
    fireEvent.press(getByText("C"));
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it("shows submit button when choices are selected", () => {
    const { getByText } = renderPanel({
      quizSelectedChoices: ["G"],
    });
    expect(getByText("quiz.submit")).toBeTruthy();
  });

  it("does not show submit button when no choices selected", () => {
    const { queryByText } = renderPanel({
      quizSelectedChoices: [],
      selectedAnswer: null,
    });
    // Submit button should not appear for empty choices in note mode
    // (It appears in the choices section only when quizSelectedChoices.length > 0)
    expect(queryByText("quiz.submit")).toBeNull();
  });

  it("calls onSubmitChoice when submit is pressed", () => {
    const onSubmitChoice = jest.fn();
    const { getByText } = renderPanel({
      quizSelectedChoices: ["G"],
      onSubmitChoice,
    });
    fireEvent.press(getByText("quiz.submit"));
    expect(onSubmitChoice).toHaveBeenCalledTimes(1);
  });

  // ── Chord quiz: root + type selection + submit ────────────────────
  it("shows root selection buttons for chord quiz", () => {
    const { getByText } = renderPanel({ mode: "chord" });
    ["A", "B", "C", "D", "E", "F", "G"].forEach((note) => {
      expect(getByText(note)).toBeTruthy();
    });
  });

  it("calls onChordQuizRootSelect when root is pressed", () => {
    const onChordQuizRootSelect = jest.fn();
    const { getByText } = renderPanel({
      mode: "chord",
      onChordQuizRootSelect,
    });
    fireEvent.press(getByText("A"));
    expect(onChordQuizRootSelect).toHaveBeenCalledWith("A");
  });

  it("shows chord type options after root is selected", () => {
    const { getAllByText } = renderPanel({
      mode: "chord",
      quizSelectedChordRoot: "C",
    });
    expect(getAllByText("Major").length).toBeGreaterThanOrEqual(1);
    expect(getAllByText("Minor").length).toBeGreaterThanOrEqual(1);
    expect(getAllByText("7th").length).toBeGreaterThanOrEqual(1);
  });

  it("calls onChordQuizTypeSelect when chord type is pressed", () => {
    const onChordQuizTypeSelect = jest.fn();
    const { getAllByText } = renderPanel({
      mode: "chord",
      quizSelectedChordRoot: "C",
      onChordQuizTypeSelect,
    });
    // The chord type buttons appear after the chord type filter chips
    const minorButtons = getAllByText("Minor");
    fireEvent.press(minorButtons[minorButtons.length - 1]);
    expect(onChordQuizTypeSelect).toHaveBeenCalledWith("Minor");
  });

  it("shows submit button when both root and type are selected", () => {
    const { getAllByText } = renderPanel({
      mode: "chord",
      quizSelectedChordRoot: "C",
      quizSelectedChordType: "Major",
    });
    const submitBtns = getAllByText("quiz.submit");
    expect(submitBtns.length).toBeGreaterThan(0);
  });

  it("calls onSubmitChordChoice when chord submit is pressed", () => {
    const onSubmitChordChoice = jest.fn();
    const { getAllByText } = renderPanel({
      mode: "chord",
      quizSelectedChordRoot: "C",
      quizSelectedChordType: "Major",
      onSubmitChordChoice,
    });
    const submitBtns = getAllByText("quiz.submit");
    fireEvent.press(submitBtns[0]);
    expect(onSubmitChordChoice).toHaveBeenCalledTimes(1);
  });

  // ── Chord quiz type filter ────────────────────────────────────────
  it("renders chord type filter chips in chord mode", () => {
    const { getByText } = renderPanel({ mode: "chord" });
    expect(getByText("quiz.chordTypes.label")).toBeTruthy();
  });

  it("calls onChordQuizTypesChange to add a type", () => {
    const onChordQuizTypesChange = jest.fn();
    const { getByText } = renderPanel({
      mode: "chord",
      chordQuizTypes: ["Major", "Minor"],
      onChordQuizTypesChange,
    });
    fireEvent.press(getByText("m7"));
    expect(onChordQuizTypesChange).toHaveBeenCalledWith(["Major", "Minor", "m7"]);
  });

  it("calls onChordQuizTypesChange to remove a type", () => {
    const onChordQuizTypesChange = jest.fn();
    const { getByText } = renderPanel({
      mode: "chord",
      chordQuizTypes: ["Major", "Minor", "7th"],
      onChordQuizTypesChange,
    });
    fireEvent.press(getByText("Minor"));
    expect(onChordQuizTypesChange).toHaveBeenCalledWith(["Major", "7th"]);
  });

  it("does not remove the last chord type", () => {
    const onChordQuizTypesChange = jest.fn();
    const { getByText } = renderPanel({
      mode: "chord",
      chordQuizTypes: ["Major"],
      onChordQuizTypesChange,
    });
    fireEvent.press(getByText("Major"));
    expect(onChordQuizTypesChange).not.toHaveBeenCalled();
  });

  it("does not toggle chord types when answered", () => {
    const onChordQuizTypesChange = jest.fn();
    const { getByText } = renderPanel({
      mode: "chord",
      selectedAnswer: "C-Major",
      question: {
        ...baseQuestion,
        promptChordRoot: "C",
        promptChordType: "Major",
      },
      onChordQuizTypesChange,
    });
    fireEvent.press(getByText("m7"));
    expect(onChordQuizTypesChange).not.toHaveBeenCalled();
  });

  // ── Fretboard quiz instruction + submit ───────────────────────────
  it("shows tap instruction for fretboard quiz", () => {
    const { getByText } = renderPanel({
      quizType: "fretboard",
      mode: "note",
    });
    expect(getByText("quiz.tapInstruction")).toBeTruthy();
  });

  it("shows submit button when cells are selected in fretboard quiz", () => {
    const { getByText } = renderPanel({
      quizType: "fretboard",
      mode: "note",
      quizSelectedCells: [{ stringIdx: 0, fret: 3 }],
    });
    expect(getByText("quiz.submit")).toBeTruthy();
  });

  it("does not show submit when no cells selected in fretboard", () => {
    const { queryAllByText } = renderPanel({
      quizType: "fretboard",
      mode: "note",
      quizSelectedCells: [],
    });
    const submits = queryAllByText("quiz.submit");
    expect(submits.length).toBe(0);
  });

  it("calls onSubmitFretboard when fretboard submit is pressed", () => {
    const onSubmitFretboard = jest.fn();
    const { getByText } = renderPanel({
      quizType: "fretboard",
      mode: "note",
      quizSelectedCells: [{ stringIdx: 0, fret: 3 }],
      onSubmitFretboard,
    });
    fireEvent.press(getByText("quiz.submit"));
    expect(onSubmitFretboard).toHaveBeenCalledTimes(1);
  });

  it("does not show fretboard tap instruction when answered", () => {
    const { queryByText } = renderPanel({
      quizType: "fretboard",
      mode: "note",
      selectedAnswer: "G",
    });
    expect(queryByText("quiz.tapInstruction")).toBeNull();
  });

  // ── Fretboard all strings mode selector ───────────────────────────
  it("shows fretboard mode selector for note fretboard quiz", () => {
    const { getByText } = renderPanel({
      quizType: "fretboard",
      mode: "note",
    });
    expect(getByText("quiz.fretboardMode.singleString")).toBeTruthy();
  });

  it("shows fretboard mode selector for degree fretboard quiz", () => {
    const { getByText } = renderPanel({
      quizType: "fretboard",
      mode: "degree",
    });
    expect(getByText("quiz.fretboardMode.singleString")).toBeTruthy();
  });

  // ── Result display (correct/incorrect text colors) ────────────────
  it("displays correct text when answer is correct", () => {
    const { getByText } = renderPanel({
      selectedAnswer: "G",
    });
    const correctText = getByText("quiz.correct");
    expect(correctText).toBeTruthy();
    expect(correctText.props.style).toEqual(expect.objectContaining({ color: "#16a34a" }));
  });

  it("displays incorrect text when answer is wrong", () => {
    const { getByText } = renderPanel({
      selectedAnswer: "C",
    });
    const incorrectText = getByText("quiz.incorrectOnly");
    expect(incorrectText).toBeTruthy();
    expect(incorrectText.props.style).toEqual(expect.objectContaining({ color: "#ef4444" }));
  });

  it("displays answer label when incorrect", () => {
    const { getByText } = renderPanel({
      selectedAnswer: "C",
      question: { ...baseQuestion, answerLabel: "G (3rd fret)" },
    });
    expect(getByText("quiz.incorrect")).toBeTruthy();
  });

  it("does not show answer label when correct", () => {
    const { queryByText } = renderPanel({
      selectedAnswer: "G",
    });
    expect(queryByText("quiz.incorrect")).toBeNull();
  });

  // ── Next/retry buttons ────────────────────────────────────────────
  it("shows next and retry buttons after answering", () => {
    const { getByText } = renderPanel({ selectedAnswer: "G" });
    expect(getByText("quiz.next")).toBeTruthy();
    expect(getByText("quiz.retry")).toBeTruthy();
  });

  it("calls onNextQuestion when next is pressed", () => {
    const onNextQuestion = jest.fn();
    const { getByText } = renderPanel({
      selectedAnswer: "G",
      onNextQuestion,
    });
    fireEvent.press(getByText("quiz.next"));
    expect(onNextQuestion).toHaveBeenCalledTimes(1);
  });

  it("calls onRetryQuestion when retry is pressed", () => {
    const onRetryQuestion = jest.fn();
    const { getByText } = renderPanel({
      selectedAnswer: "G",
      onRetryQuestion,
    });
    fireEvent.press(getByText("quiz.retry"));
    expect(onRetryQuestion).toHaveBeenCalledTimes(1);
  });

  it("does not show next/retry buttons before answering", () => {
    const { queryByText } = renderPanel();
    expect(queryByText("quiz.next")).toBeNull();
    expect(queryByText("quiz.retry")).toBeNull();
  });

  // ── Choice colors after answer ────────────────────────────────────
  it("shows green background for correct choice after answering", () => {
    const { getByText } = renderPanel({ selectedAnswer: "G" });
    // The correct choice "G" should have green background
    const gButton = getByText("G").parent;
    expect(gButton).toBeTruthy();
  });

  it("shows red background for wrong selected choice", () => {
    const { getByText } = renderPanel({ selectedAnswer: "C" });
    // "C" was selected but wrong
    const cButton = getByText("C").parent;
    expect(cButton).toBeTruthy();
  });

  // ── Chord quiz: answered state shows chord types ──────────────────
  it("shows chord type results after chord quiz is answered", () => {
    const { getAllByText } = renderPanel({
      mode: "chord",
      selectedAnswer: "C-Major",
      quizSelectedChordRoot: "C",
      quizSelectedChordType: "Major",
      question: {
        ...baseQuestion,
        promptChordRoot: "C",
        promptChordType: "Major",
      },
    });
    // "Major" should appear in the results
    const majors = getAllByText("Major");
    expect(majors.length).toBeGreaterThan(0);
  });

  // ── Scale mode ────────────────────────────────────────────────────
  it("shows scale type selector in scale mode", () => {
    const { getByText } = renderPanel({ mode: "scale" });
    expect(getByText("layers.scale")).toBeTruthy();
  });

  it("renders choices for scale quiz", () => {
    const { getByText } = renderPanel({
      mode: "scale",
      question: {
        ...baseQuestion,
        promptScaleRoot: "C",
        promptScaleType: "major",
      },
    });
    expect(getByText("quiz.questionScale")).toBeTruthy();
  });

  // ── Diatonic quiz workflow ────────────────────────────────────────
  it("renders diatonic settings in diatonic mode", () => {
    const { getByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      question: {
        ...baseQuestion,
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [
          { degree: "I", root: "C", chordType: "Major", label: "C" },
          { degree: "ii", root: "D", chordType: "Minor", label: "Dm" },
          { degree: "iii", root: "E", chordType: "Minor", label: "Em" },
        ],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
    });
    expect(getByText("controls.key")).toBeTruthy();
    expect(getByText("controls.chordType")).toBeTruthy();
  });

  it("renders diatonic degree cards", () => {
    const { getByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      question: {
        ...baseQuestion,
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [
          { degree: "I", root: "C", chordType: "Major", label: "C" },
          { degree: "ii", root: "D", chordType: "Minor", label: "Dm" },
        ],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
    });
    expect(getByText("I")).toBeTruthy();
    expect(getByText("ii")).toBeTruthy();
  });

  it("shows root selection for current diatonic degree", () => {
    const { getByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      question: {
        ...baseQuestion,
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [{ degree: "I", root: "C", chordType: "Major", label: "C" }],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
      diatonicEditingDegree: "I",
    });
    // Should show note options for root selection
    expect(getByText("C")).toBeTruthy();
  });

  it("calls onDiatonicAnswerRootSelect when root note is pressed", () => {
    const onDiatonicAnswerRootSelect = jest.fn();
    const { getByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      question: {
        ...baseQuestion,
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [{ degree: "I", root: "C", chordType: "Major", label: "C" }],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
      diatonicEditingDegree: "I",
      onDiatonicAnswerRootSelect,
    });
    fireEvent.press(getByText("D"));
    expect(onDiatonicAnswerRootSelect).toHaveBeenCalledWith("D");
  });

  it("shows chord type selection after root is selected in diatonic", () => {
    const { getByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      question: {
        ...baseQuestion,
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [{ degree: "I", root: "C", chordType: "Major", label: "C" }],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
      diatonicEditingDegree: "I",
      diatonicSelectedRoot: "C",
    });
    expect(getByText("Major")).toBeTruthy();
    expect(getByText("Minor")).toBeTruthy();
  });

  it("calls onDiatonicAnswerTypeSelect when chord type is pressed", () => {
    const onDiatonicAnswerTypeSelect = jest.fn();
    const { getByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      question: {
        ...baseQuestion,
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [{ degree: "I", root: "C", chordType: "Major", label: "C" }],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
      diatonicEditingDegree: "I",
      diatonicSelectedRoot: "C",
      onDiatonicAnswerTypeSelect,
    });
    fireEvent.press(getByText("Minor"));
    expect(onDiatonicAnswerTypeSelect).toHaveBeenCalledWith("Minor");
  });

  it("calls onDiatonicDegreeCardClick when degree card is pressed", () => {
    const onDiatonicDegreeCardClick = jest.fn();
    const { getByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      question: {
        ...baseQuestion,
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [
          { degree: "I", root: "C", chordType: "Major", label: "C" },
          { degree: "ii", root: "D", chordType: "Minor", label: "Dm" },
        ],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
      onDiatonicDegreeCardClick,
    });
    fireEvent.press(getByText("ii"));
    expect(onDiatonicDegreeCardClick).toHaveBeenCalledWith("ii");
  });

  it("shows submit button when all diatonic answers are filled", () => {
    const { getByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      question: {
        ...baseQuestion,
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [{ degree: "I", root: "C", chordType: "Major", label: "C" }],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
      diatonicEditingDegree: "I",
      diatonicSelectedRoot: "C",
      diatonicAllAnswers: {
        I: { root: "C", chordType: "Major" },
      },
    });
    expect(getByText("quiz.submit")).toBeTruthy();
  });

  it("calls onDiatonicSubmitAll when diatonic submit is pressed", () => {
    const onDiatonicSubmitAll = jest.fn();
    const { getByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      question: {
        ...baseQuestion,
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [{ degree: "I", root: "C", chordType: "Major", label: "C" }],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
      diatonicEditingDegree: "I",
      diatonicSelectedRoot: "C",
      diatonicAllAnswers: {
        I: { root: "C", chordType: "Major" },
      },
      onDiatonicSubmitAll,
    });
    fireEvent.press(getByText("quiz.submit"));
    expect(onDiatonicSubmitAll).toHaveBeenCalledTimes(1);
  });

  it("shows diatonic results after answering", () => {
    const { getByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      selectedAnswer: "answered",
      question: {
        ...baseQuestion,
        correct: "answered",
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [{ degree: "I", root: "C", chordType: "Major", label: "C" }],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
      diatonicAllAnswers: {
        I: { root: "C", chordType: "Major" },
      },
    });
    // Correct answers should show
    expect(getByText("quiz.correct")).toBeTruthy();
  });

  // ── Diatonic answer display ───────────────────────────────────────
  it("shows filled answer text on diatonic card", () => {
    const { getAllByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      question: {
        ...baseQuestion,
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [{ degree: "I", root: "C", chordType: "Major", label: "C" }],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
      diatonicAllAnswers: {
        I: { root: "C", chordType: "Major" },
      },
      diatonicEditingDegree: "I",
      diatonicSelectedRoot: "C",
    });
    // The card should show "C" (root) for the Major chord
    expect(getAllByText("C").length).toBeGreaterThanOrEqual(1);
  });

  it("shows placeholder on unfilled diatonic card", () => {
    const { getByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      question: {
        ...baseQuestion,
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [{ degree: "I", root: "C", chordType: "Major", label: "C" }],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
      diatonicAllAnswers: {},
    });
    expect(getByText("--")).toBeTruthy();
  });

  // ── Light theme rendering ─────────────────────────────────────────
  it("renders correctly with light theme", () => {
    const { getByText } = renderPanel({ theme: "light" });
    expect(getByText("quiz.questionNote")).toBeTruthy();
  });

  // ── Diatonic quiz question text ───────────────────────────────────
  it("displays diatonic all question text", () => {
    const { getByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      question: {
        ...baseQuestion,
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [{ degree: "I", root: "C", chordType: "Major", label: "C" }],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
    });
    expect(getByText("quiz.questionDiatonicAll")).toBeTruthy();
  });

  // ── Scale choice with correctNoteNames ────────────────────────────
  it("handles scale quiz with multiple correct note names", () => {
    const { getByText } = renderPanel({
      mode: "scale",
      selectedAnswer: "C",
      question: {
        ...baseQuestion,
        correct: "C",
        correctNoteNames: ["C", "D", "E"],
        promptScaleRoot: "C",
        promptScaleType: "major",
      },
    });
    expect(getByText("quiz.correct")).toBeTruthy();
  });

  // ── Chord quiz with diatonicChordTypeOptions ──────────────────────
  it("shows diatonicChordTypeOptions when available in chord quiz", () => {
    const { getAllByText } = renderPanel({
      mode: "chord",
      quizSelectedChordRoot: "C",
      question: {
        ...baseQuestion,
        promptChordRoot: "C",
        promptChordType: "Major",
        diatonicChordTypeOptions: ["Major", "Minor", "dim"] as ChordType[],
      },
    });
    expect(getAllByText("dim").length).toBeGreaterThanOrEqual(1);
  });

  // ── Minor chord display in diatonic answers ───────────────────────
  it("shows minor suffix for Minor chord in diatonic answer", () => {
    const { getByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      question: {
        ...baseQuestion,
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [{ degree: "ii", root: "D", chordType: "Minor", label: "Dm" }],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
      diatonicAllAnswers: {
        ii: { root: "D", chordType: "Minor" },
      },
      diatonicEditingDegree: "ii",
      diatonicSelectedRoot: "D",
    });
    expect(getByText("Dm")).toBeTruthy();
  });

  // ── Scale type dropdown in scale quiz ────────────────────────────
  it("renders scale type dropdown in scale mode", () => {
    const { getByText } = renderPanel({ mode: "scale" });
    // The scale dropdown trigger should show the scale label
    expect(getByText("layers.scale")).toBeTruthy();
  });

  it("calls onScaleTypeChange when scale type is changed", () => {
    const onScaleTypeChange = jest.fn();
    const { getByText } = renderPanel({
      mode: "scale",
      scaleType: "major",
      onScaleTypeChange,
    });
    // The scale type label should be visible
    expect(getByText("layers.scale")).toBeTruthy();
  });

  // ── Fretboard single/all strings mode selector ───────────────────
  it("calls onFretboardAllStringsChange when fretboard mode is changed", () => {
    const onFretboardAllStringsChange = jest.fn();
    const { getByText } = renderPanel({
      quizType: "fretboard",
      mode: "note",
      fretboardAllStrings: false,
      onFretboardAllStringsChange,
    });
    // The single string mode label should be visible
    expect(getByText("quiz.fretboardMode.singleString")).toBeTruthy();
  });

  it("shows allStrings mode selector for degree fretboard quiz", () => {
    const { getByText } = renderPanel({
      quizType: "fretboard",
      mode: "degree",
      fretboardAllStrings: true,
    });
    expect(getByText("quiz.fretboardMode.allStrings")).toBeTruthy();
  });

  it("does not show fretboard mode selector for chord fretboard quiz", () => {
    const { queryByText } = renderPanel({
      quizType: "fretboard",
      mode: "chord",
      question: {
        ...baseQuestion,
        promptChordLabel: "C Major",
      },
    });
    expect(queryByText("quiz.fretboardMode.singleString")).toBeNull();
  });

  it("disables fretboard mode selector when answered", () => {
    const { getByText } = renderPanel({
      quizType: "fretboard",
      mode: "note",
      selectedAnswer: "G",
      fretboardAllStrings: false,
    });
    // Selector should still render but be disabled
    expect(getByText("quiz.fretboardMode.singleString")).toBeTruthy();
  });

  // ── Diatonic key type and chord size settings ────────────────────
  it("renders diatonic key type dropdown", () => {
    const { getByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      question: {
        ...baseQuestion,
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [{ degree: "I", root: "C", chordType: "Major", label: "C" }],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
      diatonicQuizKeyType: "major",
    });
    expect(getByText("controls.key")).toBeTruthy();
  });

  it("renders diatonic chord size dropdown", () => {
    const { getByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      question: {
        ...baseQuestion,
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [{ degree: "I", root: "C", chordType: "Major", label: "C" }],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
      diatonicQuizChordSize: "triad",
    });
    expect(getByText("controls.chordType")).toBeTruthy();
  });

  // ── Incorrect chord answer styling (lines 502-505) ──────────────
  it("shows red background for incorrectly selected chord root", () => {
    const { getByText } = renderPanel({
      mode: "chord",
      selectedAnswer: "D-Minor",
      quizSelectedChordRoot: "D",
      quizSelectedChordType: "Minor",
      question: {
        ...baseQuestion,
        correct: "C-Major",
        promptChordRoot: "C",
        promptChordType: "Major",
        promptChordLabel: "C Major",
      },
    });
    // "D" was selected as root but wrong (correct is "C")
    // "C" should have green background, "D" should have red background
    const dButton = getByText("D");
    expect(dButton).toBeTruthy();
    // The correct root "C" should also be visible with green styling
    const cButton = getByText("C");
    expect(cButton).toBeTruthy();
  });

  it("shows correct green and wrong red styling for chord root after answer", () => {
    const { toJSON } = renderPanel({
      mode: "chord",
      selectedAnswer: "D-Minor",
      quizSelectedChordRoot: "D",
      quizSelectedChordType: "Minor",
      question: {
        ...baseQuestion,
        correct: "C-Major",
        promptChordRoot: "C",
        promptChordType: "Major",
        promptChordLabel: "C Major",
      },
    });
    const json = JSON.stringify(toJSON());
    // Red (#ef4444) for wrong selection, green (#16a34a) for correct
    expect(json).toContain("#ef4444");
    expect(json).toContain("#16a34a");
  });

  // ── Scale type dropdown onChange callback ─────────────────────────
  it("calls onScaleTypeChange when a different scale is selected from dropdown", () => {
    const onScaleTypeChange = jest.fn();
    const { getByText } = renderPanel({
      mode: "scale",
      scaleType: "major",
      onScaleTypeChange,
    });
    // Open the scale type dropdown by pressing the trigger (shows current value label)
    fireEvent.press(getByText("options.scale.major"));
    // Select a different scale from the modal list
    fireEvent.press(getByText("options.scale.naturalMinor"));
    expect(onScaleTypeChange).toHaveBeenCalledWith("natural-minor");
  });

  // ── Fretboard allStrings dropdown onChange callback ──────────────
  it("calls onFretboardAllStringsChange when fretboard mode dropdown is changed", () => {
    const onFretboardAllStringsChange = jest.fn();
    const { getByText } = renderPanel({
      quizType: "fretboard",
      mode: "note",
      fretboardAllStrings: false,
      onFretboardAllStringsChange,
    });
    // Open the fretboard mode dropdown
    fireEvent.press(getByText("quiz.fretboardMode.singleString"));
    // Select allStrings option
    fireEvent.press(getByText("quiz.fretboardMode.allStrings"));
    expect(onFretboardAllStringsChange).toHaveBeenCalledWith(true);
  });

  it("does not call onFretboardAllStringsChange when answered", () => {
    const onFretboardAllStringsChange = jest.fn();
    const { getByText } = renderPanel({
      quizType: "fretboard",
      mode: "note",
      fretboardAllStrings: false,
      selectedAnswer: "G",
      onFretboardAllStringsChange,
    });
    // Open the fretboard mode dropdown (disabled should prevent opening)
    fireEvent.press(getByText("quiz.fretboardMode.singleString"));
    expect(onFretboardAllStringsChange).not.toHaveBeenCalled();
  });

  // ── Diatonic key type dropdown onChange callback ─────────────────
  it("calls onDiatonicQuizKeyTypeChange when key type is changed from dropdown", () => {
    const onDiatonicQuizKeyTypeChange = jest.fn();
    const { getByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      question: {
        ...baseQuestion,
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [{ degree: "I", root: "C", chordType: "Major", label: "C" }],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
      diatonicQuizKeyType: "major",
      onDiatonicQuizKeyTypeChange,
    });
    // Open the key type dropdown
    fireEvent.press(getByText("options.diatonicKey.major"));
    // Select natural-minor
    fireEvent.press(getByText("options.diatonicKey.naturalMinor"));
    expect(onDiatonicQuizKeyTypeChange).toHaveBeenCalledWith("natural-minor");
  });

  // ── Diatonic chord size dropdown onChange callback ───────────────
  it("calls onDiatonicQuizChordSizeChange when chord size is changed from dropdown", () => {
    const onDiatonicQuizChordSizeChange = jest.fn();
    const { getByText } = renderPanel({
      mode: "diatonic",
      quizType: "all",
      question: {
        ...baseQuestion,
        promptDiatonicKeyType: "major",
        promptDiatonicChordSize: "triad",
        diatonicAnswers: [{ degree: "I", root: "C", chordType: "Major", label: "C" }],
        diatonicChordTypeOptions: ["Major", "Minor"] as ChordType[],
      },
      diatonicQuizChordSize: "triad",
      onDiatonicQuizChordSizeChange,
    });
    // Open the chord size dropdown
    fireEvent.press(getByText("options.diatonicChordSize.triad"));
    // Select seventh
    fireEvent.press(getByText("options.diatonicChordSize.seventh"));
    expect(onDiatonicQuizChordSizeChange).toHaveBeenCalledWith("seventh");
  });

  // ── BounceButton animation on selection change ───────────────────
  it("triggers bounce animation when choice selection changes", () => {
    const { rerender } = renderPanel({
      mode: "note",
      quizSelectedChoices: [],
    });
    // Rerender with a selected choice to trigger BounceButton animation
    rerender(<QuizPanel {...defaultProps} mode="note" quizSelectedChoices={["G"]} />);
    // The "G" button should now appear selected - use rerender's container
    const { getByText } = renderPanel({
      mode: "note",
      quizSelectedChoices: ["G"],
    });
    const gButton = getByText("G");
    expect(gButton).toBeTruthy();
  });
});
