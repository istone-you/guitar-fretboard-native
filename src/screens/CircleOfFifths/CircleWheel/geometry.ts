import type { RingName } from "../lib/circleData";

export const SNAP_DEGREES = 30;

export interface WheelGeometry {
  center: number;
  outerRadius: number;
  middleRingOuterRadius: number;
  innerRingOuterRadius: number;
  centerHoleRadius: number;
  ringWidth: number;
}

export function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function buildRingPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 0 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

export function getRingRadii(
  ring: RingName,
  geometry: WheelGeometry,
): { inner: number; outer: number } {
  if (ring === "major") {
    return { inner: geometry.middleRingOuterRadius, outer: geometry.outerRadius };
  }
  if (ring === "minor") {
    return { inner: geometry.innerRingOuterRadius, outer: geometry.middleRingOuterRadius };
  }
  return { inner: geometry.centerHoleRadius, outer: geometry.innerRingOuterRadius };
}

export function buildCellPath(geometry: WheelGeometry, ring: RingName, position: number): string {
  const { inner, outer } = getRingRadii(ring, geometry);
  const startAngle = position * SNAP_DEGREES - SNAP_DEGREES / 2;
  const endAngle = startAngle + SNAP_DEGREES;
  return buildRingPath(geometry.center, geometry.center, inner, outer, startAngle, endAngle);
}

// Build a cell path inset by `inset` pixels on all four sides so a stroke stays fully inside the cell.
export function buildInsetCellPath(
  geometry: WheelGeometry,
  ring: RingName,
  position: number,
  inset: number,
): string {
  const { inner, outer } = getRingRadii(ring, geometry);
  const midRadius = (inner + outer) / 2;
  const angularInsetDeg = (inset / midRadius) * (180 / Math.PI);
  const startAngle = position * SNAP_DEGREES - SNAP_DEGREES / 2 + angularInsetDeg;
  const endAngle = position * SNAP_DEGREES + SNAP_DEGREES / 2 - angularInsetDeg;
  return buildRingPath(
    geometry.center,
    geometry.center,
    inner + inset,
    outer - inset,
    startAngle,
    endAngle,
  );
}

export function getCellMidAngle(position: number): number {
  return position * SNAP_DEGREES;
}

// Return a label point at the radial center of the cell (where the key name sits), optionally
// offset outward (+) or inward (-) along the radial direction.
export function getCellLabelPoint(
  geometry: WheelGeometry,
  ring: RingName,
  position: number,
  radialOffset: number = 0,
): { x: number; y: number } {
  const { inner, outer } = getRingRadii(ring, geometry);
  const radius = (inner + outer) / 2 + radialOffset;
  const midAngle = getCellMidAngle(position);
  return polarToCartesian(geometry.center, geometry.center, radius, midAngle);
}
