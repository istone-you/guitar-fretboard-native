import { memo, Fragment } from "react";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";
import type { ChordType, Theme } from "../../../types";
import {
  CHORD_FORMS_5TH,
  CHORD_FORMS_6TH,
  OPEN_STRINGS,
  getNoteIndex,
  getOpenChordForm,
  type FretCell,
} from "../../../lib/fretboard";

// ─── Public helper ──────────────────────────────────────────────────────────

export function getAllChordForms(rootIndex: number, chordType: ChordType): FretCell[][] {
  const forms: FretCell[][] = [];

  const open = getOpenChordForm(rootIndex, chordType);
  if (open && open.length > 0) forms.push(open);

  // 6th-string barre — skip fret-0 (would duplicate open position)
  const rf6 = (rootIndex - OPEN_STRINGS[0] + 12) % 12;
  if (rf6 > 0) {
    const f = CHORD_FORMS_6TH[chordType];
    if (f) forms.push(f.map((p) => ({ string: p.string, fret: rf6 + p.fretOffset })));
  }

  // 5th-string barre — skip fret-0
  const rf5 = (rootIndex - OPEN_STRINGS[1] + 12) % 12;
  if (rf5 > 0) {
    const f = CHORD_FORMS_5TH[chordType];
    if (f) forms.push(f.map((p) => ({ string: p.string, fret: rf5 + p.fretOffset })));
  }

  const minFret = (cells: FretCell[]) => {
    const pressed = cells.filter((c) => c.fret > 0).map((c) => c.fret);
    return pressed.length > 0 ? Math.min(...pressed) : 0;
  };

  return forms.sort((a, b) => minFret(a) - minFret(b));
}

// ─── Layout constants ────────────────────────────────────────────────────────

const FRET_COUNT = 4;
const PAD_L = 22; // space for O/X markers
const PAD_R = 6;
const PAD_TOP = 22; // space for "fr" label
const PAD_BOT = 6;
const STRING_SP = 13; // px between string lines
const GRID_H = 5 * STRING_SP;
export const CHORD_DIAGRAM_HEIGHT = PAD_TOP + GRID_H + PAD_BOT;

// ─── Component ───────────────────────────────────────────────────────────────

interface ChordDiagramProps {
  cells: FretCell[];
  rootIndex: number;
  theme: Theme;
  width: number;
}

function ChordDiagram({ cells, rootIndex, theme, width }: ChordDiagramProps) {
  const isDark = theme === "dark";

  if (cells.length === 0) return null;

  const gridW = width - PAD_L - PAD_R;
  const FRET_SP = gridW / FRET_COUNT;
  const DOT_R = Math.max(4, Math.min(5.5, STRING_SP * 0.4));

  // Fret line x: i=0 = nut, i=FRET_COUNT = right edge
  const fx = (i: number) => PAD_L + i * FRET_SP;
  // String y: s=5 (high E) at top, s=0 (low E) at bottom
  const sy = (s: number) => PAD_TOP + (5 - s) * STRING_SP;
  // Dot center x for fret f
  const dotX = (f: number) => PAD_L + (f - gridStart + 0.5) * FRET_SP;

  type Status = "pressed" | "open" | "muted";
  const statuses: Status[] = Array.from({ length: 6 }, (_, s) => {
    const cell = cells.find((c) => c.string === s);
    if (!cell) return "muted";
    return cell.fret === 0 ? "open" : "pressed";
  });

  const hasOpenStr = cells.some((c) => c.fret === 0);
  const pressedFrets = cells.filter((c) => c.fret > 0).map((c) => c.fret);
  const gridStart = hasOpenStr ? 1 : pressedFrets.length > 0 ? Math.min(...pressedFrets) : 1;
  const showNut = gridStart === 1;

  const dotColor = isDark ? "#e5e7eb" : "#1c1917";
  const lineColor = isDark ? "#374151" : "#d6d3d1";
  const nutColor = isDark ? "#9ca3af" : "#44403c";
  const labelColor = isDark ? "#9ca3af" : "#78716c";
  const OX_X = PAD_L - 10;

  return (
    <Svg width={width} height={CHORD_DIAGRAM_HEIGHT}>
      {/* Barre position label — above nut line, top-left */}
      {!showNut && (
        <SvgText
          x={PAD_L + 2}
          y={PAD_TOP - 10}
          textAnchor="start"
          fill={labelColor}
          fontSize={9}
          fontWeight="600"
        >
          {`${gridStart}fr`}
        </SvgText>
      )}

      {/* O / X indicators to the left of nut */}
      {statuses.map((st, s) => {
        if (st === "pressed") return null;
        const cy = sy(s);
        if (st === "open") {
          return (
            <Circle
              key={`ox${s}`}
              cx={OX_X}
              cy={cy}
              r={4}
              fill="none"
              stroke={lineColor}
              strokeWidth={1.5}
            />
          );
        }
        const d = 3.5;
        return (
          <Fragment key={`ox${s}`}>
            <Line
              x1={OX_X - d}
              y1={cy - d}
              x2={OX_X + d}
              y2={cy + d}
              stroke={labelColor}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <Line
              x1={OX_X - d}
              y1={cy + d}
              x2={OX_X + d}
              y2={cy - d}
              stroke={labelColor}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </Fragment>
        );
      })}

      {/* Nut — thick vertical line on left if open position */}
      <Line
        x1={fx(0)}
        y1={sy(5)}
        x2={fx(0)}
        y2={sy(0)}
        stroke={showNut ? nutColor : lineColor}
        strokeWidth={showNut ? 3 : 1}
        strokeLinecap="square"
      />

      {/* Fret lines (vertical) */}
      {Array.from({ length: FRET_COUNT }, (_, i) => (
        <Line
          key={`fl${i}`}
          x1={fx(i + 1)}
          y1={sy(5)}
          x2={fx(i + 1)}
          y2={sy(0)}
          stroke={lineColor}
          strokeWidth={1}
        />
      ))}

      {/* String lines (horizontal) — thicker for lower strings */}
      {Array.from({ length: 6 }, (_, s) => (
        <Line
          key={`sl${s}`}
          x1={fx(0)}
          y1={sy(s)}
          x2={fx(FRET_COUNT)}
          y2={sy(s)}
          stroke={lineColor}
          strokeWidth={s === 0 ? 1.8 : s === 1 ? 1.5 : 1.2}
        />
      ))}

      {/* Chord dots */}
      {cells
        .filter((c) => c.fret > 0 && c.fret >= gridStart && c.fret < gridStart + FRET_COUNT)
        .map((c, i) => {
          const isRoot = getNoteIndex(c.string, c.fret) === rootIndex;
          return (
            <Circle
              key={`d${i}`}
              cx={dotX(c.fret)}
              cy={sy(c.string)}
              r={DOT_R}
              fill={isRoot ? dotColor : dotColor + "bb"}
            />
          );
        })}
    </Svg>
  );
}

export default memo(ChordDiagram);
