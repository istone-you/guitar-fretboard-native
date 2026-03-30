import Fretboard, { type FretboardProps } from "../ui/Fretboard";

export type { FretboardProps } from "../ui/Fretboard";

export default function QuizFretboard(props: FretboardProps) {
  return (
    <Fretboard
      {...props}
      showScale={false}
      showCaged={false}
      highlightedDegrees={new Set()}
      suppressRegularDisplay
      hideChordNoteLabels={props.showChord && !props.quizAnswerMode}
    />
  );
}
