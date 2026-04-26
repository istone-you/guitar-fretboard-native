import { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../../i18n";
import type { Accidental, Theme, LayerConfig, ChordType } from "../../../types";
import { getColors, ON_ACCENT, WHITE } from "../../../themes/design";
import { getRootIndex, getNotesByAccidental, CHORD_SUFFIX_MAP } from "../../../lib/fretboard";
import { getCommonNotes, type HarmonizeRole } from "../../../lib/harmonyUtils";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import PillButton from "../../../components/ui/PillButton";
import { CHORD_TYPE_GROUPS } from "../../Templates/TemplateFormSheet";

const MAX_CHORDS = 8;

function displayRole(role: HarmonizeRole): string {
  return role.replace("b", "♭").replace("#", "♯");
}

interface CommonNotesFinderProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

export default function CommonNotesFinder({ theme, accidental }: CommonNotesFinderProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();

  const [chords, setChords] = useState<{ rootIndex: number; chordType: ChordType }[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [selectedChordGroup, setSelectedChordGroup] = useState<"triad" | "seventh" | "tension">(
    "triad",
  );
  const calloutAnim = useRef(new Animated.Value(0)).current;

  const notes = getNotesByAccidental(accidental);
  const borderColor = isDark ? colors.border : colors.border2;
  const calloutBorder = isDark ? colors.border2 : colors.borderStrong;

  const commonNotes = useMemo(() => (chords.length >= 2 ? getCommonNotes(chords) : []), [chords]);

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

        {chords.length > 0 && (
          <View style={styles.resetRow}>
            <PillButton isDark={isDark} variant="danger" onPress={handleReset}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textDanger }}>
                {t("finder.reset", "リセット")}
              </Text>
            </PillButton>
          </View>
        )}

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
                  .map((pc) => `${chordLabel(pc.rootIndex, pc.chordType)}: ${displayRole(pc.role)}`)
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
    </View>
  );
}

const styles = StyleSheet.create({
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
