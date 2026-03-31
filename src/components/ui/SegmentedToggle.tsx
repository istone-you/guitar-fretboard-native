import { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  type LayoutChangeEvent,
} from "react-native";
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
  const selectedIndex = options.findIndex((o) => o.value === value);

  const [buttonWidths, setButtonWidths] = useState<number[]>([]);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const selectedLeft =
    buttonWidths.length === options.length
      ? buttonWidths.slice(0, selectedIndex).reduce((sum, w) => sum + w + 4, 0)
      : 0;
  const selectedWidth =
    buttonWidths.length === options.length ? (buttonWidths[selectedIndex] ?? 0) : 0;

  const handleLayout = (index: number, e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setButtonWidths((prev) => {
      const next = [...prev];
      next[index] = w;
      // When all widths are known, jump to current selection immediately
      if (next.filter(Boolean).length === options.length) {
        const initLeft = next.slice(0, selectedIndex).reduce((sum, bw) => sum + bw + 4, 0);
        slideAnim.setValue(initLeft);
      }
      return next;
    });
  };

  const handleChange = (newValue: T) => {
    const newIndex = options.findIndex((o) => o.value === newValue);
    const newLeft =
      buttonWidths.length === options.length
        ? buttonWidths.slice(0, newIndex).reduce((sum, bw) => sum + bw + 4, 0)
        : 0;
    Animated.timing(slideAnim, { toValue: newLeft, duration: 180, useNativeDriver: false }).start();
    onChange(newValue);
  };

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
      {/* Sliding highlight */}
      {selectedWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: selectedWidth,
              backgroundColor: isDark ? "#0284c7" : "#0ea5e9",
              transform: [{ translateX: slideAnim }],
            },
          ]}
        />
      )}
      {options.map((option, index) => {
        const selected = option.value === value;
        const label = option.label ?? String(option.value);
        return (
          <TouchableOpacity
            key={String(option.value)}
            onPress={() => handleChange(option.value)}
            onLayout={(e) => handleLayout(index, e)}
            style={[styles.button, isCompact ? styles.buttonCompact : styles.buttonDefault]}
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
    position: "relative",
  },
  indicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    borderRadius: 999,
    left: 4,
  },
  button: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
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
