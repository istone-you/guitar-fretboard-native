import { useRef } from "react";
import { Animated, TouchableOpacity, Text, StyleSheet } from "react-native";

interface NotePillProps {
  label: string;
  selected: boolean;
  activeBg: string;
  activeText: string;
  inactiveBg: string;
  inactiveText: string;
  onPress: () => void;
}

export default function NotePill({
  label,
  selected,
  activeBg,
  activeText,
  inactiveBg,
  inactiveText,
  onPress,
}: NotePillProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const prevSelected = useRef(selected);

  if (prevSelected.current !== selected) {
    prevSelected.current = selected;
    scale.stopAnimation();
    scale.setValue(0.85);
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[
          styles.pill,
          selected
            ? { backgroundColor: activeBg, borderColor: activeBg }
            : { backgroundColor: inactiveBg, borderColor: "transparent" },
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: selected ? activeText : inactiveText, fontWeight: selected ? "700" : "500" },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderCurve: "continuous",
    borderWidth: 1,
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 15,
    fontWeight: "600",
  },
});
