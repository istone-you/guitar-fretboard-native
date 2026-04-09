import { useRef, useState } from "react";
import { View, Text, PanResponder } from "react-native";
import * as Haptics from "expo-haptics";

const THUMB = 24;

interface RangeSliderProps {
  value: [number, number];
  min: number;
  max: number;
  onChange: (range: [number, number]) => void;
  isDark: boolean;
}

export default function RangeSlider({ value, min, max, onChange, isDark }: RangeSliderProps) {
  const twRef = useRef(0);
  const [tw, setTw] = useState(0);
  const valRef = useRef(value);
  valRef.current = value;

  const minStart = useRef({ x: 0, v: 0 });
  const minPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        minStart.current = { x: e.nativeEvent.pageX, v: valRef.current[0] };
      },
      onPanResponderMove: (e) => {
        const w = twRef.current;
        if (w <= THUMB) return;
        const dx = e.nativeEvent.pageX - minStart.current.x;
        const newV = Math.round(
          Math.max(
            min,
            Math.min(valRef.current[1] - 1, minStart.current.v + (dx / (w - THUMB)) * (max - min)),
          ),
        );
        if (newV !== valRef.current[0]) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onChange([newV, valRef.current[1]]);
      },
    }),
  ).current;

  const maxStart = useRef({ x: 0, v: 0 });
  const maxPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        maxStart.current = { x: e.nativeEvent.pageX, v: valRef.current[1] };
      },
      onPanResponderMove: (e) => {
        const w = twRef.current;
        if (w <= THUMB) return;
        const dx = e.nativeEvent.pageX - maxStart.current.x;
        const newV = Math.round(
          Math.max(
            valRef.current[0] + 1,
            Math.min(max, maxStart.current.v + (dx / (w - THUMB)) * (max - min)),
          ),
        );
        if (newV !== valRef.current[1]) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onChange([valRef.current[0], newV]);
      },
    }),
  ).current;

  const total = max - min;
  const minFrac = tw > THUMB ? (value[0] - min) / total : 0;
  const maxFrac = tw > THUMB ? (value[1] - min) / total : 1;
  const minLeft = minFrac * (tw - THUMB);
  const maxLeft = maxFrac * (tw - THUMB);
  const fillLeft = minLeft + THUMB / 2;
  const fillWidth = Math.max(0, maxLeft - minLeft);

  return (
    <View
      style={{ paddingVertical: 16, position: "relative" }}
      onLayout={(e) => {
        twRef.current = e.nativeEvent.layout.width;
        setTw(e.nativeEvent.layout.width);
      }}
    >
      {/* Track */}
      <View style={{ height: 4, borderRadius: 2, backgroundColor: isDark ? "#374151" : "#d6d3d1" }}>
        <View
          style={{
            position: "absolute",
            height: 4,
            left: fillLeft,
            width: fillWidth,
            borderRadius: 2,
            backgroundColor: isDark ? "#e5e7eb" : "#1c1917",
          }}
        />
      </View>
      {/* Min thumb */}
      <View
        style={{
          position: "absolute",
          top: 16 - THUMB / 2 + 2,
          left: minLeft,
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: isDark ? "#e5e7eb" : "#1c1917",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 3,
          elevation: 3,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 3,
        }}
        {...minPan.panHandlers}
      >
        <Text style={{ fontSize: 9, color: "#fff", fontWeight: "700" }}>{value[0]}</Text>
      </View>
      {/* Max thumb */}
      <View
        style={{
          position: "absolute",
          top: 16 - THUMB / 2 + 2,
          left: maxLeft,
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: isDark ? "#e5e7eb" : "#1c1917",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          elevation: 3,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 3,
        }}
        {...maxPan.panHandlers}
      >
        <Text style={{ fontSize: 9, color: "#fff", fontWeight: "700" }}>{value[1]}</Text>
      </View>
    </View>
  );
}
