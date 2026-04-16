/**
 * Manual Jest mock for react-native-reanimated.
 * The real library initializes native worklets which are not available in Jest.
 */
const React = require("react");
const { View, Text, Image, ScrollView, FlatList } = require("react-native");

const NOOP = () => {};
const ID = (x) => x;
const IMMEDIATE_CB = (cb) => cb();

const Animated = {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  createAnimatedComponent: ID,
};

module.exports = {
  default: Animated,
  ...Animated,

  useAnimatedStyle: IMMEDIATE_CB,
  useAnimatedProps: IMMEDIATE_CB,
  useAnimatedReaction: NOOP,
  useAnimatedRef: () => ({ current: null }),
  useAnimatedScrollHandler: () => NOOP,
  useSharedValue: (init) => ({ value: init, get: () => init }),
  useDerivedValue: (fn) => ({ value: fn(), get: fn }),
  useAnimatedSensor: () => ({ sensor: { value: {} }, unregister: NOOP }),
  useAnimatedKeyboard: () => ({ height: { value: 0 }, state: { value: 0 } }),
  useReducedMotion: () => false,

  withSpring: ID,
  withTiming: ID,
  withDelay: (_d, val) => val,
  withSequence: (...vals) => vals[vals.length - 1],
  withRepeat: (val) => val,
  withDecay: () => 0,

  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  cancelAnimation: NOOP,
  scrollTo: NOOP,
  makeMutable: (init) => ({ value: init }),
  createAnimatedComponent: ID,

  Easing: {
    linear: ID,
    ease: ID,
    quad: ID,
    cubic: ID,
    sin: ID,
    circle: ID,
    exp: ID,
    elastic: () => ID,
    back: () => ID,
    bounce: ID,
    bezier: () => ID,
    in: () => ID,
    out: () => ID,
    inOut: () => ID,
  },
  Extrapolation: { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" },
  interpolate: (_v, _in, out) => out[0],
  interpolateColor: (_v, _in, out) => out[0],
  getAnimatedStyle: (style) => style,
};
