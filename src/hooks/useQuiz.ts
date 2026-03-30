import { useCallback, useRef, useState } from "react";
import {
  NOTES_SHARP,
  NOTES_FLAT,
  CHORD_SEMITONES,
  DIATONIC_CHORDS,
  isInScale,
  getDegreeName,
  getNoteIndex,
  getRootIndex,
} from "../logic/fretboard";
import type {
  Accidental,
  ChordType,
  ScaleType,
  QuizMode,
  QuizType,
  QuizQuestion,
  DiatonicAnswerEntry,
} from "../types";

const DEGREE_NAMES = [
  "P1",
  "m2",
  "M2",
  "m3",
  "M3",
  "P4",
  "b5",
  "P5",
  "m6",
  "M6",
  "m7",
  "M7",
];

export const CHORD_QUIZ_TYPES_ALL: ChordType[] = [
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
];

const CHORD_SUFFIX_MAP: Record<ChordType, string> = {
  Major: "",
  Minor: "m",
  "7th": "7",
  maj7: "maj7",
  m7: "m7",
  "m7(b5)": "m7(b5)",
  dim7: "dim7",
  "m(maj7)": "m(maj7)",
  sus2: "sus2",
  sus4: "sus4",
  "6": "6",
  m6: "m6",
  dim: "dim",
  aug: "aug",
};

const CHORD_IDENTIFY_ROOTS = ["A", "B", "C", "D", "E", "F", "G"] as const;

interface UseQuizParams {
  accidental: Accidental;
  fretRange: [number, number];
  rootNote: string;
  scaleType: ScaleType;
  showQuiz: boolean;
  chordQuizTypes: ChordType[];
}

function chordSuffix(chordType: ChordType): string {
  return CHORD_SUFFIX_MAP[chordType] ?? chordType;
}

