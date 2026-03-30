import { renderHook, act } from "@testing-library/react-native";
import { useQuiz, CHORD_QUIZ_TYPES_ALL } from "../useQuiz";
import {
  getNoteIndex,
  NOTES_SHARP,
  NOTES_FLAT,
  OPEN_STRINGS,
  DIATONIC_CHORDS,
} from "../../logic/fretboard";
import type {
  Accidental,
  ScaleType,
  ChordType,
  QuizMode,
  QuizType,
} from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultParams = {
  accidental: "sharp" as Accidental,
  fretRange: [0, 14] as [number, number],
  rootNote: "C",
  scaleType: "major" as ScaleType,
  showQuiz: true,
  chordQuizTypes: ["Major", "Minor"] as ChordType[],
};

function setup(overrides: Partial<typeof defaultParams> = {}) {
  return renderHook(() => useQuiz({ ...defaultParams, ...overrides }));
}

/** Start quiz and return the result */
function startedQuiz(overrides: Partial<typeof defaultParams> = {}) {
  const hook = setup(overrides);
  act(() => {
    hook.result.current.handleShowQuizChange(true);
  });
  return hook;
}

/** Seed Math.random to return a fixed sequence (simple LCG) */
function mockRandom(...values: number[]) {
  let i = 0;
  return jest.spyOn(Math, "random").mockImplementation(() => {
    const v = values[i % values.length];
    i++;
    return v;
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useQuiz", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // =========================================================================
  // Initialization
  // =========================================================================

  describe("initialization", () => {
    it("returns default state before quiz starts", () => {
      const { result } = setup();
      expect(result.current.quizMode).toBe("note");
      expect(result.current.quizType).toBe("choice");
      expect(result.current.quizQuestion).toBeNull();
      expect(result.current.selectedAnswer).toBeNull();
      expect(result.current.quizScore).toEqual({ correct: 0, total: 0 });
      expect(result.current.quizSelectedCells).toEqual([]);
      expect(result.current.quizSelectedChoices).toEqual([]);
      expect(result.current.fretboardAllStrings).toBe(false);
    });
  });

  // =========================================================================
  // handleShowQuizChange / startQuiz
  // =========================================================================

  describe("handleShowQuizChange", () => {
    it("starts quiz and generates a question when called with true", () => {
      const { result } = setup();
      act(() => {
        result.current.handleShowQuizChange(true);
      });
      expect(result.current.quizQuestion).not.toBeNull();
      expect(result.current.quizScore).toEqual({ correct: 0, total: 0 });
    });

    it("clears the question when called with false", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleShowQuizChange(false);
      });
      expect(hook.result.current.quizQuestion).toBeNull();
    });

    it("resets score on restart", () => {
      const hook = startedQuiz();
      // Answer one question
      const q = hook.result.current.quizQuestion!;
      act(() => {
        hook.result.current.handleQuizAnswer(q.choices[0] ?? "C");
      });
      act(() => {
        hook.result.current.handleSubmitChoice();
      });
      expect(hook.result.current.quizScore.total).toBe(1);

      // Restart
      act(() => {
        hook.result.current.handleShowQuizChange(true);
      });
      expect(hook.result.current.quizScore).toEqual({ correct: 0, total: 0 });
    });
  });

  // =========================================================================
  // handleQuizKindChange (mode + type switching)
  // =========================================================================

  describe("handleQuizKindChange", () => {
    it("switches mode and type, generating a new question", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("degree", "choice");
      });
      expect(hook.result.current.quizMode).toBe("degree");
      expect(hook.result.current.quizType).toBe("choice");
      expect(hook.result.current.quizQuestion).not.toBeNull();
      expect(hook.result.current.quizScore).toEqual({ correct: 0, total: 0 });
    });

    it("generates chord mode question", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("chord", "choice");
      });
      expect(hook.result.current.quizMode).toBe("chord");
      const q = hook.result.current.quizQuestion!;
      expect(q.promptChordRoot).toBeDefined();
      expect(q.promptChordType).toBeDefined();
    });

    it("generates scale mode question", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("scale", "choice");
      });
      expect(hook.result.current.quizMode).toBe("scale");
      const q = hook.result.current.quizQuestion!;
      expect(q.correctNoteNames).toBeDefined();
      expect(q.choices.length).toBe(12); // All 12 notes
    });

    it("generates diatonic mode question", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("diatonic", "all");
      });
      expect(hook.result.current.quizMode).toBe("diatonic");
      const q = hook.result.current.quizQuestion!;
      expect(q.diatonicAnswers).toBeDefined();
      expect(q.diatonicAnswers!.length).toBe(7);
    });

    it("generates fretboard type question", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("note", "fretboard");
      });
      expect(hook.result.current.quizType).toBe("fretboard");
      const q = hook.result.current.quizQuestion!;
      expect(q.choices).toEqual([]);
    });

    it("resets selected state on mode change", () => {
      const hook = startedQuiz();
      // Select something
      const q = hook.result.current.quizQuestion!;
      act(() => {
        hook.result.current.handleQuizAnswer(q.choices[0] ?? "C");
      });
      expect(hook.result.current.quizSelectedChoices.length).toBeGreaterThan(0);
      // Switch mode
      act(() => {
        hook.result.current.handleQuizKindChange("degree", "choice");
      });
      expect(hook.result.current.quizSelectedChoices).toEqual([]);
    });
  });

  // =========================================================================
  // handleQuizAnswer (selection only, no judgement)
  // =========================================================================

  describe("handleQuizAnswer", () => {
    it("selects a single choice for note quiz", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizAnswer("C");
      });
      expect(hook.result.current.quizSelectedChoices).toEqual(["C"]);
    });

    it("replaces selection on second call for note quiz", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizAnswer("C");
      });
      act(() => {
        hook.result.current.handleQuizAnswer("D");
      });
      expect(hook.result.current.quizSelectedChoices).toEqual(["D"]);
    });

    it("toggles multi-select for scale choice quiz", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("scale", "choice");
      });
      act(() => {
        hook.result.current.handleQuizAnswer("C");
      });
      act(() => {
        hook.result.current.handleQuizAnswer("E");
      });
      expect(hook.result.current.quizSelectedChoices).toEqual(["C", "E"]);
      // Toggle off
      act(() => {
        hook.result.current.handleQuizAnswer("C");
      });
      expect(hook.result.current.quizSelectedChoices).toEqual(["E"]);
    });

    it("does nothing after answer is submitted", () => {
      const hook = startedQuiz();
      const q = hook.result.current.quizQuestion!;
      act(() => {
        hook.result.current.handleQuizAnswer(q.correct);
      });
      act(() => {
        hook.result.current.handleSubmitChoice();
      });
      // Now try to change selection
      act(() => {
        hook.result.current.handleQuizAnswer("X");
      });
      // Selection should not change
      expect(hook.result.current.quizSelectedChoices).toEqual([q.correct]);
    });

    it("does nothing when quizQuestion is null", () => {
      const { result } = setup();
      act(() => {
        result.current.handleQuizAnswer("C");
      });
      expect(result.current.quizSelectedChoices).toEqual([]);
    });
  });

  // =========================================================================
  // handleSubmitChoice (judge note/degree/scale choice)
  // =========================================================================

  describe("handleSubmitChoice", () => {
    it("marks correct answer for note quiz", () => {
      const hook = startedQuiz();
      const q = hook.result.current.quizQuestion!;
      act(() => {
        hook.result.current.handleQuizAnswer(q.correct);
      });
      act(() => {
        hook.result.current.handleSubmitChoice();
      });
      expect(hook.result.current.selectedAnswer).toBe(q.correct);
      expect(hook.result.current.quizScore).toEqual({ correct: 1, total: 1 });
    });

    it("marks wrong answer for note quiz", () => {
      const hook = startedQuiz();
      const q = hook.result.current.quizQuestion!;
      const wrong = q.correct === "C" ? "D" : "C";
      act(() => {
        hook.result.current.handleQuizAnswer(wrong);
      });
      act(() => {
        hook.result.current.handleSubmitChoice();
      });
      expect(hook.result.current.selectedAnswer).toBe(wrong);
      expect(hook.result.current.quizScore).toEqual({ correct: 0, total: 1 });
    });

    it("marks correct for degree quiz", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("degree", "choice");
      });
      const q = hook.result.current.quizQuestion!;
      act(() => {
        hook.result.current.handleQuizAnswer(q.correct);
      });
      act(() => {
        hook.result.current.handleSubmitChoice();
      });
      expect(hook.result.current.quizScore).toEqual({ correct: 1, total: 1 });
    });

    it("judges scale choice quiz with multi-select", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("scale", "choice");
      });
      const q = hook.result.current.quizQuestion!;
      const correctNotes = q.correctNoteNames!;
      // Select all correct notes
      for (const note of correctNotes) {
        act(() => {
          hook.result.current.handleQuizAnswer(note);
        });
      }
      act(() => {
        hook.result.current.handleSubmitChoice();
      });
      expect(hook.result.current.quizScore).toEqual({ correct: 1, total: 1 });
    });

    it("marks wrong for scale choice with missing notes", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("scale", "choice");
      });
      const q = hook.result.current.quizQuestion!;
      const correctNotes = q.correctNoteNames!;
      // Only select some
      act(() => {
        hook.result.current.handleQuizAnswer(correctNotes[0]);
      });
      act(() => {
        hook.result.current.handleSubmitChoice();
      });
      expect(hook.result.current.quizScore).toEqual({ correct: 0, total: 1 });
    });

    it("marks wrong for scale choice with extra notes", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("scale", "choice");
      });
      const q = hook.result.current.quizQuestion!;
      const correctNotes = q.correctNoteNames!;
      const allNotes = NOTES_SHARP as readonly string[];
      // Select all correct plus an extra
      for (const note of correctNotes) {
        act(() => {
          hook.result.current.handleQuizAnswer(note);
        });
      }
      const extra = allNotes.find((n) => !correctNotes.includes(n))!;
      act(() => {
        hook.result.current.handleQuizAnswer(extra);
      });
      act(() => {
        hook.result.current.handleSubmitChoice();
      });
      expect(hook.result.current.quizScore).toEqual({ correct: 0, total: 1 });
    });

    it("does nothing if already submitted", () => {
      const hook = startedQuiz();
      const q = hook.result.current.quizQuestion!;
      act(() => {
        hook.result.current.handleQuizAnswer(q.correct);
      });
      act(() => {
        hook.result.current.handleSubmitChoice();
      });
      act(() => {
        hook.result.current.handleSubmitChoice();
      });
      expect(hook.result.current.quizScore.total).toBe(1);
    });

    it("does nothing when quizQuestion is null", () => {
      const { result } = setup();
      act(() => {
        result.current.handleSubmitChoice();
      });
      expect(result.current.quizScore.total).toBe(0);
    });

    it("submits empty selection as empty string", () => {
      const hook = startedQuiz();
      // Don't select anything, just submit
      act(() => {
        hook.result.current.handleSubmitChoice();
      });
      expect(hook.result.current.selectedAnswer).toBe("");
      expect(hook.result.current.quizScore.total).toBe(1);
    });
  });

  // =========================================================================
  // Chord quiz: handleChordQuizRootSelect / TypeSelect / SubmitChordChoice
  // =========================================================================

  describe("chord quiz", () => {
    function startChordQuiz(overrides: Partial<typeof defaultParams> = {}) {
      const hook = startedQuiz(overrides);
      act(() => {
        hook.result.current.handleQuizKindChange("chord", "choice");
      });
      return hook;
    }

    it("selects chord root and type", () => {
      const hook = startChordQuiz();
      act(() => {
        hook.result.current.handleChordQuizRootSelect("A");
      });
      expect(hook.result.current.quizSelectedChordRoot).toBe("A");
      act(() => {
        hook.result.current.handleChordQuizTypeSelect("Major");
      });
      expect(hook.result.current.quizSelectedChordType).toBe("Major");
    });

    it("submits correct chord answer", () => {
      const hook = startChordQuiz();
      const q = hook.result.current.quizQuestion!;
      act(() => {
        hook.result.current.handleChordQuizRootSelect(q.promptChordRoot!);
      });
      act(() => {
        hook.result.current.handleChordQuizTypeSelect(q.promptChordType!);
      });
      act(() => {
        hook.result.current.handleSubmitChordChoice();
      });
      expect(hook.result.current.quizScore).toEqual({ correct: 1, total: 1 });
    });

    it("submits wrong chord root", () => {
      const hook = startChordQuiz();
      const q = hook.result.current.quizQuestion!;
      const wrongRoot = q.promptChordRoot === "A" ? "B" : "A";
      act(() => {
        hook.result.current.handleChordQuizRootSelect(wrongRoot);
      });
      act(() => {
        hook.result.current.handleChordQuizTypeSelect(q.promptChordType!);
      });
      act(() => {
        hook.result.current.handleSubmitChordChoice();
      });
      expect(hook.result.current.quizScore).toEqual({ correct: 0, total: 1 });
    });

    it("submits wrong chord type", () => {
      const hook = startChordQuiz();
      const q = hook.result.current.quizQuestion!;
      const wrongType: ChordType =
        q.promptChordType === "Major" ? "Minor" : "Major";
      act(() => {
        hook.result.current.handleChordQuizRootSelect(q.promptChordRoot!);
      });
      act(() => {
        hook.result.current.handleChordQuizTypeSelect(wrongType);
      });
      act(() => {
        hook.result.current.handleSubmitChordChoice();
      });
      expect(hook.result.current.quizScore).toEqual({ correct: 0, total: 1 });
    });

    it("does nothing without root and type selected", () => {
      const hook = startChordQuiz();
      act(() => {
        hook.result.current.handleSubmitChordChoice();
      });
      expect(hook.result.current.quizScore.total).toBe(0);

      // Only root
      act(() => {
        hook.result.current.handleChordQuizRootSelect("A");
      });
      act(() => {
        hook.result.current.handleSubmitChordChoice();
      });
      expect(hook.result.current.quizScore.total).toBe(0);
    });

    it("ignores root select when not chord mode", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleChordQuizRootSelect("A");
      });
      expect(hook.result.current.quizSelectedChordRoot).toBeNull();
    });

    it("ignores root select after answer submitted", () => {
      const hook = startChordQuiz();
      const q = hook.result.current.quizQuestion!;
      act(() => {
        hook.result.current.handleChordQuizRootSelect(q.promptChordRoot!);
      });
      act(() => {
        hook.result.current.handleChordQuizTypeSelect(q.promptChordType!);
      });
      act(() => {
        hook.result.current.handleSubmitChordChoice();
      });
      // Try to change root after submission
      act(() => {
        hook.result.current.handleChordQuizRootSelect("F");
      });
      expect(hook.result.current.quizSelectedChordRoot).toBe(
        q.promptChordRoot,
      );
    });

    it("ignores type select after answer submitted", () => {
      const hook = startChordQuiz();
      const q = hook.result.current.quizQuestion!;
      act(() => {
        hook.result.current.handleChordQuizRootSelect(q.promptChordRoot!);
      });
      act(() => {
        hook.result.current.handleChordQuizTypeSelect(q.promptChordType!);
      });
      act(() => {
        hook.result.current.handleSubmitChordChoice();
      });
      act(() => {
        hook.result.current.handleChordQuizTypeSelect("dim");
      });
      expect(hook.result.current.quizSelectedChordType).toBe(
        q.promptChordType,
      );
    });

    it("does not submit twice", () => {
      const hook = startChordQuiz();
      const q = hook.result.current.quizQuestion!;
      act(() => {
        hook.result.current.handleChordQuizRootSelect(q.promptChordRoot!);
      });
      act(() => {
        hook.result.current.handleChordQuizTypeSelect(q.promptChordType!);
      });
      act(() => {
        hook.result.current.handleSubmitChordChoice();
      });
      act(() => {
        hook.result.current.handleSubmitChordChoice();
      });
      expect(hook.result.current.quizScore.total).toBe(1);
    });

    it("uses default Major if chordQuizTypes is empty", () => {
      const hook = startedQuiz({ chordQuizTypes: [] });
      act(() => {
        hook.result.current.handleQuizKindChange("chord", "choice");
      });
      const q = hook.result.current.quizQuestion!;
      expect(q.promptChordType).toBe("Major");
    });
  });

  // =========================================================================
  // handleFretboardQuizAnswer (cell toggle)
  // =========================================================================

  describe("handleFretboardQuizAnswer", () => {
    it("selects a single cell for note fretboard quiz", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("note", "fretboard");
      });
      act(() => {
        hook.result.current.handleFretboardQuizAnswer(0, 3);
      });
      expect(hook.result.current.quizSelectedCells).toEqual([
        { stringIdx: 0, fret: 3 },
      ]);
    });

    it("replaces cell for single-cell mode", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("note", "fretboard");
      });
      act(() => {
        hook.result.current.handleFretboardQuizAnswer(0, 3);
      });
      act(() => {
        hook.result.current.handleFretboardQuizAnswer(1, 5);
      });
      expect(hook.result.current.quizSelectedCells).toEqual([
        { stringIdx: 1, fret: 5 },
      ]);
    });

    it("toggles cells for scale fretboard quiz (multi-cell)", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("scale", "fretboard");
      });
      act(() => {
        hook.result.current.handleFretboardQuizAnswer(0, 3);
      });
      act(() => {
        hook.result.current.handleFretboardQuizAnswer(1, 5);
      });
      expect(hook.result.current.quizSelectedCells).toEqual([
        { stringIdx: 0, fret: 3 },
        { stringIdx: 1, fret: 5 },
      ]);
      // Toggle off
      act(() => {
        hook.result.current.handleFretboardQuizAnswer(0, 3);
      });
      expect(hook.result.current.quizSelectedCells).toEqual([
        { stringIdx: 1, fret: 5 },
      ]);
    });

    it("toggles cells for chord fretboard quiz (multi-cell)", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("chord", "fretboard");
      });
      act(() => {
        hook.result.current.handleFretboardQuizAnswer(0, 0);
      });
      act(() => {
        hook.result.current.handleFretboardQuizAnswer(1, 2);
      });
      expect(hook.result.current.quizSelectedCells.length).toBe(2);
    });

    it("toggles cells for note fretboard with allStrings", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.setFretboardAllStrings(true);
      });
      act(() => {
        hook.result.current.handleQuizKindChange("note", "fretboard");
      });
      act(() => {
        hook.result.current.handleFretboardQuizAnswer(0, 3);
      });
      act(() => {
        hook.result.current.handleFretboardQuizAnswer(2, 5);
      });
      expect(hook.result.current.quizSelectedCells.length).toBe(2);
      // Toggle first off
      act(() => {
        hook.result.current.handleFretboardQuizAnswer(0, 3);
      });
      expect(hook.result.current.quizSelectedCells.length).toBe(1);
    });

    it("does nothing when showQuiz is false", () => {
      const hook = startedQuiz({ showQuiz: false });
      act(() => {
        hook.result.current.handleQuizKindChange("note", "fretboard");
      });
      act(() => {
        hook.result.current.handleFretboardQuizAnswer(0, 3);
      });
      expect(hook.result.current.quizSelectedCells).toEqual([]);
    });

    it("does nothing when quizType is choice", () => {
      const hook = startedQuiz();
      // Default quizType is 'choice'
      act(() => {
        hook.result.current.handleFretboardQuizAnswer(0, 3);
      });
      expect(hook.result.current.quizSelectedCells).toEqual([]);
    });

    it("does nothing after answer submitted", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("note", "fretboard");
      });
      const q = hook.result.current.quizQuestion!;
      // Select correct cell and submit
      act(() => {
        hook.result.current.handleFretboardQuizAnswer(
          q.stringIdx,
          q.fret,
        );
      });
      act(() => {
        hook.result.current.handleSubmitFretboard();
      });
      // Try to select another cell
      act(() => {
        hook.result.current.handleFretboardQuizAnswer(0, 0);
      });
      // Should not change (the exact cells depend on implementation, just check total didn't change)
      expect(hook.result.current.quizSelectedCells).toEqual([
        { stringIdx: q.stringIdx, fret: q.fret },
      ]);
    });

    it("does nothing when quizQuestion is null", () => {
      const { result } = setup();
      act(() => {
        result.current.setQuizType("fretboard");
      });
      act(() => {
        result.current.handleFretboardQuizAnswer(0, 3);
      });
      expect(result.current.quizSelectedCells).toEqual([]);
    });
  });

  // =========================================================================
  // handleSubmitFretboard (judge all fretboard modes)
  // =========================================================================

  describe("handleSubmitFretboard", () => {
    describe("single cell: note fretboard", () => {
      it("judges correct single cell note answer", () => {
        const hook = startedQuiz();
        act(() => {
          hook.result.current.handleQuizKindChange("note", "fretboard");
        });
        const q = hook.result.current.quizQuestion!;
        // Select the correct cell
        act(() => {
          hook.result.current.handleFretboardQuizAnswer(
            q.stringIdx,
            q.fret,
          );
        });
        act(() => {
          hook.result.current.handleSubmitFretboard();
        });
        expect(hook.result.current.selectedAnswer).toBe(q.correct);
        expect(hook.result.current.quizScore).toEqual({
          correct: 1,
          total: 1,
        });
        expect(hook.result.current.quizAnsweredCell).toEqual({
          stringIdx: q.stringIdx,
          fret: q.fret,
        });
      });

      it("judges wrong single cell note answer", () => {
        // Use a deterministic random to get fret 5, string 0
        const spy = mockRandom(0, 0.3); // stringIdx=0, fret ~4
        const hook = startedQuiz();
        act(() => {
          hook.result.current.handleQuizKindChange("note", "fretboard");
        });
        spy.mockRestore();

        const q = hook.result.current.quizQuestion!;
        // Find a wrong fret
        const wrongFret = q.fret === 0 ? 1 : q.fret - 1;
        act(() => {
          hook.result.current.handleFretboardQuizAnswer(
            q.stringIdx,
            wrongFret,
          );
        });

        const clickedNoteIdx = getNoteIndex(q.stringIdx, wrongFret);
        const qNoteIdx = getNoteIndex(q.stringIdx, q.fret);
        const notes = NOTES_SHARP;

        // Only check wrong if they're actually different notes
        if (notes[clickedNoteIdx] !== notes[qNoteIdx]) {
          act(() => {
            hook.result.current.handleSubmitFretboard();
          });
          expect(hook.result.current.quizScore).toEqual({
            correct: 0,
            total: 1,
          });
          expect(hook.result.current.quizCorrectCell).toEqual({
            stringIdx: q.stringIdx,
            fret: q.fret,
          });
        }
      });
    });

    describe("single cell: degree fretboard", () => {
      it("judges correct single cell degree answer", () => {
        const hook = startedQuiz();
        act(() => {
          hook.result.current.handleQuizKindChange("degree", "fretboard");
        });
        const q = hook.result.current.quizQuestion!;
        act(() => {
          hook.result.current.handleFretboardQuizAnswer(
            q.stringIdx,
            q.fret,
          );
        });
        act(() => {
          hook.result.current.handleSubmitFretboard();
        });
        expect(hook.result.current.selectedAnswer).toBe(q.correct);
        expect(hook.result.current.quizScore).toEqual({
          correct: 1,
          total: 1,
        });
      });
    });

    describe("all strings mode", () => {
      it("judges correct all-strings note answer", () => {
        const hook = startedQuiz();
        act(() => {
          hook.result.current.setFretboardAllStrings(true);
        });
        act(() => {
          hook.result.current.handleQuizKindChange("note", "fretboard");
        });
        const q = hook.result.current.quizQuestion!;
        const correctNoteNames = q.correctNoteNames!;
        const notes = [...NOTES_SHARP] as string[];

        // Find all cells on all strings that match correctNoteNames
        const fretRange: [number, number] = [0, 14];
        const allCorrectCells: { stringIdx: number; fret: number }[] = [];
        for (let s = 0; s < 6; s++) {
          for (let f = fretRange[0]; f <= fretRange[1]; f++) {
            if (correctNoteNames.includes(notes[getNoteIndex(s, f)])) {
              allCorrectCells.push({ stringIdx: s, fret: f });
            }
          }
        }

        // Select at least one correct cell per string that has it
        const selectedPerString = new Set<number>();
        for (const cell of allCorrectCells) {
          if (!selectedPerString.has(cell.stringIdx)) {
            selectedPerString.add(cell.stringIdx);
            act(() => {
              hook.result.current.handleFretboardQuizAnswer(
                cell.stringIdx,
                cell.fret,
              );
            });
          }
        }

        act(() => {
          hook.result.current.handleSubmitFretboard();
        });
        expect(hook.result.current.quizScore.correct).toBe(1);
        expect(hook.result.current.quizRevealNoteNames).toEqual(
          correctNoteNames,
        );
      });

      it("judges wrong when a string is missing", () => {
        const hook = startedQuiz();
        act(() => {
          hook.result.current.setFretboardAllStrings(true);
        });
        act(() => {
          hook.result.current.handleQuizKindChange("note", "fretboard");
        });
        const q = hook.result.current.quizQuestion!;
        const correctNoteNames = q.correctNoteNames!;
        const notes = [...NOTES_SHARP] as string[];

        // Only select cells on string 0
        for (let f = 0; f <= 14; f++) {
          if (correctNoteNames.includes(notes[getNoteIndex(0, f)])) {
            act(() => {
              hook.result.current.handleFretboardQuizAnswer(0, f);
            });
            break;
          }
        }

        act(() => {
          hook.result.current.handleSubmitFretboard();
        });
        // Should be wrong because not all strings are covered
        expect(hook.result.current.quizScore.correct).toBe(0);
      });

      it("judges wrong when a wrong cell is selected", () => {
        const hook = startedQuiz();
        act(() => {
          hook.result.current.setFretboardAllStrings(true);
        });
        act(() => {
          hook.result.current.handleQuizKindChange("note", "fretboard");
        });
        const q = hook.result.current.quizQuestion!;
        const correctNoteNames = q.correctNoteNames!;
        const notes = [...NOTES_SHARP] as string[];

        // Select correct cells on all strings, plus one wrong cell
        const fretRange: [number, number] = [0, 14];
        const selectedPerString = new Set<number>();
        for (let s = 0; s < 6; s++) {
          for (let f = fretRange[0]; f <= fretRange[1]; f++) {
            if (
              correctNoteNames.includes(notes[getNoteIndex(s, f)]) &&
              !selectedPerString.has(s)
            ) {
              selectedPerString.add(s);
              act(() => {
                hook.result.current.handleFretboardQuizAnswer(s, f);
              });
            }
          }
        }

        // Find a wrong cell
        let wrongAdded = false;
        for (let s = 0; s < 6; s++) {
          for (let f = 0; f <= 14; f++) {
            if (!correctNoteNames.includes(notes[getNoteIndex(s, f)])) {
              act(() => {
                hook.result.current.handleFretboardQuizAnswer(s, f);
              });
              wrongAdded = true;
              break;
            }
          }
          if (wrongAdded) break;
        }

        act(() => {
          hook.result.current.handleSubmitFretboard();
        });
        expect(hook.result.current.quizScore.correct).toBe(0);
      });
    });

    describe("scale fretboard", () => {
      it("judges correct scale fretboard answer", () => {
        const hook = startedQuiz();
        act(() => {
          hook.result.current.handleQuizKindChange("scale", "fretboard");
        });
        const q = hook.result.current.quizQuestion!;
        const correctNoteNames = q.correctNoteNames!;
        const notes = [...NOTES_SHARP] as string[];

        // Select all correct cells in fret range
        for (let s = 0; s < 6; s++) {
          for (let f = 0; f <= 14; f++) {
            if (correctNoteNames.includes(notes[getNoteIndex(s, f)])) {
              act(() => {
                hook.result.current.handleFretboardQuizAnswer(s, f);
              });
            }
          }
        }

        act(() => {
          hook.result.current.handleSubmitFretboard();
        });
        expect(hook.result.current.quizScore).toEqual({
          correct: 1,
          total: 1,
        });
        expect(hook.result.current.quizRevealNoteNames).toEqual(
          correctNoteNames,
        );
      });

      it("judges wrong when scale cells are incomplete", () => {
        const hook = startedQuiz();
        act(() => {
          hook.result.current.handleQuizKindChange("scale", "fretboard");
        });
        const q = hook.result.current.quizQuestion!;
        const correctNoteNames = q.correctNoteNames!;
        const notes = [...NOTES_SHARP] as string[];

        // Select only one correct cell
        for (let s = 0; s < 6; s++) {
          for (let f = 0; f <= 14; f++) {
            if (correctNoteNames.includes(notes[getNoteIndex(s, f)])) {
              act(() => {
                hook.result.current.handleFretboardQuizAnswer(s, f);
              });
              break; // Only one
            }
          }
          break;
        }

        act(() => {
          hook.result.current.handleSubmitFretboard();
        });
        expect(hook.result.current.quizScore.correct).toBe(0);
      });
    });

    describe("chord fretboard", () => {
      it("judges correct chord fretboard answer when all chord tones selected", () => {
        const hook = startedQuiz();
        act(() => {
          hook.result.current.handleQuizKindChange("chord", "fretboard");
        });
        const q = hook.result.current.quizQuestion!;
        const correctNoteNames = q.correctNoteNames!;
        const notes = [...NOTES_SHARP] as string[];

        // Select exactly the unique chord tones (one cell per unique note)
        const selectedNotes = new Set<string>();
        for (let s = 0; s < 6; s++) {
          for (let f = 0; f <= 14; f++) {
            const noteName = notes[getNoteIndex(s, f)];
            if (
              correctNoteNames.includes(noteName) &&
              !selectedNotes.has(noteName)
            ) {
              selectedNotes.add(noteName);
              act(() => {
                hook.result.current.handleFretboardQuizAnswer(s, f);
              });
            }
          }
          if (selectedNotes.size === correctNoteNames.length) break;
        }

        act(() => {
          hook.result.current.handleSubmitFretboard();
        });
        expect(hook.result.current.quizScore.correct).toBe(1);
        expect(hook.result.current.quizRevealNoteNames).toEqual(
          correctNoteNames,
        );
      });

      it("judges wrong chord fretboard when a wrong note is included", () => {
        const hook = startedQuiz();
        act(() => {
          hook.result.current.handleQuizKindChange("chord", "fretboard");
        });
        const q = hook.result.current.quizQuestion!;
        const correctNoteNames = q.correctNoteNames!;
        const notes = [...NOTES_SHARP] as string[];

        // Select all correct notes
        const selectedNotes = new Set<string>();
        for (let s = 0; s < 6; s++) {
          for (let f = 0; f <= 14; f++) {
            const noteName = notes[getNoteIndex(s, f)];
            if (
              correctNoteNames.includes(noteName) &&
              !selectedNotes.has(noteName)
            ) {
              selectedNotes.add(noteName);
              act(() => {
                hook.result.current.handleFretboardQuizAnswer(s, f);
              });
            }
          }
          if (selectedNotes.size === correctNoteNames.length) break;
        }

        // Add a wrong note
        for (let s = 0; s < 6; s++) {
          for (let f = 0; f <= 14; f++) {
            const noteName = notes[getNoteIndex(s, f)];
            if (!correctNoteNames.includes(noteName)) {
              act(() => {
                hook.result.current.handleFretboardQuizAnswer(s, f);
              });
              break;
            }
          }
          break;
        }

        act(() => {
          hook.result.current.handleSubmitFretboard();
        });
        expect(hook.result.current.quizScore.correct).toBe(0);
      });

      it("judges wrong chord fretboard when a chord tone is missing", () => {
        const hook = startedQuiz();
        act(() => {
          hook.result.current.handleQuizKindChange("chord", "fretboard");
        });
        const q = hook.result.current.quizQuestion!;
        const correctNoteNames = q.correctNoteNames!;
        const notes = [...NOTES_SHARP] as string[];

        // Select only the first chord tone (missing others)
        for (let s = 0; s < 6; s++) {
          for (let f = 0; f <= 14; f++) {
            const noteName = notes[getNoteIndex(s, f)];
            if (noteName === correctNoteNames[0]) {
              act(() => {
                hook.result.current.handleFretboardQuizAnswer(s, f);
              });
              break;
            }
          }
          break;
        }

        act(() => {
          hook.result.current.handleSubmitFretboard();
        });
        // Only correct if chord has 1 unique tone (unlikely), otherwise wrong
        if (correctNoteNames.length > 1) {
          expect(hook.result.current.quizScore.correct).toBe(0);
        }
      });
    });

    it("does nothing when no cells selected", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("note", "fretboard");
      });
      act(() => {
        hook.result.current.handleSubmitFretboard();
      });
      expect(hook.result.current.quizScore.total).toBe(0);
    });

    it("does nothing when already submitted", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("note", "fretboard");
      });
      const q = hook.result.current.quizQuestion!;
      act(() => {
        hook.result.current.handleFretboardQuizAnswer(
          q.stringIdx,
          q.fret,
        );
      });
      act(() => {
        hook.result.current.handleSubmitFretboard();
      });
      act(() => {
        hook.result.current.handleSubmitFretboard();
      });
      expect(hook.result.current.quizScore.total).toBe(1);
    });

    it("does nothing when quizQuestion is null", () => {
      const { result } = setup();
      act(() => {
        result.current.handleSubmitFretboard();
      });
      expect(result.current.quizScore.total).toBe(0);
    });
  });

  // =========================================================================
  // handleNextQuestion
  // =========================================================================

  describe("handleNextQuestion", () => {
    it("generates a new question and clears selection", () => {
      const hook = startedQuiz();
      const q1 = hook.result.current.quizQuestion!;
      act(() => {
        hook.result.current.handleQuizAnswer(q1.correct);
      });
      act(() => {
        hook.result.current.handleSubmitChoice();
      });
      expect(hook.result.current.selectedAnswer).not.toBeNull();

      act(() => {
        hook.result.current.handleNextQuestion();
      });
      expect(hook.result.current.selectedAnswer).toBeNull();
      expect(hook.result.current.quizSelectedChoices).toEqual([]);
      expect(hook.result.current.quizQuestion).not.toBeNull();
      // Score is preserved
      expect(hook.result.current.quizScore.total).toBe(1);
    });

    it("does nothing when quizQuestion is null", () => {
      const { result } = setup();
      act(() => {
        result.current.handleNextQuestion();
      });
      expect(result.current.quizQuestion).toBeNull();
    });
  });

  // =========================================================================
  // handleRetryQuestion
  // =========================================================================

  describe("handleRetryQuestion", () => {
    it("clears selection but keeps same question", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("scale", "choice");
      });
      const q = hook.result.current.quizQuestion!;
      const correctNotes = q.correctNoteNames!;
      // Select all correct notes
      for (const note of correctNotes) {
        act(() => {
          hook.result.current.handleQuizAnswer(note);
        });
      }
      act(() => {
        hook.result.current.handleSubmitChoice();
      });

      act(() => {
        hook.result.current.handleRetryQuestion();
      });
      expect(hook.result.current.selectedAnswer).toBeNull();
      expect(hook.result.current.quizSelectedChoices).toEqual([]);
      // Same question is retained
      expect(hook.result.current.quizQuestion).toBe(q);
    });

    it("does nothing when quizQuestion is null", () => {
      const { result } = setup();
      act(() => {
        result.current.handleRetryQuestion();
      });
      expect(result.current.quizQuestion).toBeNull();
    });
  });

  // =========================================================================
  // regenerateQuiz
  // =========================================================================

  describe("regenerateQuiz", () => {
    it("generates a new question while keeping score", () => {
      const hook = startedQuiz();
      const q1 = hook.result.current.quizQuestion!;
      act(() => {
        hook.result.current.handleQuizAnswer(q1.correct);
      });
      act(() => {
        hook.result.current.handleSubmitChoice();
      });

      act(() => {
        hook.result.current.regenerateQuiz();
      });
      expect(hook.result.current.selectedAnswer).toBeNull();
      expect(hook.result.current.quizQuestion).not.toBeNull();
      expect(hook.result.current.quizScore.total).toBe(1);
    });

    it("does nothing when showQuiz is false", () => {
      const hook = startedQuiz({ showQuiz: false });
      // Quiz question will still be created by startQuiz, but regenerateQuiz checks showQuiz
      const qBefore = hook.result.current.quizQuestion;
      act(() => {
        hook.result.current.regenerateQuiz();
      });
      // If question is null, nothing happens; if present, showQuiz=false blocks it
      expect(hook.result.current.quizQuestion).toBe(qBefore);
    });

    it("does nothing when quizQuestion is null", () => {
      const { result } = setup();
      act(() => {
        result.current.regenerateQuiz();
      });
      expect(result.current.quizQuestion).toBeNull();
    });
  });

  // =========================================================================
  // Score tracking
  // =========================================================================

  describe("score tracking", () => {
    it("accumulates score across multiple questions", () => {
      const hook = startedQuiz();

      // Answer 3 questions, get 2 correct
      for (let i = 0; i < 3; i++) {
        const q = hook.result.current.quizQuestion!;
        const answer = i < 2 ? q.correct : q.correct === "C" ? "D" : "C";
        act(() => {
          hook.result.current.handleQuizAnswer(answer);
        });
        act(() => {
          hook.result.current.handleSubmitChoice();
        });
        if (i < 2) {
          act(() => {
            hook.result.current.handleNextQuestion();
          });
        }
      }

      expect(hook.result.current.quizScore.total).toBe(3);
      // At least 2 correct (the 3rd might also be correct by coincidence)
      expect(hook.result.current.quizScore.correct).toBeGreaterThanOrEqual(2);
    });

    it("resets score on handleShowQuizChange(true)", () => {
      const hook = startedQuiz();
      const q = hook.result.current.quizQuestion!;
      act(() => {
        hook.result.current.handleQuizAnswer(q.correct);
      });
      act(() => {
        hook.result.current.handleSubmitChoice();
      });

      act(() => {
        hook.result.current.handleShowQuizChange(true);
      });
      expect(hook.result.current.quizScore).toEqual({ correct: 0, total: 0 });
    });

    it("resets score on handleQuizKindChange", () => {
      const hook = startedQuiz();
      const q = hook.result.current.quizQuestion!;
      act(() => {
        hook.result.current.handleQuizAnswer(q.correct);
      });
      act(() => {
        hook.result.current.handleSubmitChoice();
      });

      act(() => {
        hook.result.current.handleQuizKindChange("degree", "choice");
      });
      expect(hook.result.current.quizScore).toEqual({ correct: 0, total: 0 });
    });
  });

  // =========================================================================
  // Accidental handling (sharp vs flat)
  // =========================================================================

  describe("accidental handling", () => {
    it("uses sharp notes when accidental is sharp", () => {
      const hook = startedQuiz({ accidental: "sharp" });
      const q = hook.result.current.quizQuestion!;
      const sharpNotes = [...NOTES_SHARP] as string[];
      expect(sharpNotes).toContain(q.correct);
    });

    it("uses flat notes when accidental is flat", () => {
      const hook = startedQuiz({ accidental: "flat" });
      const q = hook.result.current.quizQuestion!;
      const flatNotes = [...NOTES_FLAT] as string[];
      expect(flatNotes).toContain(q.correct);
    });
  });

  // =========================================================================
  // fretRange handling
  // =========================================================================

  describe("fretRange handling", () => {
    it("generates questions within the fret range", () => {
      const hook = startedQuiz({ fretRange: [3, 7] });
      const q = hook.result.current.quizQuestion!;
      expect(q.fret).toBeGreaterThanOrEqual(3);
      expect(q.fret).toBeLessThanOrEqual(7);
    });

    it("works with single fret range", () => {
      const hook = startedQuiz({ fretRange: [5, 5] });
      const q = hook.result.current.quizQuestion!;
      expect(q.fret).toBe(5);
    });
  });

  // =========================================================================
  // Diatonic quiz
  // =========================================================================

  describe("diatonic quiz", () => {
    function startDiatonicQuiz(overrides: Partial<typeof defaultParams> = {}) {
      const hook = startedQuiz(overrides);
      act(() => {
        hook.result.current.handleQuizKindChange("diatonic", "all");
      });
      return hook;
    }

    it("generates diatonic question with 7 answers", () => {
      const hook = startDiatonicQuiz();
      const q = hook.result.current.quizQuestion!;
      expect(q.diatonicAnswers).toBeDefined();
      expect(q.diatonicAnswers!.length).toBe(7);
      expect(q.diatonicChordTypeOptions).toBeDefined();
    });

    it("handleDiatonicDegreeCardClick sets editing degree", () => {
      const hook = startDiatonicQuiz();
      const q = hook.result.current.quizQuestion!;
      const degree = q.diatonicAnswers![0].degree;
      act(() => {
        hook.result.current.handleDiatonicDegreeCardClick(degree);
      });
      expect(hook.result.current.diatonicEditingDegree).toBe(degree);
    });

    it("handleDiatonicDegreeCardClick resets root and type selection", () => {
      const hook = startDiatonicQuiz();
      const q = hook.result.current.quizQuestion!;
      // Set some root first
      act(() => {
        hook.result.current.handleDiatonicAnswerRootSelect("C");
      });
      act(() => {
        hook.result.current.handleDiatonicDegreeCardClick(
          q.diatonicAnswers![0].degree,
        );
      });
      expect(hook.result.current.diatonicSelectedRoot).toBeNull();
      expect(hook.result.current.diatonicSelectedChordType).toBeNull();
    });

    it("handleDiatonicAnswerRootSelect sets root", () => {
      const hook = startDiatonicQuiz();
      act(() => {
        hook.result.current.handleDiatonicAnswerRootSelect("D");
      });
      expect(hook.result.current.diatonicSelectedRoot).toBe("D");
    });

    it("handleDiatonicAnswerRootSelect ignores non-diatonic mode", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleDiatonicAnswerRootSelect("D");
      });
      expect(hook.result.current.diatonicSelectedRoot).toBeNull();
    });

    it("handleDiatonicAnswerTypeSelect commits answer for degree", () => {
      const hook = startDiatonicQuiz();
      const q = hook.result.current.quizQuestion!;
      const firstAnswer = q.diatonicAnswers![0];

      act(() => {
        hook.result.current.handleDiatonicDegreeCardClick(firstAnswer.degree);
      });
      act(() => {
        hook.result.current.handleDiatonicAnswerRootSelect(firstAnswer.root);
      });
      act(() => {
        hook.result.current.handleDiatonicAnswerTypeSelect(
          firstAnswer.chordType,
        );
      });
      expect(
        hook.result.current.diatonicAllAnswers[firstAnswer.degree],
      ).toEqual({
        root: firstAnswer.root,
        chordType: firstAnswer.chordType,
      });
    });

    it("handleDiatonicAnswerTypeSelect requires root to be selected", () => {
      const hook = startDiatonicQuiz();
      act(() => {
        hook.result.current.handleDiatonicAnswerTypeSelect("Major");
      });
      expect(Object.keys(hook.result.current.diatonicAllAnswers).length).toBe(
        0,
      );
    });

    it("handleDiatonicSubmitAll judges all correct answers", () => {
      const hook = startDiatonicQuiz();
      const q = hook.result.current.quizQuestion!;

      // Fill in all answers correctly
      for (const answer of q.diatonicAnswers!) {
        act(() => {
          hook.result.current.handleDiatonicDegreeCardClick(answer.degree);
        });
        act(() => {
          hook.result.current.handleDiatonicAnswerRootSelect(answer.root);
        });
        act(() => {
          hook.result.current.handleDiatonicAnswerTypeSelect(
            answer.chordType,
          );
        });
      }

      act(() => {
        hook.result.current.handleDiatonicSubmitAll();
      });
      expect(hook.result.current.quizScore).toEqual({ correct: 1, total: 1 });
    });

    it("handleDiatonicSubmitAll judges wrong answers", () => {
      const hook = startDiatonicQuiz();
      const q = hook.result.current.quizQuestion!;

      // Fill in all with wrong answers
      for (const answer of q.diatonicAnswers!) {
        act(() => {
          hook.result.current.handleDiatonicDegreeCardClick(answer.degree);
        });
        const wrongRoot = answer.root === "C" ? "D" : "C";
        act(() => {
          hook.result.current.handleDiatonicAnswerRootSelect(wrongRoot);
        });
        act(() => {
          hook.result.current.handleDiatonicAnswerTypeSelect(
            answer.chordType,
          );
        });
      }

      act(() => {
        hook.result.current.handleDiatonicSubmitAll();
      });
      expect(hook.result.current.quizScore).toEqual({ correct: 0, total: 1 });
    });

    it("handleDiatonicSubmitAll does nothing when not diatonic mode", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleDiatonicSubmitAll();
      });
      expect(hook.result.current.quizScore.total).toBe(0);
    });

    it("handleDiatonicSubmitAll does nothing when already submitted", () => {
      const hook = startDiatonicQuiz();
      const q = hook.result.current.quizQuestion!;
      for (const answer of q.diatonicAnswers!) {
        act(() => {
          hook.result.current.handleDiatonicDegreeCardClick(answer.degree);
        });
        act(() => {
          hook.result.current.handleDiatonicAnswerRootSelect(answer.root);
        });
        act(() => {
          hook.result.current.handleDiatonicAnswerTypeSelect(
            answer.chordType,
          );
        });
      }
      act(() => {
        hook.result.current.handleDiatonicSubmitAll();
      });
      act(() => {
        hook.result.current.handleDiatonicSubmitAll();
      });
      expect(hook.result.current.quizScore.total).toBe(1);
    });

    it("handleDiatonicDegreeCardClick does nothing when not diatonic all", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleDiatonicDegreeCardClick("I");
      });
      expect(hook.result.current.diatonicEditingDegree).toBeNull();
    });

    it("handleDiatonicAnswerRootSelect ignores after submission", () => {
      const hook = startDiatonicQuiz();
      const q = hook.result.current.quizQuestion!;
      for (const answer of q.diatonicAnswers!) {
        act(() => {
          hook.result.current.handleDiatonicDegreeCardClick(answer.degree);
        });
        act(() => {
          hook.result.current.handleDiatonicAnswerRootSelect(answer.root);
        });
        act(() => {
          hook.result.current.handleDiatonicAnswerTypeSelect(
            answer.chordType,
          );
        });
      }
      act(() => {
        hook.result.current.handleDiatonicSubmitAll();
      });
      act(() => {
        hook.result.current.handleDiatonicAnswerRootSelect("X");
      });
      expect(hook.result.current.diatonicSelectedRoot).toBeNull();
    });

    it("diatonicQuizKeyType and chordSize can be changed", () => {
      const hook = startDiatonicQuiz();
      act(() => {
        hook.result.current.setDiatonicQuizKeyType("natural-minor");
      });
      expect(hook.result.current.diatonicQuizKeyType).toBe("natural-minor");
      act(() => {
        hook.result.current.setDiatonicQuizChordSize("seventh");
      });
      expect(hook.result.current.diatonicQuizChordSize).toBe("seventh");
    });

    it("auto-advances diatonicEditingDegree to next unanswered", () => {
      const hook = startDiatonicQuiz();
      const q = hook.result.current.quizQuestion!;
      const answers = q.diatonicAnswers!;

      // Answer only the first degree
      act(() => {
        hook.result.current.handleDiatonicDegreeCardClick(answers[0].degree);
      });
      act(() => {
        hook.result.current.handleDiatonicAnswerRootSelect(answers[0].root);
      });
      act(() => {
        hook.result.current.handleDiatonicAnswerTypeSelect(
          answers[0].chordType,
        );
      });

      // Should auto-advance to 2nd degree
      expect(hook.result.current.diatonicEditingDegree).toBe(
        answers[1].degree,
      );
    });
  });

  // =========================================================================
  // handleQuizModeChange / handleQuizTypeChange (individual)
  // =========================================================================

  describe("handleQuizModeChange / handleQuizTypeChange", () => {
    it("handleQuizModeChange changes mode and generates question", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizModeChange("degree");
      });
      expect(hook.result.current.quizMode).toBe("degree");
      expect(hook.result.current.quizQuestion).not.toBeNull();
      expect(hook.result.current.quizScore).toEqual({ correct: 0, total: 0 });
    });

    it("handleQuizTypeChange changes type and generates question", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizTypeChange("fretboard");
      });
      expect(hook.result.current.quizType).toBe("fretboard");
      expect(hook.result.current.quizQuestion).not.toBeNull();
      expect(hook.result.current.quizScore).toEqual({ correct: 0, total: 0 });
    });
  });

  // =========================================================================
  // Question generation edge cases
  // =========================================================================

  describe("question generation edge cases", () => {
    it("note choice question has 12 choices (all notes)", () => {
      const hook = startedQuiz();
      const q = hook.result.current.quizQuestion!;
      expect(q.choices.length).toBe(12);
    });

    it("degree choice question has 12 degree names", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("degree", "choice");
      });
      const q = hook.result.current.quizQuestion!;
      expect(q.choices.length).toBe(12);
      expect(q.choices).toContain("P1");
      expect(q.choices).toContain("M7");
    });

    it("chord choice question has empty choices (root+type selection)", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("chord", "choice");
      });
      const q = hook.result.current.quizQuestion!;
      expect(q.choices).toEqual([]);
    });

    it("chord fretboard question has correctNoteNames", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("chord", "fretboard");
      });
      const q = hook.result.current.quizQuestion!;
      expect(q.correctNoteNames).toBeDefined();
      expect(q.correctNoteNames!.length).toBeGreaterThan(0);
    });

    it("scale choice question has correctNoteNames", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("scale", "choice");
      });
      const q = hook.result.current.quizQuestion!;
      expect(q.correctNoteNames).toBeDefined();
      expect(q.correctNoteNames!.length).toBeGreaterThan(0);
    });

    it("fretboard allStrings note question has correctNoteNames", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.setFretboardAllStrings(true);
      });
      act(() => {
        hook.result.current.handleQuizKindChange("note", "fretboard");
      });
      const q = hook.result.current.quizQuestion!;
      expect(q.correctNoteNames).toBeDefined();
    });

    it("fretboard allStrings degree question has correctNoteNames", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.setFretboardAllStrings(true);
      });
      act(() => {
        hook.result.current.handleQuizKindChange("degree", "fretboard");
      });
      const q = hook.result.current.quizQuestion!;
      expect(q.correctNoteNames).toBeDefined();
    });

    it("scale fretboard question has correctNoteNames", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("scale", "fretboard");
      });
      const q = hook.result.current.quizQuestion!;
      expect(q.correctNoteNames).toBeDefined();
    });

    it("chord choice uses CHORD_IDENTIFY_ROOTS for root", () => {
      const validRoots = ["A", "B", "C", "D", "E", "F", "G"];
      const hook = startedQuiz();
      act(() => {
        hook.result.current.handleQuizKindChange("chord", "choice");
      });
      const q = hook.result.current.quizQuestion!;
      expect(validRoots).toContain(q.promptChordRoot);
    });

    it("diatonic question uses correct progression for key type", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.setDiatonicQuizKeyType("natural-minor");
      });
      act(() => {
        hook.result.current.handleQuizKindChange("diatonic", "all");
      });
      const q = hook.result.current.quizQuestion!;
      expect(q.promptDiatonicKeyType).toBe("natural-minor");
      // natural-minor-triad first degree should be minor
      const firstDegree = q.diatonicAnswers![0];
      expect(firstDegree.degree).toBe("i");
    });

    it("diatonic seventh question has correct chord types", () => {
      const hook = startedQuiz();
      act(() => {
        hook.result.current.setDiatonicQuizChordSize("seventh");
      });
      act(() => {
        hook.result.current.handleQuizKindChange("diatonic", "all");
      });
      const q = hook.result.current.quizQuestion!;
      expect(q.promptDiatonicChordSize).toBe("seventh");
    });
  });

  // =========================================================================
  // CHORD_QUIZ_TYPES_ALL export
  // =========================================================================

  describe("CHORD_QUIZ_TYPES_ALL", () => {
    it("contains all 14 chord types", () => {
      expect(CHORD_QUIZ_TYPES_ALL).toHaveLength(14);
      expect(CHORD_QUIZ_TYPES_ALL).toContain("Major");
      expect(CHORD_QUIZ_TYPES_ALL).toContain("Minor");
      expect(CHORD_QUIZ_TYPES_ALL).toContain("aug");
      expect(CHORD_QUIZ_TYPES_ALL).toContain("dim");
    });
  });

  // =========================================================================
  // State setters exposed directly
  // =========================================================================

  describe("direct state setters", () => {
    it("setQuizMode updates mode", () => {
      const { result } = setup();
      act(() => {
        result.current.setQuizMode("chord");
      });
      expect(result.current.quizMode).toBe("chord");
    });

    it("setQuizType updates type", () => {
      const { result } = setup();
      act(() => {
        result.current.setQuizType("fretboard");
      });
      expect(result.current.quizType).toBe("fretboard");
    });

    it("setFretboardAllStrings updates the flag", () => {
      const { result } = setup();
      act(() => {
        result.current.setFretboardAllStrings(true);
      });
      expect(result.current.fretboardAllStrings).toBe(true);
    });

    it("setQuizQuestion updates the question", () => {
      const { result } = setup();
      const mockQ = {
        stringIdx: 0,
        fret: 0,
        correct: "C",
        choices: ["C", "D"],
      };
      act(() => {
        result.current.setQuizQuestion(mockQ);
      });
      expect(result.current.quizQuestion).toBe(mockQ);
    });
  });
});
