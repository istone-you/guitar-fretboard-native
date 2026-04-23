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
import {
  getColors,
  DIATONIC_FUNCTION_COLORS,
  WHITE,
  BLACK,
  pickNextLayerColor,
} from "../../../themes/design";
import { getRootIndex, getNotesByAccidental, CHORD_SUFFIX_MAP } from "../../../lib/fretboard";
import { getVoiceLeading } from "../../../lib/harmonyUtils";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import LayerDescription from "../../../components/LayerEditModal/LayerDescription";
import NotePill from "../../../components/ui/NotePill";
import FinderDetailSheet from "../../../components/ui/FinderDetailSheet";

interface VoiceLeadingFinderProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

const CHORD_TYPES: ChordType[] = ["Major", "Minor", "7th", "maj7", "m7", "dim"];
const CHORD_TYPE_LABELS: Partial<Record<ChordType, string>> = {
  Major: "M",
  Minor: "m",
  "7th": "7",
  maj7: "maj7",
  m7: "m7",
  dim: "dim",
};

const INTERVAL_NAMES: Record<number, string> = {
  0: "R",
  1: "b2",
  2: "2",
  3: "b3",
  4: "3",
  5: "4",
  6: "b5",
  7: "5",
  8: "b6",
  9: "6",
  10: "b7",
  11: "7",
};

function movementActiveBg(semitones: number): string | null {
  const abs = Math.abs(semitones);
  if (abs === 1) return DIATONIC_FUNCTION_COLORS.D;
  if (abs === 2) return DIATONIC_FUNCTION_COLORS.SD;
  return null;
}

