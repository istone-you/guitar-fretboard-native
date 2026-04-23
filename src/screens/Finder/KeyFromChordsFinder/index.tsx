import { useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import "../../../i18n";
import type { Accidental, Theme, LayerConfig, ChordType } from "../../../types";
import { createDefaultLayer, MAX_LAYERS } from "../../../types";
import { getColors, ON_ACCENT, WHITE, BLACK, pickNextLayerColor } from "../../../themes/design";
import { getNotesByAccidental, CHORD_SUFFIX_MAP, getRootIndex } from "../../../lib/fretboard";
import { findKeyFromChords } from "../../../lib/harmonyUtils";
import type { KeyFromChordsMatch } from "../../../lib/harmonyUtils";
import { CHORD_TYPE_GROUPS } from "../../Templates/TemplateFormSheet";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import PillButton from "../../../components/ui/PillButton";
import FinderDetailSheet from "../../../components/ui/FinderDetailSheet";
import LayerDescription from "../../../components/LayerEditModal/LayerDescription";

const MAX_CHORDS = 8;

interface KeyFromChordsFinderProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

export default function KeyFromChordsFinder({
  theme,
  accidental,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: KeyFromChordsFinderProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const borderColor = isDark ? colors.border : colors.border2;
  const calloutBorder = isDark ? colors.border2 : colors.borderStrong;
  const notes = getNotesByAccidental(accidental);
  const isFull = layers.length >= MAX_LAYERS;

  const [chords, setChords] = useState<{ rootIndex: number; chordType: ChordType }[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [selectedChordGroup, setSelectedChordGroup] = useState<"triad" | "seventh" | "tension">(
    "triad",
  );
  const [pendingMatch, setPendingMatch] = useState<KeyFromChordsMatch | null>(null);

  const calloutAnim = useRef(new Animated.Value(0)).current;

  const results = useMemo(() => findKeyFromChords(chords).slice(0, 5), [chords]);

  const tmpLayer = useMemo(() => {
    if (!pendingMatch) return null;
    const layer = createDefaultLayer("scale", "kfc-tmp", BLACK);
    layer.scaleType = pendingMatch.keyType === "major" ? "major" : "natural-minor";
    return layer;
  }, [pendingMatch]);

  const showCallout = () =>
    Animated.timing(calloutAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

  const hideCallout = (onDone?: () => void) =>
    Animated.timing(calloutAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.ease),
      useNativeDriver: false,
    }).start(onDone);

  const handleNotePress = (note: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedNote === note) {
      hideCallout(() => setSelectedNote(null));
    } else if (selectedNote === null) {
      setSelectedNote(note);
      showCallout();
    } else {
      setSelectedNote(note);
    }
  };

  const handleChordTypePress = (chordType: ChordType) => {
    if (!selectedNote || chords.length >= MAX_CHORDS) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const rootIndex = getRootIndex(selectedNote);
    setChords((prev) => [...prev, { rootIndex, chordType }]);
    hideCallout(() => setSelectedNote(null));
  };

  const handleRemove = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChords([]);
    hideCallout(() => setSelectedNote(null));
  };

  const handleAdd = useCallback(() => {
    if (!pendingMatch || isFull) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const color = pickNextLayerColor(layers);
    const layer = createDefaultLayer("scale", `layer-${Date.now()}`, color);
    layer.scaleType = pendingMatch.keyType === "major" ? "major" : "natural-minor";
    if (notes[pendingMatch.rootIndex] !== globalRootNote) {
      layer.layerRoot = notes[pendingMatch.rootIndex];
      onEnablePerLayerRoot?.();
    }
    onAddLayerAndNavigate(layer);
    setPendingMatch(null);
  }, [
    pendingMatch,
    isFull,
    layers,
    notes,
    globalRootNote,
    onAddLayerAndNavigate,
    onEnablePerLayerRoot,
  ]);

  const chordGroupOptions = [
    { value: "triad" as const, label: t("options.diatonicChordSize.triad") },
    { value: "seventh" as const, label: t("options.diatonicChordSize.seventh") },
    { value: "tension" as const, label: t("templates.tension") },
  ];

  const chordLabel = (rootIndex: number, chordType: ChordType) =>
    `${notes[rootIndex]}${CHORD_SUFFIX_MAP[chordType] ?? ""}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Note chips */}
        <View style={[styles.chipsRow, { justifyContent: "center" }]}>
          {notes.map((note) => {
            const isActive = selectedNote === note;
            return (
              <TouchableOpacity
                key={note}
                testID={`note-chip-${note}`}
                onPress={() => handleNotePress(note)}
                style={[
                  styles.pickerChip,
                  {
                    backgroundColor: isActive ? colors.primaryBtn : colors.fillIdle,
                    borderColor: isActive ? "transparent" : colors.borderStrong,
                  },
                ]}
                activeOpacity={0.7}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text
                  style={[
                    styles.pickerChipText,
                    {
                      color: isActive
                        ? colors.primaryBtnText
                        : isDark
                          ? colors.textStrong
                          : colors.textDim,
                    },
                  ]}
                >
                  {note}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Chord type callout */}
        <Animated.View
          pointerEvents={selectedNote ? "auto" : "none"}
          style={{
            opacity: calloutAnim,
            maxHeight: calloutAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 300] }),
            overflow: "hidden",
            marginTop: 8,
          }}
        >
          <View
            style={[styles.callout, { backgroundColor: colors.pageBg, borderColor: calloutBorder }]}
          >
            <SegmentedToggle
              theme={theme}
              value={selectedChordGroup}
              onChange={(v) => setSelectedChordGroup(v as "triad" | "seventh" | "tension")}
              options={chordGroupOptions}
              size="compact"
              segmentWidth={84}
            />
            <View style={[styles.chipsRow, { marginTop: 16, justifyContent: "center" }]}>
              {(CHORD_TYPE_GROUPS.find((g) => g.labelKey === selectedChordGroup)?.types ?? []).map(
                ([chordType, label]) => (
                  <TouchableOpacity
                    key={chordType}
                    testID={`chord-type-${chordType}`}
                    onPress={() => handleChordTypePress(chordType)}
                    disabled={chords.length >= MAX_CHORDS}
                    style={[
                      styles.chordTypeChip,
                      { backgroundColor: colors.pageBg, borderColor: colors.borderStrong },
                    ]}
                    activeOpacity={0.7}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Text
                      style={[
                        styles.pickerChipText,
                        { color: isDark ? colors.textStrong : colors.textDim },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </View>
        </Animated.View>

        {/* Added chords */}
        {chords.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
            {t("finder.keyFromChords.empty", "コードを入力してキーを特定")}
          </Text>
        ) : (
          <View style={styles.chipsRow}>
            {chords.map((chord, i) => (
              <TouchableOpacity
                key={`${chord.rootIndex}-${chord.chordType}-${i}`}
                testID={`chord-chip-${i}`}
                onPress={() => handleRemove(i)}
                style={[
                  styles.addedChip,
                  {
                    backgroundColor: isDark ? colors.textMuted : colors.textSubtle,
                    borderColor: "transparent",
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerChipText, { color: WHITE }]}>
                  {chordLabel(chord.rootIndex, chord.chordType)}
                </Text>
                <Svg width={8} height={8} viewBox="0 0 12 12" fill="none" style={{ marginLeft: 4 }}>
                  <Path
                    d="M9 3L3 9M3 3l6 6"
                    stroke={ON_ACCENT.iconStroke}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  />
                </Svg>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Reset button */}
        {chords.length > 0 && (
          <View style={styles.analyzeRow}>
            <PillButton
              isDark={isDark}
              variant="danger"
              style={styles.btn}
              onPress={handleReset}
              testID="reset-btn"
            >
              <Text style={[styles.btnText, { color: colors.textDanger }]}>
                {t("finder.reset", "リセット")}
              </Text>
            </PillButton>
          </View>
        )}

        {/* Results */}
        {chords.length > 0 && results.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
            {t("finder.progressionAnalysis.noResult", "一致するキーが見つかりません")}
          </Text>
        )}
        {chords.length > 0 && results.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSubtle }]}>
              {t("finder.progressionAnalysis.result", "分析結果")}
            </Text>
            {results.map((match, ri) => {
              const keyName = `${notes[match.rootIndex]} ${match.keyType === "major" ? "Major" : "Minor"}`;
              return (
                <TouchableOpacity
                  key={ri}
                  testID={`key-result-${ri}`}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPendingMatch(match);
                  }}
                  style={[styles.resultCard, { borderColor, backgroundColor: colors.surface }]}
                >
                  <View style={styles.resultHeader}>
                    <Text style={[styles.keyName, { color: colors.textStrong }]}>{keyName}</Text>
                    <Text style={[styles.scoreText, { color: colors.textSubtle }]}>
                      {`${match.score} / ${match.total}`}
                    </Text>
                  </View>
                  <View style={styles.chipsRow}>
                    {match.matchedChords.map((mc, mi) => (
                      <View
                        key={mi}
                        style={[styles.degreeBadge, { backgroundColor: colors.pageBg }]}
                      >
                        <Text style={[styles.chordNameSmall, { color: colors.textStrong }]}>
                          {chordLabel(mc.rootIndex, mc.chordType)}
                        </Text>
                        <Text style={[styles.degreeText, { color: colors.textSubtle }]}>
                          {mc.degree}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      <FinderDetailSheet
        visible={pendingMatch !== null}
        onClose={() => setPendingMatch(null)}
        theme={theme}
        title={
          pendingMatch
            ? `${notes[pendingMatch.rootIndex]} ${pendingMatch.keyType === "major" ? "Major" : "Minor"}`
            : ""
        }
        subtitle={pendingMatch ? `${pendingMatch.score} / ${pendingMatch.total}` : ""}
        topContent={
          pendingMatch ? (
            <View style={styles.sheetDegrees}>
              {pendingMatch.matchedChords.map((mc, i) => (
                <View key={i} style={[styles.degreeBadge, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.chordNameSmall, { color: colors.textStrong }]}>
                    {chordLabel(mc.rootIndex, mc.chordType)}
                  </Text>
                  <Text style={[styles.degreeText, { color: colors.textSubtle }]}>{mc.degree}</Text>
                </View>
              ))}
            </View>
          ) : null
        }
        description={tmpLayer ? <LayerDescription theme={theme} layer={tmpLayer} itemOnly /> : null}
        isFull={isFull}
        onAddLayer={handleAdd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pickerChip: {
    borderWidth: 2,
    borderRadius: 16,
    height: 32,
    minWidth: 36,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  callout: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    marginBottom: 4,
  },
  chordTypeChip: {
    borderWidth: 2,
    borderRadius: 16,
    height: 32,
    width: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  addedChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: 16,
    height: 32,
    minWidth: 32,
    paddingHorizontal: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
  analyzeRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 20,
  },
  btn: {},
  btnText: {},
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  resultCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  keyName: {
    fontSize: 16,
    fontWeight: "700",
  },
  scoreText: {
    fontSize: 13,
    fontWeight: "600",
  },
  degreeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chordNameSmall: {
    fontSize: 13,
    fontWeight: "700",
  },
  degreeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  sheetDegrees: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 4,
  },
});
