import { useState } from "react";
import { DIATONIC_CHORDS } from "../logic/fretboard";

export function useDiatonicSelection() {
  const [diatonicKeyType, setDiatonicKeyType] = useState("major");
  const [diatonicChordSize, setDiatonicChordSize] = useState("triad");
  const [diatonicDegree, setDiatonicDegree] = useState("I");

  const handleDiatonicKeyTypeChange = (value: string) => {
    const validDegrees = DIATONIC_CHORDS[`${value}-${diatonicChordSize}`].map((item) => item.value);
    setDiatonicKeyType(value);
    if (!validDegrees.includes(diatonicDegree)) setDiatonicDegree(validDegrees[0]);
  };

  const handleDiatonicChordSizeChange = (value: string) => {
    const validDegrees = DIATONIC_CHORDS[`${diatonicKeyType}-${value}`].map((item) => item.value);
    setDiatonicChordSize(value);
    if (!validDegrees.includes(diatonicDegree)) setDiatonicDegree(validDegrees[0]);
  };

  return {
    diatonicKeyType,
    diatonicChordSize,
    diatonicDegree,
    setDiatonicDegree,
    handleDiatonicKeyTypeChange,
    handleDiatonicChordSizeChange,
  };
}
