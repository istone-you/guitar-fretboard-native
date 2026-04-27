import { View, TouchableOpacity, StyleSheet, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { COLOR_PRESETS, WHITE, BLACK } from "../../../themes/design";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  isDark: boolean;
  style?: ViewStyle;
}

export default function ColorPicker({ value, onChange, isDark, style }: ColorPickerProps) {
  return (
    <View style={[styles.colorRow, style]}>
      {COLOR_PRESETS.map((preset) => (
        <TouchableOpacity
          key={preset}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(preset);
          }}
          style={[
            styles.colorDot,
            {
              backgroundColor: preset,
              borderWidth: value === preset ? 3 : 0,
              borderColor: isDark ? WHITE : BLACK,
            },
          ]}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderCurve: "continuous",
  },
});
