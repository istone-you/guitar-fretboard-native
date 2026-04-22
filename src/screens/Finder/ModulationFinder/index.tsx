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
import { getRootIndex, getNotesByAccidental } from "../../../lib/fretboard";
import {
  getPivotChords,
  getDiatonicChordList,
  chordDisplayName,
  type KeyType,
} from "../../../lib/harmonyUtils";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import BottomSheetModal, {
  SHEET_HANDLE_CLEARANCE,
  useSheetHeight,
} from "../../../components/ui/BottomSheetModal";
import SheetProgressiveHeader from "../../../components/ui/SheetProgressiveHeader";
import GlassIconButton from "../../../components/ui/GlassIconButton";
import Icon from "../../../components/ui/Icon";
import PillButton from "../../../components/ui/PillButton";

interface ModulationFinderProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

export default function ModulationFinder({
  theme,
  accidental,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: ModulationFinderProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const sheetHeight = useSheetHeight();

  const [rootNoteA, setRootNoteA] = useState("C");
  const [keyTypeA, setKeyTypeA] = useState<KeyType>("major");
  const [rootNoteB, setRootNoteB] = useState("G");
  const [keyTypeB, setKeyTypeB] = useState<KeyType>("major");
  const [pendingChord, setPendingChord] = useState<{
    rootIndex: number;
    chordType: ChordType;
    degreeA?: string;
    degreeB?: string;
  } | null>(null);
  const [detailHeaderHeight, setDetailHeaderHeight] = useState(96);

  const notes = getNotesByAccidental(accidental);
  const isFull = layers.length >= MAX_LAYERS;
  const borderColor = isDark ? colors.border : colors.border2;

  const formWidth = Math.floor((screenWidth - 32 - 8 * 2) / 3);

  const keyTypeOptions: { value: KeyType; label: string }[] = [
    { value: "major", label: "Major" },
    { value: "minor", label: "Minor" },
  ];

  const rootIndexA = getRootIndex(rootNoteA);
  const rootIndexB = getRootIndex(rootNoteB);

  const diatonicA = useMemo(
    () => getDiatonicChordList(rootIndexA, keyTypeA),
    [rootIndexA, keyTypeA],
  );
  const diatonicB = useMemo(
    () => getDiatonicChordList(rootIndexB, keyTypeB),
    [rootIndexB, keyTypeB],
  );
  const pivotChords = useMemo(
    () => getPivotChords(rootIndexA, keyTypeA, rootIndexB, keyTypeB),
    [rootIndexA, keyTypeA, rootIndexB, keyTypeB],
  );
  const pivotKeySet = useMemo(
    () => new Set(pivotChords.map((p) => `${p.rootIndex}-${p.chordType}`)),
    [pivotChords],
  );

  const handleAdd = useCallback(
    (rootIndex: number, chordType: ChordType) => {
      if (isFull) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const color = pickNextLayerColor(layers);
      const layer = createDefaultLayer("chord", `layer-${Date.now()}`, color);
      layer.chordDisplayMode = "form";
      layer.chordType = chordType;
      const rootName = notes[rootIndex];
      if (rootName !== globalRootNote) {
        layer.layerRoot = rootName;
      }
      if (rootNoteA !== globalRootNote || rootNoteB !== globalRootNote) {
        onEnablePerLayerRoot?.();
      }
      onAddLayerAndNavigate(layer);
    },
    [
      isFull,
      layers,
      notes,
      globalRootNote,
      rootNoteA,
      rootNoteB,
      onAddLayerAndNavigate,
      onEnablePerLayerRoot,
    ],
  );

  const handleChipPress = (
    c: { rootIndex: number; chordType: ChordType; degreeLabel: string },
    rowKey: string,
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const key = `${c.rootIndex}-${c.chordType}`;
    const pivot = pivotChords.find((p) => `${p.rootIndex}-${p.chordType}` === key);
    if (pivot) {
      setPendingChord({
        rootIndex: c.rootIndex,
        chordType: c.chordType,
        degreeA: pivot.degreeLabelInA,
        degreeB: pivot.degreeLabelInB,
      });
    } else if (rowKey === "a") {
      setPendingChord({ rootIndex: c.rootIndex, chordType: c.chordType, degreeA: c.degreeLabel });
    } else {
      setPendingChord({ rootIndex: c.rootIndex, chordType: c.chordType, degreeB: c.degreeLabel });
    }
  };

  const keyLabel = (root: string, kt: KeyType) => `${root} ${kt === "major" ? "Major" : "Minor"}`;

  const renderDiatonicRow = (
    diatonic: ReturnType<typeof getDiatonicChordList>,
    keyName: string,
    rowKey: string,
  ) => (
    <View style={[styles.card, { borderColor }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.textStrong }]}>{keyName}</Text>
      </View>
      <View style={styles.chipsRow}>
        {diatonic.map((c) => {
          const isShared = pivotKeySet.has(`${c.rootIndex}-${c.chordType}`);
          return (
            <TouchableOpacity
              key={c.degree}
              testID={`diatonic-chip-${rowKey}-${c.degree}`}
              activeOpacity={0.7}
              onPress={() => handleChipPress(c, rowKey)}
              style={[
                styles.degreeChip,
                isShared
                  ? { backgroundColor: colors.chipSelectedBg }
                  : { backgroundColor: colors.surface2 },
              ]}
            >
              <Text
                style={[
                  styles.chipDegree,
                  { color: isShared ? colors.chipSelectedText : colors.textSubtle },
                ]}
              >
                {c.degreeLabel}
              </Text>
              <Text
                style={[
                  styles.chipChordName,
                  { color: isShared ? colors.chipSelectedText : colors.textStrong },
                ]}
              >
                {chordDisplayName(c.rootIndex, c.chordType, notes)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      {/* Key A */}
      <View style={[styles.keyRow, { borderBottomColor: borderColor }]}>
        <Text style={[styles.keyLabel, { color: colors.textSubtle }]}>
          {t("finder.modulation.keyA")}
        </Text>
        <View style={styles.keyControls}>
          <NotePickerButton
            theme={theme}
            accidental={accidental}
            value={rootNoteA}
            onChange={(note) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setRootNoteA(note);
            }}
            label={t("header.root")}
            sheetTitle={t("header.root")}
          />
          <SegmentedToggle
            theme={theme}
            value={keyTypeA}
            onChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setKeyTypeA(v as KeyType);
            }}
            options={keyTypeOptions}
            size="compact"
            segmentWidth={60}
          />
        </View>
      </View>

      {/* Key B */}
      <View style={[styles.keyRow, { borderBottomColor: borderColor }]}>
        <Text style={[styles.keyLabel, { color: colors.textSubtle }]}>
          {t("finder.modulation.keyB")}
        </Text>
        <View style={styles.keyControls}>
          <NotePickerButton
            theme={theme}
            accidental={accidental}
            value={rootNoteB}
            onChange={(note) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setRootNoteB(note);
            }}
            label={t("header.root")}
            sheetTitle={t("header.root")}
          />
          <SegmentedToggle
            theme={theme}
            value={keyTypeB}
            onChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setKeyTypeB(v as KeyType);
            }}
            options={keyTypeOptions}
            size="compact"
            segmentWidth={60}
          />
        </View>
      </View>

      {/* Diatonic rows */}
      <ScrollView
        contentContainerStyle={[styles.resultContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {renderDiatonicRow(diatonicA, keyLabel(rootNoteA, keyTypeA), "a")}
        {renderDiatonicRow(diatonicB, keyLabel(rootNoteB, keyTypeB), "b")}

        {/* Common chords */}
        <View style={[styles.card, { borderColor }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textStrong }]}>
              {t("finder.relatedKeys.pivotChords")}
            </Text>
          </View>
          {pivotChords.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
              {t("finder.modulation.none")}
            </Text>
          ) : (
            <View style={styles.chipsRow}>
              {pivotChords.map((p) => (
                <TouchableOpacity
                  key={`${p.rootIndex}-${p.chordType}`}
                  testID={`pivot-chip-${p.rootIndex}-${p.chordType}`}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPendingChord({
                      rootIndex: p.rootIndex,
                      chordType: p.chordType,
                      degreeA: p.degreeLabelInA,
                      degreeB: p.degreeLabelInB,
                    });
                  }}
                  style={[styles.degreeChip, { backgroundColor: colors.chipSelectedBg }]}
                >
                  <Text style={[styles.chipDegree, { color: colors.chipSelectedText }]}>
                    {p.degreeLabelInA} / {p.degreeLabelInB}
                  </Text>
                  <Text style={[styles.chipChordName, { color: colors.chipSelectedText }]}>
                    {chordDisplayName(p.rootIndex, p.chordType, notes)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Chord detail sheet */}
      <BottomSheetModal visible={pendingChord !== null} onClose={() => setPendingChord(null)}>
        {({ close, dragHandlers }) => {
          if (!pendingChord) return null;
          const chordName = chordDisplayName(pendingChord.rootIndex, pendingChord.chordType, notes);
          const forms = getAllChordForms(pendingChord.rootIndex, pendingChord.chordType);
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
                  contentContainerStyle={[styles.sheetContent, { paddingTop: detailHeaderHeight }]}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Degree badges */}
                  <View style={styles.degreeBadges}>
                    {pendingChord.degreeA && (
                      <View style={[styles.degreeBadge, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.degreeText, { color: colors.textSubtle }]}>
                          {keyLabel(rootNoteA, keyTypeA)}
                        </Text>
                        <Text style={[styles.degreeValue, { color: colors.textStrong }]}>
                          {pendingChord.degreeA}
                        </Text>
                      </View>
                    )}
                    {pendingChord.degreeB && (
                      <View style={[styles.degreeBadge, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.degreeText, { color: colors.textSubtle }]}>
                          {keyLabel(rootNoteB, keyTypeB)}
                        </Text>
                        <Text style={[styles.degreeValue, { color: colors.textStrong }]}>
                          {pendingChord.degreeB}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Chord diagrams */}
                  {forms.length > 0 && (
                    <View style={styles.formsRow}>
                      {forms.map((cells, fi) => (
                        <ChordDiagram
                          key={fi}
                          cells={cells}
                          rootIndex={pendingChord.rootIndex}
                          theme={theme}
                          width={formWidth}
                        />
                      ))}
                    </View>
                  )}

                  {/* Add to layer */}
                  <View style={styles.addButtonArea}>
                    <PillButton
                      isDark={isDark}
                      onPress={() => {
                        handleAdd(pendingChord.rootIndex, pendingChord.chordType);
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
  keyRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  keyLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  keyControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  resultContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  cardHeader: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  degreeChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 56,
    gap: 3,
  },
  chipDegree: {
    fontSize: 10,
    fontWeight: "600",
  },
  chipChordName: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
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
  degreeBadges: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 4,
  },
  degreeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 2,
  },
  degreeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  degreeValue: {
    fontSize: 14,
    fontWeight: "700",
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
  addButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
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
