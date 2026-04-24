import { useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Path, Text as SvgText, TSpan } from "react-native-svg";
import { getColors } from "../../../themes/design";
import type { Theme } from "../../../types";
import {
  KEY_SIGNATURES,
  MAJOR_KEYS,
  MINOR_FLAT5_KEYS,
  MINOR_KEYS,
  formatRingSignatureLabel,
  type KeyType,
  type RingName,
} from "../lib/circleData";
import { SNAP_DEGREES, buildRingPath, polarToCartesian, type WheelGeometry } from "./geometry";
import { DiatonicOverlay, DominantsOverlay, RelatedKeysOverlay } from "./overlays";

export type CircleOverlayKey = "relatedKeys" | "diatonic" | "dominants";

interface CircleWheelProps {
  theme: Theme;
  keyType: KeyType;
  selectedIndex: number;
  activeOverlay: CircleOverlayKey | null;
  onSelect: (index: number, keyType?: KeyType) => void;
}

const INACTIVE_RING_OPACITY = 0.55;

const RING_FONT_SIZE: Record<RingName, number> = {
  major: 13,
  minor: 11,
  flat5: 9,
};

const RING_LABEL_KEYS: Record<RingName, readonly string[]> = {
  major: MAJOR_KEYS,
  minor: MINOR_KEYS,
  flat5: MINOR_FLAT5_KEYS,
};

interface Segment {
  ring: RingName;
  index: number;
  key: string;
  path: string;
  labelPoint: { x: number; y: number };
}

export default function CircleWheel({
  theme,
  keyType,
  selectedIndex,
  activeOverlay,
  onSelect,
}: CircleWheelProps) {
  const colors = getColors(theme === "dark");
  const { width } = useWindowDimensions();

  const outerDiameter = Math.min(width * 0.85, 420);
  const outerRadius = outerDiameter / 2;
  const signaturePadding = 24;
  const canvasSize = outerDiameter + signaturePadding * 2;
  const center = canvasSize / 2;
  const centerHoleRadius = outerDiameter * 0.18;
  const ringWidth = (outerRadius - centerHoleRadius) / 3;
  const middleRingOuterRadius = outerRadius - ringWidth;
  const innerRingOuterRadius = outerRadius - ringWidth * 2;

  const geometry: WheelGeometry = {
    center,
    outerRadius,
    middleRingOuterRadius,
    innerRingOuterRadius,
    centerHoleRadius,
    ringWidth,
  };

  const segments = useMemo<Segment[]>(() => {
    const ringRadii: Record<RingName, { inner: number; outer: number; labelRadius: number }> = {
      major: {
        inner: middleRingOuterRadius,
        outer: outerRadius,
        labelRadius: outerRadius - ringWidth / 2,
      },
      minor: {
        inner: innerRingOuterRadius,
        outer: middleRingOuterRadius,
        labelRadius: outerRadius - ringWidth * 1.5,
      },
      flat5: {
        inner: centerHoleRadius,
        outer: innerRingOuterRadius,
        labelRadius: outerRadius - ringWidth * 2.5,
      },
    };
    const rings: RingName[] = ["major", "minor", "flat5"];
    const out: Segment[] = [];
    for (const ring of rings) {
      const { inner, outer, labelRadius } = ringRadii[ring];
      RING_LABEL_KEYS[ring].forEach((key, index) => {
        const startAngle = index * SNAP_DEGREES - SNAP_DEGREES / 2;
        const endAngle = startAngle + SNAP_DEGREES;
        const midAngle = startAngle + SNAP_DEGREES / 2;
        out.push({
          ring,
          index,
          key,
          path: buildRingPath(center, center, inner, outer, startAngle, endAngle),
          labelPoint: polarToCartesian(center, center, labelRadius, midAngle),
        });
      });
    }
    return out;
  }, [
    center,
    outerRadius,
    middleRingOuterRadius,
    innerRingOuterRadius,
    centerHoleRadius,
    ringWidth,
  ]);

  const signatureSegments = useMemo(
    () =>
      MAJOR_KEYS.map((_, index) => {
        const midAngle = index * SNAP_DEGREES;
        return {
          index,
          point: polarToCartesian(center, center, outerRadius + 16, midAngle),
          label: formatRingSignatureLabel(KEY_SIGNATURES[index]),
        };
      }),
    [center, outerRadius],
  );

  const ringOpacity = (ring: RingName): number => {
    if (ring === "major") return keyType === "major" ? 1 : INACTIVE_RING_OPACITY;
    if (ring === "minor") return keyType === "minor" ? 1 : INACTIVE_RING_OPACITY;
    return INACTIVE_RING_OPACITY;
  };

  const onSegmentPress = (seg: Segment) => {
    if (seg.ring === "major") onSelect(seg.index, "major");
    else if (seg.ring === "minor") onSelect(seg.index, "minor");
    else onSelect(seg.index);
  };

  return (
    <View style={[styles.container, { width: canvasSize, height: canvasSize }]}>
      <Svg width={canvasSize} height={canvasSize} viewBox={`0 0 ${canvasSize} ${canvasSize}`}>
        {/* Base fill */}
        {segments.map((seg) => {
          const selected = seg.index === selectedIndex;
          return (
            <Path
              key={`${seg.ring}-${seg.index}`}
              testID={`${seg.ring}-segment-${seg.index}`}
              d={seg.path}
              fill={selected ? colors.borderStrong : colors.surface}
              opacity={ringOpacity(seg.ring)}
              stroke={colors.border}
              strokeWidth={1}
              onPress={() => onSegmentPress(seg)}
            />
          );
        })}

        {/* Key name labels */}
        {segments.map((seg) => {
          const parts = seg.key.split("/");
          const fs = RING_FONT_SIZE[seg.ring];
          return (
            <SvgText
              key={`${seg.ring}-text-${seg.index}`}
              x={seg.labelPoint.x}
              y={seg.labelPoint.y}
              textAnchor="middle"
              alignmentBaseline="middle"
              fontSize={fs}
              fontWeight="700"
              fill={colors.textStrong}
              opacity={ringOpacity(seg.ring)}
            >
              {parts.length === 2 ? (
                <>
                  <TSpan x={seg.labelPoint.x} dy={-fs * 0.6}>
                    {parts[0]}
                  </TSpan>
                  <TSpan x={seg.labelPoint.x} dy={fs * 1.2}>
                    {parts[1]}
                  </TSpan>
                </>
              ) : (
                seg.key
              )}
            </SvgText>
          );
        })}

        {/* Key signature labels (outside the wheel) */}
        {signatureSegments.map((sig) => (
          <SvgText
            key={`sig-${sig.index}`}
            x={sig.point.x}
            y={sig.point.y}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={10}
            fontWeight="600"
            fill={colors.textSubtle}
          >
            {sig.label}
          </SvgText>
        ))}

        {activeOverlay === "diatonic" && (
          <DiatonicOverlay geometry={geometry} selectedIndex={selectedIndex} keyType={keyType} />
        )}
        {activeOverlay === "dominants" && (
          <DominantsOverlay geometry={geometry} selectedIndex={selectedIndex} keyType={keyType} />
        )}
        {activeOverlay === "relatedKeys" && (
          <RelatedKeysOverlay geometry={geometry} selectedIndex={selectedIndex} keyType={keyType} />
        )}

        {/* Transparent hitboxes on top so overlays don't steal taps */}
        {segments.map((seg) => (
          <Path
            key={`hitbox-${seg.ring}-${seg.index}`}
            d={seg.path}
            fill="transparent"
            onPress={() => onSegmentPress(seg)}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
  },
});
