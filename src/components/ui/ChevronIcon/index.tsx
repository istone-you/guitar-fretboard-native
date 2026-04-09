import Svg, { Path } from "react-native-svg";

export default function ChevronIcon({
  size = 10,
  color = "#6b7280",
  direction = "down",
}: {
  size?: number;
  color?: string;
  direction?: "down" | "up";
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={direction === "up" ? { transform: [{ rotate: "180deg" }] } : undefined}
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
