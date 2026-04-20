import Svg, { Path, Circle, Line } from "react-native-svg";

export type IconName =
  | "close"
  | "back"
  | "check"
  | "plus"
  | "upload"
  | "trash"
  | "duplicate"
  | "chevron-left"
  | "chevron-right"
  | "chevron-up"
  | "chevron-down"
  | "drag-handle"
  | "settings"
  | "bookmark"
  | "bar-chart"
  | "search"
  | "music-note"
  | "ellipsis";

interface IconProps {
  name: IconName;
  size: number;
  color: string;
  strokeWidth?: number;
  /** Background fill color for icons that need surface separation (duplicate) */
  surfaceColor?: string;
}

export default function Icon({
  name,
  size,
  color,
  strokeWidth = 2,
  surfaceColor = "transparent",
}: IconProps) {
  const sw = strokeWidth;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === "close" && (
        <Path
          d="M18 6L6 18M6 6l12 12"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {(name === "back" || name === "chevron-left") && (
        <Path
          d="M15 18l-6-6 6-6"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {name === "check" && (
        <Path
          d="M6 12l4 4 8-8"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {name === "plus" && (
        <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      )}
      {name === "upload" && (
        <Path
          d="M12 19V5M6 11l6-6 6 6"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {name === "trash" && (
        <Path
          d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {name === "duplicate" && (
        <>
          <Path
            d="M4 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10 9h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"
            fill={surfaceColor}
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {name === "chevron-right" && (
        <Path
          d="M9 18l6-6-6-6"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {name === "chevron-up" && (
        <Path
          d="M18 15l-6-6-6 6"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {name === "chevron-down" && (
        <Path
          d="M6 9l6 6 6-6"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {name === "drag-handle" && (
        <Path d="M5 8h14M5 12h14M5 16h14" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      )}
      {name === "settings" && (
        <Path
          d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {name === "bookmark" && (
        <Path
          d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {name === "bar-chart" && (
        <>
          <Path d="M18 20V10" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M12 20V4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M6 20v-6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </>
      )}
      {name === "search" && (
        <>
          <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={sw} />
          <Line
            x1="16.5"
            y1="16.5"
            x2="22"
            y2="22"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </>
      )}
      {name === "music-note" && (
        <>
          <Path
            d="M9 18V5l12-2v13"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx={6} cy={18} r={3} stroke={color} strokeWidth={sw} />
          <Circle cx={18} cy={16} r={3} stroke={color} strokeWidth={sw} />
        </>
      )}
      {name === "ellipsis" && (
        <Path
          d="M5 12h.01M12 12h.01M19 12h.01"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
        />
      )}
    </Svg>
  );
}
