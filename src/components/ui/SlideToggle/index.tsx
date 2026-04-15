import { Switch } from "react-native";

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
  const onColor = activeColor ?? "#34C759";
  const offColor = isDark ? "#3A3A3C" : "#E5E5EA";

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: offColor, true: onColor }}
      ios_backgroundColor={offColor}
    />
  );
}
