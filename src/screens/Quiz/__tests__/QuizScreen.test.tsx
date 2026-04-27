import React from "react";
import { render, act, screen } from "@testing-library/react-native";
import QuizScreen from "..";
import type { Theme } from "../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
jest.mock("../../../i18n", () => ({}));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light" },
  NotificationFeedbackType: { Warning: "Warning" },
}));
jest.mock("../../../components/AppHeader/SceneHeader", () => {
  const { View, TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ onBack, title }: { onBack?: () => void; title?: string }) => (
      <View testID="scene-header">
        {onBack && <TouchableOpacity testID="header-back" onPress={onBack} />}
        {title && <Text>{title}</Text>}
      </View>
    ),
  };
});

jest.mock("../Selection", () => {
  const { View, TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({
      onQuizModeSelect,
      onShowStats,
    }: {
      onQuizModeSelect: (v: string) => void;
      onShowStats: () => void;
    }) => (
      <View testID="quiz-selection">
        <TouchableOpacity testID="select-mode" onPress={() => onQuizModeSelect("note-choice")} />
        <TouchableOpacity testID="open-stats" onPress={onShowStats} />
      </View>
    ),
  };
});

jest.mock("../Stats", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="stats-pane" />,
  };
});

jest.mock("../Active", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="active-practice-pane" />,
  };
});

jest.mock("../../../hooks/useQuizRecords", () => ({
  useQuizRecords: () => ({
    records: [],
    addRecord: jest.fn(),
    clearRecords: jest.fn(),
  }),
}));

jest.mock("../../../hooks/useQuizViewModel", () => ({
  useQuizViewModel: () => ({
    quizKindOptions: [{ value: "note-choice", label: "Note" }],
    handleQuizKindDropdownChange: jest.fn(),
  }),
}));

const mockHandleQuizKindChange = jest.fn();
const mockRegenerateQuiz = jest.fn();
const mockHandleShowQuizChange = jest.fn();
const mockHandleFretboardQuizAnswer = jest.fn();
const mockHandleNextQuestion = jest.fn();
const mockHandleRetryQuestion = jest.fn();

jest.mock("../../../hooks/useQuiz", () => ({
  CHORD_QUIZ_TYPES_ALL: [],
  useQuiz: () => ({
    quizMode: "note",
    quizType: "choice",
    quizQuestion: null,
    selectedAnswer: null,
    quizScore: { correct: 0, total: 0 },
    quizAnsweredCell: null,
    quizCorrectCell: null,
    quizSelectedCells: [],
    quizSelectedChoices: [],
    diatonicQuizKeyType: "major",
    diatonicQuizChordSize: "triad",
    quizSelectedChordRoot: null,
    quizSelectedChordType: null,
    diatonicSelectedRoot: null,
    diatonicSelectedChordType: null,
    diatonicAllAnswers: {},
    diatonicEditingDegree: null,
    quizRevealNoteNames: false,
    handleQuizKindChange: mockHandleQuizKindChange,
    handleQuizAnswer: jest.fn(),
    handleChordQuizRootSelect: jest.fn(),
    handleChordQuizTypeSelect: jest.fn(),
    handleDiatonicAnswerRootSelect: jest.fn(),
    handleDiatonicAnswerTypeSelect: jest.fn(),
    handleDiatonicDegreeCardClick: jest.fn(),
    handleDiatonicSubmitAll: jest.fn(),
    handleFretboardQuizAnswer: mockHandleFretboardQuizAnswer,
    handleNextQuestion: mockHandleNextQuestion,
    handleRetryQuestion: mockHandleRetryQuestion,
    setDiatonicQuizKeyType: jest.fn(),
    setDiatonicQuizChordSize: jest.fn(),
    chordQuizTypes: [],
    handleChordQuizTypesChange: jest.fn(),
    quizStrings: [],
    handleQuizStringsChange: jest.fn(),
    quizKeys: [],
    handleQuizKeysChange: jest.fn(),
    quizNoteNames: [],
    handleQuizNoteNamesChange: jest.fn(),
    regenerateQuiz: mockRegenerateQuiz,
    handleShowQuizChange: mockHandleShowQuizChange,
    handleSubmitChoice: jest.fn(),
    handleSubmitChordChoice: jest.fn(),
    handleSubmitFretboard: jest.fn(),
  }),
}));

let mockShowQuiz = true;
let mockQuizModeSelected = false;
const mockSetShowQuiz = jest.fn((v: boolean) => {
  mockShowQuiz = v;
});
const mockSetQuizModeSelected = jest.fn((v: boolean) => {
  mockQuizModeSelected = v;
});
const mockHandleQuizModeSelect = jest.fn((v: string) => {
  mockQuizModeSelected = !!v;
});
const mockHandleChangeQuiz = jest.fn();

jest.mock("../../../hooks/useQuizNavigation", () => ({
  useQuizNavigation: () => ({
    showQuiz: mockShowQuiz,
    setShowQuiz: mockSetShowQuiz,
    quizModeSelected: mockQuizModeSelected,
    setQuizModeSelected: mockSetQuizModeSelected,
    quizSlideAnim: { current: 0 },
    handleQuizModeSelect: mockHandleQuizModeSelect,
    handleChangeQuiz: mockHandleChangeQuiz,
    swipePanResponder: { panHandlers: {} },
  }),
}));

jest.mock("../../../lib/fretboard", () => ({
  getNotesByAccidental: () => ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
}));

const defaultProps = {
  theme: "dark" as Theme,
  accidental: "flat" as const,
  fretRange: [0, 12] as [number, number],
  rootNote: "C",
  baseLabelMode: "note" as const,
  isLandscape: false,
  winWidth: 390,
  onFretboardDoubleTap: jest.fn(),
  onThemeChange: jest.fn(),
  onFretRangeChange: jest.fn(),
  onAccidentalChange: jest.fn(),
  onLeftHandedChange: jest.fn(),
  layers: [],
  layersFull: false,
  onAddLayerAndNavigate: jest.fn(),
  onEnablePerLayerRoot: jest.fn(),
};

describe("QuizScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShowQuiz = true;
    mockQuizModeSelected = false;
  });

  it("renders without crashing", () => {
    const { toJSON } = render(<QuizScreen {...defaultProps} />);
    expect(toJSON()).not.toBeNull();
  });

  it("renders quiz selection screen", () => {
    render(<QuizScreen {...defaultProps} />);
    expect(screen.getByTestId("quiz-selection")).toBeTruthy();
  });

  it("renders in light theme without crashing", () => {
    const { toJSON } = render(<QuizScreen {...defaultProps} theme="light" />);
    expect(toJSON()).not.toBeNull();
  });

  it("exposes regenerate via ref", () => {
    const ref = React.createRef<any>();
    render(<QuizScreen {...defaultProps} ref={ref} />);
    expect(typeof ref.current?.regenerate).toBe("function");
  });

  it("regenerate calls regenerateQuiz", () => {
    const ref = React.createRef<any>();
    render(<QuizScreen {...defaultProps} ref={ref} />);
    act(() => {
      ref.current?.regenerate();
    });
    expect(mockRegenerateQuiz).toHaveBeenCalled();
  });
});
