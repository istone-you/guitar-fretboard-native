import { useState, useMemo, useCallback, useRef } from "react";
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
import { getColors, pickNextLayerColor, RELATED_KEY_COLORS, BLACK } from "../../../themes/design";
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
import PillButton from "../../../components/ui/PillButton";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import FinderDetailSheet from "../../../components/ui/FinderDetailSheet";
import LayerDescription from "../../../components/LayerEditModal/LayerDescription";
import Icon from "../../../components/ui/Icon";

type PendingChord = {
  rootIndex: number;
  chordType: ChordType;
  degreeInBase?: string;
  baseKeyName: string;
  degreeInRelated: string;
  relatedKeyName: string;
};

interface ModulationTargetBrowserProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
  onOpenCircle?: (rootSemitone: number, keyType: "major" | "minor") => void;
}

export default function ModulationTargetBrowser({
  theme,
  accidental,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
  onOpenCircle,
}: ModulationTargetBrowserProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [rootNote, setRootNote] = useState("C");
  const [keyType, setKeyType] = useState<KeyType>("major");
  const [pendingChord, setPendingChord] = useState<PendingChord | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionYRef = useRef<Partial<Record<string, number>>>({});

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

  const pendingTmpLayer = useMemo(() => {
    if (!pendingChord) return null;
    const layer = createDefaultLayer("chord", "modulation-target-tmp", BLACK);
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

  const handleOpenCircle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpenCircle?.(rootIndex, keyType);
  }, [rootIndex, keyType, onOpenCircle]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View style={[styles.controlRow, { borderBottomColor: borderColor }]}>
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
      <View style={[styles.circleRow, { borderBottomColor: borderColor }]}>
        <PillButton isDark={isDark} onPress={handleOpenCircle}>
          <Text style={[styles.circleLabel, { color: colors.textStrong }]}>
            {t("finder.viewOnCircle")}
          </Text>
        </PillButton>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View testID="related-keys-summary" style={styles.summaryContainer}>
          {sections.map(({ rk }) => {
            const shortKeyName = `${notes[rk.rootIndex]}${rk.keyType === "minor" ? "m" : ""}`;
            const relLabel = t(
              `finder.relatedKeys.relation.${rk.relation}.${keyType}.${rk.keyType}`,
            );
            return (
              <TouchableOpacity
                key={rk.relation}
                activeOpacity={0.7}
                style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const y = sectionYRef.current[rk.relation];
                  if (y !== undefined) {
                    scrollViewRef.current?.scrollTo({ y, animated: true });
                  }
                }}
              >
                <Text style={[styles.summaryRelLabel, { color: colors.textSubtle }]}>
                  {relLabel}
                </Text>
                <Text style={[styles.summaryKeyName, { color: colors.textStrong }]}>
                  {shortKeyName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {sections.map(({ rk, diatonic, pivots, pivotSet }) => {
          const relKeyName = keyLabel(rk.rootIndex, rk.keyType);
          const relLabel = t(`finder.relatedKeys.relation.${rk.relation}.${keyType}.${rk.keyType}`);

          return (
            <View
              key={`${rk.relation}-${rk.rootIndex}`}
              testID={`related-section-${rk.relation}`}
              style={styles.sectionGroup}
              onLayout={(e) => {
                sectionYRef.current[rk.relation] = e.nativeEvent.layout.y;
              }}
            >
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeader, { color: colors.textSubtle }]}>{relLabel}</Text>
                <Text style={[styles.sectionKeyName, { color: colors.textStrong }]}>
                  {relKeyName}
                </Text>
              </View>
              {diatonic.map((c) => {
                const key = `${c.rootIndex}-${c.chordType}`;
                const isPivot = pivotSet.has(key);
                const pivot = pivots.find((p) => `${p.rootIndex}-${p.chordType}` === key);
                return (
                  <TouchableOpacity
                    key={c.degree}
                    testID={`related-chord-${rk.relation}-${c.degree}`}
                    style={[
                      styles.chordRow,
                      {
                        borderColor,
                        backgroundColor: colors.surface,
                        borderLeftWidth: isPivot ? 3 : StyleSheet.hairlineWidth,
                        borderLeftColor: isPivot ? RELATED_KEY_COLORS.subdominant : borderColor,
                      },
                    ]}
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
                  >
                    <View style={styles.chordLeft}>
                      <Text style={[styles.chordName, { color: colors.textStrong }]}>
                        {chordDisplayName(c.rootIndex, c.chordType, notes)}
                      </Text>
                      <Text style={[styles.chordDegree, { color: colors.textSubtle }]}>
                        {c.degreeLabel}
                      </Text>
                    </View>
                    {isPivot && (
                      <Text style={[styles.pivotBadge, { color: RELATED_KEY_COLORS.subdominant }]}>
                        {t("finder.relatedKeys.pivot")}
                      </Text>
                    )}
                    <Icon name="chevron-right" size={14} color={colors.textSubtle} />
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
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
  controlRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  circleRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  circleLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  summaryContainer: {
    flexDirection: "row",
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    borderRadius: 10,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  summaryRelLabel: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  summaryKeyName: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  sectionGroup: {
    gap: 8,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionKeyName: {
    fontSize: 15,
    fontWeight: "700",
  },
  chordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  chordLeft: {
    flex: 1,
    gap: 2,
  },
  chordName: {
    fontSize: 14,
    fontWeight: "700",
  },
  chordDegree: {
    fontSize: 11,
    fontWeight: "500",
  },
  pivotBadge: {
    fontSize: 11,
    fontWeight: "700",
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
    borderCurve: "continuous",
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
