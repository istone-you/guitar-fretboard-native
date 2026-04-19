import type { ReactNode } from "react";
import { Text, TouchableOpacity, type StyleProp, type ViewStyle } from "react-native";
import { GlassView } from "expo-glass-effect";
import Icon, { type IconName } from "../Icon";

interface GlassIconButtonProps {
  isDark: boolean;
  onPress: () => void;
  label?: string;
  children?: ReactNode;
  fontSize?: number;
  icon?: IconName;
  /** Visual diameter of the glass circle. Default: 36 */
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
  children,
  fontSize,
  icon,
  size: sizeProp,
  testID,
  hitSlop,
  style,
  activeOpacity = 0.7,
}: GlassIconButtonProps) {
  const size = sizeProp ?? 36;
  const resolvedFontSize = fontSize ?? Math.round(size * 0.38);
  const iconColor = isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.5)";

  const iconNode = icon ? <Icon name={icon} size={22} color={iconColor} strokeWidth={2.2} /> : null;

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
        {children ?? iconNode ?? (
          <Text
            style={{
              fontSize: resolvedFontSize,
              fontWeight: "700",
              color: iconColor,
              lineHeight: resolvedFontSize + 2,
            }}
          >
            {label}
          </Text>
        )}
      </GlassView>
    </TouchableOpacity>
  );
}
