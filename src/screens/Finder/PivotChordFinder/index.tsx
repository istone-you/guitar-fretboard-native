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
  getPivotChords,
  getDiatonicChordList,
  chordDisplayName,
  type KeyType,
} from "../../../lib/harmonyUtils";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import FinderDetailSheet from "../../../components/ui/FinderDetailSheet";
import LayerDescription from "../../../components/LayerEditModal/LayerDescription";

interface PivotChordFinderProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

export default function PivotChordFinder({
  theme,
  accidental,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: PivotChordFinderProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

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

  const pendingTmpLayer = useMemo(() => {
    if (!pendingChord) return null;
    const layer = createDefaultLayer("chord", "pivot-chord-tmp", BLACK);
    layer.chordDisplayMode = "form";
    layer.chordType = pendingChord.chordType;
    return layer;
  }, [pendingChord]);

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
          {t("finder.pivotChord.keyA")}
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
            label={t("header.key")}
            sheetTitle={t("header.key")}
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
          {t("finder.pivotChord.keyB")}
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
            label={t("header.key")}
            sheetTitle={t("header.key")}
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
              {t("finder.pivotChord.none")}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
