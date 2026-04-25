import { memo, useState } from "react";
import CirclePane from "../../CircleOfFifths";
import type { CircleOverlayKey } from "../../CircleOfFifths/CircleWheel";
import type { KeyType } from "../../CircleOfFifths/lib/circleData";
import type { Theme, Accidental, LayerConfig } from "../../../types";

export interface FinderCirclePageProps {
  theme: Theme;
  accidental: Accidental;
  layers?: LayerConfig[];
  globalRootNote?: string;
  onAddLayerAndNavigate?: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

export default memo(function FinderCirclePage(props: FinderCirclePageProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [keyType, setKeyType] = useState<KeyType>("major");
  const [activeOverlay, setActiveOverlay] = useState<CircleOverlayKey | null>(null);

  return (
    <CirclePane
      {...props}
      selectedIndex={selectedIndex}
      keyType={keyType}
      activeOverlay={activeOverlay}
      onSelectedIndexChange={setSelectedIndex}
      onKeyTypeChange={setKeyType}
      onActiveOverlayChange={setActiveOverlay}
    />
  );
});
