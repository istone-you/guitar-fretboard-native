import { View } from "react-native";
import NormalFretboard from "../NormalFretboard";
import QuizFretboard from "../QuizFretboard";
import type { Accidental, BaseLabelMode, LayerConfig, Theme } from "../../types";
import type { QuizQuestion } from "../../types";

interface FretboardPaneProps {
  showQuiz: boolean;
  isLandscape: boolean;
  theme: Theme;
  accidental: Accidental;
  baseLabelMode: BaseLabelMode;
  fretRange: [number, number];
  rootNote: string;
  quizEffectiveRootNote: string;
  quizLayers: LayerConfig[];
  quizAccentColor: string;
  quizQuestion: QuizQuestion | null;
  quizType: "choice" | "fretboard" | "all";
  quizMode: "note" | "degree" | "chord" | "scale" | "diatonic";
  quizAnsweredCell: { stringIdx: number; fret: number } | null;
  quizCorrectCell: { stringIdx: number; fret: number } | null;
  quizSelectedCells: { stringIdx: number; fret: number }[];
  quizRevealNoteNames: string[] | null;
  quizStrings: number[];
  layers: LayerConfig[];
  disableAnimation: boolean;
  cellEditMode: "hide" | "frame" | null;
  cellEditLayerId: string | null;
  editingCells: Set<string>;
  cellEditBounceKey: string | null;
  cellEditBounceTick: number;
  onFretboardDoubleTap: () => void;
  onQuizCellClick: (stringIdx: number, fret: number) => void;
  onCellToggle: (cellKey: string) => void;
}

export default function FretboardPane({
  showQuiz,
  isLandscape,
  theme,
  accidental,
  baseLabelMode,
  fretRange,
  rootNote,
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
  layers,
  disableAnimation,
  cellEditMode,
  cellEditLayerId,
  editingCells,
  cellEditBounceKey,
  cellEditBounceTick,
  onFretboardDoubleTap,
  onQuizCellClick,
  onCellToggle,
}: FretboardPaneProps) {
  return (
    <View style={{ paddingVertical: isLandscape ? 2 : 8 }} onTouchEnd={onFretboardDoubleTap}>
      {showQuiz ? (
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
            quizQuestion != null &&
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
            quizStrings.length === 1 &&
            quizQuestion != null
              ? quizQuestion.stringIdx
              : undefined
          }
          quizAnsweredCell={quizAnsweredCell}
          quizCorrectCell={quizCorrectCell}
          quizSelectedCells={quizSelectedCells}
          onQuizCellClick={onQuizCellClick}
          quizRevealNoteNames={quizRevealNoteNames}
        />
      ) : (
        <NormalFretboard
          theme={theme}
          accidental={accidental}
          baseLabelMode={baseLabelMode}
          fretRange={fretRange}
          rootNote={rootNote}
          layers={layers}
          disableAnimation={disableAnimation}
          onNoteClick={() => {}}
          cellEditMode={cellEditMode}
          cellEditLayerId={cellEditLayerId}
          editingCells={editingCells}
          cellEditBounceKey={cellEditBounceKey}
          cellEditBounceTick={cellEditBounceTick}
          onCellToggle={onCellToggle}
        />
      )}
    </View>
  );
}
