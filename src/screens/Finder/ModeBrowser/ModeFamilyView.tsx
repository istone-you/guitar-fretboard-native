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
import FinderDetailSheet from "../../../components/ui/FinderDetailSheet";

interface ModeFamilyViewProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  rootNote: string;
  onRootNoteChange: (note: string) => void;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

interface PendingEntry {
  scaleType: string;
  rootIndex: number;
}

export default function ModeFamilyView({
  theme,
  accidental,
  layers,
  globalRootNote,
  rootNote,
  onRootNoteChange,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: ModeFamilyViewProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const sheetHeight = useSheetHeight();

  const [modeType, setModeType] = useState("ionian");
  const [modeSheetVisible, setModeSheetVisible] = useState(false);
  const [modeHeaderHeight, setModeHeaderHeight] = useState(96);
  const [pendingEntry, setPendingEntry] = useState<PendingEntry | null>(null);

  const notes = getNotesByAccidental(accidental);
  const isFull = layers.length >= MAX_LAYERS;
  const borderColor = isDark ? colors.border : colors.border2;
  const rootIndex = getRootIndex(rootNote);

  const { parentRootIndex, modes } = useMemo(
    () => getModeFamily(modeType, rootIndex),
    [modeType, rootIndex],
  );

  const parentRootName = notes[parentRootIndex];
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

  const pendingData = useMemo(() => {
    if (!pendingEntry) return null;
    const { scaleType: entryScaleType, rootIndex: entryRootIndex } = pendingEntry;
    const entryRootName = notes[entryRootIndex];
    const entryScaleName = t(`options.scale.${scaleI18nKey(entryScaleType)}`);
    const { parentRootIndex: entryParentIdx } = getModeFamily(entryScaleType, entryRootIndex);
    const entryParentName = notes[entryParentIdx];
    const entryScaleNotes = Array.from(SCALE_DEGREES[entryScaleType as ScaleType] ?? [])
      .sort((a, b) => a - b)
      .map((s) => notes[(entryRootIndex + s) % 12]);
    return {
      entryScaleType,
      entryRootIndex,
      entryRootName,
      entryScaleName,
      entryParentName,
      entryScaleNotes,
    };
  }, [pendingEntry, notes, t]);

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
            onRootNoteChange(note);
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
            {scaleName(modeType)}
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
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 80,
          gap: 12,
        }}
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
            style={[styles.modeRow, { borderColor }]}
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
            <Icon name="chevron-right" size={14} color={colors.textSubtle} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FinderDetailSheet
        visible={pendingEntry !== null}
        onClose={() => setPendingEntry(null)}
        theme={theme}
        title={pendingData?.entryScaleName ?? ""}
        subtitle={pendingData?.entryRootName}
        topContent={
          pendingData ? (
            <View style={[styles.detailParentRow, { borderBottomColor: borderColor }]}>
              <Text style={[styles.detailParentLabel, { color: colors.textSubtle }]}>
                {t("finder.modes.parentScale")}
              </Text>
              <Text style={[styles.detailParentValue, { color: colors.textStrong }]}>
                {`${pendingData.entryParentName} ${t("options.scale.major")}`}
              </Text>
            </View>
          ) : null
        }
        description={
          pendingData ? (
            <>
              <Text style={[styles.functionLabel, { color: colors.textStrong }]}>
                {pendingData.entryScaleName}
              </Text>
              <Text style={[styles.functionDesc, { color: colors.textSubtle }]}>
                {t(`description.scale.${scaleI18nKey(pendingData.entryScaleType)}`)}
              </Text>
            </>
          ) : null
        }
        bottomContent={
          pendingData ? (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSubtle }]}>
                {t("finder.modes.notes")}
              </Text>
              <View style={[styles.noteChipsRow, { paddingTop: 8 }]}>
                {pendingData.entryScaleNotes.map((n) => (
                  <View key={n} style={[styles.noteChip, { backgroundColor: colors.surface2 }]}>
                    <Text style={[styles.noteChipText, { color: colors.textStrong }]}>{n}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null
        }
        isFull={isFull}
        onAddLayer={
          pendingData
            ? () => handleAddMode(pendingData.entryScaleType, pendingData.entryRootIndex)
            : undefined
        }
      />

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
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderCurve: "continuous",
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
    borderCurve: "continuous",
  },
  noteChipText: {
    fontSize: 14,
    fontWeight: "600",
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
});
