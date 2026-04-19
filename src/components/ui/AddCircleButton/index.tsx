import { TouchableOpacity } from "react-native";
import Icon from "../Icon";

interface AddCircleButtonProps {
  isDark: boolean;
  onPress: () => void;
  size?: number;
}

export default function AddCircleButton({ isDark, onPress, size = 22 }: AddCircleButtonProps) {
  const color = isDark ? "#9ca3af" : "#6b7280";
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: color,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 4,
      }}
      activeOpacity={0.6}
      hitSlop={{ top: 11, bottom: 11, left: 11, right: 11 }}
    >
      <Icon name="plus" size={14} color={color} strokeWidth={3.5} />
    </TouchableOpacity>
  );
}
