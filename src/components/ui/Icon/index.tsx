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
  | "chord-grid"
  | "ellipsis"
  | "capo"
  | "arrows-lr"
  | "network"
  | "rotate-cw";

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
      {name === "chord-grid" && (
        <>
          {/* 3 strings */}
          <Path
            d="M4 3V21M12 3V21M20 3V21"
            stroke={color}
            strokeWidth={sw * 0.8}
            strokeLinecap="round"
          />
          {/* Nut */}
          <Path d="M4 3H20" stroke={color} strokeWidth={sw * 1.5} strokeLinecap="round" />
          {/* Frets */}
          <Path
            d="M4 9H20M4 15H20M4 21H20"
            stroke={color}
            strokeWidth={sw * 0.8}
            strokeLinecap="round"
          />
          {/* Dots */}
          <Circle cx={12} cy={9} r={2.5} fill={color} />
          <Circle cx={4} cy={15} r={2.5} fill={color} />
        </>
      )}
      {name === "capo" && (
        <>
          <Path
            d="M7 2V22M12 2V22M17 2V22"
            stroke={color}
            strokeWidth={sw * 0.7}
            strokeLinecap="round"
          />
          <Path d="M4 8H20" stroke={color} strokeWidth={sw * 2.5} strokeLinecap="round" />
          <Circle cx={7} cy={15} r={2.2} fill={color} />
          <Circle cx={17} cy={13} r={2.2} fill={color} />
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
      {name === "arrows-lr" && (
        <>
          <Path
            d="M5 8h14M15 5l4 3-4 3"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M19 16H5M9 13l-4 3 4 3"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {name === "network" && (
        <>
          <Circle cx="12" cy="5" r="2" stroke={color} strokeWidth={sw} />
          <Circle cx="5" cy="18" r="2" stroke={color} strokeWidth={sw} />
          <Circle cx="19" cy="18" r="2" stroke={color} strokeWidth={sw} />
          <Path
            d="M10.8 6.9L6.4 16.1M13.2 6.9L17.6 16.1M7 18h10"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </>
      )}
      {name === "rotate-cw" && (
        <>
          <Path
            d="M23 4v6h-6"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </Svg>
  );
}
