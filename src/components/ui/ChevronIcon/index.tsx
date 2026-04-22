import Svg, { Path } from "react-native-svg";
import { getColors } from "../../../themes/design";

export default function ChevronIcon({
  size = 10,
  color = getColors(false).iconSubtle,
  direction = "down",
}: {
  size?: number;
  color?: string;
  direction?: "down" | "up" | "right" | "left";
}) {
  const rotateMap = { down: "0deg", up: "180deg", right: "-90deg", left: "90deg" };
  const rotate = rotateMap[direction];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={rotate !== "0deg" ? { transform: [{ rotate }] } : undefined}
    >
      <Path
        d="M3 6l5 5 5-5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
