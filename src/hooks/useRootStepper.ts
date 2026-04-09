import { useMemo } from "react";
import type { Accidental } from "../types";
import { getNotesByAccidental } from "../lib/fretboard";

interface UseRootStepperParams {
  accidental: Accidental;
  rootNote: string;
  rootChangeDisabled?: boolean;
  onRootNoteChange: (note: string) => void;
}

export function useRootStepper({
  accidental,
  rootNote,
  rootChangeDisabled = false,
  onRootNoteChange,
}: UseRootStepperParams) {
  const notes: string[] = useMemo(
    () => [...getNotesByAccidental(accidental)] as string[],
    [accidental],
  );
  const currentIndex = notes.indexOf(rootNote);

  const stepNote = (dir: 1 | -1) => {
    if (rootChangeDisabled || currentIndex < 0) return;
    const next = (currentIndex + dir + 12) % 12;
    onRootNoteChange(notes[next]);
  };

  return {
    stepNote,
  };
}
