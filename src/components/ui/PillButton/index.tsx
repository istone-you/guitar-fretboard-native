import type { ReactNode } from "react";
import { TouchableOpacity, type StyleProp, type ViewStyle } from "react-native";
import { getColors, radius, type ThemeColors } from "../../../themes/tokens";

export function getPillStyle(colors: ThemeColors): ViewStyle {
  return {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  };
}

interface PillButtonProps {
  isDark: boolean;
  onPress: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
  testID?: string;
}

export default function PillButton({
  isDark,
  onPress,
  children,
  style,
  activeOpacity = 0.7,
  testID,
}: PillButtonProps) {
  const colors = getColors(isDark);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[getPillStyle(colors), style]}
      activeOpacity={activeOpacity}
      testID={testID}
    >
      {children}
    </TouchableOpacity>
  );
}
