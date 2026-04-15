import { Text, TouchableOpacity, type StyleProp, type ViewStyle } from "react-native";
import { GlassView } from "expo-glass-effect";

interface GlassIconButtonProps {
  isDark: boolean;
  onPress: () => void;
  label: string;
  fontSize?: number;
  /** Visual diameter of the glass circle. Default: 44 */
  size?: number;
  testID?: string;
  hitSlop?: number;
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
}

export default function GlassIconButton({
  isDark,
  onPress,
  label,
  fontSize,
  size = 44,
  testID,
  hitSlop,
  style,
  activeOpacity = 0.7,
}: GlassIconButtonProps) {
  const resolvedFontSize = fontSize ?? Math.round(size * 0.38);

  return (
    <TouchableOpacity
      onPress={onPress}
      testID={testID}
      hitSlop={hitSlop}
      activeOpacity={activeOpacity}
      style={style}
    >
      <GlassView
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
        glassEffectStyle="regular"
        colorScheme={isDark ? "dark" : "light"}
      >
        <Text
          style={{
            fontSize: resolvedFontSize,
            fontWeight: "700",
            color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.5)",
            lineHeight: resolvedFontSize + 2,
          }}
        >
          {label}
        </Text>
      </GlassView>
    </TouchableOpacity>
  );
}
