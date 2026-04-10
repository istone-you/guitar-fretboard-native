import { View, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { COLOR_PRESETS } from "../../../types";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  isDark: boolean;
}

export default function ColorPicker({ value, onChange, isDark }: ColorPickerProps) {
  return (
    <View style={styles.colorRow}>
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
              borderColor: isDark ? "#fff" : "#1c1917",
            },
          ]}
          activeOpacity={0.7}
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
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});
