import { useCallback, useState } from "react";
import {
  CHORD_SEMITONES,
  DEGREE_BY_SEMITONE,
  getNotesByAccidental,
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
  QuizRecord,
  DiatonicAnswerEntry,
} from "../types";

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
  "9",
  "b9",
  "#9",
  "add9",
  "11",
  "#11",
  "add11",
  "add#11",
  "13",
  "b13",
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
  "9": "9",
  b9: "7(b9)",
  "#9": "7(#9)",
  maj9: "maj9",
  m9: "m9",
  add9: "add9",
  "7(b9)": "7(b9)",
  "7(#9)": "7(#9)",
  "11": "11",
  "#11": "7(#11)",
  add11: "add11",
  "add#11": "add(#11)",
  m11: "m11",
  "13": "13",
  b13: "7(b13)",
  maj13: "maj13",
  m13: "m13",
  "6/9": "6/9",
  "m6/9": "m6/9",
};

const QUIZ_HISTORY_SIZE = 4;

function pickAvoiding<T extends string>(pool: readonly T[], recentKeys: string[]): T {
  if (pool.length === 0) throw new Error("empty pool");
  const recentSet = new Set(recentKeys);
  const candidates = pool.filter((item) => !recentSet.has(item));
  const src = candidates.length > 0 ? candidates : pool;
  return src[Math.floor(Math.random() * src.length)];
}

interface UseQuizParams {
  accidental: Accidental;
  fretRange: [number, number];
  rootNote: string;
  scaleType: ScaleType;
  showQuiz: boolean;
  onRecord?: (record: QuizRecord) => void;
}

const DEFAULT_CHORD_QUIZ_TYPES: ChordType[] = ["Major", "Minor", "7th", "maj7", "m7"];

function chordSuffix(chordType: ChordType): string {
  return CHORD_SUFFIX_MAP[chordType] ?? chordType;
}

