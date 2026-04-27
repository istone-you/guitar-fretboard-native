import { useWindowDimensions } from "react-native";

// scrollView paddingH (16) × 2 + card paddingH (14) × 2 = 60
const OUTER_PADDING = 60;
const FORM_GAP = 8;

export function calcChordDiagramWidth(screenWidth: number): number {
  return Math.floor((screenWidth - OUTER_PADDING - FORM_GAP * 2) / 3);
}

export function useChordDiagramWidth(): number {
  const { width } = useWindowDimensions();
  return calcChordDiagramWidth(width);
}
