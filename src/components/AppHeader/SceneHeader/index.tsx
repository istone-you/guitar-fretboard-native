import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Theme, Accidental } from "@/types";
import { getColors } from "@/themes/design";
import HeaderBar from "@/components/AppHeader";

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
  const { pageBg: bgColor } = getColors(props.theme === "dark");

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: bgColor }}>
      <HeaderBar {...props} />
    </View>
  );
}
