import { useMemo } from "react";
import type { QuizMode, QuizType } from "../types";

interface QuizKindOption {
  value: string;
  label: string;
}

interface UseQuizViewModelParams {
  showQuiz: boolean;
  quizMode: QuizMode;
  quizType: QuizType;
  t: (key: string) => string;
  onQuizKindChange: (mode: QuizMode, type: QuizType) => void;
}

export function useQuizViewModel({
  showQuiz,
  quizMode,
  quizType,
  t,
  onQuizKindChange,
}: UseQuizViewModelParams) {
  const quizRootChangeEnabled = !showQuiz;

  const quizKindValue = `${quizMode}-${quizType}`;

  const quizKindOptions: QuizKindOption[] = useMemo(
    () => [
      { value: "note-choice", label: t("quiz.kind.noteChoice") },
      { value: "note-fretboard", label: t("quiz.kind.noteFretboard") },
      { value: "degree-choice", label: t("quiz.kind.degreeChoice") },
      { value: "degree-fretboard", label: t("quiz.kind.degreeFretboard") },
      { value: "chord-choice", label: t("quiz.kind.chordChoice") },
      { value: "scale-choice", label: t("quiz.kind.scaleChoice") },
      { value: "diatonic-all", label: t("quiz.kind.diatonicAll") },
    ],
    [t],
  );

  const handleQuizKindDropdownChange = (value: string) => {
    const parts = value.split("-");
    const newType = parts[parts.length - 1] as QuizType;
    const newMode = parts.slice(0, -1).join("-") as QuizMode;
    onQuizKindChange(newMode, newType);
  };

  return {
    quizRootChangeEnabled,
    quizKindValue,
    quizKindOptions,
    handleQuizKindDropdownChange,
  };
}
