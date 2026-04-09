import { useRef } from "react";
import { Animated, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";

export default function BounceButton({
  selected,
  onPress,
  style,
  wrapperStyle,
  activeOpacity = 0.7,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  style: any;
  wrapperStyle?: any;
  activeOpacity?: number;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const mounted = useRef(false);
  const prevSelected = useRef(selected);

  if (!mounted.current) {
    mounted.current = true;
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  } else if (prevSelected.current !== selected) {
    prevSelected.current = selected;
    scale.stopAnimation();
    scale.setValue(0.8);
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={[wrapperStyle, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={style}
        activeOpacity={activeOpacity}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
