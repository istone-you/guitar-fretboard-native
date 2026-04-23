import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../../i18n";
import type { Accidental, Theme, LayerConfig, ChordType } from "../../../types";
import { createDefaultLayer, MAX_LAYERS } from "../../../types";
import { getColors, pickNextLayerColor } from "../../../themes/design";
import { getNotesByAccidental, getRootIndex, CHORD_SUFFIX_MAP } from "../../../lib/fretboard";
import { chordDisplayName } from "../../../lib/harmonyUtils";
import { SUBSTITUTION_CHORD_TYPES, SUBSTITUTION_CHORD_LABELS } from "../../../lib/substitutions";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import Icon from "../../../components/ui/Icon";
import PillButton from "../../../components/ui/PillButton";
import NotePill from "../../../components/ui/NotePill";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import BottomSheetModal, {
  SHEET_HANDLE_CLEARANCE,
  useSheetHeight,
} from "../../../components/ui/BottomSheetModal";
import SheetProgressiveHeader from "../../../components/ui/SheetProgressiveHeader";
import GlassIconButton from "../../../components/ui/GlassIconButton";

type CapoMode = "form-to-sound" | "sound-to-form";

interface CapoFinderProps {
  theme: Theme;
  accidental: Accidental;
  layers?: LayerConfig[];
  onAddLayerAndNavigate?: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

export default function CapoFinder({
  theme,
  accidental,
  layers = [],
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: CapoFinderProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const sheetHeight = useSheetHeight();

  const [capoMode, setCapoMode] = useState<CapoMode>("form-to-sound");
  const [capoFret, setCapoFret] = useState(0);
  const [formKey, setFormKey] = useState("C");
  const [chordType, setChordType] = useState<ChordType>("Major");
  const [targetKey, setTargetKey] = useState("G");
  const [shapeKey, setShapeKey] = useState("E");
  const [sheetVisible, setSheetVisible] = useState(false);
  const [detailHeaderHeight, setDetailHeaderHeight] = useState(96);

  const notes = getNotesByAccidental(accidental);
  const borderColor = isDark ? colors.border : colors.border2;

  const FORM_GAP = 8;
  const formWidth = Math.floor((screenWidth - 32 - FORM_GAP * 2) / 3);

  const actualSoundIndex = (getRootIndex(formKey) + capoFret) % 12;
  const actualSound = notes[actualSoundIndex];

  const capoNeeded = (getRootIndex(targetKey) - getRootIndex(shapeKey) + 12) % 12;

  const isFull = layers.length >= MAX_LAYERS;

  const handleAdd = () => {
    if (isFull || !onAddLayerAndNavigate) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const color = pickNextLayerColor(layers);
    const layer = createDefaultLayer("chord", `layer-${Date.now()}`, color);
    layer.chordDisplayMode = "form";
    layer.chordType = chordType;
    if (actualSound !== notes[getRootIndex(notes[0])]) {
      layer.layerRoot = actualSound;
      onEnablePerLayerRoot?.();
    }
    onAddLayerAndNavigate(layer);
  };

  const sheetBg = colors.deepBg;
  const sheetChordName = chordDisplayName(actualSoundIndex, chordType, notes);
  const sheetForms = getAllChordForms(actualSoundIndex, chordType);

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View style={[styles.modeRow, { borderBottomColor: borderColor }]}>
        <SegmentedToggle
          theme={theme}
          value={capoMode}
          onChange={(v) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCapoMode(v as CapoMode);
          }}
          options={[
            { value: "form-to-sound" as CapoMode, label: t("finder.capo.modeFormToSound") },
            { value: "sound-to-form" as CapoMode, label: t("finder.capo.modeSoundToForm") },
          ]}
          size="compact"
          segmentWidth={120}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {capoMode === "form-to-sound" ? (
          <>
            <View style={[styles.row, { borderBottomColor: borderColor }]}>
              <Text style={[styles.rowLabel, { color: colors.textSubtle }]}>
                {t("finder.capo.capoFret")}
              </Text>
              <View style={styles.stepper}>
                <PillButton
                  isDark={isDark}
                  testID="capo-fret-decrement"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCapoFret((f) => Math.max(0, f - 1));
                  }}
                >
                  <Icon name="chevron-left" size={16} color={colors.textStrong} />
                </PillButton>
                <Text
                  testID="capo-fret-value"
                  style={[styles.fretNumber, { color: colors.textStrong }]}
                >
                  {capoFret}
                </Text>
                <PillButton
                  isDark={isDark}
                  testID="capo-fret-increment"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCapoFret((f) => Math.min(11, f + 1));
                  }}
                >
                  <Icon name="chevron-right" size={16} color={colors.textStrong} />
                </PillButton>
              </View>
            </View>

            <View style={[styles.row, { borderBottomColor: borderColor }]}>
              <Text style={[styles.rowLabel, { color: colors.textSubtle }]}>
                {t("finder.capo.formKey")}
              </Text>
              <NotePickerButton
                theme={theme}
                accidental={accidental}
                value={formKey}
                onChange={(note) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFormKey(note);
                }}
                label={t("header.key")}
                sheetTitle={t("header.key")}
              />
            </View>

            <View style={[styles.chipsRow, { borderBottomColor: borderColor }]}>
              {SUBSTITUTION_CHORD_TYPES.map((ct) => (
                <NotePill
                  key={ct}
                  label={SUBSTITUTION_CHORD_LABELS[ct] ?? (CHORD_SUFFIX_MAP[ct] || ct)}
                  selected={chordType === ct}
                  activeBg={colors.chipSelectedBg}
                  activeText={colors.chipSelectedText}
                  inactiveBg={colors.chipUnselectedBg}
                  inactiveText={colors.text}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setChordType(ct);
                  }}
                />
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSheetVisible(true);
              }}
              style={[styles.resultCard, { backgroundColor: colors.surface, borderColor }]}
            >
              <Text style={[styles.resultLabel, { color: colors.textSubtle }]}>
                {t("finder.capo.actualSound")}
              </Text>
              <Text
                testID="actual-sound-value"
                style={[styles.resultNote, { color: colors.textStrong }]}
              >
                {`${actualSound}${CHORD_SUFFIX_MAP[chordType] || ""}`}
              </Text>
              {capoFret === 0 && (
                <Text style={[styles.resultHint, { color: colors.textSubtle }]}>
                  {t("finder.capo.noCapo")}
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={[styles.row, { borderBottomColor: borderColor }]}>
              <Text style={[styles.rowLabel, { color: colors.textSubtle }]}>
                {t("finder.capo.targetKey")}
              </Text>
              <NotePickerButton
                theme={theme}
                accidental={accidental}
                value={targetKey}
                onChange={(note) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTargetKey(note);
                }}
                label={t("header.key")}
                sheetTitle={t("header.key")}
              />
            </View>

            <View style={[styles.row, { borderBottomColor: borderColor }]}>
              <Text style={[styles.rowLabel, { color: colors.textSubtle }]}>
                {t("finder.capo.shapeKey")}
              </Text>
              <NotePickerButton
                theme={theme}
                accidental={accidental}
                value={shapeKey}
                onChange={(note) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShapeKey(note);
                }}
                label={t("header.key")}
                sheetTitle={t("header.key")}
              />
            </View>

            <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor }]}>
              <Text style={[styles.resultLabel, { color: colors.textSubtle }]}>
                {t("finder.capo.capoPosition")}
              </Text>
              <Text
                testID="capo-result-value"
                style={[styles.resultNote, { color: colors.textStrong }]}
              >
                {capoNeeded === 0 ? t("finder.capo.noCapo") : `${capoNeeded}`}
              </Text>
              {capoNeeded > 9 && (
                <Text style={[styles.resultHint, { color: colors.textSubtle }]}>
                  {t("finder.capo.highFret")}
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <BottomSheetModal visible={sheetVisible} onClose={() => setSheetVisible(false)}>
        {({ close, dragHandlers }) => (
          <View
            style={[
              styles.detailSheet,
              { height: sheetHeight, backgroundColor: sheetBg, borderColor: colors.sheetBorder },
            ]}
          >
            <View style={{ flex: 1, overflow: "hidden" }}>
              <ScrollView
                contentContainerStyle={[styles.sheetContent, { paddingTop: detailHeaderHeight }]}
                showsVerticalScrollIndicator={false}
              >
                {sheetForms.length > 0 && (
                  <View style={styles.formsRow}>
                    {sheetForms.map((cells, fi) => (
                      <ChordDiagram
                        key={fi}
                        cells={cells}
                        rootIndex={actualSoundIndex}
                        theme={theme}
                        width={formWidth}
                      />
                    ))}
                  </View>
                )}
                <View style={styles.addButtonArea}>
                  <PillButton
                    isDark={isDark}
                    onPress={() => {
                      handleAdd();
                      close();
                    }}
                    disabled={isFull || !onAddLayerAndNavigate}
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
                    <Text style={[styles.headerTitle, { color: colors.textStrong }]}>
                      {sheetChordName}
                    </Text>
                  </View>
                  <View style={styles.headerSide} />
                </View>
              </SheetProgressiveHeader>
            </View>
          </View>
        )}
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fretNumber: {
    fontSize: 22,
    fontWeight: "700",
    minWidth: 28,
    textAlign: "center",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultCard: {
    marginTop: 24,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  resultNote: {
    fontSize: 56,
    fontWeight: "700",
    letterSpacing: -1,
  },
  resultHint: {
    fontSize: 12,
  },
  detailSheet: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  formsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  addButtonArea: {
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
  },
  addButtonText: {},
  fullText: {
    fontSize: 12,
    textAlign: "center",
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
  },
});
