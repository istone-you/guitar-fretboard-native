import { useRef } from "react";
import { Animated, Text, TouchableOpacity } from "react-native";

interface BounceActionButtonProps {
  label: string;
  onPress: () => void;
  style: any;
  textStyle: any;
}

export default function BounceActionButton({
  label,
  onPress,
  style,
  textStyle,
}: BounceActionButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const bounce = () => {
    scale.stopAnimation();
    scale.setValue(0.92);
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={() => {
        bounce();
        onPress();
      }}
      activeOpacity={0.9}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        <Text style={textStyle}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}
