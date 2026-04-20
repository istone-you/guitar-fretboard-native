import { Switch } from "react-native";
import { TOGGLE_COLORS } from "../../../themes/design";

interface SlideToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  isDark: boolean;
  activeColor?: string;
}

export default function SlideToggle({
  value,
  onValueChange,
  isDark,
  activeColor,
}: SlideToggleProps) {
  // iOS 26: UISwitch automatically adopts Liquid Glass design.
  // Custom activeColor is preserved; if unset, iOS green (#34C759) is used.
  const onColor = activeColor ?? TOGGLE_COLORS.on;
  const offColor = isDark ? TOGGLE_COLORS.offDark : TOGGLE_COLORS.offLight;

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: offColor, true: onColor }}
      ios_backgroundColor={offColor}
    />
  );
}
