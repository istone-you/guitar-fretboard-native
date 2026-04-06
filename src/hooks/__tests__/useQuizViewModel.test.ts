import { renderHook, act } from "@testing-library/react-native";
import { useQuizViewModel } from "../useQuizViewModel";
import type { QuizMode, QuizType } from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const t = (key: string) => key;

function setup(
  overrides: Partial<{
    showQuiz: boolean;
    quizMode: QuizMode;
    quizType: QuizType;
    onQuizKindChange: (mode: QuizMode, type: QuizType) => void;
  }> = {},
) {
  const onQuizKindChange = jest.fn();
  const defaultParams = {
    showQuiz: false,
    quizMode: "note" as QuizMode,
    quizType: "choice" as QuizType,
    t,
    onQuizKindChange,
  };
  const hook = renderHook(() => useQuizViewModel({ ...defaultParams, ...overrides }));
  return { hook, onQuizKindChange: overrides.onQuizKindChange ?? onQuizKindChange };
}

// ---------------------------------------------------------------------------
// quizRootChangeEnabled
// ---------------------------------------------------------------------------

describe("useQuizViewModel – quizRootChangeEnabled", () => {
  it("returns true when showQuiz is false", () => {
    const { hook } = setup({ showQuiz: false, quizMode: "note" });
    expect(hook.result.current.quizRootChangeEnabled).toBe(true);
  });

  it("returns true when showQuiz is true and mode is degree", () => {
    const { hook } = setup({ showQuiz: true, quizMode: "degree" });
    expect(hook.result.current.quizRootChangeEnabled).toBe(true);
  });

  it("returns true when showQuiz is true and mode is scale", () => {
    const { hook } = setup({ showQuiz: true, quizMode: "scale" });
    expect(hook.result.current.quizRootChangeEnabled).toBe(true);
  });

  it("returns true when showQuiz is true and mode is diatonic", () => {
    const { hook } = setup({ showQuiz: true, quizMode: "diatonic" });
    expect(hook.result.current.quizRootChangeEnabled).toBe(true);
  });

  it("returns false when showQuiz is true and mode is note", () => {
    const { hook } = setup({ showQuiz: true, quizMode: "note" });
    expect(hook.result.current.quizRootChangeEnabled).toBe(false);
  });

  it("returns false when showQuiz is true and mode is chord", () => {
    const { hook } = setup({ showQuiz: true, quizMode: "chord" });
    expect(hook.result.current.quizRootChangeEnabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// quizKindValue
// ---------------------------------------------------------------------------

describe("useQuizViewModel – quizKindValue", () => {
  it("formats as mode-type", () => {
    const { hook } = setup({ quizMode: "chord", quizType: "fretboard" });
    expect(hook.result.current.quizKindValue).toBe("chord-fretboard");
  });

  it("formats diatonic-all correctly", () => {
    const { hook } = setup({ quizMode: "diatonic", quizType: "all" });
    expect(hook.result.current.quizKindValue).toBe("diatonic-all");
  });
});

// ---------------------------------------------------------------------------
// quizKindOptions
// ---------------------------------------------------------------------------

describe("useQuizViewModel – quizKindOptions", () => {
  it("returns 9 quiz kind options", () => {
    const { hook } = setup();
    expect(hook.result.current.quizKindOptions).toHaveLength(9);
  });

  it("contains expected values", () => {
    const { hook } = setup();
    const values = hook.result.current.quizKindOptions.map((o) => o.value);
    expect(values).toEqual([
      "note-choice",
      "note-fretboard",
      "degree-choice",
      "degree-fretboard",
      "chord-choice",
      "chord-fretboard",
      "scale-choice",
      "scale-fretboard",
      "diatonic-all",
    ]);
  });
});

// ---------------------------------------------------------------------------
// handleQuizKindDropdownChange
// ---------------------------------------------------------------------------

describe("useQuizViewModel – handleQuizKindDropdownChange", () => {
  it('parses "note-choice" into mode=note, type=choice', () => {
    const { hook, onQuizKindChange } = setup();
    act(() => {
      hook.result.current.handleQuizKindDropdownChange("note-choice");
    });
    expect(onQuizKindChange).toHaveBeenCalledWith("note", "choice");
  });

  it('parses "chord-fretboard" into mode=chord, type=fretboard', () => {
    const { hook, onQuizKindChange } = setup();
    act(() => {
      hook.result.current.handleQuizKindDropdownChange("chord-fretboard");
    });
    expect(onQuizKindChange).toHaveBeenCalledWith("chord", "fretboard");
  });

  it('parses "diatonic-all" correctly (mode=diatonic, type=all)', () => {
    const { hook, onQuizKindChange } = setup();
    act(() => {
      hook.result.current.handleQuizKindDropdownChange("diatonic-all");
    });
    expect(onQuizKindChange).toHaveBeenCalledWith("diatonic", "all");
  });

  it('parses "scale-fretboard" correctly', () => {
    const { hook, onQuizKindChange } = setup();
    act(() => {
      hook.result.current.handleQuizKindDropdownChange("scale-fretboard");
    });
    expect(onQuizKindChange).toHaveBeenCalledWith("scale", "fretboard");
  });
});
