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
import { getRootIndex, getNotesByAccidental, CHORD_SUFFIX_MAP } from "../../../lib/fretboard";
import {
  getSubstitutions,
  SUBSTITUTION_CHORD_TYPES,
  SUBSTITUTION_CHORD_LABELS,
  type SubstitutionType,
} from "../../../lib/substitutions";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import NotePill from "../../../components/ui/NotePill";
import FinderDetailSheet from "../../../components/ui/FinderDetailSheet";

interface SubstitutionFinderProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

type PendingSubstitution = {
  type: SubstitutionType;
  rootIndex: number;
  chordType: ChordType;
};

export default function SubstitutionFinder({
  theme,
  accidental,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: SubstitutionFinderProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [rootNote, setRootNote] = useState("C");
  const [selectedChordType, setSelectedChordType] = useState<ChordType>("Major");
  const [pendingSub, setPendingSub] = useState<PendingSubstitution | null>(null);
  const rootIndex = getRootIndex(rootNote);
  const notes = getNotesByAccidental(accidental);
  const isFull = layers.length >= MAX_LAYERS;
  const borderColor = isDark ? colors.border : colors.border2;

  const FORM_GAP = 8;
  const formWidth = Math.floor((screenWidth - 32 - FORM_GAP * 2) / 3);

  const sourceChordName = `${rootNote}${CHORD_SUFFIX_MAP[selectedChordType] ?? ""}`;
  const sourceForms = useMemo(
    () => getAllChordForms(rootIndex, selectedChordType),
    [rootIndex, selectedChordType],
  );

  const substitutions = useMemo(
    () => getSubstitutions(rootIndex, selectedChordType),
    [rootIndex, selectedChordType],
  );

  const handleAdd = useCallback(
    (subRootIndex: number, subChordType: ChordType) => {
      if (isFull) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const color = pickNextLayerColor(layers);
      const layer = createDefaultLayer("chord", `layer-${Date.now()}`, color);
      layer.chordDisplayMode = "form";
      layer.chordType = subChordType;
      if (notes[subRootIndex] !== globalRootNote) {
        layer.layerRoot = notes[subRootIndex];
      }
      if (rootNote !== globalRootNote) {
        onEnablePerLayerRoot?.();
      }
      onAddLayerAndNavigate(layer);
    },
    [isFull, layers, notes, globalRootNote, onAddLayerAndNavigate, onEnablePerLayerRoot],
  );

  const subTypeLabel = (type: SubstitutionType): string => {
    if (type === "diatonic") return t("finder.substitution.diatonic");
    return t("finder.substitution.tritone");
  };

  const pendingSubData = useMemo(() => {
    if (!pendingSub) return null;
    const subRootName = notes[pendingSub.rootIndex];
    const subChordName = `${subRootName}${CHORD_SUFFIX_MAP[pendingSub.chordType] ?? ""}`;
    const forms = getAllChordForms(pendingSub.rootIndex, pendingSub.chordType);
    const descKey =
      pendingSub.type === "diatonic"
        ? "finder.substitution.diatonicDesc"
        : "finder.substitution.tritoneDesc";
    return { subChordName, forms, descKey };
  }, [pendingSub, notes]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      {/* Root picker */}
      <View style={[styles.rootRow, { borderBottomColor: borderColor }]}>
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
      </View>

      {/* Chord type chips */}
      <View style={[styles.chipsRow, { borderBottomColor: borderColor }]}>
        {SUBSTITUTION_CHORD_TYPES.map((ct) => (
          <NotePill
            key={ct}
            label={SUBSTITUTION_CHORD_LABELS[ct] ?? ct}
            selected={selectedChordType === ct}
            activeBg={colors.chipSelectedBg}
            activeText={colors.chipSelectedText}
            inactiveBg={colors.chipUnselectedBg}
            inactiveText={colors.text}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedChordType(ct);
            }}
          />
        ))}
      </View>

      {/* Results */}
      <ScrollView
        contentContainerStyle={[styles.resultContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.sourceSection, { borderColor }]}>
          <Text style={[styles.sourceChordName, { color: colors.textStrong }]}>
            {sourceChordName}
          </Text>
          {sourceForms.length > 0 && (
            <View style={styles.cardFormsRow}>
              {sourceForms.map((cells, fi) => (
                <ChordDiagram
                  key={fi}
                  cells={cells}
                  rootIndex={rootIndex}
                  theme={theme}
                  width={formWidth}
                />
              ))}
            </View>
          )}
        </View>

        <Text style={[styles.sourceLabel, { color: colors.textSubtle }]}>
          {t("finder.substitution.sourceLabel", { chord: sourceChordName })}
        </Text>

        {substitutions.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
            {t("finder.substitution.none")}
          </Text>
        ) : (
          substitutions.map((sub) => {
            const subRootName = notes[sub.rootIndex];
            const subChordName = `${subRootName}${CHORD_SUFFIX_MAP[sub.chordType] ?? ""}`;
            const subForms = getAllChordForms(sub.rootIndex, sub.chordType);

            return (
              <TouchableOpacity
                key={`${sub.type}-${sub.rootIndex}`}
                style={[styles.subSection, { borderColor }]}
                testID={`sub-section-${sub.type}-${sub.rootIndex}`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPendingSub({
                    type: sub.type,
                    rootIndex: sub.rootIndex,
                    chordType: sub.chordType,
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.subHeader}>
                  <View style={[styles.typeBadge, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.typeLabel, { color: colors.textSubtle }]}>
                      {subTypeLabel(sub.type)}
                    </Text>
                  </View>
                  <Text style={[styles.subChordName, { color: colors.textStrong }]}>
                    {subChordName}
                  </Text>
                </View>
                {subForms.length > 0 && (
                  <View style={styles.cardFormsRow}>
                    {subForms.map((cells, fi) => (
                      <ChordDiagram
                        key={fi}
                        cells={cells}
                        rootIndex={sub.rootIndex}
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
        visible={pendingSub !== null}
        onClose={() => setPendingSub(null)}
        theme={theme}
        title={pendingSubData?.subChordName ?? ""}
        mediaContent={
          pendingSub && pendingSubData && pendingSubData.forms.length > 0 ? (
            <View style={styles.modalDiagrams}>
              {pendingSubData.forms.map((cells, fi) => (
                <ChordDiagram
                  key={fi}
                  cells={cells}
                  rootIndex={pendingSub.rootIndex}
                  theme={theme}
                  width={formWidth}
                />
              ))}
            </View>
          ) : null
        }
        description={
          pendingSub && pendingSubData ? (
            <>
              <Text style={[styles.functionLabel, { color: colors.textStrong }]}>
                {subTypeLabel(pendingSub.type)}
              </Text>
              <Text style={[styles.functionDesc, { color: colors.textSubtle }]}>
                {t(pendingSubData.descKey)}
              </Text>
            </>
          ) : null
        }
        isFull={isFull}
        onAddLayer={
          pendingSub ? () => handleAdd(pendingSub.rootIndex, pendingSub.chordType) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  sourceSection: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  sourceChordName: {
    fontSize: 17,
    fontWeight: "700",
  },
  sourceLabel: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 32,
  },
  subSection: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  subChordName: {
    fontSize: 17,
    fontWeight: "700",
  },
  cardFormsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  modalDiagrams: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
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
});
