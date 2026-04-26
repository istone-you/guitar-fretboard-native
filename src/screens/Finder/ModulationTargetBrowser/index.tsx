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
  getRelatedKeys,
  getPivotChords,
  getDiatonicChordList,
  getChromaticMediants,
  getEnharmonicModulations,
  getModalModulations,
  chordDisplayName,
  type KeyType,
  type ChromaticMediantRelation,
} from "../../../lib/harmonyUtils";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import FinderDetailSheet from "../../../components/ui/FinderDetailSheet";
import LayerDescription from "../../../components/LayerEditModal/LayerDescription";

const RELATION_I18N: Record<ChromaticMediantRelation, string> = {
  M3up: "finder.modulation.relation.M3up",
  m3up: "finder.modulation.relation.m3up",
  M3down: "finder.modulation.relation.M3down",
  m3down: "finder.modulation.relation.m3down",
};

const MODE_I18N: Record<string, string> = {
  ionian: "options.scale.ionian",
  dorian: "options.scale.dorian",
  phrygian: "options.scale.phrygian",
  lydian: "options.scale.lydian",
  mixolydian: "options.scale.mixolydian",
  aeolian: "options.scale.aeolian",
  locrian: "options.scale.locrian",
};

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
}

export default function ModulationTargetBrowser({
  theme,
  accidental,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: ModulationTargetBrowserProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [rootNote, setRootNote] = useState("C");
  const [keyType, setKeyType] = useState<KeyType>("major");
  const [pendingChord, setPendingChord] = useState<PendingChord | null>(null);

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

  const chromaticMediants = useMemo(
    () => getChromaticMediants(rootIndex, keyType),
    [rootIndex, keyType],
  );
  const enharmonicMods = useMemo(
    () => getEnharmonicModulations(rootIndex, keyType),
    [rootIndex, keyType],
  );
  const modalMods = useMemo(() => getModalModulations(rootIndex, keyType), [rootIndex, keyType]);

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

  const keyName = (rIndex: number, kt: KeyType) =>
    `${notes[rIndex]} ${kt === "major" ? "Major" : "Minor"}`;

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

      <ScrollView
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 近親調 */}
        <Text style={[styles.bigSectionHeader, { color: colors.textSubtle }]}>
          {t("finder.modulationTarget.sectionNear")}
        </Text>
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

        {/* 遠隔調 */}
        <Text style={[styles.bigSectionHeader, { color: colors.textSubtle }]}>
          {t("finder.modulationTarget.sectionFar")}
        </Text>

        <View style={styles.sectionGroup}>
          <Text style={[styles.sectionSubHeader, { color: colors.textSubtle }]}>
            {t("finder.modulation.sectionChromatic")}
          </Text>
          {chromaticMediants.map((c, i) => (
            <View
              key={i}
              testID={`chromatic-${c.rootIndex}-${c.keyType}`}
              style={[styles.chordRow, { borderColor, backgroundColor: colors.surface }]}
            >
              <View style={styles.chordLeft}>
                <Text style={[styles.chordName, { color: colors.textStrong }]}>
                  {keyName(c.rootIndex, c.keyType)}
                </Text>
                <Text style={[styles.chordDegree, { color: colors.textSubtle }]}>
                  {t(RELATION_I18N[c.relation])}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionGroup}>
          <Text style={[styles.sectionSubHeader, { color: colors.textSubtle }]}>
            {t("finder.modulation.sectionEnharmonic")}
          </Text>
          {enharmonicMods.map((e, i) => (
            <View
              key={i}
              testID={`enharmonic-${e.destRootIndex}`}
              style={[styles.chordRow, { borderColor, backgroundColor: colors.surface }]}
            >
              <View style={styles.chordLeft}>
                <Text style={[styles.chordName, { color: colors.textStrong }]}>
                  {keyName(e.destRootIndex, e.destKeyType)}
                </Text>
                <Text style={[styles.chordDegree, { color: colors.textSubtle }]}>
                  {t("finder.modulation.viaChord", {
                    chord: `${notes[e.pivotRootIndex]}dim7`,
                  })}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionGroup}>
          <Text style={[styles.sectionSubHeader, { color: colors.textSubtle }]}>
            {t("finder.modulation.sectionModal")}
          </Text>
          {modalMods.map((m, i) => (
            <View
              key={i}
              testID={`modal-${m.modeName}`}
              style={[styles.chordRow, { borderColor, backgroundColor: colors.surface }]}
            >
              <View style={styles.chordLeft}>
                <Text style={[styles.chordName, { color: colors.textStrong }]}>
                  {`${notes[m.rootIndex]} ${t(MODE_I18N[m.modeName] ?? m.modeName)}`}
                </Text>
              </View>
            </View>
          ))}
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  bigSectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
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
  sectionGroup: {
    gap: 8,
    marginTop: 4,
  },
  sectionSubHeader: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
