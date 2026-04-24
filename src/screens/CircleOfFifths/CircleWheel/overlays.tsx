import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { G, Path } from "react-native-svg";
import {
  CIRCLE_OVERLAY_COLORS,
  DIATONIC_FUNCTION_COLORS,
  RELATED_KEY_COLORS,
} from "../../../themes/design";
import {
  getDiatonicOverlayCells,
  getModalInterchangeCells,
  getRelatedKeyCells,
  getSecondaryDominantCells,
  type KeyType,
  type RingName,
} from "../lib/circleData";
import { buildInsetCellPath, getCellLabelPoint, type WheelGeometry } from "./geometry";

const STROKE_WIDTH = 3;
const STROKE_INSET = STROKE_WIDTH / 2 + 1.5;

interface OverlayProps {
  geometry: WheelGeometry;
  selectedIndex: number;
  keyType: KeyType;
}

interface BounceCellProps {
  geometry: WheelGeometry;
  ring: RingName;
  position: number;
  color: string;
  testID?: string;
  bounceKey: string;
}

function BounceCell({ geometry, ring, position, color, testID, bounceKey }: BounceCellProps) {
  const { x: cx, y: cy } = getCellLabelPoint(geometry, ring, position, 0);
  const [scale, setScale] = useState(0.6);
  const animValueRef = useRef(new Animated.Value(0.6));
  const prevBounceKeyRef = useRef<string | null>(null);
  const listenerIdRef = useRef<string | null>(null);

  if (listenerIdRef.current === null) {
    listenerIdRef.current = animValueRef.current.addListener(({ value }) => setScale(value));
  }

  // Cleanup listener and animation on unmount (valid: subscribe-once / cleanup-on-unmount pattern).
  useEffect(() => {
    return () => {
      animValueRef.current.stopAnimation();
      if (listenerIdRef.current !== null) {
        animValueRef.current.removeListener(listenerIdRef.current);
      }
    };
  }, []);

  if (prevBounceKeyRef.current !== bounceKey) {
    prevBounceKeyRef.current = bounceKey;
    animValueRef.current.stopAnimation();
    animValueRef.current.setValue(0.6);
    Animated.spring(animValueRef.current, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: false,
    }).start();
  }

  // Scale around the cell's own center: translate → scale → translate back.
  const transform = `translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`;

  return (
    <G transform={transform}>
      <Path
        testID={testID}
        d={buildInsetCellPath(geometry, ring, position, STROKE_INSET)}
        fill="none"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
      />
    </G>
  );
}

export function RelatedKeysOverlay({ geometry, selectedIndex, keyType }: OverlayProps) {
  const cells = getRelatedKeyCells(selectedIndex, keyType);
  return (
    <G testID="overlay-related-keys" pointerEvents="none">
      {cells.map((cell) => (
        <BounceCell
          key={`related-${cell.relation}`}
          geometry={geometry}
          ring={cell.ring}
          position={cell.position}
          color={RELATED_KEY_COLORS[cell.relation]}
          testID={`overlay-related-${cell.relation}`}
          bounceKey={`${selectedIndex}-${keyType}-${cell.relation}`}
        />
      ))}
    </G>
  );
}

export function DiatonicOverlay({ geometry, selectedIndex, keyType }: OverlayProps) {
  const cells = getDiatonicOverlayCells(selectedIndex, keyType);
  return (
    <G testID="overlay-diatonic" pointerEvents="none">
      {cells.map((cell) => (
        <BounceCell
          key={`diatonic-${cell.degreeLabel}`}
          geometry={geometry}
          ring={cell.ring}
          position={cell.position}
          color={DIATONIC_FUNCTION_COLORS[cell.fn]}
          testID={`overlay-diatonic-${cell.degreeLabel}`}
          bounceKey={`${selectedIndex}-${keyType}-${cell.degreeLabel}`}
        />
      ))}
    </G>
  );
}

export function DominantsOverlay({ geometry, selectedIndex, keyType }: OverlayProps) {
  const cells = getSecondaryDominantCells(selectedIndex, keyType);
  return (
    <G testID="overlay-dominants" pointerEvents="none">
      {cells.map((cell) => (
        <BounceCell
          key={`dominants-${cell.targetDegreeLabel}`}
          geometry={geometry}
          ring="major"
          position={cell.secDomPosition}
          color={CIRCLE_OVERLAY_COLORS.secondaryDominant}
          testID={`overlay-secdom-${cell.targetDegreeLabel}`}
          bounceKey={`${selectedIndex}-${keyType}-secdom-${cell.targetDegreeLabel}`}
        />
      ))}
    </G>
  );
}

export function ModalInterchangeOverlay({ geometry, selectedIndex, keyType }: OverlayProps) {
  const cells = getModalInterchangeCells(selectedIndex, keyType);
  return (
    <G testID="overlay-modal-interchange" pointerEvents="none">
      {cells.map((cell) => (
        <BounceCell
          key={`modal-interchange-${cell.degreeLabel}`}
          geometry={geometry}
          ring={cell.ring}
          position={cell.position}
          color={CIRCLE_OVERLAY_COLORS.modalInterchange}
          testID={`overlay-modal-interchange-${cell.degreeLabel}`}
          bounceKey={`${selectedIndex}-${keyType}-modal-${cell.degreeLabel}`}
        />
      ))}
    </G>
  );
}
