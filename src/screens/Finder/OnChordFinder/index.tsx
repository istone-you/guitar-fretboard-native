import { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../../i18n";
import type { Accidental, Theme, LayerConfig } from "../../../types";
import { createDefaultLayer, MAX_LAYERS } from "../../../types";
import { getColors, pickNextLayerColor, BLACK } from "../../../themes/design";
import {
  ON_CHORD_LIST,
  parseOnChord,
  getOnChordVoicings,
  getOnChordListForRoot,
  getRootIndex,
  CHORD_SUFFIX_MAP,
} from "../../../lib/fretboard";
import ChordDiagram from "../../../components/ui/ChordDiagram";
import { useChordDiagramWidth } from "../../../hooks/useChordDiagramWidth";
import FinderChordPicker from "../../../components/ui/FinderChordPicker";
import FinderDetailSheet from "../../../components/ui/FinderDetailSheet";
import LayerDescription from "../../../components/LayerEditModal/LayerDescription";
import Icon from "../../../components/ui/Icon";

interface OnChordFinderProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

const TYPE_ORDER = [
  "Major",
  "Minor",
  "7th",
  "maj7",
  "m7",
  "m(maj7)",
  "m6",
  "6",
  "dim",
  "dim7",
  "aug",
  "sus4",
  "add9",
  "7sus4",
];

function typeLabel(chordType: string): string {
  if (chordType === "Major") return "M";
  return CHORD_SUFFIX_MAP[chordType as keyof typeof CHORD_SUFFIX_MAP] ?? chordType;
}

const ALL_TYPES: string[] = (() => {
  const found = new Set<string>();
  for (const name of ON_CHORD_LIST) {
    const p = parseOnChord(name);
    if (p) found.add(p.chordType);
  }
  return TYPE_ORDER.filter((t) => found.has(t));
})();

export default function OnChordFinder({
  theme,
  accidental,
  layers,
  onAddLayerAndNavigate,
}: OnChordFinderProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const borderColor = isDark ? colors.border : colors.border2;
  const isFull = layers.length >= MAX_LAYERS;
  const formWidth = useChordDiagramWidth();

  const [chordRoot, setChordRoot] = useState("C");
  const [selectedType, setSelectedType] = useState<string>(ALL_TYPES[0] ?? "Major");
  const [selectedOnChord, setSelectedOnChord] = useState<string | null>(null);

  const byRoot = useMemo(() => getOnChordListForRoot(chordRoot), [chordRoot]);

  const availableTypesForRoot = useMemo(() => {
    const types = new Set<string>();
    for (const name of byRoot) {
      const p = parseOnChord(name);
      if (p) types.add(p.chordType);
    }
    return types;
  }, [byRoot]);

  const effectiveType = useMemo(() => {
    if (availableTypesForRoot.has(selectedType)) return selectedType;
    return ALL_TYPES.find((t) => availableTypesForRoot.has(t)) ?? null;
  }, [selectedType, availableTypesForRoot]);

  const filtered = useMemo(() => {
    if (effectiveType === null) return byRoot;
    return byRoot.filter((name) => {
      const p = parseOnChord(name);
      return p?.chordType === effectiveType;
    });
  }, [byRoot, effectiveType]);

  const chordRootIndex = getRootIndex(chordRoot);

  const tmpLayer = useMemo(() => {
    if (!selectedOnChord) return null;
    const layer = createDefaultLayer("chord", "on-chord-tmp", BLACK);
    layer.chordDisplayMode = "on-chord";
    layer.onChordName = selectedOnChord;
    return layer;
  }, [selectedOnChord]);

  const voicings = useMemo(
    () => (selectedOnChord ? getOnChordVoicings(selectedOnChord) : []),
    [selectedOnChord],
  );

  const handleAdd = useCallback(() => {
    if (isFull || !selectedOnChord) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const color = pickNextLayerColor(layers);
    const layer = createDefaultLayer("chord", `layer-${Date.now()}`, color);
    layer.chordDisplayMode = "on-chord";
    layer.onChordName = selectedOnChord;
    onAddLayerAndNavigate(layer);
    setSelectedOnChord(null);
  }, [isFull, selectedOnChord, layers, onAddLayerAndNavigate]);

  return (
    <View style={[styles.root, { backgroundColor: colors.pageBg }]}>
      <FinderChordPicker
        theme={theme}
        accidental={accidental}
        rootNote={chordRoot}
        onRootChange={setChordRoot}
        chordTypes={ALL_TYPES.filter((t) => availableTypesForRoot.has(t)).map((ct) => ({
          value: ct,
          label: typeLabel(ct),
        }))}
        selectedChordType={effectiveType ?? ""}
        onChordTypeChange={setSelectedType}
        borderColor={borderColor}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
            {t("finder.onChord.none", "該当するオンコードがありません")}
          </Text>
        ) : (
          filtered.map((name) => {
            const parsed = parseOnChord(name);
            const cardVoicings = getOnChordVoicings(name);
            return (
              <TouchableOpacity
                key={name}
                testID={`on-chord-card-${name}`}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedOnChord(name);
                }}
                style={[styles.sourceCard, { borderColor }]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.chordNameText, { color: colors.textStrong }]}>{name}</Text>
                  {parsed && (
                    <View style={[styles.bassBadge, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.bassLabel, { color: colors.textSubtle }]}>
                        {t("finder.onChord.bassNote", "ベース音")} {parsed.bassNote}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }} />
                  <Icon name="chevron-right" size={14} color={colors.textSubtle} />
                </View>
                {cardVoicings.length > 0 && (
                  <View style={styles.cardFormsRow}>
                    {cardVoicings.map((cells, fi) => (
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
            );
          })
        )}
      </ScrollView>

      <FinderDetailSheet
        visible={selectedOnChord !== null}
        onClose={() => setSelectedOnChord(null)}
        theme={theme}
        title={selectedOnChord ?? ""}
        subtitle={
          selectedOnChord
            ? `${t("finder.onChord.bassNote", "ベース音")} ${parseOnChord(selectedOnChord)?.bassNote ?? ""}`
            : ""
        }
        mediaContent={
          voicings.length > 0 ? (
            <View style={styles.modalDiagrams}>
              {voicings.map((cells, fi) => (
                <ChordDiagram
                  key={fi}
                  cells={cells}
                  rootIndex={chordRootIndex}
                  theme={theme}
                  width={formWidth}
                />
              ))}
            </View>
          ) : null
        }
        description={tmpLayer ? <LayerDescription theme={theme} layer={tmpLayer} /> : null}
        isFull={isFull}
        onAddLayer={handleAdd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  sourceCard: {
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chordNameText: {
    fontSize: 17,
    fontWeight: "700",
  },
  bassBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderCurve: "continuous",
  },
  bassLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardFormsRow: {
    flexDirection: "row",
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: "italic",
    paddingTop: 8,
  },
  modalDiagrams: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
