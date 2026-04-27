import { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../../i18n";
import type { Accidental, Theme, LayerConfig, ChordType } from "../../../types";
import { createDefaultLayer, MAX_LAYERS } from "../../../types";
import { getColors, pickNextLayerColor, BLACK, TOGGLE_COLORS, WHITE } from "../../../themes/design";
import { getRootIndex, getNotesByAccidental, CHORD_SUFFIX_MAP } from "../../../lib/fretboard";
import { getTensionsAndAvoids } from "../../../lib/harmonyUtils";
import type { KeyType, TensionNote } from "../../../lib/harmonyUtils";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import { useChordDiagramWidth } from "../../../hooks/useChordDiagramWidth";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import FinderChordPicker from "../../../components/ui/FinderChordPicker";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import FinderDetailSheet from "../../../components/ui/FinderDetailSheet";
import Icon from "../../../components/ui/Icon";
import LayerDescription from "../../../components/LayerEditModal/LayerDescription";

interface TensionAvoidFinderProps {
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

// コードトーン用（R, 3, 5, 7 系）
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

// アボイドノート用（対応するテンションコードがないので拡張表記でフォールバック）
const TENSION_NAMES: Record<number, string> = {
  1: "b9",
  2: "9",
  3: "#9",
  5: "11",
  6: "#11",
  8: "b13",
  9: "13",
  10: "b7",
  11: "7",
};

// 結果コード型 → テンション表記（6 chord なら "6"、13 chord なら "13"）
const TENSION_CHORD_TO_LABEL: Partial<Record<ChordType, string>> = {
  "6": "6",
  m6: "6",
  dim7: "6",
  add9: "9",
  "9": "9",
  maj9: "9",
  m9: "9",
  "m(add9)": "9",
  b9: "b9",
  "#9": "#9",
  "11": "11",
  add11: "11",
  m11: "11",
  "#11": "#11",
  "add#11": "#11",
  "13": "13",
  maj13: "13",
  m13: "13",
  b13: "b13",
  "7th": "b7",
  m7: "b7",
  "m7(b5)": "b7",
  maj7: "maj7",
  "m(maj7)": "maj7",
};

// ベースコード + テンション音（半音インターバル） → テンションコードの ChordType
function getTensionChordType(base: ChordType, interval: number): ChordType | null {
  if (base === "Major") {
    if (interval === 1) return "b9";
    if (interval === 2) return "add9";
    if (interval === 3) return "#9";
    if (interval === 5) return "add11";
    if (interval === 6) return "add#11";
    if (interval === 8) return "b13";
    if (interval === 9) return "6";
    if (interval === 10) return "7th";
    if (interval === 11) return "maj7";
  }
  if (base === "Minor") {
    if (interval === 2) return "m(add9)";
    if (interval === 5) return "m11";
    if (interval === 9) return "m6";
    if (interval === 10) return "m7";
    if (interval === 11) return "m(maj7)";
  }
  if (base === "7th") {
    if (interval === 1) return "b9";
    if (interval === 2) return "9";
    if (interval === 3) return "#9";
    if (interval === 5) return "11";
    if (interval === 6) return "#11";
    if (interval === 8) return "b13";
    if (interval === 9) return "13";
  }
  if (base === "maj7") {
    if (interval === 2) return "maj9";
    if (interval === 9) return "maj13";
  }
  if (base === "m7") {
    if (interval === 2) return "m9";
    if (interval === 5) return "m11";
    if (interval === 9) return "m13";
  }
  if (base === "dim") {
    if (interval === 9) return "dim7";
    if (interval === 10) return "m7(b5)";
  }
  return null;
}

// テンション音のラベル。変化後コードに応じて 6/9/11/13 を切り替え
function getTensionLabel(base: ChordType, interval: number): string {
  const chord = getTensionChordType(base, interval);
  if (chord && TENSION_CHORD_TO_LABEL[chord]) return TENSION_CHORD_TO_LABEL[chord]!;
  return TENSION_NAMES[interval] ?? String(interval);
}

export default function TensionAvoidFinder({
  theme,
  accidental,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: TensionAvoidFinderProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const borderColor = isDark ? colors.border : colors.border2;
  const notes = getNotesByAccidental(accidental);
  const isFull = layers.length >= MAX_LAYERS;
  const formWidth = useChordDiagramWidth();

  const [keyRoot, setKeyRoot] = useState("C");
  const [keyType, setKeyType] = useState<KeyType>("major");
  const [chordRoot, setChordRoot] = useState("C");
  const [chordType, setChordType] = useState<ChordType>("Major");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedTension, setSelectedTension] = useState<TensionNote | null>(null);

  const keyRootIndex = getRootIndex(keyRoot);
  const chordRootIndex = getRootIndex(chordRoot);
  const chordName = `${chordRoot}${CHORD_SUFFIX_MAP[chordType] ?? ""}`;
  const keyLabel = `${keyRoot} ${keyType === "major" ? t("finder.tensionAvoid.major", "Major") : t("finder.tensionAvoid.minor", "Minor")}`;

  const result = useMemo(
    () => getTensionsAndAvoids(keyRootIndex, keyType, chordRootIndex, chordType),
    [keyRootIndex, keyType, chordRootIndex, chordType],
  );

  const forms = useMemo(
    () => getAllChordForms(chordRootIndex, chordType),
    [chordRootIndex, chordType],
  );

  const tmpLayer = useMemo(() => {
    const layer = createDefaultLayer("chord", "ta-tmp", BLACK);
    layer.chordDisplayMode = "form";
    layer.chordType = chordType;
    return layer;
  }, [chordType]);

  const tensionChordType = useMemo(
    () => (selectedTension ? getTensionChordType(chordType, selectedTension.interval) : null),
    [selectedTension, chordType],
  );

  const tensionChordName = tensionChordType
    ? `${chordRoot}${CHORD_SUFFIX_MAP[tensionChordType] ?? ""}`
    : "";

  const tensionForms = useMemo(
    () => (tensionChordType ? getAllChordForms(chordRootIndex, tensionChordType) : []),
    [tensionChordType, chordRootIndex],
  );

  const tensionTmpLayer = useMemo(() => {
    if (!tensionChordType) return null;
    const layer = createDefaultLayer("chord", "ta-tension-tmp", BLACK);
    layer.chordDisplayMode = "form";
    layer.chordType = tensionChordType;
    return layer;
  }, [tensionChordType]);

  const keyTypeOptions: { value: KeyType; label: string }[] = [
    { value: "major", label: "Major" },
    { value: "minor", label: "Minor" },
  ];

  const handleAdd = useCallback(() => {
    if (isFull) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const color = pickNextLayerColor(layers);
    const layer = createDefaultLayer("chord", `layer-${Date.now()}`, color);
    layer.chordDisplayMode = "form";
    layer.chordType = chordType;
    if (notes[chordRootIndex] !== globalRootNote) {
      layer.layerRoot = notes[chordRootIndex];
      onEnablePerLayerRoot?.();
    }
    onAddLayerAndNavigate(layer);
  }, [
    isFull,
    layers,
    chordType,
    chordRootIndex,
    notes,
    globalRootNote,
    onAddLayerAndNavigate,
    onEnablePerLayerRoot,
  ]);

  const handleAddTension = useCallback(() => {
    if (isFull || !tensionChordType) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const color = pickNextLayerColor(layers);
    const layer = createDefaultLayer("chord", `layer-${Date.now()}`, color);
    layer.chordDisplayMode = "form";
    layer.chordType = tensionChordType;
    if (notes[chordRootIndex] !== globalRootNote) {
      layer.layerRoot = notes[chordRootIndex];
      onEnablePerLayerRoot?.();
    }
    onAddLayerAndNavigate(layer);
    setSelectedTension(null);
  }, [
    isFull,
    tensionChordType,
    layers,
    chordRootIndex,
    notes,
    globalRootNote,
    onAddLayerAndNavigate,
    onEnablePerLayerRoot,
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      {/* Key picker */}
      <View style={[styles.pickerRow, { borderBottomColor: borderColor }]}>
        <View style={styles.keyRow}>
          <NotePickerButton
            theme={theme}
            accidental={accidental}
            value={keyRoot}
            onChange={(n) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setKeyRoot(n);
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
          />
        </View>
      </View>

      {/* Chord picker */}
      <FinderChordPicker
        theme={theme}
        accidental={accidental}
        rootNote={chordRoot}
        onRootChange={setChordRoot}
        chordTypes={CHORD_TYPES.map((ct) => ({
          value: ct,
          label: CHORD_TYPE_LABELS[ct] ?? ct,
        }))}
        selectedChordType={chordType}
        onChordTypeChange={(type) => setChordType(type as ChordType)}
        borderColor={borderColor}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Source section (tappable) */}
        <TouchableOpacity
          testID="chord-source-card"
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSheetOpen(true);
          }}
          style={[styles.sourceSection, { borderColor }]}
        >
          <View style={styles.sourceHeader}>
            <Text style={[styles.sourceChordName, { color: colors.textStrong }]}>{chordName}</Text>
            <Icon name="chevron-right" size={14} color={colors.textSubtle} />
          </View>
          <View style={styles.badgesRow}>
            {result.chordTones.map((tn) => (
              <View
                key={tn.noteIndex}
                testID={`chord-tone-${tn.noteIndex}`}
                style={[styles.toneBadge, { backgroundColor: colors.surface, borderColor }]}
              >
                <Text style={[styles.toneBadgeText, { color: colors.text }]}>
                  {notes[tn.noteIndex]} ({INTERVAL_NAMES[tn.interval] ?? tn.interval})
                </Text>
              </View>
            ))}
          </View>
          {forms.length > 0 && (
            <View style={styles.cardFormsRow}>
              {forms.map((cells, fi) => (
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

        {/* Tensions */}
        {result.tensions.length === 0 ? (
          <View style={[styles.groupCard, { borderColor }]}>
            <Text style={[styles.groupLabel, { color: colors.textSubtle }]}>
              {t("finder.tensionAvoid.tensions", "テンション")}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
              {t("finder.tensionAvoid.none", "なし")}
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSubtle }]}>
              {t("finder.tensionAvoid.tensions", "テンション")}
            </Text>
            {result.tensions.map((tn) => {
              const tensionChord = getTensionChordType(chordType, tn.interval);
              const tensionLabel = getTensionLabel(chordType, tn.interval);
              const tensionChordName = tensionChord
                ? `${chordRoot}${CHORD_SUFFIX_MAP[tensionChord] ?? ""}`
                : `${chordRoot}${CHORD_SUFFIX_MAP[chordType] ?? ""}(${tensionLabel})`;
              const cardForms = tensionChord ? getAllChordForms(chordRootIndex, tensionChord) : [];
              return (
                <TouchableOpacity
                  key={tn.noteIndex}
                  testID={`tension-${tn.noteIndex}`}
                  style={[styles.subSection, { borderColor }]}
                  activeOpacity={tensionChord ? 0.7 : 1}
                  onPress={() => {
                    if (!tensionChord) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTension(tn);
                  }}
                >
                  {tensionChord && (
                    <View style={styles.subHeader}>
                      <Text style={[styles.subChordName, { color: colors.textStrong }]}>
                        {tensionChordName}
                      </Text>
                      <View style={{ flex: 1 }} />
                      <Icon name="chevron-right" size={14} color={colors.textSubtle} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.badgesRow,
                      styles.cardBadgesRow,
                      !tensionChord && styles.cardBadgesRowNoHeader,
                    ]}
                  >
                    {result.chordTones.map((ct) => (
                      <View
                        key={ct.noteIndex}
                        style={[styles.toneBadge, { backgroundColor: colors.surface, borderColor }]}
                      >
                        <Text style={[styles.toneBadgeText, { color: colors.text }]}>
                          {notes[ct.noteIndex]} ({INTERVAL_NAMES[ct.interval] ?? ct.interval})
                        </Text>
                      </View>
                    ))}
                    <View
                      style={[styles.toneBadge, { backgroundColor: TOGGLE_COLORS.on, borderColor }]}
                    >
                      <Text style={[styles.toneBadgeText, { color: WHITE }]}>
                        {notes[tn.noteIndex]} ({tensionLabel})
                      </Text>
                    </View>
                  </View>
                  {cardForms.length > 0 && (
                    <View style={styles.cardFormsRow}>
                      {cardForms.map((cells, fi) => (
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
            })}
          </>
        )}

        {/* Avoid notes */}
        <View style={[styles.groupCard, { borderColor }]}>
          <Text style={[styles.groupLabel, { color: colors.textSubtle }]}>
            {t("finder.tensionAvoid.avoidNotes", "アボイドノート")}
          </Text>
          {result.avoidNotes.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
              {t("finder.tensionAvoid.none", "なし")}
            </Text>
          ) : (
            <View style={styles.badgesRow}>
              {result.avoidNotes.map((tn) => (
                <View
                  key={tn.noteIndex}
                  testID={`avoid-${tn.noteIndex}`}
                  style={[
                    styles.toneBadge,
                    { backgroundColor: colors.pillDangerBg, borderColor: colors.pillDangerBorder },
                  ]}
                >
                  <Text style={[styles.toneBadgeText, { color: colors.textDanger }]}>
                    {notes[tn.noteIndex]} ({TENSION_NAMES[tn.interval] ?? tn.interval})
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <FinderDetailSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        theme={theme}
        title={chordName}
        subtitle={keyLabel}
        mediaContent={
          forms.length > 0 ? (
            <View style={styles.modalDiagrams}>
              {forms.map((cells, fi) => (
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
        description={<LayerDescription theme={theme} layer={tmpLayer} itemOnly />}
        isFull={isFull}
        onAddLayer={handleAdd}
      />

      <FinderDetailSheet
        visible={selectedTension !== null}
        onClose={() => setSelectedTension(null)}
        theme={theme}
        title={tensionChordName}
        subtitle={
          selectedTension
            ? `${chordName} + ${notes[selectedTension.noteIndex]} (${getTensionLabel(chordType, selectedTension.interval)})`
            : ""
        }
        mediaContent={
          tensionForms.length > 0 ? (
            <View style={styles.modalDiagrams}>
              {tensionForms.map((cells, fi) => (
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
        description={
          tensionTmpLayer ? (
            <LayerDescription theme={theme} layer={tensionTmpLayer} itemOnly />
          ) : null
        }
        isFull={isFull}
        onAddLayer={handleAddTension}
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
  content: {
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
  sourceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sourceChordName: {
    fontSize: 17,
    fontWeight: "700",
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
  cardFormsRow: {
    flexDirection: "row",
    gap: 8,
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
  subChordName: {
    fontSize: 17,
    fontWeight: "700",
  },
  groupCard: {
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 2,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cardBadgesRow: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  cardBadgesRowNoHeader: {
    paddingTop: 14,
  },
  toneBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  toneBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  modalDiagrams: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sheetDesc: {
    fontSize: 13,
    lineHeight: 20,
    paddingTop: 4,
  },
});
