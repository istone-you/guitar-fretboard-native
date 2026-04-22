import { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../../i18n";
import type { Accidental, Theme, LayerConfig, ScaleType } from "../../../types";
import { createDefaultLayer, MAX_LAYERS } from "../../../types";
import { getColors, pickNextLayerColor } from "../../../themes/design";
import { getRootIndex, getNotesByAccidental, SCALE_DEGREES } from "../../../lib/fretboard";
import { scaleI18nKey } from "../../../lib/scaleFinder";
import { getModeFamily, CHURCH_MODES } from "../../../lib/harmonyUtils";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import BottomSheetModal, {
  SHEET_HANDLE_CLEARANCE,
  useSheetHeight,
} from "../../../components/ui/BottomSheetModal";
import SheetProgressiveHeader from "../../../components/ui/SheetProgressiveHeader";
import GlassIconButton from "../../../components/ui/GlassIconButton";
import Icon from "../../../components/ui/Icon";
import PillButton from "../../../components/ui/PillButton";

interface ModeBrowserProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

interface PendingEntry {
  scaleType: string;
  rootIndex: number;
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
  const insets = useSafeAreaInsets();
  const sheetHeight = useSheetHeight();

  const [rootNote, setRootNote] = useState("C");
  const [modeType, setModeType] = useState("ionian");
  const [modeSheetVisible, setModeSheetVisible] = useState(false);
  const [modeHeaderHeight, setModeHeaderHeight] = useState(96);
  const [pendingEntry, setPendingEntry] = useState<PendingEntry | null>(null);
  const [detailHeaderHeight, setDetailHeaderHeight] = useState(96);

  const notes = getNotesByAccidental(accidental);
  const isFull = layers.length >= MAX_LAYERS;
  const borderColor = isDark ? colors.border : colors.border2;
  const rootIndex = getRootIndex(rootNote);

  const { parentRootIndex, modes } = useMemo(
    () => getModeFamily(modeType, rootIndex),
    [modeType, rootIndex],
  );

  const parentRootName = notes[parentRootIndex];
  const currentMode = CHURCH_MODES.find((m) => m.scaleType === modeType);

  const scaleName = (st: string) => t(`options.scale.${scaleI18nKey(st)}`);

  const handleAddMode = useCallback(
    (scaleTypeToAdd: string, rootIndexToAdd: number) => {
      if (isFull) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const color = pickNextLayerColor(layers);
      const layer = createDefaultLayer("scale", `layer-${Date.now()}`, color);
      layer.scaleType = scaleTypeToAdd as ScaleType;
      const rootNameToAdd = notes[rootIndexToAdd];
      if (rootNameToAdd !== globalRootNote) {
        layer.layerRoot = rootNameToAdd;
        onEnablePerLayerRoot?.();
      }
      onAddLayerAndNavigate(layer);
    },
    [isFull, layers, notes, globalRootNote, onAddLayerAndNavigate, onEnablePerLayerRoot],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      {/* Controls */}
      <View style={[styles.controlRow, { borderBottomColor: borderColor }]}>
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
        <PillButton
          isDark={isDark}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setModeSheetVisible(true);
          }}
          style={styles.modeBtn}
        >
          <Text style={[styles.modeBtnText, { color: colors.textSubtle }]}>
            {currentMode?.label ?? modeType}
          </Text>
          <Icon name="chevron-down" size={12} color={colors.textSubtle} />
        </PillButton>
      </View>

      {/* Parent scale info */}
      <View style={[styles.parentRow, { borderBottomColor: borderColor }]}>
        <Text style={[styles.parentLabel, { color: colors.textSubtle }]}>
          {t("finder.modes.parentScale")}
        </Text>
        <Text style={[styles.parentValue, { color: colors.textStrong }]}>
          {`${parentRootName} ${t("options.scale.major")}`}
        </Text>
      </View>

      {/* Mode list */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {modes.map((entry, index) => (
          <TouchableOpacity
            key={entry.scaleType}
            testID={`mode-row-${entry.scaleType}`}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPendingEntry({ scaleType: entry.scaleType, rootIndex: entry.rootIndex });
            }}
            style={[styles.modeRow, { borderBottomColor: borderColor }]}
          >
            <View style={[styles.indexBadge, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.indexText, { color: colors.textSubtle }]}>{index + 1}</Text>
            </View>
            <View style={styles.modeInfo}>
              <Text style={[styles.modeRootNote, { color: colors.textStrong, fontWeight: "600" }]}>
                {notes[entry.rootIndex]}
              </Text>
              <Text style={[styles.modeName, { color: colors.textSubtle }]}>
                {scaleName(entry.scaleType)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Mode detail sheet */}
      <BottomSheetModal visible={pendingEntry !== null} onClose={() => setPendingEntry(null)}>
        {({ close, dragHandlers }) => {
          if (!pendingEntry) return null;
          const { scaleType: entryScaleType, rootIndex: entryRootIndex } = pendingEntry;
          const entryRootName = notes[entryRootIndex];
          const entryScaleName = scaleName(entryScaleType);
          const { parentRootIndex: entryParentIdx } = getModeFamily(entryScaleType, entryRootIndex);
          const entryParentName = notes[entryParentIdx];
          const entryScaleNotes = Array.from(SCALE_DEGREES[entryScaleType as ScaleType] ?? [])
            .sort((a, b) => a - b)
            .map((s) => notes[(entryRootIndex + s) % 12]);
          const sheetBg = colors.deepBg;

          return (
            <View
              style={[
                styles.detailSheet,
                { height: sheetHeight, backgroundColor: sheetBg, borderColor: colors.sheetBorder },
              ]}
            >
              <View style={{ flex: 1, overflow: "hidden" }}>
                <ScrollView
                  contentContainerStyle={[styles.detailContent, { paddingTop: detailHeaderHeight }]}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Parent scale */}
                  <View style={[styles.detailParentRow, { borderBottomColor: borderColor }]}>
                    <Text style={[styles.detailParentLabel, { color: colors.textSubtle }]}>
                      {t("finder.modes.parentScale")}
                    </Text>
                    <Text style={[styles.detailParentValue, { color: colors.textStrong }]}>
                      {`${entryParentName} ${t("options.scale.major")}`}
                    </Text>
                  </View>

                  {/* Description */}
                  <View style={styles.descriptionArea}>
                    <Text style={[styles.functionLabel, { color: colors.textStrong }]}>
                      {entryScaleName}
                    </Text>
                    <Text style={[styles.functionDesc, { color: colors.textSubtle }]}>
                      {t(`description.scale.${scaleI18nKey(entryScaleType)}`)}
                    </Text>
                  </View>

                  {/* Scale notes */}
                  <Text style={[styles.sectionLabel, { color: colors.textSubtle }]}>
                    {t("finder.modes.notes")}
                  </Text>
                  <View style={styles.noteChipsRow}>
                    {entryScaleNotes.map((n) => (
                      <View key={n} style={[styles.noteChip, { backgroundColor: colors.surface2 }]}>
                        <Text style={[styles.noteChipText, { color: colors.textStrong }]}>{n}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Add to layer */}
                  <View style={styles.addButtonArea}>
                    <PillButton
                      isDark={isDark}
                      onPress={() => {
                        handleAddMode(entryScaleType, entryRootIndex);
                        close();
                      }}
                      disabled={isFull}
                    >
                      <Icon name="upload" size={15} color={colors.textStrong} />
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

                <SheetProgressiveHeader
                  isDark={isDark}
                  bgColor={sheetBg}
                  dragHandlers={dragHandlers}
                  contentPaddingHorizontal={14}
                  onLayout={setDetailHeaderHeight}
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
                      <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>
                        {entryRootName}
                      </Text>
                      <Text style={[styles.headerTitle, { color: colors.textStrong }]}>
                        {entryScaleName}
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

      {/* Mode picker sheet */}
      <BottomSheetModal visible={modeSheetVisible} onClose={() => setModeSheetVisible(false)}>
        {({ close, dragHandlers }) => {
          const sheetBg = colors.deepBg;
          return (
            <View
              style={[
                styles.detailSheet,
                { height: sheetHeight, backgroundColor: sheetBg, borderColor: colors.sheetBorder },
              ]}
            >
              <View style={{ flex: 1, overflow: "hidden" }}>
                <ScrollView
                  contentContainerStyle={{ paddingTop: modeHeaderHeight }}
                  showsVerticalScrollIndicator={false}
                >
                  {CHURCH_MODES.map(({ scaleType }) => (
                    <TouchableOpacity
                      key={scaleType}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setModeType(scaleType);
                        close();
                      }}
                      style={[styles.modeOption, { borderBottomColor: borderColor }]}
                    >
                      <Text
                        style={[
                          styles.modeOptionLabel,
                          {
                            color: modeType === scaleType ? colors.chipSelectedBg : colors.text,
                            fontWeight: modeType === scaleType ? "700" : "400",
                          },
                        ]}
                      >
                        {scaleName(scaleType)}
                      </Text>
                      {modeType === scaleType && (
                        <Icon name="check" size={16} color={colors.chipSelectedBg} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <SheetProgressiveHeader
                  isDark={isDark}
                  bgColor={sheetBg}
                  dragHandlers={dragHandlers}
                  contentPaddingHorizontal={14}
                  onLayout={setModeHeaderHeight}
                  style={styles.absoluteHeader}
                >
                  <View style={styles.headerRow}>
                    <GlassIconButton
                      isDark={isDark}
                      onPress={close}
                      icon="close"
                      style={styles.headerSide}
                    />
                    <View style={styles.headerCenter} />
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
  controlRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modeBtn: {
    paddingHorizontal: 10,
    gap: 4,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },

  parentRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  parentLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  parentValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  indexText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modeInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modeRootNote: {
    fontSize: 18,
    minWidth: 32,
  },
  modeName: {
    fontSize: 13,
  },

  detailSheet: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  detailContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  detailParentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailParentLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  detailParentValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  descriptionArea: {
    paddingBottom: 4,
  },
  functionLabel: {
    fontSize: 13,
    fontWeight: "600",
    paddingTop: 4,
  },
  functionDesc: {
    fontSize: 13,
    lineHeight: 20,
    paddingTop: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingTop: 4,
  },
  noteChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  noteChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  noteChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  addButtonArea: {
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  fullText: {
    fontSize: 12,
    textAlign: "center",
  },
  modeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modeOptionLabel: {
    fontSize: 16,
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
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
});
