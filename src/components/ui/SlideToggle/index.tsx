import { useRef } from "react";
import { TouchableOpacity, Animated, StyleSheet } from "react-native";

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
  const resolvedActiveColor = activeColor ?? (isDark ? "#e5e7eb" : "#1c1917");
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const prevValue = useRef(value);

  if (prevValue.current !== value) {
    prevValue.current = value;
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }

  const thumbX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });
  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? "#4b5563" : "#d6d3d1", resolvedActiveColor],
  });

  return (
    <TouchableOpacity onPress={() => onValueChange(!value)} activeOpacity={0.8}>
      <Animated.View style={[styles.track, { backgroundColor: bgColor }]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX: thumbX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 36,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
  },
  thumb: {
    position: "absolute",
    top: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
});
