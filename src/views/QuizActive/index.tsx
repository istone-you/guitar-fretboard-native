import QuizFretboard from "../../components/QuizFretboard";
import QuizPanel from "../../components/QuizPanel";
import PracticePane from "../../components/ui/PracticePane";
import type {
  Accidental,
  BaseLabelMode,
  ChordType,
  LayerConfig,
  QuizMode,
  QuizQuestion,
  QuizType,
  ScaleType,
  Theme,
} from "../../types";

interface QuizActivePracticePaneProps {
  // Fretboard
  isLandscape: boolean;
  theme: Theme;
  accidental: Accidental;
  baseLabelMode: BaseLabelMode;
  fretRange: [number, number];
  quizEffectiveRootNote: string;
  quizLayers: LayerConfig[];
  quizAccentColor: string;
  quizQuestion: QuizQuestion | null;
  quizType: QuizType;
  quizMode: QuizMode;
  quizAnsweredCell: { stringIdx: number; fret: number } | null;
  quizCorrectCell: { stringIdx: number; fret: number } | null;
  quizSelectedCells: { stringIdx: number; fret: number }[];
  quizRevealNoteNames: string[] | null;
  quizStrings: number[];
  leftHanded?: boolean;
  onFretboardDoubleTap: () => void;
  onQuizCellClick: (stringIdx: number, fret: number) => void;
  // Quiz panel
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

export default function QuizActivePracticePane({
  isLandscape,
  theme,
  accidental,
  baseLabelMode,
  fretRange,
  quizEffectiveRootNote,
  quizLayers,
  quizAccentColor,
  quizQuestion,
  quizType,
  quizMode,
  quizAnsweredCell,
  quizCorrectCell,
  quizSelectedCells,
  quizRevealNoteNames,
  quizStrings,
  leftHanded,
  onFretboardDoubleTap,
  onQuizCellClick,
  quizScore,
  selectedAnswer,
  rootNote,
  quizSelectedChoices,
  noteOptions,
  quizSelectedChordRoot,
  quizSelectedChordType,
  diatonicSelectedRoot,
  diatonicSelectedChordType,
  diatonicAllAnswers,
  diatonicEditingDegree,
  diatonicQuizKeyType,
  diatonicQuizChordSize,
  chordQuizTypes,
  availableChordQuizTypes,
  scaleType,
  quizKeys,
  onQuizKeysChange,
  quizNoteNames,
  onQuizNoteNamesChange,
  onChordQuizTypesChange,
  onScaleTypeChange,
  onDiatonicQuizKeyTypeChange,
  onDiatonicQuizChordSizeChange,
  onAnswer,
  onSubmitChoice,
  onChordQuizRootSelect,
  onChordQuizTypeSelect,
  onSubmitChordChoice,
  onDiatonicAnswerRootSelect,
  onDiatonicAnswerTypeSelect,
  onDiatonicDegreeCardClick,
  onDiatonicSubmitAll,
  onSubmitFretboard,
  onNextQuestion,
  onRetryQuestion,
  onQuizStringsChange,
}: QuizActivePracticePaneProps) {
  if (quizQuestion == null) return null;

  const hidden = quizMode === "diatonic" || (quizMode === "scale" && quizType === "choice");

  return (
    <PracticePane
      isLandscape={isLandscape}
      onFretboardDoubleTap={onFretboardDoubleTap}
      fretboardHidden={hidden}
      fretboard={
        <QuizFretboard
          theme={theme}
          accidental={accidental}
          baseLabelMode={baseLabelMode}
          fretRange={fretRange}
          rootNote={quizEffectiveRootNote}
          layers={quizLayers}
          quizColor={quizAccentColor}
          onNoteClick={() => {}}
          quizModeActive={quizQuestion != null}
          quizCell={
            quizType !== "fretboard" &&
            quizMode !== "chord" &&
            quizMode !== "scale" &&
            quizMode !== "diatonic"
              ? { stringIdx: quizQuestion.stringIdx, fret: quizQuestion.fret }
              : undefined
          }
          quizAnswerMode={quizType === "fretboard"}
          quizTargetString={
            quizType === "fretboard" &&
            (quizMode === "note" || quizMode === "degree") &&
            quizStrings.length === 1
              ? quizQuestion.stringIdx
              : undefined
          }
          quizAnsweredCell={quizAnsweredCell}
          quizCorrectCell={quizCorrectCell}
          quizSelectedCells={quizSelectedCells}
          onQuizCellClick={onQuizCellClick}
          quizRevealNoteNames={quizRevealNoteNames}
          leftHanded={leftHanded}
        />
      }
    >
      <QuizPanel
        theme={theme}
        mode={quizMode}
        quizType={quizType}
        question={quizQuestion}
        score={quizScore}
        selectedAnswer={selectedAnswer}
        rootNote={rootNote}
        quizSelectedChoices={quizSelectedChoices}
        noteOptions={noteOptions}
        quizSelectedChordRoot={quizSelectedChordRoot}
        quizSelectedChordType={quizSelectedChordType}
        diatonicSelectedRoot={diatonicSelectedRoot}
        diatonicSelectedChordType={diatonicSelectedChordType}
        diatonicAllAnswers={diatonicAllAnswers}
        diatonicEditingDegree={diatonicEditingDegree}
        diatonicQuizKeyType={diatonicQuizKeyType}
        diatonicQuizChordSize={diatonicQuizChordSize}
        chordQuizTypes={chordQuizTypes}
        availableChordQuizTypes={availableChordQuizTypes}
        scaleType={scaleType}
        onChordQuizTypesChange={onChordQuizTypesChange}
        onScaleTypeChange={onScaleTypeChange}
        onDiatonicQuizKeyTypeChange={onDiatonicQuizKeyTypeChange}
        onDiatonicQuizChordSizeChange={onDiatonicQuizChordSizeChange}
        onAnswer={onAnswer}
        onSubmitChoice={onSubmitChoice}
        onChordQuizRootSelect={onChordQuizRootSelect}
        onChordQuizTypeSelect={onChordQuizTypeSelect}
        onSubmitChordChoice={onSubmitChordChoice}
        onDiatonicAnswerRootSelect={onDiatonicAnswerRootSelect}
        onDiatonicAnswerTypeSelect={onDiatonicAnswerTypeSelect}
        onDiatonicDegreeCardClick={onDiatonicDegreeCardClick}
        onDiatonicSubmitAll={onDiatonicSubmitAll}
        onSubmitFretboard={onSubmitFretboard}
        onNextQuestion={onNextQuestion}
        onRetryQuestion={onRetryQuestion}
        quizSelectedCells={quizSelectedCells}
        quizStrings={quizStrings}
        onQuizStringsChange={onQuizStringsChange}
        quizKeys={quizKeys}
        onQuizKeysChange={onQuizKeysChange}
        quizNoteNames={quizNoteNames}
        onQuizNoteNamesChange={onQuizNoteNamesChange}
      />
    </PracticePane>
  );
}
