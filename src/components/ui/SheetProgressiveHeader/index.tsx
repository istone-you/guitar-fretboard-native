/**
 * SheetProgressiveHeader
 *
 * iOS 26 Liquid Glass header for bottom sheets.
 * - GlassView (expo-glass-effect) fills the full width as a native iOS 26 glass background
 * - LinearGradient fades transparent → bgColor at the bottom edge
 * - Children are direct children of the container so callers can freely set
 *   flexDirection/alignItems/justifyContent via the style prop
 * - Use contentPaddingHorizontal for horizontal padding (keeps glass edge-to-edge)
 * - Use style for paddingTop / flexDirection / marginHorizontal etc.
 */
import type { ReactNode } from "react";
import { View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";

interface SheetProgressiveHeaderProps {
  isDark: boolean;
  /** Solid background color of the sheet content below (gradient end color) */
  bgColor: string;
  children: ReactNode;
  dragHandlers?: object;
  /** Horizontal padding applied to the container */
  contentPaddingHorizontal?: number;
  style?: StyleProp<ViewStyle>;
  /** Called with the measured height so callers can set paddingTop on content below */
  onLayout?: (height: number) => void;
}

/** Height of the gradient fade zone at the bottom edge */
export const SHEET_HEADER_FADE = 24;

/** Convert any color string to its fully transparent counterpart (same RGB, alpha=0) */
function toTransparent(color: string): string {
  const rgba = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgba) return `rgba(${rgba[1]},${rgba[2]},${rgba[3]},0)`;
  const hex = color.replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return `rgba(${r},${g},${b},0)`;
}

export default function SheetProgressiveHeader({
  isDark,
  bgColor,
  children,
  dragHandlers,
  contentPaddingHorizontal = 20,
  style,
  onLayout,
}: SheetProgressiveHeaderProps) {
  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: contentPaddingHorizontal, paddingBottom: SHEET_HEADER_FADE },
        style,
      ]}
      onLayout={onLayout ? (e) => onLayout(e.nativeEvent.layout.height) : undefined}
      {...dragHandlers}
    >
      {/* Native iOS 26 Liquid Glass background */}
      <GlassView
        style={StyleSheet.absoluteFill}
        glassEffectStyle="regular"
        colorScheme={isDark ? "dark" : "light"}
      />
      {/* Children are direct children — container's flexDirection applies */}
      {children}
      {/* Gradient: bgColor(alpha=0) → bgColor, transitions into solid sheet body */}
      <LinearGradient
        colors={[toTransparent(bgColor), bgColor]}
        style={styles.fade}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  fade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEADER_FADE,
  },
});
