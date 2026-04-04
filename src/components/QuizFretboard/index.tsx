import Fretboard, { type FretboardProps } from "../ui/Fretboard";

export default function QuizFretboard(props: FretboardProps) {
  return (
    <Fretboard
      {...props}
      suppressRegularDisplay
      hideChordNoteLabels={
        props.layers &&
        props.layers.some((l) => l.type === "chord" && l.enabled) &&
        !props.quizAnswerMode
      }
    />
  );
}