export function useQuiz({
  accidental,
  fretRange,
  rootNote,
  scaleType,
  showQuiz,
  onRecord,
}: UseQuizParams) {
  const [chordQuizTypes, setChordQuizTypes] = useState<ChordType[]>(DEFAULT_CHORD_QUIZ_TYPES);
  const [quizMode, setQuizMode] = useState<QuizMode>("note");
  const [quizType, setQuizType] = useState<QuizType>("choice");
  const [quizStrings, setQuizStrings] = useState<number[]>([0, 1, 2, 3, 4, 5]);
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
  const [quizKeys, setQuizKeys] = useState<string[]>(() => [...getNotesByAccidental(accidental)]);
  const [quizNoteNames, setQuizNoteNames] = useState<string[]>(() => [
    ...getNotesByAccidental(accidental),
  ]);
  const [quizHistory, setQuizHistory] = useState<string[]>([]);

  const generateQuizQuestion = useCallback(
    (
      mode: QuizMode,
      type: QuizType = "choice",
      overrides?: {
        quizKeys?: string[];
        quizNoteNames?: string[];
        quizStrings?: number[];
        chordQuizTypes?: ChordType[];
      },
    ): QuizQuestion => {
      const notes = getNotesByAccidental(accidental);
      const stringIdx = Math.floor(Math.random() * 6);
      const fret = fretRange[0] + Math.floor(Math.random() * (fretRange[1] - fretRange[0] + 1));
      const noteIdx = getNoteIndex(stringIdx, fret);

      // For degree/scale, pick a random key from quizKeys
      const effectiveQuizKeys = overrides?.quizKeys ?? quizKeys;
      const effectiveRoot =
        (mode === "degree" || mode === "scale") && effectiveQuizKeys.length > 0
          ? effectiveQuizKeys[Math.floor(Math.random() * effectiveQuizKeys.length)]
          : rootNote;
      const rootIdx = getRootIndex(effectiveRoot);

      if (mode === "chord") {
        const effectiveChordTypes = overrides?.chordQuizTypes ?? chordQuizTypes;
        const chordTypePool: ChordType[] =
          effectiveChordTypes.length > 0 ? effectiveChordTypes : ["Major"];
        const chordType = pickAvoiding(chordTypePool, quizHistory);
        // Fix #2: use all 12 notes for chord root (not just natural notes)
        const chordRoot = pickAvoiding([...notes], quizHistory);
        const chordRootIndex = getRootIndex(chordRoot);
        const chordSemitones = [...(CHORD_SEMITONES[chordType] ?? new Set<number>())];
        const correctNoteNames = chordSemitones.map(
          (semitone) => notes[(chordRootIndex + semitone) % 12],
        );
        const promptChordLabel = `${chordRoot}${CHORD_SUFFIX_MAP[chordType]}`;
        const historyKey = `${chordRoot}|${chordType}`;
        setQuizHistory((prev) => [...prev.slice(-QUIZ_HISTORY_SIZE + 1), historyKey]);

        if (type === "choice") {
          return {
            stringIdx,
            fret,
            correct: historyKey,
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
              matchingCells.push({
                stringIdx: currentStringIdx,
                fret: currentFret,
              });
            }
          }
        }

        const targetCell =
          matchingCells.length > 0
            ? matchingCells[Math.floor(Math.random() * matchingCells.length)]
            : undefined;
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
        const scaleRootIndex = getRootIndex(effectiveRoot);
        const correctNoteNames = notes.filter((_, noteIndex) =>
          isInScale((noteIndex - scaleRootIndex + 12) % 12, scaleType),
        );
        const matchingCells: { stringIdx: number; fret: number }[] = [];

        for (let currentStringIdx = 0; currentStringIdx < 6; currentStringIdx += 1) {
          for (let currentFret = fretRange[0]; currentFret <= fretRange[1]; currentFret += 1) {
            if (correctNoteNames.includes(notes[getNoteIndex(currentStringIdx, currentFret)])) {
              matchingCells.push({
                stringIdx: currentStringIdx,
                fret: currentFret,
              });
            }
          }
        }

        const targetCell =
          matchingCells.length > 0
            ? matchingCells[Math.floor(Math.random() * matchingCells.length)]
            : undefined;
        setQuizHistory((prev) => [...prev.slice(-QUIZ_HISTORY_SIZE + 1), `scale:${effectiveRoot}`]);
        return {
          stringIdx: targetCell?.stringIdx ?? stringIdx,
          fret: targetCell?.fret ?? fret,
          correct: correctNoteNames[0] ?? "",
          choices: type === "choice" ? [...notes] : [],
          answerLabel: correctNoteNames.join(" / "),
          promptScaleRoot: effectiveRoot,
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

      const effectiveStrings = overrides?.quizStrings ?? quizStrings;
      const multiString = effectiveStrings.length > 1;

      // Fix #3: For note mode, pick note name first, then pick a cell with that note
      if (mode === "note") {
        const effectiveNoteNames = overrides?.quizNoteNames ?? quizNoteNames;
        const notePool = effectiveNoteNames.length > 0 ? effectiveNoteNames : [...notes];
        // Pick a note avoiding recent history
        const targetNote = pickAvoiding(notePool, quizHistory);

        // Collect all cells that have the target note
        const validCells: { stringIdx: number; fret: number }[] = [];
        for (const s of effectiveStrings) {
          for (let f = fretRange[0]; f <= fretRange[1]; f++) {
            if (notes[getNoteIndex(s, f)] === targetNote) {
              validCells.push({ stringIdx: s, fret: f });
            }
          }
        }
        const cell =
          validCells.length > 0
            ? validCells[Math.floor(Math.random() * validCells.length)]
            : { stringIdx, fret };
        const correct = targetNote;
        setQuizHistory((prev) => [...prev.slice(-QUIZ_HISTORY_SIZE + 1), correct]);

        if (type === "fretboard") {
          if (multiString) {
            return {
              stringIdx: cell.stringIdx,
              fret: cell.fret,
              correct,
              choices: [],
              correctNoteNames: [correct],
              promptQuizStrings: effectiveStrings,
            };
          }
          return { stringIdx: cell.stringIdx, fret: cell.fret, correct, choices: [] };
        }
        return { stringIdx: cell.stringIdx, fret: cell.fret, correct, choices: [...notes] };
      }

      // Degree mode: pick degree first to avoid bias, then find a cell
      const allDegrees = [...DEGREE_BY_SEMITONE];
      const targetDegree = pickAvoiding(allDegrees, quizHistory);
      const targetSemitone = allDegrees.indexOf(targetDegree);
      const targetNoteIdx = (rootIdx + targetSemitone) % 12;

      const validCells: { stringIdx: number; fret: number }[] = [];
      for (const s of effectiveStrings) {
        for (let f = fretRange[0]; f <= fretRange[1]; f++) {
          if (getNoteIndex(s, f) === targetNoteIdx) {
            validCells.push({ stringIdx: s, fret: f });
          }
        }
      }
      const cell =
        validCells.length > 0
          ? validCells[Math.floor(Math.random() * validCells.length)]
          : { stringIdx, fret };
      setQuizHistory((prev) => [...prev.slice(-QUIZ_HISTORY_SIZE + 1), targetDegree]);

      if (type === "fretboard") {
        if (multiString) {
          return {
            stringIdx: cell.stringIdx,
            fret: cell.fret,
            correct: targetDegree,
            choices: [],
            correctNoteNames: [notes[targetNoteIdx]],
            promptQuizRoot: effectiveRoot,
            promptQuizStrings: effectiveStrings,
          };
        }
        return {
          stringIdx: cell.stringIdx,
          fret: cell.fret,
          correct: targetDegree,
          choices: [],
          promptQuizRoot: effectiveRoot,
        };
      }

      const choices = [...DEGREE_BY_SEMITONE];
      return {
        stringIdx: cell.stringIdx,
        fret: cell.fret,
        correct: targetDegree,
        choices,
        promptQuizRoot: effectiveRoot,
      };
    },
    [
      accidental,
      chordQuizTypes,
      diatonicQuizChordSize,
      diatonicQuizKeyType,
      fretRange,
      quizHistory,
      quizStrings,
      quizKeys,
      quizNoteNames,
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
    setQuizHistory([]);
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
      onRecord?.({ mode: "scale", correct: allCorrect, scaleType: quizQuestion.promptScaleType });
      return;
    }

    const answer = quizSelectedChoices[0] ?? "";
    const isCorrect = answer === quizQuestion.correct;
    setSelectedAnswer(answer);
    setQuizScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    if (quizMode === "note") {
      onRecord?.({
        mode: "note",
        correct: isCorrect,
        noteName: quizQuestion.correct,
        stringIdx: quizQuestion.stringIdx,
        fret: quizQuestion.fret,
      });
    } else if (quizMode === "degree") {
      onRecord?.({
        mode: "degree",
        correct: isCorrect,
        degreeLabel: quizQuestion.correct,
        stringIdx: quizQuestion.stringIdx,
        fret: quizQuestion.fret,
      });
    }
  }, [onRecord, quizMode, quizQuestion, quizSelectedChoices, quizType, selectedAnswer]);

  const handleChordQuizRootSelect = useCallback(
    (root: string) => {
      if (quizMode !== "chord" || quizType !== "choice" || selectedAnswer !== null) return;
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
    onRecord?.({ mode: "chord", correct: isCorrect, chordType: quizQuestion.promptChordType });
  }, [onRecord, quizQuestion, quizSelectedChordRoot, quizSelectedChordType, selectedAnswer]);

  // Fretboard: toggle cell selection only — no judgement
  const handleFretboardQuizAnswer = useCallback(
    (stringIdx: number, fret: number) => {
      if (!showQuiz || quizType !== "fretboard" || selectedAnswer !== null || quizQuestion === null)
        return;

      // Multi-cell modes (scale/chord/multiString): toggle cell
      if (
        quizMode === "chord" ||
        quizMode === "scale" ||
        ((quizMode === "note" || quizMode === "degree") && quizStrings.length > 1)
      ) {
        setQuizSelectedCells((prev) => {
          const exists = prev.some((c) => c.stringIdx === stringIdx && c.fret === fret);
          return exists
            ? prev.filter((c) => !(c.stringIdx === stringIdx && c.fret === fret))
            : [...prev, { stringIdx, fret }];
        });
        return;
      }

      // Single-cell mode (note/degree single string): replace selection
      setQuizSelectedCells([{ stringIdx, fret }]);
    },
    [showQuiz, quizType, selectedAnswer, quizQuestion, quizMode, quizStrings],
  );

  // Submit fretboard answer
  const handleSubmitFretboard = useCallback(() => {
    if (selectedAnswer !== null || quizQuestion === null || quizSelectedCells.length === 0) return;

    const notes = getNotesByAccidental(accidental);
    const effectiveRoot = quizQuestion.promptQuizRoot ?? rootNote;
    const rootIdx = getRootIndex(effectiveRoot);
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
      setQuizScore((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
      onRecord?.({ mode: "scale", correct: isCorrect, scaleType: quizQuestion.promptScaleType });
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
      setQuizScore((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
      onRecord?.({ mode: "chord", correct: isCorrect, chordType: quizQuestion.promptChordType });
      return;
    }

    // Note/degree multi-string: correct note on every target string that has it
    const targetStrings = quizQuestion.promptQuizStrings ?? quizStrings;
    if ((quizMode === "note" || quizMode === "degree") && targetStrings.length > 1) {
      // Check all selected cells are correct notes
      const allSelectedCorrect = quizSelectedCells.every((c) =>
        correctNoteNames.includes(notes[getNoteIndex(c.stringIdx, c.fret)] as string),
      );
      // Check every target string that has the note has at least one selected
      let allStringsCovered = true;
      for (const s of targetStrings) {
        const stringHasNote = Array.from(
          { length: fretRange[1] - fretRange[0] + 1 },
          (_, i) => fretRange[0] + i,
        ).some((f) => correctNoteNames.includes(notes[getNoteIndex(s, f)] as string));
        if (stringHasNote) {
          const selectedOnString = quizSelectedCells.some(
            (c) =>
              c.stringIdx === s &&
              correctNoteNames.includes(notes[getNoteIndex(c.stringIdx, c.fret)] as string),
          );
          if (!selectedOnString) {
            allStringsCovered = false;
            break;
          }
        }
      }
      const isCorrect = allSelectedCorrect && allStringsCovered;
      setQuizRevealNoteNames(correctNoteNames);
      setSelectedAnswer(isCorrect ? quizQuestion.correct : "wrong");
      setQuizScore((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
      onRecord?.({ mode: quizMode, correct: isCorrect });
      return;
    }

    // Single-cell: note/degree single string
    const cell = quizSelectedCells[0];
    const clickedNoteIdx = getNoteIndex(cell.stringIdx, cell.fret);
    const isCorrect =
      quizMode === "note"
        ? notes[clickedNoteIdx] === quizQuestion.correct
        : getDegreeName(clickedNoteIdx, rootIdx) === quizQuestion.correct;

    setQuizAnsweredCell(cell);
    setQuizCorrectCell(
      isCorrect ? cell : { stringIdx: quizQuestion.stringIdx, fret: quizQuestion.fret },
    );
    setSelectedAnswer(isCorrect ? quizQuestion.correct : (notes[clickedNoteIdx] as string));
    setQuizScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    if (quizMode === "note") {
      onRecord?.({
        mode: "note",
        correct: isCorrect,
        noteName: quizQuestion.correct,
        stringIdx: quizQuestion.stringIdx,
        fret: quizQuestion.fret,
      });
    } else {
      onRecord?.({
        mode: "degree",
        correct: isCorrect,
        degreeLabel: quizQuestion.correct,
        stringIdx: quizQuestion.stringIdx,
        fret: quizQuestion.fret,
      });
    }
  }, [
    onRecord,
    selectedAnswer,
    quizQuestion,
    quizSelectedCells,
    accidental,
    rootNote,
    quizMode,
    quizStrings,
    fretRange,
  ]);

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
    onRecord?.({ mode: "diatonic", correct: isCorrect });
  }, [onRecord, quizMode, quizType, selectedAnswer, quizQuestion, diatonicAllAnswers]);

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

  const regenerateQuiz = useCallback(
    (overrides?: {
      quizKeys?: string[];
      quizNoteNames?: string[];
      quizStrings?: number[];
      chordQuizTypes?: ChordType[];
    }) => {
      if (!showQuiz || quizQuestion === null) return;
      clearCurrentQuizState();
      setQuizQuestion(generateQuizQuestion(quizMode, quizType, overrides));
    },
    [clearCurrentQuizState, generateQuizQuestion, quizMode, quizQuestion, quizType, showQuiz],
  );

  const handleChordQuizTypesChange = useCallback(
    (types: ChordType[]) => {
      setChordQuizTypes(types);
      regenerateQuiz({ chordQuizTypes: types });
    },
    [regenerateQuiz],
  );

  const handleQuizKeysChange = useCallback(
    (keys: string[]) => {
      setQuizKeys(keys);
      regenerateQuiz({ quizKeys: keys });
    },
    [regenerateQuiz],
  );

  const handleQuizNoteNamesChange = useCallback(
    (names: string[]) => {
      setQuizNoteNames(names);
      regenerateQuiz({ quizNoteNames: names });
    },
    [regenerateQuiz],
  );

  const handleQuizStringsChange = useCallback(
    (strings: number[]) => {
      setQuizStrings(strings);
      regenerateQuiz({ quizStrings: strings });
    },
    [regenerateQuiz],
  );

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
    chordQuizTypes,
    handleChordQuizTypesChange,
    quizStrings,
    handleQuizStringsChange,
    quizKeys,
    handleQuizKeysChange,
    quizNoteNames,
    handleQuizNoteNamesChange,
    regenerateQuiz,
    handleShowQuizChange,
    handleSubmitChoice,
    handleSubmitChordChoice,
    handleSubmitFretboard,
  };
}
