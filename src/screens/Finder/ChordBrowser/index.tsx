import { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../../i18n";
import type { Accidental, Theme, LayerConfig, ChordType } from "../../../types";
import { createDefaultLayer, MAX_LAYERS } from "../../../types";
import { getColors, pickNextLayerColor, BLACK } from "../../../themes/design";
import { CHORD_TYPES_CORE, CHORD_SUFFIX_MAP, getRootIndex } from "../../../lib/fretboard";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import { useChordDiagramWidth } from "../../../hooks/useChordDiagramWidth";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import FinderDetailSheet from "../../../components/ui/FinderDetailSheet";
import Icon from "../../../components/ui/Icon";
import LayerDescription from "../../../components/LayerEditModal/LayerDescription";

interface ChordBrowserProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

export default function ChordBrowser({
  theme,
  accidental,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: ChordBrowserProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const [rootNote, setRootNote] = useState("C");
  const [pendingType, setPendingType] = useState<ChordType | null>(null);

  const rootIndex = getRootIndex(rootNote);
  const isFull = layers.length >= MAX_LAYERS;
  const borderColor = isDark ? colors.border : colors.border2;
  const formWidth = useChordDiagramWidth();

  const handleAddLayer = useCallback(() => {
    if (!pendingType || isFull) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const color = pickNextLayerColor(layers);
    const layer = createDefaultLayer("chord", `layer-${Date.now()}`, color);
    layer.chordDisplayMode = "form";
    layer.chordType = pendingType;
    if (rootNote !== globalRootNote) {
      layer.layerRoot = rootNote;
      onEnablePerLayerRoot?.();
    }
    onAddLayerAndNavigate(layer);
  }, [
    pendingType,
    isFull,
    layers,
    rootNote,
    globalRootNote,
    onAddLayerAndNavigate,
    onEnablePerLayerRoot,
  ]);

  const pendingLayer = useMemo(() => {
    if (!pendingType) return null;
    const layer = createDefaultLayer("chord", "browser-desc", BLACK);
    layer.chordDisplayMode = "form";
    layer.chordType = pendingType;
    return layer;
  }, [pendingType]);

  const pendingForms = useMemo(
    () => (pendingType ? getAllChordForms(rootIndex, pendingType) : []),
    [rootIndex, pendingType],
  );

  const pendingChordName = useMemo(
    () => (pendingType ? `${rootNote}${CHORD_SUFFIX_MAP[pendingType] ?? pendingType}` : ""),
    [pendingType, rootNote],
  );

  const chordList = useMemo(
    () =>
      CHORD_TYPES_CORE.flatMap((chordType) => {
        const forms = getAllChordForms(rootIndex, chordType);
        if (forms.length === 0) return [];
        return [{ chordType, forms, suffix: CHORD_SUFFIX_MAP[chordType] ?? chordType }];
      }),
    [rootIndex],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      {/* Root note selector */}
      <View style={[styles.rootRow, { borderBottomColor: borderColor }]}>
        <NotePickerButton
          theme={theme}
          accidental={accidental}
          value={rootNote}
          onChange={(note) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setRootNote(note);
          }}
          label={t("header.root")}
          sheetTitle={t("header.root")}
        />
      </View>

      {/* Chord list */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 80,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {chordList.map(({ chordType, forms, suffix }) => (
          <TouchableOpacity
            key={chordType}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPendingType(chordType);
            }}
            style={[styles.chordItem, { borderColor }]}
          >
            <View style={styles.chordItemHeader}>
              <Text style={[styles.chordLabel, { color: colors.textStrong }]}>
                {`${rootNote}${suffix}`}
              </Text>
              <Icon name="chevron-right" size={14} color={colors.textSubtle} />
            </View>
            <View style={styles.formsRow}>
              {forms.map((cells, fi) => (
                <ChordDiagram
                  key={fi}
                  cells={cells}
                  rootIndex={rootIndex}
                  theme={theme}
                  width={formWidth}
                />
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FinderDetailSheet
        visible={pendingType !== null}
        onClose={() => setPendingType(null)}
        theme={theme}
        title={pendingChordName}
        mediaContent={
          pendingForms.length > 0 ? (
            <View style={styles.modalDiagrams}>
              {pendingForms.map((cells, fi) => (
                <ChordDiagram
                  key={fi}
                  cells={cells}
                  rootIndex={rootIndex}
                  theme={theme}
                  width={formWidth}
                />
              ))}
            </View>
          ) : null
        }
        description={
          pendingLayer ? <LayerDescription theme={theme} layer={pendingLayer} itemOnly /> : null
        }
        isFull={isFull}
        onAddLayer={handleAddLayer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  chordItem: {
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 8,
  },
  chordItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chordLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  formsRow: {
    flexDirection: "row",
    gap: 8,
  },
  modalDiagrams: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
