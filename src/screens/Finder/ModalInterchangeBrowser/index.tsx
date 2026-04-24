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
import { getColors, pickNextLayerColor, BLACK } from "../../../themes/design";
import { getRootIndex, getNotesByAccidental } from "../../../lib/fretboard";
import {
  getModalInterchangeChords,
  chordDisplayName,
  type KeyType,
} from "../../../lib/harmonyUtils";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import FinderDetailSheet from "../../../components/ui/FinderDetailSheet";
import LayerDescription from "../../../components/LayerEditModal/LayerDescription";

interface ModalInterchangeBrowserProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

export default function ModalInterchangeBrowser({
  theme,
  accidental,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: ModalInterchangeBrowserProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [rootNote, setRootNote] = useState(globalRootNote);
  const [keyType, setKeyType] = useState<KeyType>("major");
  const [pendingChord, setPendingChord] = useState<{
    rootIndex: number;
    chordType: ChordType;
    degreeLabel: string;
    sourceMode: string;
  } | null>(null);

  const notes = getNotesByAccidental(accidental);
  const isFull = layers.length >= MAX_LAYERS;
  const borderColor = isDark ? colors.border : colors.border2;
  const formWidth = Math.floor((screenWidth - 32 - 8 * 2) / 3);

  const keyTypeOptions: { value: KeyType; label: string }[] = [
    { value: "major", label: "Major" },
    { value: "minor", label: "Minor" },
  ];

  const rootIndex = getRootIndex(rootNote);

  const borrowedChords = useMemo(
    () => getModalInterchangeChords(rootIndex, keyType),
    [rootIndex, keyType],
  );

  const pendingTmpLayer = useMemo(() => {
    if (!pendingChord) return null;
    const layer = createDefaultLayer("chord", "mi-tmp", BLACK);
    layer.chordDisplayMode = "form";
    layer.chordType = pendingChord.chordType;
    return layer;
  }, [pendingChord]);

  const handleAdd = useCallback(
    (chordRootIndex: number, chordType: ChordType) => {
      if (isFull) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const color = pickNextLayerColor(layers);
      const layer = createDefaultLayer("chord", `layer-${Date.now()}`, color);
      layer.chordDisplayMode = "form";
      layer.chordType = chordType;
      const chordRootName = notes[chordRootIndex];
      if (chordRootName !== globalRootNote) {
        layer.layerRoot = chordRootName;
        onEnablePerLayerRoot?.();
      }
      onAddLayerAndNavigate(layer);
    },
    [isFull, layers, notes, globalRootNote, onAddLayerAndNavigate, onEnablePerLayerRoot],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      {/* Key selector */}
      <View style={[styles.keyRow, { borderBottomColor: borderColor }]}>
        <View style={styles.keyControls}>
          <NotePickerButton
            theme={theme}
            accidental={accidental}
            value={rootNote}
            onChange={(note) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setRootNote(note);
            }}
            label={t("header.key")}
            sheetTitle={t("header.key")}
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
      </View>

      {/* Borrowed chords */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { borderColor }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textStrong }]}>
              {t("finder.modalInterchange.sectionTitle")}
            </Text>
          </View>
          <View style={styles.chipsRow}>
            {borrowedChords.map((chord) => (
              <TouchableOpacity
                key={`${chord.degreeLabel}-${chord.rootIndex}`}
                testID={`mi-chip-${chord.degreeLabel}`}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPendingChord(chord);
                }}
                style={[styles.chip, { backgroundColor: colors.surface2 }]}
              >
                <Text style={[styles.chipDegree, { color: colors.textSubtle }]}>
                  {chord.degreeLabel}
                </Text>
                <Text style={[styles.chipChordName, { color: colors.textStrong }]}>
                  {chordDisplayName(chord.rootIndex, chord.chordType, notes)}
                </Text>
                <Text style={[styles.chipSource, { color: colors.textSubtle }]}>
                  {t("finder.modalInterchange.borrowedFrom", { mode: chord.sourceMode })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <FinderDetailSheet
        visible={pendingChord !== null}
        onClose={() => setPendingChord(null)}
        theme={theme}
        title={
          pendingChord
            ? chordDisplayName(pendingChord.rootIndex, pendingChord.chordType, notes)
            : ""
        }
        topContent={
          pendingChord ? (
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: colors.surface }]}>
                <Text style={[styles.badgeLabel, { color: colors.textSubtle }]}>
                  {pendingChord.degreeLabel}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.surface }]}>
                <Text style={[styles.badgeLabel, { color: colors.textSubtle }]}>
                  {t("finder.modalInterchange.borrowedFrom", { mode: pendingChord.sourceMode })}
                </Text>
              </View>
            </View>
          ) : null
        }
        mediaContent={
          pendingChord &&
          getAllChordForms(pendingChord.rootIndex, pendingChord.chordType).length > 0 ? (
            <View style={styles.formsRow}>
              {getAllChordForms(pendingChord.rootIndex, pendingChord.chordType).map((cells, fi) => (
                <ChordDiagram
                  key={fi}
                  cells={cells}
                  rootIndex={pendingChord.rootIndex}
                  theme={theme}
                  width={formWidth}
                />
              ))}
            </View>
          ) : null
        }
        description={
          pendingTmpLayer ? (
            <LayerDescription theme={theme} layer={pendingTmpLayer} itemOnly />
          ) : null
        }
        isFull={isFull}
        onAddLayer={
          pendingChord ? () => handleAdd(pendingChord.rootIndex, pendingChord.chordType) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  keyRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  keyControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  scrollContent: {
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
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 64,
    gap: 2,
  },
  chipDegree: {
    fontSize: 10,
    fontWeight: "600",
  },
  chipChordName: {
    fontSize: 14,
    fontWeight: "700",
  },
  chipSource: {
    fontSize: 9,
    fontWeight: "500",
    opacity: 0.8,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  formsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
