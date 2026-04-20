import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Theme, Accidental } from "../../types";
import HeaderBar from "./index";

interface SceneHeaderProps {
  theme: Theme;
  title?: string;
  accidental: Accidental;
  onBack?: () => void;
  fretRange: [number, number];
  onThemeChange: (theme: Theme) => void;
  onFretRangeChange: (range: [number, number]) => void;
  onAccidentalChange: (accidental: Accidental) => void;
  leftHanded?: boolean;
  onLeftHandedChange?: (value: boolean) => void;
}

export default function SceneHeader(props: SceneHeaderProps) {
  const insets = useSafeAreaInsets();
  const bgColor = props.theme === "dark" ? "#000000" : "#ffffff";

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: bgColor }}>
      <HeaderBar {...props} />
    </View>
  );
}
