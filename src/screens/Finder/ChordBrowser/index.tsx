import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../../i18n";
import type { Accidental, Theme, LayerConfig, ChordType } from "../../../types";
import { createDefaultLayer, MAX_LAYERS } from "../../../types";
import { getColors, pickNextLayerColor } from "../../../themes/design";
import { CHORD_TYPES_CORE, CHORD_SUFFIX_MAP, getRootIndex } from "../../../lib/fretboard";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import BottomSheetModal, {
  SHEET_HANDLE_CLEARANCE,
  useSheetHeight,
} from "../../../components/ui/BottomSheetModal";
import SheetProgressiveHeader from "../../../components/ui/SheetProgressiveHeader";
import GlassIconButton from "../../../components/ui/GlassIconButton";
import LayerDescription from "../../../components/LayerEditModal/LayerDescription";
import Icon from "../../../components/ui/Icon";
import PillButton from "../../../components/ui/PillButton";

interface ChordBrowserProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
}

export default function ChordBrowser({
  theme,
  accidental,
  layers,
  onAddLayerAndNavigate,
}: ChordBrowserProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const sheetHeight = useSheetHeight();

  const [rootNote, setRootNote] = useState("C");
  const [pendingType, setPendingType] = useState<ChordType | null>(null);
  const [modalHeaderHeight, setModalHeaderHeight] = useState(96);

  const rootIndex = getRootIndex(rootNote);
  const isFull = layers.length >= MAX_LAYERS;
  const borderColor = isDark ? colors.border : colors.border2;

  const FORM_GAP = 8;
  const formWidth = Math.floor((screenWidth - 32 - FORM_GAP * 2) / 3);

  const handleAddLayer = useCallback(() => {
    if (!pendingType || isFull) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const color = pickNextLayerColor(layers);
    const layer = createDefaultLayer("chord", `layer-${Date.now()}`, color);
    layer.chordDisplayMode = "form";
    layer.chordType = pendingType;
    setPendingType(null);
    onAddLayerAndNavigate(layer);
  }, [pendingType, isFull, layers, onAddLayerAndNavigate]);

  const pendingLayer = useMemo(() => {
    if (!pendingType) return null;
    const layer = createDefaultLayer("chord", "browser-desc", "#000");
    layer.chordDisplayMode = "form";
    layer.chordType = pendingType;
    return layer;
  }, [pendingType]);

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
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
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
            style={[styles.chordItem, { borderBottomColor: borderColor }]}
          >
            <Text style={[styles.chordLabel, { color: colors.textStrong }]}>
              {`${rootNote}${suffix}`}
            </Text>
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

      {/* Chord detail bottom sheet */}
      <BottomSheetModal visible={pendingType !== null} onClose={() => setPendingType(null)}>
        {({ close, dragHandlers }) => {
          if (!pendingType || !pendingLayer) return null;
          const suffix = CHORD_SUFFIX_MAP[pendingType] ?? pendingType;
          const chordName = `${rootNote}${suffix}`;
          const forms = getAllChordForms(rootIndex, pendingType);
          const sheetBg = colors.deepBg;

          return (
            <View
              style={[
                styles.sheet,
                { height: sheetHeight, backgroundColor: sheetBg, borderColor: colors.sheetBorder },
              ]}
            >
              <View style={{ flex: 1, overflow: "hidden" }}>
                <ScrollView
                  contentContainerStyle={[styles.sheetContent, { paddingTop: modalHeaderHeight }]}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Chord diagrams */}
                  <View style={styles.modalDiagrams}>
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

                  {/* Description */}
                  <View style={styles.descriptionArea}>
                    <LayerDescription theme={theme} layer={pendingLayer} itemOnly />
                  </View>

                  {/* Add to layer button */}
                  <View style={styles.addButtonArea}>
                    <PillButton isDark={isDark} onPress={handleAddLayer} disabled={isFull}>
                      <Icon name="plus" size={15} color={colors.textStrong} />
                      <Text style={[styles.addButtonText, { color: colors.textStrong }]}>
                        {t("finder.addToLayerTitle")}
                      </Text>
                    </PillButton>
                    {isFull && (
                      <Text style={[styles.fullText, { color: colors.textSubtle }]}>
                        {t("finder.addToLayerFull")}
                      </Text>
                    )}
                  </View>
                </ScrollView>

                {/* Absolute glass header */}
                <SheetProgressiveHeader
                  isDark={isDark}
                  bgColor={sheetBg}
                  dragHandlers={dragHandlers}
                  contentPaddingHorizontal={14}
                  onLayout={setModalHeaderHeight}
                  style={styles.absoluteHeader}
                >
                  <View style={styles.headerRow}>
                    <GlassIconButton
                      isDark={isDark}
                      onPress={close}
                      icon="close"
                      style={styles.headerSide}
                    />
                    <View style={styles.headerCenter}>
                      <Text style={[styles.headerTitle, { color: colors.textStrong }]}>
                        {chordName}
                      </Text>
                    </View>
                    <View style={styles.headerSide} />
                  </View>
                </SheetProgressiveHeader>
              </View>
            </View>
          );
        }}
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  rootRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "flex-start",
  },
  chordItem: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  chordLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  formsRow: {
    flexDirection: "row",
    gap: 8,
  },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  sheetContent: {
    paddingBottom: 32,
  },
  absoluteHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingTop: SHEET_HANDLE_CLEARANCE,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerSide: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  modalDiagrams: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  descriptionArea: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  addButtonArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  fullText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
