import { useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../../i18n";
import type { Accidental, Theme, LayerConfig, ChordType } from "../../../types";
import { createDefaultLayer, MAX_LAYERS } from "../../../types";
import { getColors, ON_ACCENT, WHITE, BLACK, pickNextLayerColor } from "../../../themes/design";
import { getRootIndex, getNotesByAccidental, CHORD_SUFFIX_MAP } from "../../../lib/fretboard";
import {
  getPivotChords,
  chordDisplayName,
  getCommonNotes,
  type KeyType,
  type HarmonizeRole,
} from "../../../lib/harmonyUtils";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import FinderDetailSheet from "../../../components/ui/FinderDetailSheet";
import LayerDescription from "../../../components/LayerEditModal/LayerDescription";
import PillButton from "../../../components/ui/PillButton";
import Icon from "../../../components/ui/Icon";
import { CHORD_TYPE_GROUPS } from "../../Templates/TemplateFormSheet";

const MAX_CHORDS = 8;

function displayRole(role: HarmonizeRole): string {
  return role.replace("b", "♭").replace("#", "♯");
}

interface CommonFinderProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

export default function CommonFinder({
  theme,
  accidental,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: CommonFinderProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [mode, setMode] = useState<"notes" | "chords">("notes");

  // Mode 1: common notes state
  const [chords, setChords] = useState<{ rootIndex: number; chordType: ChordType }[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [selectedChordGroup, setSelectedChordGroup] = useState<"triad" | "seventh" | "tension">(
    "triad",
  );
  const calloutAnim = useRef(new Animated.Value(0)).current;

  // Mode 2: common chords state
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
  const calloutBorder = isDark ? colors.border2 : colors.borderStrong;
  const formWidth = Math.floor((screenWidth - 32 - 8 * 2) / 3);

  const keyTypeOptions: { value: KeyType; label: string }[] = [
    { value: "major", label: "Major" },
    { value: "minor", label: "Minor" },
  ];

  const modeOptions = [
    { value: "notes" as const, label: t("finder.common.modeNotes") },
    { value: "chords" as const, label: t("finder.common.modeChords") },
  ];

  // Mode 1 computations
  const commonNotes = useMemo(() => (chords.length >= 2 ? getCommonNotes(chords) : []), [chords]);

  // Mode 2 computations
  const rootIndexA = getRootIndex(rootNoteA);
  const rootIndexB = getRootIndex(rootNoteB);
  const pivotChords = useMemo(
    () => getPivotChords(rootIndexA, keyTypeA, rootIndexB, keyTypeB),
    [rootIndexA, keyTypeA, rootIndexB, keyTypeB],
  );

  const pendingTmpLayer = useMemo(() => {
    if (!pendingChord) return null;
    const layer = createDefaultLayer("chord", "common-tmp", BLACK);
    layer.chordDisplayMode = "form";
    layer.chordType = pendingChord.chordType;
    return layer;
  }, [pendingChord]);

  // Mode 1 handlers
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

  const handleRemoveChord = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChords([]);
    hideCallout(() => setSelectedNote(null));
  };

  // Mode 2 handler
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
        onEnablePerLayerRoot?.();
      }
      onAddLayerAndNavigate(layer);
    },
    [isFull, layers, notes, globalRootNote, onAddLayerAndNavigate, onEnablePerLayerRoot],
  );

  const chordGroupOptions = [
    { value: "triad" as const, label: t("options.diatonicChordSize.triad") },
    { value: "seventh" as const, label: t("options.diatonicChordSize.seventh") },
    { value: "tension" as const, label: t("templates.tension") },
  ];

  const chordLabel = (rootIndex: number, chordType: ChordType) =>
    `${notes[rootIndex]}${CHORD_SUFFIX_MAP[chordType] ?? ""}`;

  const keyLabel = (root: string, kt: KeyType) => `${root} ${kt === "major" ? "Major" : "Minor"}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      {/* Mode toggle */}
      <View style={[styles.keyRow, { borderBottomColor: borderColor }]}>
        <View style={styles.keyControls}>
          <SegmentedToggle
            theme={theme}
            value={mode}
            onChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode(v as "notes" | "chords");
            }}
            options={modeOptions}
            size="compact"
            segmentWidth={100}
          />
        </View>
      </View>

      {mode === "notes" ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Note picker chips */}
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
              style={[
                styles.callout,
                { backgroundColor: colors.pageBg, borderColor: calloutBorder },
              ]}
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
                {(
                  CHORD_TYPE_GROUPS.find((g) => g.labelKey === selectedChordGroup)?.types ?? []
                ).map(([chordType, label]) => (
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
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Added chord chips */}
          {chords.length > 0 && (
            <View style={styles.chipsRow}>
              {chords.map((chord, i) => (
                <TouchableOpacity
                  key={`${chord.rootIndex}-${chord.chordType}-${i}`}
                  testID={`chord-chip-${i}`}
                  onPress={() => handleRemoveChord(i)}
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
                  <Svg
                    width={8}
                    height={8}
                    viewBox="0 0 12 12"
                    fill="none"
                    style={{ marginLeft: 4 }}
                  >
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

          {/* Reset */}
          {chords.length > 0 && (
            <View style={styles.resetRow}>
              <PillButton isDark={isDark} variant="danger" onPress={handleReset}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textDanger }}>
                  {t("finder.reset", "リセット")}
                </Text>
              </PillButton>
            </View>
          )}

          {/* Results */}
          {chords.length >= 2 && (
            <View style={styles.sectionGroup}>
              <Text style={[styles.sectionHeader, { color: colors.textSubtle }]}>
                {t("finder.common.modeNotes")}
              </Text>
              {commonNotes.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
                  {t("finder.common.none")}
                </Text>
              ) : (
                commonNotes.map((entry) => {
                  const noteName = notes[entry.noteIndex];
                  const roleText = entry.perChord
                    .map(
                      (pc) => `${chordLabel(pc.rootIndex, pc.chordType)}: ${displayRole(pc.role)}`,
                    )
                    .join(" · ");
                  return (
                    <View
                      key={entry.noteIndex}
                      style={[styles.chordRow, { borderColor, backgroundColor: colors.surface }]}
                    >
                      <View style={styles.chordLeft}>
                        <Text style={[styles.chordName, { color: colors.textStrong }]}>
                          {noteName}
                        </Text>
                        <Text style={[styles.chordDegree, { color: colors.textSubtle }]}>
                          {roleText}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {chords.length === 1 && (
            <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
              {t("finder.common.needMoreChords")}
            </Text>
          )}

          {chords.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
              {t("finder.keyFromChords.empty", "コードを選択してください")}
            </Text>
          )}
        </ScrollView>
      ) : (
        <>
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

          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionGroup}>
              <Text style={[styles.sectionHeader, { color: colors.textSubtle }]}>
                {t("finder.relatedKeys.pivotChords")}
              </Text>
              {pivotChords.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
                  {t("finder.pivotChord.none")}
                </Text>
              ) : (
                pivotChords.map((p) => (
                  <TouchableOpacity
                    key={`${p.rootIndex}-${p.chordType}`}
                    testID={`pivot-chip-${p.rootIndex}-${p.chordType}`}
                    style={[styles.chordRow, { borderColor, backgroundColor: colors.surface }]}
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
                  >
                    <View style={styles.chordLeft}>
                      <Text style={[styles.chordName, { color: colors.textStrong }]}>
                        {chordDisplayName(p.rootIndex, p.chordType, notes)}
                      </Text>
                      <Text style={[styles.chordDegree, { color: colors.textSubtle }]}>
                        {keyLabel(rootNoteA, keyTypeA)}: {p.degreeLabelInA} ·{" "}
                        {keyLabel(rootNoteB, keyTypeB)}: {p.degreeLabelInB}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={14} color={colors.textSubtle} />
                  </TouchableOpacity>
                ))
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
                <View style={styles.badgeRow}>
                  {pendingChord.degreeA && (
                    <View style={[styles.badge, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.badgeLabel, { color: colors.textSubtle }]}>
                        {keyLabel(rootNoteA, keyTypeA)}: {pendingChord.degreeA}
                      </Text>
                    </View>
                  )}
                  {pendingChord.degreeB && (
                    <View style={[styles.badge, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.badgeLabel, { color: colors.textSubtle }]}>
                        {keyLabel(rootNoteB, keyTypeB)}: {pendingChord.degreeB}
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
                  {getAllChordForms(pendingChord.rootIndex, pendingChord.chordType).map(
                    (cells, fi) => (
                      <ChordDiagram
                        key={fi}
                        cells={cells}
                        rootIndex={pendingChord.rootIndex}
                        theme={theme}
                        width={formWidth}
                      />
                    ),
                  )}
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
              pendingChord
                ? () => handleAdd(pendingChord.rootIndex, pendingChord.chordType)
                : undefined
            }
          />
        </>
      )}
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  sectionGroup: {
    gap: 8,
    marginTop: 4,
  },
  sectionHeader: {
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
  resetRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 16,
  },
});
