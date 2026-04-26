import { useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import type { Accidental, Theme, LayerConfig } from "../../../types";
import { getColors } from "../../../themes/design";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import ModeFamilyView from "./ModeFamilyView";
import ModalInterchangeView from "./ModalInterchangeView";

type SubView = "family" | "modal-interchange";

interface ModeBrowserProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

export default function ModeBrowser({
  theme,
  accidental,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: ModeBrowserProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);

  const { width: screenWidth } = useWindowDimensions();
  const segmentWidth = Math.floor((screenWidth - 32) / 2);

  const [subView, setSubView] = useState<SubView>("family");
  const [rootNote, setRootNote] = useState("C");

  const subViewOptions: { value: SubView; label: string }[] = [
    { value: "family", label: t("finder.modes.tab.family") },
    { value: "modal-interchange", label: t("finder.modes.tab.modalInterchange") },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.pageBg }]}>
      <View
        style={[styles.toggleRow, { borderBottomColor: isDark ? colors.border : colors.border2 }]}
      >
        <SegmentedToggle
          theme={theme}
          value={subView}
          onChange={(v) => setSubView(v as SubView)}
          options={subViewOptions}
          size="compact"
          segmentWidth={segmentWidth}
        />
      </View>

      {subView === "family" ? (
        <ModeFamilyView
          theme={theme}
          accidental={accidental}
          layers={layers}
          globalRootNote={globalRootNote}
          rootNote={rootNote}
          onRootNoteChange={setRootNote}
          onAddLayerAndNavigate={onAddLayerAndNavigate}
          onEnablePerLayerRoot={onEnablePerLayerRoot}
        />
      ) : (
        <ModalInterchangeView
          theme={theme}
          accidental={accidental}
          layers={layers}
          globalRootNote={globalRootNote}
          rootNote={rootNote}
          onRootNoteChange={setRootNote}
          onAddLayerAndNavigate={onAddLayerAndNavigate}
          onEnablePerLayerRoot={onEnablePerLayerRoot}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  toggleRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
});
