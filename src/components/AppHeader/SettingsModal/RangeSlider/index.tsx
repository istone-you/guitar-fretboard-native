import { useRef, useState } from "react";
import { View, Text, PanResponder, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { GlassView } from "expo-glass-effect";

const THUMB = 28;

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
  // positions relative to the outer container
  const minLeft = minFrac * (tw - THUMB);
  const maxLeft = maxFrac * (tw - THUMB);
  // fill position relative to the track container (which has THUMB/2 inset on each side)
  const fillLeft = minLeft;
  const fillWidth = Math.max(0, maxLeft - minLeft);

  return (
    <View
      style={styles.outer}
      onLayout={(e) => {
        twRef.current = e.nativeEvent.layout.width;
        setTw(e.nativeEvent.layout.width);
      }}
    >
      {/* Track: Liquid Glass background + blue fill */}
      <View style={styles.trackContainer}>
        <GlassView
          style={StyleSheet.absoluteFillObject}
          glassEffectStyle="regular"
          colorScheme={isDark ? "dark" : "light"}
        />
        <View style={[styles.fill, { left: fillLeft, width: fillWidth }]} />
      </View>

      {/* Min thumb */}
      <View style={[styles.thumb, { left: minLeft }]} {...minPan.panHandlers}>
        <Text style={styles.thumbLabel}>{value[0]}</Text>
      </View>

      {/* Max thumb */}
      <View style={[styles.thumb, { left: maxLeft, zIndex: 2 }]} {...maxPan.panHandlers}>
        <Text style={styles.thumbLabel}>{value[1]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingVertical: 20,
    position: "relative",
  },
  trackContainer: {
    height: 6,
    marginHorizontal: THUMB / 2,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "#007AFF",
    borderRadius: 3,
  },
  thumb: {
    position: "absolute",
    top: 20 - THUMB / 2 + 3,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  thumbLabel: {
    fontSize: 9,
    color: "#374151",
    fontWeight: "700",
  },
});
