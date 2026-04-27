import SegmentedControl from "@react-native-segmented-control/segmented-control";
import * as Haptics from "expo-haptics";
import type { Theme } from "../../../types";

interface SegmentedToggleOption<T extends string | boolean> {
  value: T;
  label?: string;
}

interface SegmentedToggleProps<T extends string | boolean> {
  theme: Theme;
  value: T;
  onChange: (value: T) => void;
  options: SegmentedToggleOption<T>[];
  size?: "default" | "compact";
  segmentWidth?: number;
  enabled?: boolean;
}

export function SegmentedToggle<T extends string | boolean>({
  theme,
  value,
  onChange,
  options,
  size = "default",
  segmentWidth,
  enabled = true,
}: SegmentedToggleProps<T>) {
  const isDark = theme === "dark";
  const selectedIndex = options.findIndex((o) => o.value === value);
  const height = size === "compact" ? 28 : 32;
  const segWidth = segmentWidth ?? (size === "compact" ? 56 : 72);
  const containerWidth = options.length * segWidth;

  return (
    <SegmentedControl
      values={options.map((o) => o.label ?? String(o.value))}
      selectedIndex={selectedIndex}
      onChange={(e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(options[e.nativeEvent.selectedSegmentIndex].value);
      }}
      enabled={enabled}
      appearance={isDark ? "dark" : "light"}
      style={{ width: containerWidth, height }}
    />
  );
}
