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
import {
  getColors,
  pickNextLayerColor,
  DIATONIC_FUNCTION_COLORS,
  BLACK,
} from "../../../themes/design";
import {
  DIATONIC_CHORDS,
  CHORD_SUFFIX_MAP,
  getRootIndex,
  getNotesByAccidental,
  diatonicDegreeLabel,
} from "../../../lib/fretboard";
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

type DiatonicFunction = "T" | "SD" | "D";
type DiatonicMode = "major-triad" | "major-seventh" | "minor-triad" | "minor-seventh";

const DIATONIC_MODES: { value: DiatonicMode; label: string; fullLabel: string }[] = [
  { value: "major-triad", label: "Maj", fullLabel: "Major Triad" },
  { value: "major-seventh", label: "Maj7", fullLabel: "Major 7th" },
  { value: "minor-triad", label: "Min", fullLabel: "Minor Triad" },
  { value: "minor-seventh", label: "Min7", fullLabel: "Minor 7th" },
];

const TEMPLATE_ID: Record<DiatonicMode, string> = {
  "major-triad": "diatonicMajorTriad",
  "major-seventh": "diatonicMajorSeventh",
  "minor-triad": "diatonicMinorTriad",
  "minor-seventh": "diatonicMinorSeventh",
};

const DEGREE_FUNCTIONS_MAJOR: DiatonicFunction[] = ["T", "SD", "T", "SD", "D", "T", "D"];
const DEGREE_FUNCTIONS_MINOR: DiatonicFunction[] = ["T", "SD", "T", "SD", "D", "SD", "T"];

interface DiatonicBrowserProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

interface PendingEntry {
  degreeLabel: string;
  fn: DiatonicFunction;
  chordRootIndex: number;
  chordType: ChordType;
  chordName: string;
}

