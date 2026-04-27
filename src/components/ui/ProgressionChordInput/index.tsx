import { forwardRef, useImperativeHandle, useRef, useState, type ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import type { Accidental, ChordType, ProgressionChord, Theme } from "../../../types";
import { CHORD_SUFFIX_MAP, getNotesByAccidental } from "../../../lib/fretboard";
import { getColors, ON_ACCENT, WHITE, type ThemeColors } from "../../../themes/design";
import { getPillStyle } from "../PillButton";
import { SegmentedToggle } from "../SegmentedToggle";

export const MAX_PROGRESSION_CHORDS = 16;

export const DEGREE_TO_OFFSET: Record<string, number> = {
  I: 0,
  bII: 1,
  II: 2,
  bIII: 3,
  III: 4,
  IV: 5,
  bV: 6,
  V: 7,
  bVI: 8,
  VI: 9,
  bVII: 10,
  VII: 11,
};

export const OFFSET_TO_DEGREE: Record<number, string> = {
  0: "I",
  1: "bII",
  2: "II",
  3: "bIII",
  4: "III",
  5: "IV",
  6: "bV",
  7: "V",
  8: "bVI",
  9: "VI",
  10: "bVII",
  11: "VII",
};

export const CHROMATIC_DEGREES: [string, string][] = [
  ["I", "I"],
  ["bII", "♭II"],
  ["II", "II"],
  ["bIII", "♭III"],
  ["III", "III"],
  ["IV", "IV"],
  ["bV", "♭V"],
  ["V", "V"],
  ["bVI", "♭VI"],
  ["VI", "VI"],
  ["bVII", "♭VII"],
  ["VII", "VII"],
];

export const CHORD_TYPE_GROUPS: {
  labelKey: "triad" | "seventh" | "tension";
  types: [ChordType, string][];
}[] = [
  {
    labelKey: "triad",
    types: [
      ["Major", "M"],
      ["Minor", "m"],
      ["dim", "dim"],
      ["aug", "aug"],
      ["sus2", "sus2"],
      ["sus4", "sus4"],
      ["7sus4", "7sus4"],
      ["5", "5"],
    ],
  },
  {
    labelKey: "seventh",
    types: [
      ["7th", "7"],
      ["maj7", "M7"],
      ["m7", "m7"],
      ["m7(b5)", "m7♭5"],
      ["dim7", "dim7"],
      ["m(maj7)", "m(M7)"],
      ["6", "6"],
      ["m6", "m6"],
    ],
  },
  {
    labelKey: "tension",
    types: [
      ["9", "9"],
      ["maj9", "M9"],
      ["m9", "m9"],
      ["add9", "add9"],
      ["m(add9)", "m(add9)"],
      ["7(b9)", "7♭9"],
      ["7(#9)", "7♯9"],
      ["11", "11"],
      ["#11", "♯11"],
      ["add11", "add11"],
      ["add#11", "add♯11"],
      ["m11", "m11"],
      ["13", "13"],
      ["b13", "♭13"],
      ["maj13", "M13"],
      ["m13", "m13"],
      ["6/9", "6/9"],
      ["m6/9", "m6/9"],
    ],
  },
];

export function chordDisplayLabel(chord: ProgressionChord): string {
  const deg = chord.degree.replace("b", "♭");
  const suffix = CHORD_SUFFIX_MAP[chord.chordType] ?? chord.chordType;
  return `${deg}${suffix}`;
}

export interface ProgressionChordInputHandle {
  resetSelection: () => void;
}

interface ProgressionChordInputProps {
  theme: Theme;
  accidental: Accidental;
  inputMode: "degree" | "note";
  noteKey: string;
  onKeyPress?: () => void;
  showKeyButton?: boolean;
  keyRowStyle?: StyleProp<ViewStyle>;
  keyAccessory?: ReactNode;
  topSlot?: ReactNode;
  progressionSlot?: ReactNode;
  chords: ProgressionChord[];
  onChordsChange: (chords: ProgressionChord[]) => void;
  maxChords?: number;
  calloutBg: string;
  emptyText?: string;
  renderChords?: (args: {
    chords: ProgressionChord[];
    chordLabel: (chord: ProgressionChord) => string;
    colors: ThemeColors;
    isDark: boolean;
  }) => ReactNode;
}

const ProgressionChordInput = forwardRef<ProgressionChordInputHandle, ProgressionChordInputProps>(
  (
    {
      theme,
      accidental,
      inputMode,
      noteKey,
      onKeyPress,
      showKeyButton,
      keyRowStyle,
      keyAccessory,
      topSlot,
      progressionSlot,
      chords,
      onChordsChange,
      maxChords = MAX_PROGRESSION_CHORDS,
      calloutBg,
      emptyText,
      renderChords,
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const isDark = theme === "dark";
    const colors = getColors(isDark);
    const calloutBorder = isDark ? colors.border2 : colors.borderStrong;
    const notes = getNotesByAccidental(accidental);
    const keyNoteIndex = notes.findIndex((n) => n === noteKey);

    const [selectedDegree, setSelectedDegree] = useState<string | null>(null);
    const [selectedNote, setSelectedNote] = useState<string | null>(null);
    const [selectedChordGroup, setSelectedChordGroup] = useState<"triad" | "seventh" | "tension">(
      "triad",
    );

    const calloutAnim = useRef(new Animated.Value(0)).current;

    const noteToChromaDegree = (note: string): string => {
      const noteIdx = notes.findIndex((n) => n === note);
      if (noteIdx < 0 || keyNoteIndex < 0) return "I";
      return OFFSET_TO_DEGREE[(noteIdx - keyNoteIndex + 12) % 12] ?? "I";
    };

    const degreeToNote = (degree: string): string => {
      const offset = DEGREE_TO_OFFSET[degree];
      if (offset === undefined || keyNoteIndex < 0) return "";
      return notes[(keyNoteIndex + offset) % 12] ?? "";
    };

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

    useImperativeHandle(ref, () => ({
      resetSelection() {
        calloutAnim.stopAnimation();
        calloutAnim.setValue(0);
        setSelectedDegree(null);
        setSelectedNote(null);
      },
    }));

    const handleDegreePress = (deg: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (selectedDegree === deg) {
        hideCallout(() => setSelectedDegree(null));
      } else if (selectedDegree === null) {
        setSelectedDegree(deg);
        showCallout();
      } else {
        setSelectedDegree(deg);
      }
    };

    const handleNotePress = (note: string) => {
      const degree = noteToChromaDegree(note);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (selectedNote === note) {
        hideCallout(() => {
          setSelectedDegree(null);
          setSelectedNote(null);
        });
      } else if (selectedDegree === null) {
        setSelectedDegree(degree);
        setSelectedNote(note);
        showCallout();
      } else {
        setSelectedDegree(degree);
        setSelectedNote(note);
      }
    };

    const handleChordTypePress = (chordType: ChordType) => {
      if (!selectedDegree || chords.length >= maxChords) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChordsChange([...chords, { degree: selectedDegree, chordType }]);
      hideCallout(() => {
        setSelectedDegree(null);
        setSelectedNote(null);
      });
    };

    const handleRemoveChord = (index: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChordsChange(chords.filter((_, i) => i !== index));
    };

    const chordLabel = (chord: ProgressionChord): string => {
      if (inputMode === "note") {
        const suffix = CHORD_SUFFIX_MAP[chord.chordType] ?? chord.chordType;
        return `${degreeToNote(chord.degree)}${suffix}`;
      }
      return chordDisplayLabel(chord);
    };

    const chordGroupOptions = [
      { value: "triad" as const, label: t("options.diatonicChordSize.triad") },
      { value: "seventh" as const, label: t("options.diatonicChordSize.seventh") },
      { value: "tension" as const, label: t("templates.tension") },
    ];

    return (
      <>
        {topSlot}
        {(showKeyButton ?? inputMode === "note") && onKeyPress ? (
          <View style={[styles.keyNavRow, keyRowStyle]}>
            <TouchableOpacity
              testID="key-nav-btn"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onKeyPress();
              }}
              activeOpacity={0.7}
            >
              <View style={getPillStyle(colors)}>
                <Text style={[styles.pillLabel, { color: colors.textSubtle }]}>
                  {t("templates.key")}
                </Text>
                <Text style={[styles.pillValue, { color: colors.text }]}>{noteKey}</Text>
              </View>
            </TouchableOpacity>
            {keyAccessory}
          </View>
        ) : null}

        <View style={[styles.chipsRow, { justifyContent: "center" }]}>
          {inputMode === "degree"
            ? CHROMATIC_DEGREES.map(([deg, label]) => {
                const isActive = selectedDegree === deg;
                return (
                  <TouchableOpacity
                    key={deg}
                    testID={`degree-chip-${deg}`}
                    onPress={() => handleDegreePress(deg)}
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
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })
            : notes.map((note) => {
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
          pointerEvents={selectedDegree ? "auto" : "none"}
          style={{
            opacity: calloutAnim,
            maxHeight: calloutAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 300] }),
            overflow: "hidden",
            marginTop: 8,
          }}
        >
          <View
            style={[styles.callout, { backgroundColor: calloutBg, borderColor: calloutBorder }]}
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
                    disabled={chords.length >= maxChords}
                    style={[
                      styles.chordTypeChip,
                      { backgroundColor: calloutBg, borderColor: colors.borderStrong },
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

        {progressionSlot}

        {chords.length === 0 ? (
          emptyText ? (
            <Text style={[styles.emptyText, { color: colors.textSubtle }]}>{emptyText}</Text>
          ) : null
        ) : renderChords ? (
          renderChords({ chords, chordLabel, colors, isDark })
        ) : (
          <View style={styles.chipsRow}>
            {chords.map((chord, i) => (
              <View key={`${chord.degree}-${chord.chordType}-${i}`} style={styles.progressionItem}>
                {i > 0 && <Text style={[styles.arrow, { color: colors.textSubtle }]}>→</Text>}
                <TouchableOpacity
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
                  <Text style={[styles.pickerChipText, { color: WHITE }]}>{chordLabel(chord)}</Text>
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
              </View>
            ))}
          </View>
        )}
      </>
    );
  },
);

export default ProgressionChordInput;

const styles = StyleSheet.create({
  keyNavRow: {
    alignItems: "center",
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  pillValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pickerChip: {
    borderWidth: 2,
    borderRadius: 16,
    borderCurve: "continuous",
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
    borderCurve: "continuous",
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    marginBottom: 4,
  },
  chordTypeChip: {
    borderWidth: 2,
    borderRadius: 16,
    borderCurve: "continuous",
    height: 32,
    width: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  progressionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  arrow: {
    fontSize: 12,
  },
  addedChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: 16,
    borderCurve: "continuous",
    height: 32,
    minWidth: 32,
    paddingHorizontal: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
});
