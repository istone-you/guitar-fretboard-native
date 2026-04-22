import type { ReactNode } from "react";
import { TouchableOpacity, type StyleProp, type ViewStyle } from "react-native";
import { getColors, radius, type ThemeColors } from "../../../themes/design";

export function getPillStyle(colors: ThemeColors): ViewStyle {
  return {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  };
}

function getDangerStyle(isDark: boolean): ViewStyle {
  return {
    borderColor: getColors(isDark).pillDangerBorder,
    backgroundColor: getColors(isDark).pillDangerBg,
  };
}

interface PillButtonProps {
  isDark: boolean;
  onPress: () => void;
  children: ReactNode;
  variant?: "default" | "danger";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
  testID?: string;
}

export default function PillButton({
  isDark,
  onPress,
  children,
  variant = "default",
  disabled = false,
  style,
  activeOpacity = 0.7,
  testID,
}: PillButtonProps) {
  const colors = getColors(isDark);
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        getPillStyle(colors),
        variant === "danger" && getDangerStyle(isDark),
        disabled && { opacity: 0.35 },
        style,
      ]}
      activeOpacity={activeOpacity}
      testID={testID}
    >
      {children}
    </TouchableOpacity>
  );
}
