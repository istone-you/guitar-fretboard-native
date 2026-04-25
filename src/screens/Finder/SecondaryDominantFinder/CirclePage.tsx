import { useState } from "react";
import CirclePane from "../../CircleOfFifths";
import type { CircleOverlayKey } from "../../CircleOfFifths/CircleWheel";
import { semitoneToCirclePosition, type KeyType } from "../../CircleOfFifths/lib/circleData";
import type { Theme, Accidental, LayerConfig } from "../../../types";

export interface SecondaryDominantCirclePageProps {
  theme: Theme;
  accidental: Accidental;
  layers?: LayerConfig[];
  globalRootNote?: string;
  onAddLayerAndNavigate?: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
  rootSemitone: number;
  initialKeyType: KeyType;
}

export default function SecondaryDominantCirclePage({
  rootSemitone,
  initialKeyType,
  ...rest
}: SecondaryDominantCirclePageProps) {
  const relMajor = initialKeyType === "minor" ? (rootSemitone + 3) % 12 : rootSemitone;
  const [selectedIndex, setSelectedIndex] = useState(semitoneToCirclePosition(relMajor));
  const [keyType, setKeyType] = useState<KeyType>(initialKeyType);
  const [activeOverlay, setActiveOverlay] = useState<CircleOverlayKey | null>("dominants");

  return (
    <CirclePane
      {...rest}
      selectedIndex={selectedIndex}
      keyType={keyType}
      activeOverlay={activeOverlay}
      onSelectedIndexChange={setSelectedIndex}
      onKeyTypeChange={setKeyType}
      onActiveOverlayChange={setActiveOverlay}
    />
  );
}
