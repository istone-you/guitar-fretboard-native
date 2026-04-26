import { useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { getColors, radius } from "../../../themes/design";
import type { Theme } from "../../../types";
import type { CircleOverlayKey } from "../CircleWheel";

interface OverlayToggleBarProps {
  theme: Theme;
  activeOverlay: CircleOverlayKey | null;
  onChange: (next: CircleOverlayKey | null) => void;
}

const TOGGLE_ORDER: ReadonlyArray<{ key: CircleOverlayKey; labelKey: string }> = [
  { key: "relatedKeys", labelKey: "circle.toggle.relatedKeys" },
  { key: "diatonic", labelKey: "circle.toggle.diatonic" },
  { key: "dominants", labelKey: "circle.toggle.dominants" },
  { key: "modalInterchange", labelKey: "circle.toggle.modalInterchange" },
];

interface TogglePillProps {
  active: boolean;
  theme: Theme;
  label: string;
  testID: string;
  onPress: () => void;
}

function TogglePill({ active, theme, label, testID, onPress }: TogglePillProps) {
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const scale = useRef(new Animated.Value(1)).current;
  const prevActive = useRef(active);

  if (prevActive.current !== active) {
    prevActive.current = active;
    if (active) {
      scale.stopAnimation();
      scale.setValue(0.8);
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 150,
        useNativeDriver: true,
      }).start();
    }
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        testID={testID}
        accessibilityRole="radio"
        accessibilityState={{ selected: active }}
        activeOpacity={0.7}
        style={[
          styles.pill,
          {
            borderColor: active ? colors.chipSelectedBg : colors.borderStrong,
            backgroundColor: active ? `${colors.chipSelectedBg}22` : colors.surface,
          },
        ]}
        onPress={onPress}
      >
        <Text
          style={[styles.label, { color: active ? colors.chipSelectedBg : colors.textSubtle }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function OverlayToggleBar({
  theme,
  activeOverlay,
  onChange,
}: OverlayToggleBarProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {TOGGLE_ORDER.map(({ key, labelKey }) => {
        const active = activeOverlay === key;
        return (
          <TogglePill
            key={key}
            active={active}
            theme={theme}
            label={t(labelKey)}
            testID={`circle-overlay-toggle-${key}`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(active ? null : key);
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
