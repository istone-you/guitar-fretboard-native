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
  getRelatedKeys,
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

interface RelatedKeysBrowserProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

type PendingChord = {
  rootIndex: number;
  chordType: ChordType;
  degreeInBase?: string;
  baseKeyName: string;
  degreeInRelated: string;
  relatedKeyName: string;
};

export default function RelatedKeysBrowser({
  theme,
  accidental,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: RelatedKeysBrowserProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const sheetHeight = useSheetHeight();

  const [rootNote, setRootNote] = useState("C");
  const [keyType, setKeyType] = useState<KeyType>("major");
  const [pendingChord, setPendingChord] = useState<PendingChord | null>(null);
  const [detailHeaderHeight, setDetailHeaderHeight] = useState(96);

  const notes = getNotesByAccidental(accidental);
  const isFull = layers.length >= MAX_LAYERS;
  const borderColor = isDark ? colors.border : colors.border2;
  const rootIndex = getRootIndex(rootNote);
  const formWidth = Math.floor((screenWidth - 32 - 8 * 2) / 3);

  const keyLabel = (rIndex: number, kType: KeyType) =>
    `${notes[rIndex]} ${kType === "major" ? "Major" : "Minor"}`;

  const keyTypeOptions: { value: KeyType; label: string }[] = [
    { value: "major", label: "Major" },
    { value: "minor", label: "Minor" },
  ];

  const relatedKeys = useMemo(() => getRelatedKeys(rootIndex, keyType), [rootIndex, keyType]);

  const sections = useMemo(
    () =>
      relatedKeys.map((rk) => {
        const diatonic = getDiatonicChordList(rk.rootIndex, rk.keyType);
        const pivots = getPivotChords(rootIndex, keyType, rk.rootIndex, rk.keyType);
        const pivotSet = new Set(pivots.map((p) => `${p.rootIndex}-${p.chordType}`));
        return { rk, diatonic, pivots, pivotSet };
      }),
    [relatedKeys, rootIndex, keyType],
  );

  const handleAdd = useCallback(
    (chordRootIndex: number, chordType: ChordType) => {
      if (isFull) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const color = pickNextLayerColor(layers);
      const layer = createDefaultLayer("chord", `layer-${Date.now()}`, color);
      layer.chordDisplayMode = "form";
      layer.chordType = chordType;
      const rootName = notes[chordRootIndex];
      if (rootName !== globalRootNote) {
        layer.layerRoot = rootName;
      }
      if (rootNote !== globalRootNote) {
        onEnablePerLayerRoot?.();
      }
      onAddLayerAndNavigate(layer);
    },
    [isFull, layers, notes, globalRootNote, rootNote, onAddLayerAndNavigate, onEnablePerLayerRoot],
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
        <SegmentedToggle
          theme={theme}
          value={keyType}
          onChange={(v) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setKeyType(v as KeyType);
          }}
          options={keyTypeOptions}
          size="compact"
          segmentWidth={60}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.baseKeyLabel, { color: colors.textSubtle }]}>
          {t("finder.relatedKeys.baseKey", { key: keyLabel(rootIndex, keyType) })}
        </Text>

        {sections.map(({ rk, diatonic, pivots, pivotSet }) => {
          const relKeyName = keyLabel(rk.rootIndex, rk.keyType);
          const relLabel = t(`finder.relatedKeys.relation.${rk.relation}.${keyType}.${rk.keyType}`);
          const desc = t(`finder.relatedKeys.desc.${rk.relation}`);

          return (
            <View
              key={`${rk.relation}-${rk.rootIndex}`}
              testID={`related-section-${rk.relation}`}
              style={[styles.section, { borderColor }]}
            >
              <View style={styles.sectionHeader}>
                <Text style={[styles.relationLabel, { color: colors.textSubtle }]}>{relLabel}</Text>
                <Text style={[styles.relKeyName, { color: colors.textStrong }]}>{relKeyName}</Text>
                <Text style={[styles.descText, { color: colors.textSubtle }]}>{desc}</Text>
              </View>
              <View style={styles.chipsRow}>
                {diatonic.map((c) => {
                  const key = `${c.rootIndex}-${c.chordType}`;
                  const isShared = pivotSet.has(key);
                  const pivot = pivots.find((p) => `${p.rootIndex}-${p.chordType}` === key);
                  return (
                    <TouchableOpacity
                      key={c.degree}
                      testID={`related-chip-${rk.relation}-${c.degree}`}
                      activeOpacity={0.7}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPendingChord({
                          rootIndex: c.rootIndex,
                          chordType: c.chordType as ChordType,
                          degreeInBase: pivot?.degreeLabelInA,
                          baseKeyName: keyLabel(rootIndex, keyType),
                          degreeInRelated: c.degreeLabel,
                          relatedKeyName: relKeyName,
                        });
                      }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isShared ? colors.chipSelectedBg : colors.surface2,
                        },
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
        })}
      </ScrollView>

      {/* Pivot chord detail sheet */}
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
                  <View style={styles.degreeBadges}>
                    {pendingChord.degreeInBase && (
                      <View style={[styles.degreeBadge, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.degreeKey, { color: colors.textSubtle }]}>
                          {pendingChord.baseKeyName}
                        </Text>
                        <Text style={[styles.degreeVal, { color: colors.textStrong }]}>
                          {pendingChord.degreeInBase}
                        </Text>
                      </View>
                    )}
                    <View style={[styles.degreeBadge, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.degreeKey, { color: colors.textSubtle }]}>
                        {pendingChord.relatedKeyName}
                      </Text>
                      <Text style={[styles.degreeVal, { color: colors.textStrong }]}>
                        {pendingChord.degreeInRelated}
                      </Text>
                    </View>
                  </View>
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
  controlRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  baseKeyLabel: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  section: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    gap: 0,
  },
  sectionHeader: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 2,
  },
  relationLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  relKeyName: {
    fontSize: 18,
    fontWeight: "700",
  },
  descText: {
    fontSize: 12,
    lineHeight: 18,
    paddingTop: 2,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  chip: {
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
  degreeKey: {
    fontSize: 10,
    fontWeight: "600",
  },
  degreeVal: {
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
