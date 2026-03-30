import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { Theme } from "../../types";

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
  const isCompact = size === "compact";

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e7e5e4",
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(231,229,228,0.8)",
        },
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const label = option.label ?? String(option.value);
        return (
          <TouchableOpacity
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            style={[
              styles.button,
              isCompact ? styles.buttonCompact : styles.buttonDefault,
              selected
                ? { backgroundColor: isDark ? "#0284c7" : "#0ea5e9" }
                : { backgroundColor: "transparent" },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.buttonText,
                { color: selected ? "#fff" : isDark ? "#d1d5db" : "#57534e" },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  button: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDefault: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  buttonCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 56,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