export function useQuiz({
  accidental,
  fretRange,
  rootNote,
  scaleType,
  showQuiz,
  chordQuizTypes,
}: UseQuizParams) {
  const [quizMode, setQuizMode] = useState<QuizMode>("note");
  const [quizType, setQuizType] = useState<QuizType>("choice");
  const [fretboardAllStrings, setFretboardAllStrings] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [quizAnsweredCell, setQuizAnsweredCell] = useState<{
    stringIdx: number;
    fret: number;
  } | null>(null);
  const [quizCorrectCell, setQuizCorrectCell] = useState<{
    stringIdx: number;
    fret: number;
  } | null>(null);
  const [quizSelectedCells, setQuizSelectedCells] = useState<
    { stringIdx: number; fret: number }[]
  >([]);
  const [quizSelectedChoices, setQuizSelectedChoices] = useState<string[]>([]);
  const [quizSelectedChordRoot, setQuizSelectedChordRoot] = useState<
    string | null
  >(null);
  const [quizSelectedChordType, setQuizSelectedChordType] =
    useState<ChordType | null>(null);
  const [diatonicQuizKeyType, setDiatonicQuizKeyType] = useState<
    "major" | "natural-minor"
  >("major");
  const [diatonicQuizChordSize, setDiatonicQuizChordSize] = useState<
    "triad" | "seventh"
  >("triad");
  const [diatonicSelectedRoot, setDiatonicSelectedRoot] = useState<
    string | null
  >(null);
  const [diatonicSelectedChordType, setDiatonicSelectedChordType] =
    useState<ChordType | null>(null);
  const [diatonicAllAnswers, setDiatonicAllAnswers] = useState<
    Record<string, { root: string; chordType: ChordType }>
  >({});
  const [diatonicEditingDegree, setDiatonicEditingDegree] = useState<
    string | null
  >(null);
  const [quizRevealNoteNames, setQuizRevealNoteNames] = useState<
    string[] | null
  >(null);

  const generateQuizQuestion = useCallback(
    (mode: QuizMode, type: QuizType = "choice"): QuizQuestion => {
      const notes = accidental === "sharp" ? NOTES_SHARP : NOTES_FLAT;
      const stringIdx = Math.floor(Math.random() * 6);
      const fret =
        fretRange[0] +
        Math.floor(Math.random() * (fretRange[1] - fretRange[0] + 1));
      const noteIdx = getNoteIndex(stringIdx, fret);
      const rootIdx = getRootIndex(rootNote);

      if (mode === "chord") {
        const chordTypePool: ChordType[] =
          chordQuizTypes.length > 0 ? chordQuizTypes : ["Major"];
        const chordType =
          chordTypePool[Math.floor(Math.random() * chordTypePool.length)];
        const chordRoot =
          type === "choice"
            ? CHORD_IDENTIFY_ROOTS[
                Math.floor(Math.random() * CHORD_IDENTIFY_ROOTS.length)
              ]
            : notes[Math.floor(Math.random() * 12)];
        const chordRootIndex = getRootIndex(chordRoot);
        const chordSemitones = [
          ...(CHORD_SEMITONES[chordType] ?? new Set<number>()),
        ];
        const correctNoteNames = chordSemitones.map(
          (semitone) => notes[(chordRootIndex + semitone) % 12],
        );
        const promptChordLabel = `${chordRoot}${CHORD_SUFFIX_MAP[chordType]}`;

        if (type === "choice") {
          return {
            stringIdx,
            fret,
            correct: `${chordRoot}|${chordType}`,
            choices: [],
            answerLabel: promptChordLabel,
            promptChordLabel,
            promptChordRoot: chordRoot,
            promptChordType: chordType,
          };
        }

        const matchingCells: { stringIdx: number; fret: number }[] = [];

        for (
          let currentStringIdx = 0;
          currentStringIdx < 6;
          currentStringIdx += 1
        ) {
          for (
            let currentFret = fretRange[0];
            currentFret <= fretRange[1];
            currentFret += 1
          ) {
            if (
              correctNoteNames.includes(
                notes[getNoteIndex(currentStringIdx, currentFret)],
              )
            ) {
              matchingCells.push({
                stringIdx: currentStringIdx,
                fret: currentFret,
              });
            }
          }
        }

        const targetCell =
          matchingCells[Math.floor(Math.random() * matchingCells.length)];
        return {
          stringIdx: targetCell?.stringIdx ?? stringIdx,
          fret: targetCell?.fret ?? fret,
          correct: correctNoteNames[0] ?? "",
          choices: [],
          answerLabel: correctNoteNames.join(" / "),
          promptChordLabel,
          promptChordRoot: chordRoot,
          promptChordType: chordType,
          correctNoteNames,
        };
      }

      if (mode === "scale") {
        const scaleRootIndex = getRootIndex(rootNote);
        const correctNoteNames = notes.filter((_, noteIndex) =>
          isInScale((noteIndex - scaleRootIndex + 12) % 12, scaleType),
        );
        const matchingCells: { stringIdx: number; fret: number }[] = [];

        for (
          let currentStringIdx = 0;
          currentStringIdx < 6;
          currentStringIdx += 1
        ) {
          for (
            let currentFret = fretRange[0];
            currentFret <= fretRange[1];
            currentFret += 1
          ) {
            if (
              correctNoteNames.includes(
                notes[getNoteIndex(currentStringIdx, currentFret)],
              )
            ) {
              matchingCells.push({
                stringIdx: currentStringIdx,
                fret: currentFret,
              });
            }
          }
        }

        const targetCell =
          matchingCells[Math.floor(Math.random() * matchingCells.length)];
        return {
          stringIdx: targetCell?.stringIdx ?? stringIdx,
          fret: targetCell?.fret ?? fret,
          correct: correctNoteNames[0] ?? "",
          choices: type === "choice" ? [...notes] : [],
          answerLabel: correctNoteNames.join(" / "),
          promptScaleRoot: rootNote,
          promptScaleType: scaleType,
          correctNoteNames,
        };
      }

      if (mode === "diatonic") {
        const progressionKey = `${diatonicQuizKeyType}-${diatonicQuizChordSize}`;
        const progression =
          DIATONIC_CHORDS[progressionKey] ?? DIATONIC_CHORDS["major-triad"];
        const uniqueChordTypes = Array.from(
          new Set(progression.map((entry) => entry.chordType)),
        );
        const answers: DiatonicAnswerEntry[] = progression.map((entry) => {
          const answerRoot = notes[(rootIdx + entry.offset) % 12];
          return {
            degree: entry.value,
            root: answerRoot,
            chordType: entry.chordType,
            label: `${answerRoot}${chordSuffix(entry.chordType)}`,
          };
        });

        return {
          stringIdx,
          fret,
          correct: answers.map((entry) => entry.label).join(" / "),
          choices: [],
          answerLabel: answers
            .map((entry) => `${entry.degree}: ${entry.label}`)
            .join(", "),
          promptDiatonicKeyType: diatonicQuizKeyType,
          promptDiatonicChordSize: diatonicQuizChordSize,
          diatonicChordTypeOptions: uniqueChordTypes,
          diatonicAnswers: answers,
        };
      }

      if (type === "fretboard") {
        const correct =
          mode === "note" ? notes[noteIdx] : getDegreeName(noteIdx, rootIdx);
        if (fretboardAllStrings && (mode === "note" || mode === "degree")) {
          return {
            stringIdx,
            fret,
            correct,
            choices: [],
            correctNoteNames: [notes[noteIdx]],
          };
        }
        return { stringIdx, fret, correct, choices: [] };
      }

      if (mode === "note") {
        const correct = notes[noteIdx];
        const choices = [...notes];
        return { stringIdx, fret, correct, choices };
      }

      const correct = getDegreeName(noteIdx, rootIdx);
      const choices = DEGREE_NAMES;
      return { stringIdx, fret, correct, choices };
    },
    [
      accidental,
      chordQuizTypes,
      diatonicQuizChordSize,
      diatonicQuizKeyType,
      fretRange,
      fretboardAllStrings,
      rootNote,
      scaleType,
    ],
  );

  const resetQuizProgress = useCallback(() => {
    setSelectedAnswer(null);
    setQuizAnsweredCell(null);
    setQuizCorrectCell(null);
    setQuizSelectedCells([]);
    setQuizSelectedChoices([]);
    setQuizSelectedChordRoot(null);
    setQuizSelectedChordType(null);
    setDiatonicSelectedRoot(null);
    setDiatonicSelectedChordType(null);
    setDiatonicAllAnswers({});
    setDiatonicEditingDegree(null);
    setQuizRevealNoteNames(null);
    setQuizScore({ correct: 0, total: 0 });
  }, []);

  const clearCurrentQuizState = useCallback(() => {
    setSelectedAnswer(null);
    setQuizAnsweredCell(null);
    setQuizCorrectCell(null);
    setQuizSelectedCells([]);
    setQuizSelectedChoices([]);
    setQuizSelectedChordRoot(null);
    setQuizSelectedChordType(null);
    setDiatonicSelectedRoot(null);
    setDiatonicSelectedChordType(null);
    setDiatonicAllAnswers({});
    setDiatonicEditingDegree(null);
    setQuizRevealNoteNames(null);
  }, []);

  const startQuiz = useCallback(() => {
    resetQuizProgress();
    setQuizQuestion(generateQuizQuestion(quizMode, quizType));
  }, [generateQuizQuestion, quizMode, quizType, resetQuizProgress]);

  const handleQuizModeChange = useCallback(
    (mode: QuizMode) => {
      setQuizMode(mode);
      resetQuizProgress();
      setQuizQuestion(generateQuizQuestion(mode, quizType));
    },
    [generateQuizQuestion, quizType, resetQuizProgress],
  );

  const handleQuizTypeChange = useCallback(
    (type: QuizType) => {
      setQuizType(type);
      resetQuizProgress();
      setQuizQuestion(generateQuizQuestion(quizMode, type));
    },
    [generateQuizQuestion, quizMode, resetQuizProgress],
  );

  const handleQuizKindChange = useCallback(
    (mode: QuizMode, type: QuizType) => {
      setQuizMode(mode);
      setQuizType(type);
      resetQuizProgress();
      setQuizQuestion(generateQuizQuestion(mode, type));
    },
    [generateQuizQuestion, resetQuizProgress],
  );

  // Toggle selection only — no judgement
  const handleQuizAnswer = useCallback(
    (answer: string) => {
      if (selectedAnswer !== null || quizQuestion === null) return;

      if (quizMode === "scale" && quizType === "choice") {
        // Multi-select: toggle
        setQuizSelectedChoices((prev) =>
          prev.includes(answer) ? prev.filter((c) => c !== answer) : [...prev, answer],
        );
        return;
      }

      // Single-select for note/degree choice
      setQuizSelectedChoices([answer]);
    },
    [quizMode, quizQuestion, quizType, selectedAnswer],
  );

  // Submit: judge the current selection
  const handleSubmitChoice = useCallback(() => {
    if (selectedAnswer !== null || quizQuestion === null) return;

    if (quizMode === "scale" && quizType === "choice") {
      const correctNoteNames = quizQuestion.correctNoteNames ?? [];
      const allCorrect =
        correctNoteNames.length === quizSelectedChoices.length &&
        correctNoteNames.every((n) => quizSelectedChoices.includes(n));
      setSelectedAnswer(allCorrect ? quizQuestion.correct : quizSelectedChoices.join(","));
      setQuizScore((prev) => ({
        correct: prev.correct + (allCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
      return;
    }

    const answer = quizSelectedChoices[0] ?? "";
    const isCorrect = answer === quizQuestion.correct;
    setSelectedAnswer(answer);
    setQuizScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  }, [quizMode, quizQuestion, quizSelectedChoices, quizType, selectedAnswer]);

  const handleChordQuizRootSelect = useCallback(
    (root: string) => {
      if (
        quizMode !== "chord" ||
        quizType !== "choice" ||
        selectedAnswer !== null
      )
        return;
      setQuizSelectedChordRoot(root);
    },
    [quizMode, quizType, selectedAnswer],
  );

  // Chord type: selection only
  const handleChordQuizTypeSelect = useCallback(
    (chordType: ChordType) => {
      if (selectedAnswer !== null) return;
      setQuizSelectedChordType(chordType);
    },
    [selectedAnswer],
  );

  // Submit chord choice
  const handleSubmitChordChoice = useCallback(() => {
    if (selectedAnswer !== null || quizQuestion === null) return;
    if (quizSelectedChordRoot == null || quizSelectedChordType == null) return;
    const isCorrect =
      quizSelectedChordRoot === quizQuestion.promptChordRoot &&
      quizSelectedChordType === quizQuestion.promptChordType;
    setSelectedAnswer(`${quizSelectedChordRoot}|${quizSelectedChordType}`);
    setQuizScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  }, [quizQuestion, quizSelectedChordRoot, quizSelectedChordType, selectedAnswer]);

  // Fretboard: toggle cell selection only — no judgement
  const handleFretboardQuizAnswer = useCallback(
    (stringIdx: number, fret: number) => {
      if (!showQuiz || quizType !== "fretboard" || selectedAnswer !== null || quizQuestion === null) return;

      // Multi-cell modes (scale/chord/allStrings): toggle cell
      if (quizMode === "chord" || quizMode === "scale" ||
          ((quizMode === "note" || quizMode === "degree") && fretboardAllStrings)) {
        setQuizSelectedCells((prev) => {
          const exists = prev.some((c) => c.stringIdx === stringIdx && c.fret === fret);
          return exists ? prev.filter((c) => !(c.stringIdx === stringIdx && c.fret === fret)) : [...prev, { stringIdx, fret }];
        });
        return;
      }

      // Single-cell mode (note/degree single string): replace selection
      setQuizSelectedCells([{ stringIdx, fret }]);
    },
    [showQuiz, quizType, selectedAnswer, quizQuestion, quizMode, fretboardAllStrings],
  );

  // Submit fretboard answer
  const handleSubmitFretboard = useCallback(() => {
    if (selectedAnswer !== null || quizQuestion === null || quizSelectedCells.length === 0) return;

    const notes = accidental === "sharp" ? NOTES_SHARP : NOTES_FLAT;
    const rootIdx = getRootIndex(rootNote);
    const correctNoteNames = quizQuestion.correctNoteNames ?? [];

    // Scale fretboard: must select ALL cells that are scale notes
    if (quizMode === "scale") {
      const allCorrectCells: { stringIdx: number; fret: number }[] = [];
      for (let s = 0; s < 6; s++) {
        for (let f = fretRange[0]; f <= fretRange[1]; f++) {
          if (correctNoteNames.includes(notes[getNoteIndex(s, f)] as string)) {
            allCorrectCells.push({ stringIdx: s, fret: f });
          }
        }
      }
      const isCorrect =
        allCorrectCells.length === quizSelectedCells.length &&
        allCorrectCells.every((c) =>
          quizSelectedCells.some((s) => s.stringIdx === c.stringIdx && s.fret === c.fret),
        );
      setQuizRevealNoteNames(correctNoteNames);
      setSelectedAnswer(isCorrect ? quizQuestion.correct : "wrong");
      setQuizScore((prev) => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
      return;
    }

    // Chord fretboard: all unique chord tone names must be present, wrong notes NG, duplicates OK
    if (quizMode === "chord") {
      const selectedNames = new Set(
        quizSelectedCells.map((c) => notes[getNoteIndex(c.stringIdx, c.fret)] as string),
      );
      const allSelectedCorrect = [...selectedNames].every((n) => correctNoteNames.includes(n));
      const allTonesPresent = correctNoteNames.every((n) => selectedNames.has(n));
      const isCorrect = allTonesPresent && allSelectedCorrect;
      setQuizRevealNoteNames(correctNoteNames);
      setSelectedAnswer(isCorrect ? quizQuestion.correct : "wrong");
      setQuizScore((prev) => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
      return;
    }

    // Note/degree all strings: correct note on every string that has it, one per string OK, wrong cells NG
    if ((quizMode === "note" || quizMode === "degree") && fretboardAllStrings) {
      // Check all selected cells are correct notes
      const allSelectedCorrect = quizSelectedCells.every((c) =>
        correctNoteNames.includes(notes[getNoteIndex(c.stringIdx, c.fret)] as string),
      );
      // Check every string that has the note has at least one selected
      let allStringsCovered = true;
      for (let s = 0; s < 6; s++) {
        const stringHasNote = Array.from(
          { length: fretRange[1] - fretRange[0] + 1 },
          (_, i) => fretRange[0] + i,
        ).some((f) => correctNoteNames.includes(notes[getNoteIndex(s, f)] as string));
        if (stringHasNote) {
          const selectedOnString = quizSelectedCells.some(
            (c) => c.stringIdx === s && correctNoteNames.includes(notes[getNoteIndex(c.stringIdx, c.fret)] as string),
          );
          if (!selectedOnString) { allStringsCovered = false; break; }
        }
      }
      const isCorrect = allSelectedCorrect && allStringsCovered;
      setQuizRevealNoteNames(correctNoteNames);
      setSelectedAnswer(isCorrect ? quizQuestion.correct : "wrong");
      setQuizScore((prev) => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
      return;
    }

    // Single-cell: note/degree single string
    const cell = quizSelectedCells[0];
    const clickedNoteIdx = getNoteIndex(cell.stringIdx, cell.fret);
    const isCorrect = quizMode === "note"
      ? notes[clickedNoteIdx] === quizQuestion.correct
      : getDegreeName(clickedNoteIdx, rootIdx) === quizQuestion.correct;

    setQuizAnsweredCell(cell);
    setQuizCorrectCell(isCorrect ? cell : { stringIdx: quizQuestion.stringIdx, fret: quizQuestion.fret });
    setSelectedAnswer(isCorrect ? quizQuestion.correct : (notes[clickedNoteIdx] as string));
    setQuizScore((prev) => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
  }, [selectedAnswer, quizQuestion, quizSelectedCells, accidental, rootNote, quizMode, fretboardAllStrings, fretRange]);

  const handleNextQuestion = useCallback(() => {
    if (quizQuestion === null) return;
    clearCurrentQuizState();
    setQuizQuestion(generateQuizQuestion(quizMode, quizType));
  }, [
    clearCurrentQuizState,
    generateQuizQuestion,
    quizMode,
    quizQuestion,
    quizType,
  ]);

  const handleRetryQuestion = useCallback(() => {
    if (quizQuestion === null) return;
    clearCurrentQuizState();
  }, [clearCurrentQuizState, quizQuestion]);

  const handleDiatonicAnswerRootSelect = useCallback(
    (root: string) => {
      if (quizMode !== "diatonic" || selectedAnswer !== null) return;
      setDiatonicSelectedRoot(root);
    },
    [quizMode, selectedAnswer],
  );

  const handleDiatonicDegreeCardClick = useCallback(
    (degree: string) => {
      if (
        quizMode !== "diatonic" ||
        quizType !== "all" ||
        selectedAnswer !== null
      )
        return;
      setDiatonicEditingDegree(degree);
      setDiatonicSelectedRoot(null);
      setDiatonicSelectedChordType(null);
    },
    [quizMode, quizType, selectedAnswer],
  );

  const handleDiatonicSubmitAll = useCallback(() => {
    if (
      quizMode !== "diatonic" ||
      quizType !== "all" ||
      selectedAnswer !== null
    )
      return;
    if (quizQuestion?.diatonicAnswers == null) return;

    const isCorrect =
      quizQuestion.diatonicAnswers.every(
        (entry) =>
          diatonicAllAnswers[entry.degree]?.root === entry.root &&
          diatonicAllAnswers[entry.degree]?.chordType === entry.chordType,
      ) ?? false;
    setSelectedAnswer(isCorrect ? quizQuestion.correct : "diatonic-all");
    setQuizScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  }, [quizMode, quizType, selectedAnswer, quizQuestion, diatonicAllAnswers]);

  const handleDiatonicAnswerTypeSelect = useCallback(
    (chordType: ChordType) => {
      if (
        quizMode !== "diatonic" ||
        selectedAnswer !== null ||
        quizQuestion == null
      )
        return;
      if (diatonicSelectedRoot == null) return;

      setDiatonicSelectedChordType(chordType);

      const targetDegree =
        diatonicEditingDegree ??
        quizQuestion.diatonicAnswers?.find(
          (entry) => diatonicAllAnswers[entry.degree] == null,
        )?.degree ??
        null;
      if (targetDegree == null) return;

      const nextAnswers = {
        ...diatonicAllAnswers,
        [targetDegree]: { root: diatonicSelectedRoot, chordType },
      };
      setDiatonicAllAnswers(nextAnswers);
      setDiatonicSelectedRoot(null);
      setDiatonicSelectedChordType(null);

      const nextUnanswered =
        quizQuestion.diatonicAnswers?.find(
          (entry) => nextAnswers[entry.degree] == null,
        )?.degree ?? null;
      setDiatonicEditingDegree(nextUnanswered ?? targetDegree);
    },
    [
      diatonicAllAnswers,
      diatonicEditingDegree,
      diatonicSelectedRoot,
      quizMode,
      quizQuestion,
      quizType,
      selectedAnswer,
    ],
  );

  const regenerateQuiz = useCallback(() => {
    if (!showQuiz || quizQuestion === null) return;
    clearCurrentQuizState();
    setQuizQuestion(generateQuizQuestion(quizMode, quizType));
  }, [
    clearCurrentQuizState,
    generateQuizQuestion,
    quizMode,
    quizQuestion,
    quizType,
    showQuiz,
  ]);

  const handleShowQuizChange = useCallback(
    (show: boolean) => {
      if (show) {
        startQuiz();
      } else {
        setQuizQuestion(null);
        clearCurrentQuizState();
      }
    },
    [clearCurrentQuizState, startQuiz],
  );

  return {
    quizMode,
    quizType,
    quizQuestion,
    selectedAnswer,
    quizScore,
    quizAnsweredCell,
    quizCorrectCell,
    quizSelectedCells,
    quizSelectedChoices,
    diatonicQuizKeyType,
    diatonicQuizChordSize,
    quizSelectedChordRoot,
    quizSelectedChordType,
    diatonicSelectedRoot,
    diatonicSelectedChordType,
    diatonicAllAnswers,
    diatonicEditingDegree,
    quizRevealNoteNames,
    setQuizMode,
    setQuizType,
    setQuizQuestion,
    handleQuizModeChange,
    handleQuizTypeChange,
    handleQuizKindChange,
    handleQuizAnswer,
    handleChordQuizRootSelect,
    handleChordQuizTypeSelect,
    handleDiatonicAnswerRootSelect,
    handleDiatonicAnswerTypeSelect,
    handleDiatonicDegreeCardClick,
    handleDiatonicSubmitAll,
    handleFretboardQuizAnswer,
    handleNextQuestion,
    handleRetryQuestion,
    setDiatonicQuizKeyType,
    setDiatonicQuizChordSize,
    fretboardAllStrings,
    setFretboardAllStrings,
    regenerateQuiz,
    handleShowQuizChange,
    handleSubmitChoice,
    handleSubmitChordChoice,
    handleSubmitFretboard,
  };
}
