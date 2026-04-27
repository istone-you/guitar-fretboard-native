import { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../../i18n";
import type { Accidental, Theme, ProgressionChord } from "../../../types";
import { getColors } from "../../../themes/design";
import { getRootIndex, getNotesByAccidental, CHORD_SUFFIX_MAP } from "../../../lib/fretboard";
import {
  getDominantMotionPatterns,
  type KeyType,
  type DomMotionPattern,
  type DomMotionPatternType,
} from "../../../lib/harmonyUtils";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import FinderDetailSheet from "../../../components/ui/FinderDetailSheet";
import Icon from "../../../components/ui/Icon";
import PillButton from "../../../components/ui/PillButton";
import type { FinderMode } from "../types";

const OFFSET_TO_DEGREE: Record<number, string> = {
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

const SECTION_TYPES: DomMotionPatternType[] = [
  "basic-V-I",
  "two-five-one",
  "tritone-sub",
  "backdoor",
  "dominant-chain",
  "dim-resolution",
];

interface DominantMotionProps {
  theme: Theme;
  accidental: Accidental;
  globalRootNote: string;
  onNavigateTo: (mode: FinderMode, chords?: ProgressionChord[], noteKey?: string) => void;
  onOpenCircle?: (rootSemitone: number, keyType: "major" | "minor") => void;
}

export default function DominantMotion({
  theme,
  accidental,
  globalRootNote: _globalRootNote,
  onNavigateTo,
  onOpenCircle,
}: DominantMotionProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();

  const [keyRoot, setKeyRoot] = useState("C");
  const [keyType, setKeyType] = useState<KeyType>("major");
  const [pending, setPending] = useState<DomMotionPattern | null>(null);

  const keyRootIndex = getRootIndex(keyRoot);
  const notes = getNotesByAccidental(accidental);
  const borderColor = isDark ? colors.border : colors.border2;

  const keyTypeOptions: { value: KeyType; label: string }[] = [
    { value: "major", label: "Major" },
    { value: "minor", label: "Minor" },
  ];

  const allPatterns = useMemo(
    () => getDominantMotionPatterns(keyRootIndex, keyType),
    [keyRootIndex, keyType],
  );

  const basicPatterns = useMemo(
    () => allPatterns.filter((p) => SECTION_TYPES.includes(p.type)),
    [allPatterns],
  );

  const secDomPatterns = useMemo(
    () => allPatterns.filter((p) => p.type === "secondary-dominant"),
    [allPatterns],
  );

  const patternTitle = (pattern: DomMotionPattern) =>
    pattern.chords
      .map((c) => `${notes[c.rootIndex]}${CHORD_SUFFIX_MAP[c.chordType] ?? ""}`)
      .join(" → ");

  const renderPatternRow = (pattern: DomMotionPattern, idx: number) => (
    <TouchableOpacity
      key={`${pattern.type}-${idx}`}
      style={[styles.patternRow, { borderColor, backgroundColor: colors.surface }]}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPending(pattern);
      }}
    >
      <View style={styles.patternLeft}>
        <Text style={[styles.patternLabel, { color: colors.textStrong }]}>
          {patternTitle(pattern)}
        </Text>
        <Text style={[styles.patternDegrees, { color: colors.textSubtle }]}>
          {pattern.chords.map((c) => c.label).join(" → ")}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: colors.chipUnselectedBg }]}>
          <Text style={[styles.typeBadgeText, { color: colors.textSubtle }]}>
            {t(pattern.labelKey)}
          </Text>
        </View>
      </View>
      <Icon name="chevron-right" size={14} color={colors.textSubtle} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      {/* Key picker */}
      <View style={[styles.keyRow, { borderBottomColor: borderColor }]}>
        <Text style={[styles.keyLabel, { color: colors.textSubtle }]}>
          {t("finder.dominantMotion.keyLabel")}
        </Text>
        <View style={styles.keyControls}>
          <NotePickerButton
            theme={theme}
            accidental={accidental}
            value={keyRoot}
            onChange={(note) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setKeyRoot(note);
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
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic patterns */}
        <View style={styles.sectionGroup}>
          <Text style={[styles.sectionHeader, { color: colors.textSubtle }]}>
            {t("finder.dominantMotion.tonicResolution")}
          </Text>
          {basicPatterns.map((p, i) => renderPatternRow(p, i))}
        </View>

        {/* Secondary dominant section */}
        {secDomPatterns.length > 0 && (
          <View style={styles.sectionGroup}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeader, { color: colors.textSubtle }]}>
                {t("finder.dominantMotion.nonTonicResolution")}
              </Text>
              {onOpenCircle && (
                <PillButton
                  isDark={isDark}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onOpenCircle(getRootIndex(keyRoot), keyType);
                  }}
                >
                  <Text style={[styles.circleBtnText, { color: colors.textStrong }]}>
                    {t("finder.viewOnCircle")}
                  </Text>
                </PillButton>
              )}
            </View>
            {secDomPatterns.map((p, i) => renderPatternRow(p, i))}
          </View>
        )}
      </ScrollView>

      <FinderDetailSheet
        visible={pending !== null}
        onClose={() => setPending(null)}
        theme={theme}
        title={pending ? patternTitle(pending) : ""}
        subtitle={pending ? t(pending.labelKey) : undefined}
        description={
          pending ? (
            <View style={styles.descWrap}>
              <Text style={[styles.descTitle, { color: colors.textStrong }]}>
                {t(pending.labelKey)}
              </Text>
              <Text style={[styles.descText, { color: colors.textSubtle }]}>
                {t(pending.descriptionKey)}
              </Text>
              {pending.voiceLeading.length > 0 && (
                <View style={styles.vlSection}>
                  <Text style={[styles.vlTitle, { color: colors.textStrong }]}>
                    {t("finder.dominantMotion.voiceLeading")}
                  </Text>
                  {pending.voiceLeading.map((vl, i) => {
                    const dom = pending.chords[pending.chords.length - 2] ?? pending.chords[0];
                    const res = pending.chords[pending.chords.length - 1];
                    const fromNote = notes[(dom.rootIndex + vl.interval) % 12];
                    const toNote = notes[(res.rootIndex + vl.movesTo) % 12];
                    const moveLabel =
                      vl.moveType === "stay"
                        ? t("finder.dominantMotion.stay")
                        : vl.moveType === "half"
                          ? t("finder.dominantMotion.halfStep")
                          : vl.moveType === "whole"
                            ? t("finder.dominantMotion.wholeStep")
                            : t("finder.dominantMotion.tritoneMove");
                    const dir =
                      vl.direction === "none"
                        ? ""
                        : vl.direction === "up"
                          ? t("finder.dominantMotion.up")
                          : t("finder.dominantMotion.down");
                    const roleLabel =
                      vl.role === "third"
                        ? t("finder.dominantMotion.third")
                        : t("finder.dominantMotion.seventh");
                    return (
                      <Text key={i} style={[styles.vlRow, { color: colors.textSubtle }]}>
                        {`${roleLabel}: ${fromNote} → ${toNote}  (${moveLabel}${dir})`}
                      </Text>
                    );
                  })}
                </View>
              )}
            </View>
          ) : null
        }
        extraAction={{
          label: t("finder.dominantMotion.viewProgressionAnalysis"),
          iconName: "chord-sequence",
          onPress: () => {
            if (pending) {
              const progressionChords: ProgressionChord[] = pending.chords.map(
                ({ rootIndex, chordType }) => {
                  const offset = (rootIndex - keyRootIndex + 12) % 12;
                  return { degree: OFFSET_TO_DEGREE[offset] ?? "I", chordType };
                },
              );
              setPending(null);
              onNavigateTo("progression-analysis", progressionChords, keyRoot);
            } else {
              setPending(null);
              onNavigateTo("progression-analysis");
            }
          },
          position: "after",
        }}
        isFull={false}
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
    gap: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  patternRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  patternLeft: {
    flex: 1,
    gap: 2,
  },
  typeBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    borderCurve: "continuous",
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  patternLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  patternDegrees: {
    fontSize: 11,
    fontWeight: "500",
  },
  sectionGroup: {
    gap: 8,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  circleBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  descWrap: {
    gap: 12,
  },
  descTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  descText: {
    fontSize: 13,
    lineHeight: 20,
  },
  vlSection: {
    gap: 4,
  },
  vlTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  vlRow: {
    fontSize: 13,
    lineHeight: 20,
    fontVariant: ["tabular-nums"],
  },
});