export default function VoiceLeadingFinder({
  theme,
  accidental,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: VoiceLeadingFinderProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const borderColor = isDark ? colors.border : colors.border2;
  const notes = getNotesByAccidental(accidental);
  const isFull = layers.length >= MAX_LAYERS;

  const FORM_GAP = 8;
  const formWidth = Math.floor((screenWidth - 32 - FORM_GAP * 2) / 3);

  const [rootA, setRootA] = useState("C");
  const [chordTypeA, setChordTypeA] = useState<ChordType>("Major");
  const [rootB, setRootB] = useState("G");
  const [chordTypeB, setChordTypeB] = useState<ChordType>("Major");
  const [sheetOpen, setSheetOpen] = useState(false);

  const rootAIndex = getRootIndex(rootA);
  const rootBIndex = getRootIndex(rootB);
  const chordNameA = `${rootA}${CHORD_SUFFIX_MAP[chordTypeA] ?? ""}`;
  const chordNameB = `${rootB}${CHORD_SUFFIX_MAP[chordTypeB] ?? ""}`;

  const result = useMemo(
    () => getVoiceLeading(rootAIndex, chordTypeA, rootBIndex, chordTypeB),
    [rootAIndex, chordTypeA, rootBIndex, chordTypeB],
  );

  const formsB = useMemo(() => getAllChordForms(rootBIndex, chordTypeB), [rootBIndex, chordTypeB]);

  const tmpLayerB = useMemo(() => {
    const layer = createDefaultLayer("chord", "vl-tmp", BLACK);
    layer.chordDisplayMode = "form";
    layer.chordType = chordTypeB;
    return layer;
  }, [chordTypeB]);

  const movementLabel = (semitones: number): string => {
    const abs = Math.abs(semitones);
    if (abs === 1) return semitones > 0 ? "半音↑" : "半音↓";
    if (abs === 2) return semitones > 0 ? "全音↑" : "全音↓";
    return semitones > 0 ? `${abs}半音↑` : `${abs}半音↓`;
  };

  const handleAdd = useCallback(() => {
    if (isFull) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const color = pickNextLayerColor(layers);
    const layer = createDefaultLayer("chord", `layer-${Date.now()}`, color);
    layer.chordDisplayMode = "form";
    layer.chordType = chordTypeB;
    if (notes[rootBIndex] !== globalRootNote) {
      layer.layerRoot = notes[rootBIndex];
      onEnablePerLayerRoot?.();
    }
    onAddLayerAndNavigate(layer);
  }, [
    isFull,
    layers,
    chordTypeB,
    rootBIndex,
    notes,
    globalRootNote,
    onAddLayerAndNavigate,
    onEnablePerLayerRoot,
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      {/* Chord A: section label + picker */}
      <View style={[styles.keyRow, { borderBottomColor: borderColor }]}>
        <Text style={[styles.keyLabel, { color: colors.textSubtle }]}>
          {t("finder.voiceLeading.from")}
        </Text>
        <View style={styles.keyControls}>
          <NotePickerButton
            theme={theme}
            accidental={accidental}
            value={rootA}
            onChange={(n) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setRootA(n);
            }}
            label={t("finder.voiceLeading.chord", "コード")}
            sheetTitle={t("finder.voiceLeading.chord", "コード")}
          />
          <View style={styles.chipsRow}>
            {CHORD_TYPES.map((ct) => (
              <NotePill
                key={ct}
                label={CHORD_TYPE_LABELS[ct] ?? ct}
                selected={chordTypeA === ct}
                activeBg={colors.chipSelectedBg}
                activeText={colors.chipSelectedText}
                inactiveBg={colors.chipUnselectedBg}
                inactiveText={colors.text}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setChordTypeA(ct);
                }}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Chord B: section label + picker */}
      <View style={[styles.keyRow, { borderBottomColor: borderColor }]}>
        <Text style={[styles.keyLabel, { color: colors.textSubtle }]}>
          {t("finder.voiceLeading.to")}
        </Text>
        <View style={styles.keyControls}>
          <NotePickerButton
            theme={theme}
            accidental={accidental}
            value={rootB}
            onChange={(n) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setRootB(n);
            }}
            label={t("finder.voiceLeading.chord", "コード")}
            sheetTitle={t("finder.voiceLeading.chord", "コード")}
          />
          <View style={styles.chipsRow}>
            {CHORD_TYPES.map((ct) => (
              <NotePill
                key={ct}
                label={CHORD_TYPE_LABELS[ct] ?? ct}
                selected={chordTypeB === ct}
                activeBg={colors.chipSelectedBg}
                activeText={colors.chipSelectedText}
                inactiveBg={colors.chipUnselectedBg}
                inactiveText={colors.text}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setChordTypeB(ct);
                }}
              />
            ))}
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Result header */}
        <View style={styles.headerRow}>
          <Text style={[styles.chordNameText, { color: colors.textStrong }]}>{chordNameA}</Text>
          <Text style={[styles.arrow, { color: colors.textSubtle }]}>→</Text>
          <Text style={[styles.chordNameText, { color: colors.textStrong }]}>{chordNameB}</Text>
        </View>

        {/* Common tones */}
        {result.commonTones.length > 0 && (
          <View style={[styles.card, { borderColor }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSubtle }]}>
              {t("finder.voiceLeading.commonTones", "コモントーン")}
            </Text>
            <View style={styles.pillsRow}>
              {result.commonTones.map((noteIdx) => {
                const interval = (noteIdx - rootAIndex + 12) % 12;
                return (
                  <View key={noteIdx} testID={`common-tone-${noteIdx}`}>
                    <NotePill
                      label={`${notes[noteIdx]} (${INTERVAL_NAMES[interval] ?? interval})`}
                      selected={true}
                      activeBg={DIATONIC_FUNCTION_COLORS.T}
                      activeText={WHITE}
                      inactiveBg={colors.chipUnselectedBg}
                      inactiveText={colors.text}
                      onPress={() => {}}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Voice movements */}
        {result.movements.length > 0 && (
          <View style={[styles.card, { borderColor }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSubtle }]}>
              {t("finder.voiceLeading.movements", "声部移動")}
            </Text>
            {result.movements.map((move, i) => {
              const bg = movementActiveBg(move.semitones);
              return (
                <View key={i} testID={`movement-row-${i}`} style={styles.movementRow}>
                  <NotePill
                    label={notes[move.from]}
                    selected={bg !== null}
                    activeBg={bg ?? colors.chipUnselectedBg}
                    activeText={WHITE}
                    inactiveBg={colors.chipUnselectedBg}
                    inactiveText={colors.text}
                    onPress={() => {}}
                  />
                  <View style={[styles.typeBadge, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.typeLabel, { color: colors.textSubtle }]}>
                      {movementLabel(move.semitones)}
                    </Text>
                  </View>
                  <NotePill
                    label={notes[move.to]}
                    selected={bg !== null}
                    activeBg={bg ?? colors.chipUnselectedBg}
                    activeText={WHITE}
                    inactiveBg={colors.chipUnselectedBg}
                    inactiveText={colors.text}
                    onPress={() => {}}
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* Chord A notes breakdown */}
        <View style={[styles.card, { borderColor }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSubtle }]}>
            {`${chordNameA} の構成音`}
          </Text>
          <View style={styles.pillsRow}>
            {result.notesA.map((noteIdx) => {
              const interval = (noteIdx - rootAIndex + 12) % 12;
              const isCommon = result.commonTones.includes(noteIdx);
              return (
                <View key={noteIdx} testID={`note-a-${noteIdx}`}>
                  <NotePill
                    label={`${notes[noteIdx]} (${INTERVAL_NAMES[interval] ?? interval})`}
                    selected={isCommon}
                    activeBg={DIATONIC_FUNCTION_COLORS.T}
                    activeText={WHITE}
                    inactiveBg={colors.chipUnselectedBg}
                    inactiveText={colors.text}
                    onPress={() => {}}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Chord B notes breakdown (tappable) */}
        <TouchableOpacity
          testID="chord-b-card"
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSheetOpen(true);
          }}
          style={[styles.subSection, { borderColor }]}
        >
          <View style={styles.subHeader}>
            <View style={[styles.typeBadge, { backgroundColor: colors.surface }]}>
              <Text style={[styles.typeLabel, { color: colors.textSubtle }]}>
                {t("finder.voiceLeading.to", "先コード")}
              </Text>
            </View>
            <Text style={[styles.subChordName, { color: colors.textStrong }]}>{chordNameB}</Text>
          </View>
          <View style={[styles.pillsRow, styles.subPills]}>
            {result.notesB.map((noteIdx) => {
              const interval = (noteIdx - rootBIndex + 12) % 12;
              const isCommon = result.commonTones.includes(noteIdx);
              return (
                <View key={noteIdx} testID={`note-b-${noteIdx}`}>
                  <NotePill
                    label={`${notes[noteIdx]} (${INTERVAL_NAMES[interval] ?? interval})`}
                    selected={isCommon}
                    activeBg={DIATONIC_FUNCTION_COLORS.T}
                    activeText={WHITE}
                    inactiveBg={colors.chipUnselectedBg}
                    inactiveText={colors.text}
                    onPress={() => {}}
                  />
                </View>
              );
            })}
          </View>
        </TouchableOpacity>
      </ScrollView>

      <FinderDetailSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        theme={theme}
        title={chordNameB}
        mediaContent={
          formsB.length > 0 ? (
            <View style={styles.modalDiagrams}>
              {formsB.map((cells, fi) => (
                <ChordDiagram
                  key={fi}
                  cells={cells}
                  rootIndex={rootBIndex}
                  theme={theme}
                  width={formWidth}
                />
              ))}
            </View>
          ) : null
        }
        description={<LayerDescription theme={theme} layer={tmpLayerB} itemOnly />}
        isFull={isFull}
        onAddLayer={handleAdd}
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
    flexWrap: "wrap",
    gap: 10,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  chordNameText: {
    fontSize: 17,
    fontWeight: "700",
  },
  arrow: {
    fontSize: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  movementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  subChordName: {
    fontSize: 17,
    fontWeight: "700",
  },
  subPills: {
    paddingHorizontal: 14,
    paddingBottom: 14,
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
