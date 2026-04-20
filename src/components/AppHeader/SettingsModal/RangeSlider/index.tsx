import { useRef, useState } from "react";
import { View, Text, Animated, PanResponder, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { GlassView } from "expo-glass-effect";
import { getColors, WHITE, BLACK } from "../../../../themes/design";

const THUMB_W = 46;
const THUMB_H = 28;
const SCALE_ACTIVE = 52 / 46; // ~1.13x when pressed
const TOUCH_H = 44;
const TRACK_H = 6;
const LABEL_H = 22;

const SPRING_IN = { useNativeDriver: true, damping: 18, mass: 0.9, stiffness: 220 } as const;
const SPRING_OUT = { useNativeDriver: true, damping: 20, mass: 1, stiffness: 200 } as const;

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

  const [localMin, setLocalMin] = useState<number>(value[0]);
  const [localMax, setLocalMax] = useState<number>(value[1]);
  const localMinRef = useRef<number>(value[0]);
  const localMaxRef = useRef<number>(value[1]);

  // 0 = resting, 1 = active (pressed/dragging)
  const minActivation = useRef(new Animated.Value(0)).current;
  const maxActivation = useRef(new Animated.Value(0)).current;

  const total = max - min;
  const trackUsable = tw > THUMB_W ? tw - THUMB_W : 0;
  const valToLeft = (v: number) => ((v - min) / total) * trackUsable;

  const minLeft = valToLeft(localMin);
  const maxLeft = valToLeft(localMax);
  const displayMin = Math.round(localMin);
  const displayMax = Math.round(localMax);

  const minStart = useRef({ x: 0, v: 0 });
  const minPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        Animated.spring(minActivation, { toValue: 1, ...SPRING_IN }).start();
        minStart.current = { x: e.nativeEvent.pageX, v: localMinRef.current };
      },
      onPanResponderMove: (e) => {
        const w = twRef.current;
        if (w <= THUMB_W) return;
        const dx = e.nativeEvent.pageX - minStart.current.x;
        const raw = Math.max(
          min,
          Math.min(valRef.current[1] - 1, minStart.current.v + (dx / (w - THUMB_W)) * (max - min)),
        );
        localMinRef.current = raw;
        setLocalMin(raw);
        const intV = Math.round(raw);
        if (intV !== valRef.current[0]) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onChange([intV, valRef.current[1]]);
        }
      },
      onPanResponderRelease: () => {
        Animated.spring(minActivation, { toValue: 0, ...SPRING_OUT }).start();
        const snapped = Math.round(localMinRef.current);
        localMinRef.current = snapped;
        setLocalMin(snapped);
      },
      onPanResponderTerminate: () => {
        Animated.spring(minActivation, { toValue: 0, ...SPRING_OUT }).start();
        const snapped = Math.round(localMinRef.current);
        localMinRef.current = snapped;
        setLocalMin(snapped);
      },
    }),
  ).current;

  const maxStart = useRef({ x: 0, v: 0 });
  const maxPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        Animated.spring(maxActivation, { toValue: 1, ...SPRING_IN }).start();
        maxStart.current = { x: e.nativeEvent.pageX, v: localMaxRef.current };
      },
      onPanResponderMove: (e) => {
        const w = twRef.current;
        if (w <= THUMB_W) return;
        const dx = e.nativeEvent.pageX - maxStart.current.x;
        const raw = Math.max(
          valRef.current[0] + 1,
          Math.min(max, maxStart.current.v + (dx / (w - THUMB_W)) * (max - min)),
        );
        localMaxRef.current = raw;
        setLocalMax(raw);
        const intV = Math.round(raw);
        if (intV !== valRef.current[1]) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onChange([valRef.current[0], intV]);
        }
      },
      onPanResponderRelease: () => {
        Animated.spring(maxActivation, { toValue: 0, ...SPRING_OUT }).start();
        const snapped = Math.round(localMaxRef.current);
        localMaxRef.current = snapped;
        setLocalMax(snapped);
      },
      onPanResponderTerminate: () => {
        Animated.spring(maxActivation, { toValue: 0, ...SPRING_OUT }).start();
        const snapped = Math.round(localMaxRef.current);
        localMaxRef.current = snapped;
        setLocalMax(snapped);
      },
    }),
  ).current;

  const trackTop = LABEL_H + (TOUCH_H - TRACK_H) / 2;
  const colors = getColors(isDark);
  const labelColor = isDark ? WHITE : BLACK;

  const makeThumb = (activation: Animated.Value) => {
    const scale = activation.interpolate({ inputRange: [0, 1], outputRange: [1, SCALE_ACTIVE] });
    // White overlay: opacity 1 (resting) → 0 (active = glass visible)
    const whiteOpacity = activation.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
    return (
      // Shadow wrapper — scales with the pill, no overflow clip so shadow is visible
      <Animated.View style={[styles.thumbShadow, { transform: [{ scale }] }]}>
        {/* Clip wrapper for overflow:hidden */}
        <View style={styles.thumbClip}>
          <GlassView
            style={StyleSheet.absoluteFillObject}
            glassEffectStyle="regular"
            colorScheme={isDark ? "dark" : "light"}
          />
          {/* White overlay fades out as glass activates */}
          <Animated.View
            style={[StyleSheet.absoluteFillObject, styles.thumbWhite, { opacity: whiteOpacity }]}
          />
        </View>
      </Animated.View>
    );
  };

  return (
    <View
      style={styles.outer}
      onLayout={(e) => {
        twRef.current = e.nativeEvent.layout.width;
        setTw(e.nativeEvent.layout.width);
      }}
    >
      {/* Track */}
      <View style={[styles.trackContainer, { top: trackTop }]}>
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.sliderTrackEmpty }]}
        />
        <View
          style={[
            styles.fill,
            {
              left: minLeft,
              width: Math.max(0, maxLeft - minLeft),
              backgroundColor: colors.sliderTrackFilled,
            },
          ]}
        />
      </View>

      {/* Value labels above thumbs */}
      <View style={[styles.labelContainer, { left: minLeft }]}>
        <Text style={[styles.labelText, { color: labelColor }]}>{displayMin}</Text>
      </View>
      <View style={[styles.labelContainer, { left: maxLeft }]}>
        <Text style={[styles.labelText, { color: labelColor }]}>{displayMax}</Text>
      </View>

      {/* Min thumb */}
      <View style={[styles.thumbTouch, { left: minLeft }]} {...minPan.panHandlers}>
        {makeThumb(minActivation)}
      </View>

      {/* Max thumb */}
      <View style={[styles.thumbTouch, { left: maxLeft, zIndex: 2 }]} {...maxPan.panHandlers}>
        {makeThumb(maxActivation)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    height: LABEL_H + TOUCH_H,
    position: "relative",
  },
  trackContainer: {
    position: "absolute",
    left: THUMB_W / 2,
    right: THUMB_W / 2,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: TRACK_H / 2,
  },
  labelContainer: {
    position: "absolute",
    top: 0,
    width: THUMB_W,
    alignItems: "center",
  },
  labelText: {
    fontSize: 13,
    fontWeight: "700",
  },
  thumbTouch: {
    position: "absolute",
    top: LABEL_H,
    width: THUMB_W,
    height: TOUCH_H,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  thumbShadow: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: THUMB_H / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  thumbClip: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: THUMB_H / 2,
    overflow: "hidden",
  },
  thumbWhite: {
    backgroundColor: WHITE,
  },
});
