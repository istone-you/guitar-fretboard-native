import { View } from "react-native";

interface PracticePaneProps {
  isLandscape: boolean;
  fretboard: React.ReactNode;
  fretboardHidden?: boolean;
  controls?: React.ReactNode;
  onFretboardDoubleTap: () => void;
  children: React.ReactNode;
}

export default function PracticePane({
  isLandscape,
  fretboard,
  fretboardHidden = false,
  controls,
  onFretboardDoubleTap,
  children,
}: PracticePaneProps) {
  return (
    <>
      {!isLandscape && controls}
      <View
        style={{ paddingVertical: isLandscape ? 2 : 8, opacity: fretboardHidden ? 0 : 1 }}
        onTouchEnd={onFretboardDoubleTap}
      >
        {fretboard}
      </View>
      {!isLandscape && <View style={{ flex: 1 }}>{children}</View>}
    </>
  );
}
