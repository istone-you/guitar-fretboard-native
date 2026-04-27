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
  type KeyType,
  type SubstitutionType,
} from "../../../lib/substitutions";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import NotePill from "../../../components/ui/NotePill";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
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

const KEY_TYPE_OPTIONS: { value: KeyType; label: string }[] = [
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
];

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

  const [keyRoot, setKeyRoot] = useState("C");
  const [keyType, setKeyType] = useState<KeyType>("major");
  const [rootNote, setRootNote] = useState("C");
  const [selectedChordType, setSelectedChordType] = useState<ChordType>("Major");
  const [pendingSub, setPendingSub] = useState<PendingSubstitution | null>(null);
  const [sourceDetailVisible, setSourceDetailVisible] = useState(false);

  const keyRootIndex = getRootIndex(keyRoot);
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
    () => getSubstitutions(keyRootIndex, keyType, rootIndex, selectedChordType),
    [keyRootIndex, keyType, rootIndex, selectedChordType],
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
    if (type === "tonic") return t("finder.substitution.tonic");
    if (type === "subdominant") return t("finder.substitution.subdominant");
    return t("finder.substitution.dominant");
  };

  const descKeyMap: Record<SubstitutionType, string> = {
    tonic: "finder.substitution.tonicDesc",
    subdominant: "finder.substitution.subdominantDesc",
    dominant: "finder.substitution.dominantDesc",
  };

  const pendingSubData = useMemo(() => {
    if (!pendingSub) return null;
    const subRootName = notes[pendingSub.rootIndex];
    const subChordName = `${subRootName}${CHORD_SUFFIX_MAP[pendingSub.chordType] ?? ""}`;
    const forms = getAllChordForms(pendingSub.rootIndex, pendingSub.chordType);
    const descKey = descKeyMap[pendingSub.type];
    return { subChordName, forms, descKey };
  }, [pendingSub, notes]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      {/* Key picker */}
      <View style={[styles.pickerRow, { borderBottomColor: borderColor }]}>
        <View style={styles.keyRow}>
          <NotePickerButton
            theme={theme}
            accidental={accidental}
            value={keyRoot}
            onChange={(note) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setKeyRoot(note);
            }}
            label={t("finder.substitution.keyRoot")}
            sheetTitle={t("finder.substitution.keyRoot")}
          />
          <SegmentedToggle
            theme={theme}
            value={keyType}
            onChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setKeyType(v as KeyType);
            }}
            options={KEY_TYPE_OPTIONS}
            size="compact"
          />
        </View>
      </View>

      {/* Chord root picker */}
      <View style={[styles.pickerRow, { borderBottomColor: borderColor }]}>
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
        <View style={styles.chipsRow}>
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
      </View>

      {/* Results */}
      <ScrollView
        contentContainerStyle={[styles.resultContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[styles.sourceSection, { borderColor }]}
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSourceDetailVisible(true);
          }}
        >
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
        </TouchableOpacity>

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

      <FinderDetailSheet
        visible={sourceDetailVisible}
        onClose={() => setSourceDetailVisible(false)}
        theme={theme}
        title={sourceChordName}
        mediaContent={
          sourceForms.length > 0 ? (
            <View style={styles.modalDiagrams}>
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
          ) : null
        }
        isFull={isFull}
        onAddLayer={() => handleAdd(rootIndex, selectedChordType)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pickerRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
    alignItems: "center",
  },
  keyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  resultContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  sourceSection: {
    borderRadius: 16,
    borderCurve: "continuous",
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
    borderCurve: "continuous",
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
    borderCurve: "continuous",
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
