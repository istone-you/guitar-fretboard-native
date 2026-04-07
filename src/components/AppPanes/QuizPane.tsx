import QuizPanel from "../QuizPanel";
import type { ChordType, ScaleType, Theme, QuizMode, QuizQuestion, QuizType } from "../../types";

interface QuizPaneProps {
  showQuiz: boolean;
  theme: Theme;
  quizMode: QuizMode;
  quizType: QuizType;
  quizQuestion: QuizQuestion | null;
  quizScore: { correct: number; total: number };
  selectedAnswer: string | null;
  rootNote: string;
  quizSelectedChoices: string[];
  noteOptions: string[];
  quizSelectedChordRoot: string | null;
  quizSelectedChordType: ChordType | null;
  diatonicSelectedRoot: string | null;
  diatonicSelectedChordType: ChordType | null;
  diatonicAllAnswers: Record<string, { root: string; chordType: ChordType }>;
  diatonicEditingDegree: string | null;
  diatonicQuizKeyType: "major" | "natural-minor";
  diatonicQuizChordSize: "triad" | "seventh";
  chordQuizTypes: ChordType[];
  availableChordQuizTypes: ChordType[];
  scaleType: ScaleType;
  quizSelectedCells: { stringIdx: number; fret: number }[];
  quizStrings: number[];
  quizKeys: string[];
  onQuizKeysChange: (value: string[]) => void;
  quizNoteNames: string[];
  onQuizNoteNamesChange: (value: string[]) => void;
  onChordQuizTypesChange: (value: ChordType[]) => void;
  onScaleTypeChange: (value: ScaleType) => void;
  onDiatonicQuizKeyTypeChange: (value: "major" | "natural-minor") => void;
  onDiatonicQuizChordSizeChange: (value: "triad" | "seventh") => void;
  onAnswer: (answer: string) => void;
  onSubmitChoice: () => void;
  onChordQuizRootSelect: (root: string) => void;
  onChordQuizTypeSelect: (chordType: ChordType) => void;
  onSubmitChordChoice: () => void;
  onDiatonicAnswerRootSelect: (root: string) => void;
  onDiatonicAnswerTypeSelect: (chordType: ChordType) => void;
  onDiatonicDegreeCardClick: (degree: string) => void;
  onDiatonicSubmitAll: () => void;
  onSubmitFretboard: () => void;
  onNextQuestion: () => void;
  onRetryQuestion: () => void;
  onQuizStringsChange: (value: number[]) => void;
}

export default function QuizPane(props: QuizPaneProps) {
  if (!props.showQuiz || props.quizQuestion == null) return null;

  return (
    <QuizPanel
      theme={props.theme}
      mode={props.quizMode}
      quizType={props.quizType}
      question={props.quizQuestion}
      score={props.quizScore}
      selectedAnswer={props.selectedAnswer}
      rootNote={props.rootNote}
      quizSelectedChoices={props.quizSelectedChoices}
      noteOptions={props.noteOptions}
      quizSelectedChordRoot={props.quizSelectedChordRoot}
      quizSelectedChordType={props.quizSelectedChordType}
      diatonicSelectedRoot={props.diatonicSelectedRoot}
      diatonicSelectedChordType={props.diatonicSelectedChordType}
      diatonicAllAnswers={props.diatonicAllAnswers}
      diatonicEditingDegree={props.diatonicEditingDegree}
      diatonicQuizKeyType={props.diatonicQuizKeyType}
      diatonicQuizChordSize={props.diatonicQuizChordSize}
      chordQuizTypes={props.chordQuizTypes}
      availableChordQuizTypes={props.availableChordQuizTypes}
      scaleType={props.scaleType}
      onChordQuizTypesChange={props.onChordQuizTypesChange}
      onScaleTypeChange={props.onScaleTypeChange}
      onDiatonicQuizKeyTypeChange={props.onDiatonicQuizKeyTypeChange}
      onDiatonicQuizChordSizeChange={props.onDiatonicQuizChordSizeChange}
      onAnswer={props.onAnswer}
      onSubmitChoice={props.onSubmitChoice}
      onChordQuizRootSelect={props.onChordQuizRootSelect}
      onChordQuizTypeSelect={props.onChordQuizTypeSelect}
      onSubmitChordChoice={props.onSubmitChordChoice}
      onDiatonicAnswerRootSelect={props.onDiatonicAnswerRootSelect}
      onDiatonicAnswerTypeSelect={props.onDiatonicAnswerTypeSelect}
      onDiatonicDegreeCardClick={props.onDiatonicDegreeCardClick}
      onDiatonicSubmitAll={props.onDiatonicSubmitAll}
      onSubmitFretboard={props.onSubmitFretboard}
      onNextQuestion={props.onNextQuestion}
      onRetryQuestion={props.onRetryQuestion}
      quizSelectedCells={props.quizSelectedCells}
      quizStrings={props.quizStrings}
      onQuizStringsChange={props.onQuizStringsChange}
      quizKeys={props.quizKeys}
      onQuizKeysChange={props.onQuizKeysChange}
      quizNoteNames={props.quizNoteNames}
      onQuizNoteNamesChange={props.onQuizNoteNamesChange}
    />
  );
}
