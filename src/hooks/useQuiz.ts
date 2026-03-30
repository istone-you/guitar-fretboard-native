import { useCallback, useEffect, useRef, useState } from "react";
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

const DEGREE_NAMES = ["P1", "m2", "M2", "m3", "M3", "P4", "b5", "P5", "m6", "M6", "m7", "M7"];

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
  const [quizSelectedCells, setQuizSelectedCells] = useState<{ stringIdx: number; fret: number }[]>(
    [],
  );
  const [quizSelectedChoices, setQuizSelectedChoices] = useState<string[]>([]);
  const [quizSelectedChordRoot, setQuizSelectedChordRoot] = useState<string | null>(null);
  const [quizSelectedChordType, setQuizSelectedChordType] = useState<ChordType | null>(null);
  const [diatonicQuizKeyType, setDiatonicQuizKeyType] = useState<"major" | "natural-minor">(
    "major",
  );
  const [diatonicQuizChordSize, setDiatonicQuizChordSize] = useState<"triad" | "seventh">("triad");
  const [diatonicSelectedRoot, setDiatonicSelectedRoot] = useState<string | null>(null);
  const [diatonicSelectedChordType, setDiatonicSelectedChordType] = useState<ChordType | null>(
    null,
  );
  const [diatonicAllAnswers, setDiatonicAllAnswers] = useState<
    Record<string, { root: string; chordType: ChordType }>
  >({});
  const [diatonicEditingDegree, setDiatonicEditingDegree] = useState<string | null>(null);
  const [quizRevealNoteNames, setQuizRevealNoteNames] = useState<string[] | null>(null);
  const chordQuizTypesKey = chordQuizTypes.join("|");
  const previousChordQuizTypesKeyRef = useRef(chordQuizTypesKey);
  const previousRootNoteRef = useRef(rootNote);
  const scaleQuizKey = `${rootNote}|${scaleType}`;
  const previousScaleQuizKeyRef = useRef(scaleQuizKey);
  const diatonicQuizKey = `${diatonicQuizKeyType}|${diatonicQuizChordSize}`;
  const previousDiatonicQuizKeyRef = useRef(diatonicQuizKey);

  const generateQuizQuestion = useCallback(
    (mode: QuizMode, type: QuizType = "choice"): QuizQuestion => {
      const notes = accidental === "sharp" ? NOTES_SHARP : NOTES_FLAT;
      const stringIdx = Math.floor(Math.random() * 6);
      const fret = fretRange[0] + Math.floor(Math.random() * (fretRange[1] - fretRange[0] + 1));
      const noteIdx = getNoteIndex(stringIdx, fret);
      const rootIdx = getRootIndex(rootNote);

      if (mode === "chord") {
        const chordTypePool: ChordType[] = chordQuizTypes.length > 0 ? chordQuizTypes : ["Major"];
        const chordType = chordTypePool[Math.floor(Math.random() * chordTypePool.length)];
        const chordRoot =
          type === "choice"
            ? CHORD_IDENTIFY_ROOTS[Math.floor(Math.random() * CHORD_IDENTIFY_ROOTS.length)]
            : notes[Math.floor(Math.random() * 12)];
        const chordRootIndex = getRootIndex(chordRoot);
        const chordSemitones = [...(CHORD_SEMITONES[chordType] ?? new Set<number>())];
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

        for (let currentStringIdx = 0; currentStringIdx < 6; currentStringIdx += 1) {
          for (let currentFret = fretRange[0]; currentFret <= fretRange[1]; currentFret += 1) {
            if (correctNoteNames.includes(notes[getNoteIndex(currentStringIdx, currentFret)])) {
              matchingCells.push({ stringIdx: currentStringIdx, fret: currentFret });
            }
          }
        }

        const targetCell = matchingCells[Math.floor(Math.random() * matchingCells.length)];
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

        for (let currentStringIdx = 0; currentStringIdx < 6; currentStringIdx += 1) {
          for (let currentFret = fretRange[0]; currentFret <= fretRange[1]; currentFret += 1) {
            if (correctNoteNames.includes(notes[getNoteIndex(currentStringIdx, currentFret)])) {
              matchingCells.push({ stringIdx: currentStringIdx, fret: currentFret });
            }
          }
        }

        const targetCell = matchingCells[Math.floor(Math.random() * matchingCells.length)];
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
        const progression = DIATONIC_CHORDS[progressionKey] ?? DIATONIC_CHORDS["major-triad"];
        const uniqueChordTypes = Array.from(new Set(progression.map((entry) => entry.chordType)));
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
          answerLabel: answers.map((entry) => `${entry.degree}: ${entry.label}`).join(", "),
          promptDiatonicKeyType: diatonicQuizKeyType,
          promptDiatonicChordSize: diatonicQuizChordSize,
          diatonicChordTypeOptions: uniqueChordTypes,
          diatonicAnswers: answers,
        };
      }

      if (type === "fretboard") {
        const correct = mode === "note" ? notes[noteIdx] : getDegreeName(noteIdx, rootIdx);
        if (fretboardAllStrings && (mode === "note" || mode === "degree")) {
          return { stringIdx, fret, correct, choices: [], correctNoteNames: [notes[noteIdx]] };
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

  const handleQuizAnswer = useCallback(
    (answer: string) => {
      if (selectedAnswer !== null || quizQuestion === null) return;

      if (quizMode === "scale" && quizType === "choice") {
        const correctNoteNames = quizQuestion.correctNoteNames ?? [];
        const isCorrectNote = correctNoteNames.includes(answer);

        if (!isCorrectNote) {
          setSelectedAnswer(answer);
          setQuizScore((prev) => ({
            correct: prev.correct,
            total: prev.total + 1,
          }));
          return;
        }

        const nextSelectedChoices = quizSelectedChoices.includes(answer)
          ? quizSelectedChoices
          : [...quizSelectedChoices, answer];
        setQuizSelectedChoices(nextSelectedChoices);

        const completed = correctNoteNames.every((noteName) =>
          nextSelectedChoices.includes(noteName),
        );
        if (completed) {
          setSelectedAnswer(quizQuestion.correct);
          setQuizScore((prev) => ({
            correct: prev.correct + 1,
            total: prev.total + 1,
          }));
        }
        return;
      }

      const isCorrect = answer === quizQuestion.correct;
      setSelectedAnswer(answer);
      setQuizScore((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
    },
    [quizMode, quizQuestion, quizSelectedChoices, quizType, selectedAnswer],
  );

  const handleChordQuizRootSelect = useCallback(
    (root: string) => {
      if (quizMode !== "chord" || quizType !== "choice" || selectedAnswer !== null) return;
      setQuizSelectedChordRoot(root);
    },
    [quizMode, quizType, selectedAnswer],
  );

  const handleChordQuizTypeSelect = useCallback(
    (chordType: ChordType) => {
      if (quizMode !== "chord" || quizType !== "choice" || selectedAnswer !== null) return;
      if (quizQuestion === null || quizSelectedChordRoot == null) return;

      setQuizSelectedChordType(chordType);
      const isCorrect =
        quizSelectedChordRoot === quizQuestion.promptChordRoot &&
        chordType === quizQuestion.promptChordType;
      setSelectedAnswer(`${quizSelectedChordRoot}|${chordType}`);
      setQuizScore((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
    },
    [quizMode, quizQuestion, quizSelectedChordRoot, quizType, selectedAnswer],
  );

  const handleFretboardQuizAnswer = useCallback(
    (stringIdx: number, fret: number) => {
      if (!showQuiz || quizType !== "fretboard" || selectedAnswer !== null || quizQuestion === null)
        return;

      const notes = accidental === "sharp" ? NOTES_SHARP : NOTES_FLAT;
      const rootIdx = getRootIndex(rootNote);
      const clickedNoteIdx = getNoteIndex(stringIdx, fret);

      if (quizMode === "chord" || quizMode === "scale") {
        const clickedNoteName = notes[clickedNoteIdx];
        const correctNoteNames = quizQuestion.correctNoteNames ?? [];
        const isCorrectNote = correctNoteNames.includes(clickedNoteName);

        if (!isCorrectNote) {
          setQuizAnsweredCell({ stringIdx, fret });
          setQuizCorrectCell(null);
          setQuizRevealNoteNames(correctNoteNames);
          setSelectedAnswer(clickedNoteName);
          setQuizScore((prev) => ({
            correct: prev.correct,
            total: prev.total + 1,
          }));
          return;
        }

        const nextSelectedCells = [
          ...quizSelectedCells,
          ...(quizSelectedCells.some((cell) => cell.stringIdx === stringIdx && cell.fret === fret)
            ? []
            : [{ stringIdx, fret }]),
        ];
        setQuizSelectedCells(nextSelectedCells);

        const completed =
          quizMode === "scale"
            ? nextSelectedCells.length ===
              Array.from({ length: 6 }, (_, currentStringIdx) => currentStringIdx).reduce(
                (count, currentStringIdx) =>
                  count +
                  Array.from(
                    { length: fretRange[1] - fretRange[0] + 1 },
                    (_, offset) => fretRange[0] + offset,
                  ).filter((currentFret) =>
                    correctNoteNames.includes(notes[getNoteIndex(currentStringIdx, currentFret)]),
                  ).length,
                0,
              )
            : correctNoteNames.every((noteName) =>
                new Set<string>(
                  nextSelectedCells.map((cell) => notes[getNoteIndex(cell.stringIdx, cell.fret)]),
                ).has(noteName),
              );
        if (completed) {
          setQuizRevealNoteNames(correctNoteNames);
          setSelectedAnswer(quizQuestion.correct);
          setQuizScore((prev) => ({
            correct: prev.correct + 1,
            total: prev.total + 1,
          }));
        }
        return;
      }

      if ((quizMode === "note" || quizMode === "degree") && fretboardAllStrings) {
        const clickedNoteName = notes[clickedNoteIdx];
        const correctNoteNames = quizQuestion.correctNoteNames ?? [];
        const isCorrectNote = correctNoteNames.includes(clickedNoteName);

        if (!isCorrectNote) {
          setQuizAnsweredCell({ stringIdx, fret });
          setQuizCorrectCell(null);
          setQuizRevealNoteNames(correctNoteNames);
          setSelectedAnswer(clickedNoteName);
          setQuizScore((prev) => ({ correct: prev.correct, total: prev.total + 1 }));
          return;
        }

        const nextSelectedCells = [
          ...quizSelectedCells,
          ...(quizSelectedCells.some((cell) => cell.stringIdx === stringIdx && cell.fret === fret)
            ? []
            : [{ stringIdx, fret }]),
        ];
        setQuizSelectedCells(nextSelectedCells);

        const totalCorrectCells = Array.from({ length: 6 }, (_, s) => s).reduce(
          (count, s) =>
            count +
            Array.from(
              { length: fretRange[1] - fretRange[0] + 1 },
              (_, i) => fretRange[0] + i,
            ).filter((f) => correctNoteNames.includes(notes[getNoteIndex(s, f)])).length,
          0,
        );

        if (nextSelectedCells.length === totalCorrectCells) {
          setQuizRevealNoteNames(correctNoteNames);
          setSelectedAnswer(quizQuestion.correct);
          setQuizScore((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }));
        }
        return;
      }

      const isCorrect =
        quizMode === "note"
          ? notes[clickedNoteIdx] === quizQuestion.correct
          : getDegreeName(clickedNoteIdx, rootIdx) === quizQuestion.correct;

      setQuizAnsweredCell({ stringIdx, fret });
      setQuizCorrectCell(
        isCorrect
          ? { stringIdx, fret }
          : { stringIdx: quizQuestion.stringIdx, fret: quizQuestion.fret },
      );
      setSelectedAnswer(isCorrect ? quizQuestion.correct : notes[clickedNoteIdx]);
      setQuizScore((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
    },
    [
      showQuiz,
      quizType,
      selectedAnswer,
      quizQuestion,
      accidental,
      rootNote,
      quizMode,
      quizSelectedCells,
      fretboardAllStrings,
      fretRange,
    ],
  );

  const handleNextQuestion = useCallback(() => {
    if (quizQuestion === null) return;
    clearCurrentQuizState();
    setQuizQuestion(generateQuizQuestion(quizMode, quizType));
  }, [clearCurrentQuizState, generateQuizQuestion, quizMode, quizQuestion, quizType]);

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
      if (quizMode !== "diatonic" || quizType !== "all" || selectedAnswer !== null) return;
      setDiatonicEditingDegree(degree);
      setDiatonicSelectedRoot(null);
      setDiatonicSelectedChordType(null);
    },
    [quizMode, quizType, selectedAnswer],
  );

  const handleDiatonicSubmitAll = useCallback(() => {
    if (quizMode !== "diatonic" || quizType !== "all" || selectedAnswer !== null) return;
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
      if (quizMode !== "diatonic" || selectedAnswer !== null || quizQuestion == null) return;
      if (diatonicSelectedRoot == null) return;

      setDiatonicSelectedChordType(chordType);

      const targetDegree =
        diatonicEditingDegree ??
        quizQuestion.diatonicAnswers?.find((entry) => diatonicAllAnswers[entry.degree] == null)
          ?.degree ??
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
        quizQuestion.diatonicAnswers?.find((entry) => nextAnswers[entry.degree] == null)?.degree ??
        null;
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

  useEffect(() => {
    if (previousRootNoteRef.current === rootNote) return;
    previousRootNoteRef.current = rootNote;
    if (!showQuiz || quizQuestion === null) return;

    clearCurrentQuizState();
    setQuizQuestion(generateQuizQuestion(quizMode, quizType));
  }, [
    clearCurrentQuizState,
    generateQuizQuestion,
    quizMode,
    quizQuestion,
    quizType,
    rootNote,
    showQuiz,
  ]);

  useEffect(() => {
    if (previousChordQuizTypesKeyRef.current === chordQuizTypesKey) return;
    previousChordQuizTypesKeyRef.current = chordQuizTypesKey;
    if (!showQuiz || quizQuestion === null) return;
    if (quizMode !== "chord") return;

    clearCurrentQuizState();
    setQuizQuestion(generateQuizQuestion(quizMode, quizType));
  }, [
    chordQuizTypesKey,
    clearCurrentQuizState,
    generateQuizQuestion,
    quizMode,
    quizQuestion,
    quizType,
    showQuiz,
  ]);

  useEffect(() => {
    if (previousDiatonicQuizKeyRef.current === diatonicQuizKey) return;
    previousDiatonicQuizKeyRef.current = diatonicQuizKey;
    if (!showQuiz || quizQuestion == null) return;
    if (quizMode !== "diatonic") return;

    clearCurrentQuizState();
    setQuizQuestion(generateQuizQuestion(quizMode, quizType));
  }, [
    clearCurrentQuizState,
    diatonicQuizKey,
    generateQuizQuestion,
    quizMode,
    quizQuestion,
    quizType,
    showQuiz,
  ]);

  useEffect(() => {
    if (previousScaleQuizKeyRef.current === scaleQuizKey) return;
    previousScaleQuizKeyRef.current = scaleQuizKey;
    if (!showQuiz || quizQuestion === null) return;
    if (quizMode !== "scale") return;

    clearCurrentQuizState();
    setQuizQuestion(generateQuizQuestion(quizMode, quizType));
  }, [
    clearCurrentQuizState,
    generateQuizQuestion,
    quizMode,
    quizQuestion,
    quizType,
    rootNote,
    scaleQuizKey,
    scaleType,
    showQuiz,
  ]);

  useEffect(() => {
    if (showQuiz && quizQuestion === null) {
      startQuiz();
    }
    if (!showQuiz) {
      setQuizQuestion(null);
      clearCurrentQuizState();
    }
  }, [clearCurrentQuizState, quizQuestion, showQuiz, startQuiz]);

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
  };
}