export default function DiatonicBrowser({
  theme,
  accidental,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: DiatonicBrowserProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const sheetHeight = useSheetHeight();

  const [rootNote, setRootNote] = useState("C");
  const [diatonicMode, setDiatonicMode] = useState<DiatonicMode>("major-triad");
  const [modeSheetVisible, setModeSheetVisible] = useState(false);
  const [modeHeaderHeight, setModeHeaderHeight] = useState(96);
  const [pendingEntry, setPendingEntry] = useState<PendingEntry | null>(null);

  const keyType = diatonicMode.startsWith("major") ? "major" : "minor";
  const chordSize = diatonicMode.endsWith("triad") ? "triad" : "seventh";
  const [modalHeaderHeight, setModalHeaderHeight] = useState(96);

  const rootIndex = getRootIndex(rootNote);
  const notes = getNotesByAccidental(accidental);
  const isFull = layers.length >= MAX_LAYERS;
  const borderColor = isDark ? colors.border : colors.border2;

  const FORM_GAP = 8;
  const formWidth = Math.floor((screenWidth - 32 - FORM_GAP * 2) / 3);

  const chordList = useMemo(() => {
    const scaleKey = keyType === "major" ? `major-${chordSize}` : `natural-minor-${chordSize}`;
    const entries = DIATONIC_CHORDS[scaleKey] ?? [];
    const fnMap = keyType === "major" ? DEGREE_FUNCTIONS_MAJOR : DEGREE_FUNCTIONS_MINOR;
    return entries.map((entry, index) => {
      const chordRootIndex = (rootIndex + entry.offset) % 12;
      const chordName = `${notes[chordRootIndex]}${CHORD_SUFFIX_MAP[entry.chordType] ?? ""}`;
      const forms = getAllChordForms(chordRootIndex, entry.chordType);
      return {
        degree: entry.value,
        degreeLabel: diatonicDegreeLabel(entry.value, { chordSize, keyType }),
        fn: fnMap[index] ?? "T",
        chordRootIndex,
        chordType: entry.chordType,
        chordName,
        forms,
      };
    });
  }, [rootIndex, keyType, chordSize, accidental]);

  const pendingLayer = useMemo(() => {
    if (!pendingEntry) return null;
    const layer = createDefaultLayer("chord", "diatonic-desc", BLACK);
    layer.chordDisplayMode = "form";
    layer.chordType = pendingEntry.chordType;
    return layer;
  }, [pendingEntry]);

  const handleAddLayer = useCallback(() => {
    if (!pendingEntry || isFull) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const color = pickNextLayerColor(layers);
    const layer = createDefaultLayer("chord", `layer-${Date.now()}`, color);
    layer.chordDisplayMode = "form";
    layer.chordType = pendingEntry.chordType;
    if (notes[pendingEntry.chordRootIndex] !== globalRootNote) {
      layer.layerRoot = notes[pendingEntry.chordRootIndex];
    }
    if (rootNote !== globalRootNote) {
      onEnablePerLayerRoot?.();
    }
    setPendingEntry(null);
    onAddLayerAndNavigate(layer);
  }, [
    pendingEntry,
    isFull,
    layers,
    notes,
    globalRootNote,
    onAddLayerAndNavigate,
    onEnablePerLayerRoot,
  ]);

  const handleAddProgression = useCallback(() => {
    if (isFull) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const color = pickNextLayerColor(layers);
    const layer = createDefaultLayer("progression", `layer-${Date.now()}`, color);
    layer.progressionTemplateId = TEMPLATE_ID[diatonicMode];
    if (rootNote !== globalRootNote) {
      layer.layerRoot = rootNote;
      onEnablePerLayerRoot?.();
    }
    onAddLayerAndNavigate(layer);
  }, [
    isFull,
    layers,
    diatonicMode,
    rootNote,
    globalRootNote,
    onAddLayerAndNavigate,
    onEnablePerLayerRoot,
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      {/* Root note + toggles */}
      <View style={[styles.controlsRow, { borderBottomColor: borderColor }]}>
        <View style={styles.rootRow}>
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
              {DIATONIC_MODES.find((m) => m.value === diatonicMode)?.label}
            </Text>
            <Icon name="chevron-down" size={12} color={colors.textSubtle} />
          </PillButton>
          <PillButton
            isDark={isDark}
            onPress={handleAddProgression}
            disabled={isFull}
            style={styles.uploadBtn}
          >
            <Icon name="upload" size={16} color={colors.textSubtle} />
          </PillButton>
        </View>
      </View>

      {/* Mode picker sheet */}
      <BottomSheetModal visible={modeSheetVisible} onClose={() => setModeSheetVisible(false)}>
        {({ close, dragHandlers }) => {
          const sheetBg = colors.deepBg;
          return (
            <View
              style={[
                styles.modeSheet,
                { height: sheetHeight, backgroundColor: sheetBg, borderColor: colors.sheetBorder },
              ]}
            >
              <View style={{ flex: 1, overflow: "hidden" }}>
                <ScrollView
                  contentContainerStyle={{ paddingTop: modeHeaderHeight }}
                  showsVerticalScrollIndicator={false}
                >
                  {DIATONIC_MODES.map(({ value, fullLabel }) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setDiatonicMode(value);
                        close();
                      }}
                      style={[styles.modeOption, { borderBottomColor: borderColor }]}
                    >
                      <Text
                        style={[
                          styles.modeOptionText,
                          { color: diatonicMode === value ? colors.chipSelectedBg : colors.text },
                        ]}
                      >
                        {fullLabel}
                      </Text>
                      {diatonicMode === value && (
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

      {/* Chord list */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {chordList.map(
          ({ degree, degreeLabel, fn, chordRootIndex, chordType, chordName, forms }) => (
            <TouchableOpacity
              key={degree}
              testID={`chord-row-${degree}`}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPendingEntry({ degreeLabel, fn, chordRootIndex, chordType, chordName });
              }}
              style={[styles.chordItem, { borderBottomColor: borderColor }]}
            >
              <View style={styles.chordHeader}>
                <View style={[styles.degreeBadge, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.degreeText, { color: colors.textSubtle }]}>
                    {degreeLabel}
                  </Text>
                </View>
                <Text style={[styles.chordLabel, { color: colors.textStrong }]}>{chordName}</Text>
                <View
                  style={[
                    styles.functionBadge,
                    { backgroundColor: DIATONIC_FUNCTION_COLORS[fn] + "22" },
                  ]}
                >
                  <Text style={[styles.functionText, { color: DIATONIC_FUNCTION_COLORS[fn] }]}>
                    {fn === "T"
                      ? t("finder.diatonicFunction.tonic")
                      : fn === "SD"
                        ? t("finder.diatonicFunction.subdominant")
                        : t("finder.diatonicFunction.dominant")}
                  </Text>
                </View>
              </View>
              {forms.length > 0 && (
                <View style={styles.formsRow}>
                  {forms.map((cells, fi) => (
                    <ChordDiagram
                      key={fi}
                      cells={cells}
                      rootIndex={chordRootIndex}
                      theme={theme}
                      width={formWidth}
                    />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ),
        )}
      </ScrollView>

      {/* Chord detail bottom sheet */}
      <BottomSheetModal visible={pendingEntry !== null} onClose={() => setPendingEntry(null)}>
        {({ close, dragHandlers }) => {
          if (!pendingEntry || !pendingLayer) return null;
          const forms = getAllChordForms(pendingEntry.chordRootIndex, pendingEntry.chordType);
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
                  {forms.length > 0 && (
                    <View style={styles.modalDiagrams}>
                      {forms.map((cells, fi) => (
                        <ChordDiagram
                          key={fi}
                          cells={cells}
                          rootIndex={pendingEntry.chordRootIndex}
                          theme={theme}
                          width={formWidth}
                        />
                      ))}
                    </View>
                  )}
                  <View style={styles.descriptionArea}>
                    <Text style={[styles.functionLabel, { color: colors.textStrong }]}>
                      {pendingEntry.fn === "T"
                        ? t("finder.diatonicFunction.tonic")
                        : pendingEntry.fn === "SD"
                          ? t("finder.diatonicFunction.subdominant")
                          : t("finder.diatonicFunction.dominant")}
                    </Text>
                    <Text style={[styles.functionDesc, { color: colors.textSubtle }]}>
                      {pendingEntry.fn === "T"
                        ? t("finder.diatonicFunction.tonicDesc")
                        : pendingEntry.fn === "SD"
                          ? t("finder.diatonicFunction.subdominantDesc")
                          : t("finder.diatonicFunction.dominantDesc")}
                    </Text>
                    <LayerDescription theme={theme} layer={pendingLayer} itemOnly />
                  </View>
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
                      <Text style={[styles.headerDegree, { color: colors.textSubtle }]}>
                        {pendingEntry.degreeLabel}
                      </Text>
                      <Text style={[styles.headerTitle, { color: colors.textStrong }]}>
                        {pendingEntry.chordName}
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
  controlsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
    alignItems: "center",
  },
  rootRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadBtn: {
    paddingHorizontal: 8,
  },
  modeBtn: {
    paddingHorizontal: 10,
    gap: 4,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  modeSheet: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  modeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modeOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  chordItem: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  chordHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  degreeBadge: {
    minWidth: 44,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: "center",
  },
  degreeText: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  functionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  functionText: {
    fontSize: 11,
    fontWeight: "700",
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
  headerDegree: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
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
  functionLabel: {
    fontSize: 13,
    fontWeight: "600",
    paddingTop: 12,
  },
  functionDesc: {
    fontSize: 13,
    lineHeight: 20,
    paddingTop: 4,
  },
});
