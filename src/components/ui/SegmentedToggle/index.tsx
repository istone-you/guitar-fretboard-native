import SegmentedControl from "@react-native-segmented-control/segmented-control";
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
}

export function SegmentedToggle<T extends string | boolean>({
  theme,
  value,
  onChange,
  options,
  size = "default",
}: SegmentedToggleProps<T>) {
  const isDark = theme === "dark";
  const selectedIndex = options.findIndex((o) => o.value === value);
  const height = size === "compact" ? 28 : 32;
  const segWidth = size === "compact" ? 56 : 72;
  const containerWidth = options.length * segWidth;

  return (
    <SegmentedControl
      values={options.map((o) => o.label ?? String(o.value))}
      selectedIndex={selectedIndex}
      onChange={(e) => {
        onChange(options[e.nativeEvent.selectedSegmentIndex].value);
      }}
      appearance={isDark ? "dark" : "light"}
      style={{ width: containerWidth, height }}
    />
  );
}
