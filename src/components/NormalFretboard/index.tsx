import Fretboard, { type FretboardProps } from "../ui/Fretboard";

export type { FretboardProps } from "../ui/Fretboard";

export default function NormalFretboard(props: FretboardProps) {
  return (
    <Fretboard
      {...props}
      quizModeActive={false}
      quizCell={undefined}
      quizAnswerMode={false}
      quizTargetString={undefined}
      quizAnsweredCell={null}
      quizCorrectCell={null}
      onQuizCellClick={undefined}
      suppressRegularDisplay={false}
    />
  );
}
