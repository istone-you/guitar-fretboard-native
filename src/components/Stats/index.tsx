import { useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  Alert,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Icon from "../ui/Icon";
import { DEGREE_BY_SEMITONE, getNotesByAccidental } from "../../lib/fretboard";
import { CHORD_QUIZ_TYPES_ALL } from "../../hooks/useQuiz";
import type { Accidental, QuizMode, QuizRecord, ScaleType, Theme } from "../../types";
import { getColors, STATS_RATE_COLORS, BLACK } from "../../themes/design";
import PillButton from "../ui/PillButton";

const MIN_SAMPLES = 5;
const FRET_COUNT = 15;

const ALL_SCALE_TYPES: ScaleType[] = [
  "major",
  "natural-minor",
  "major-penta",
  "minor-penta",
  "blues",
  "harmonic-minor",
  "melodic-minor",
  "ionian",
  "dorian",
  "phrygian",
  "lydian",
  "mixolydian",
  "aeolian",
  "locrian",
  "phrygian-dominant",
  "lydian-dominant",
  "altered",
  "whole-tone",
  "diminished",
];

// ── Color helpers ─────────────────────────────────────────────────

function rateToColor(rate: number): string {
  const { worst, best } = STATS_RATE_COLORS;
  const r = Math.round(worst.r + (best.r - worst.r) * rate);
  const g = Math.round(worst.g + (best.g - worst.g) * rate);
  const b = Math.round(worst.b + (best.b - worst.b) * rate);
  return `rgb(${r},${g},${b})`;
}

// ── Data types ────────────────────────────────────────────────────

interface StatEntry {
  key: string;
  label: string;
  correct: number;
  total: number;
}

// ── Compute helpers ───────────────────────────────────────────────

function buildStats(
  records: QuizRecord[],
  filter: (r: QuizRecord) => boolean,
  getKey: (r: QuizRecord) => string | undefined,
  getLabel: (key: string) => string,
  allKeys?: string[],
): StatEntry[] {
  const map = new Map<string, { correct: number; total: number }>();
  for (const key of allKeys ?? []) {
    map.set(key, { correct: 0, total: 0 });
  }
  for (const r of records) {
    if (!filter(r)) continue;
    const key = getKey(r);
    if (key === undefined) continue;
    const entry = map.get(key) ?? { correct: 0, total: 0 };
    entry.total++;
    if (r.correct) entry.correct++;
    map.set(key, entry);
  }
  return Array.from(map.entries())
    .map(([key, v]) => ({ key, label: getLabel(key), ...v }))
    .sort((a, b) => {
      const hasA = a.total >= MIN_SAMPLES;
      const hasB = b.total >= MIN_SAMPLES;
      if (hasA && !hasB) return -1;
      if (!hasA && hasB) return 1;
      if (hasA && hasB) return a.correct / a.total - b.correct / b.total;
      return b.total - a.total;
    });
}

// ── CollapsibleSection ────────────────────────────────────────────

function CollapsibleSection({
  title,
  children,
  isDark,
}: {
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const colors = getColors(isDark);
  const { cardBg, border: cardBorder, text: titleColor, textSubtle: chevronColor } = colors;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <TouchableOpacity style={styles.collapsibleHeader} onPress={toggle} activeOpacity={0.7}>
        <Text style={[styles.sectionTitle, { color: titleColor }]}>{title}</Text>
        <Icon name={open ? "chevron-up" : "chevron-down"} size={16} color={chevronColor} />
      </TouchableOpacity>
      <Animated.View
        style={{
          maxHeight: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 2000] }),
          opacity: anim,
          overflow: "hidden",
        }}
      >
        <View style={styles.collapsibleBody}>{children}</View>
      </Animated.View>
    </View>
  );
}

// ── RankRow ───────────────────────────────────────────────────────

function RankRow({
  label,
  correct,
  total,
  isDark,
}: {
  label: string;
  correct: number;
  total: number;
  isDark: boolean;
}) {
  const hasData = total >= MIN_SAMPLES;
  const rate = hasData ? correct / total : 0;
  const { progressTrack, text: textColor, textSubtle: subColor } = getColors(isDark);
  const fillColor = hasData ? rateToColor(rate) : progressTrack;
  const trackColor = progressTrack;

  return (
    <View style={[styles.rankRow, !hasData && styles.rankRowDim]}>
      <Text style={[styles.rankLabel, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.rankBarWrapper}>
        <View style={[styles.rankBarTrack, { backgroundColor: trackColor }]}>
          {hasData && (
            <View
              style={[
                styles.rankBarFill,
                { width: `${Math.round(rate * 100)}%`, backgroundColor: fillColor },
              ]}
            />
          )}
        </View>
      </View>
      <Text style={[styles.rankRate, { color: hasData ? textColor : subColor }]}>
        {hasData ? `${Math.round(rate * 100)}%` : "--"}
      </Text>
      <Text style={[styles.rankCount, { color: subColor }]}>{total}問</Text>
    </View>
  );
}

// ── HeatmapGrid ───────────────────────────────────────────────────

function HeatmapGrid({
  data,
  isDark,
}: {
  data: Map<string, { correct: number; total: number }>;
  isDark: boolean;
}) {
  const CELL = 20;
  const LABEL_W = 32;
  const {
    textSubtle: textColor,
    progressTrack: emptyBorder,
    heatmapEmpty: noDataBg,
  } = getColors(isDark);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} testID="heatmap-grid">
      <View style={styles.heatmapContainer}>
        {/* Fret number header */}
        <View style={[styles.heatmapRow, { marginLeft: LABEL_W }]}>
          {Array.from({ length: FRET_COUNT }, (_, fret) => (
            <View key={fret} style={{ width: CELL, alignItems: "center" }}>
              <Text style={{ fontSize: 8, color: textColor }}>{fret}</Text>
            </View>
          ))}
        </View>

        {[5, 4, 3, 2, 1, 0].map((stringIdx) => (
          <View key={stringIdx} style={[styles.heatmapRow, { marginBottom: 2 }]}>
            <View style={[styles.heatmapStringLabel, { width: LABEL_W }]}>
              <Text style={{ fontSize: 10, color: textColor }}>{6 - stringIdx}弦</Text>
            </View>
            {Array.from({ length: FRET_COUNT }, (_, fret) => {
              const key = `${stringIdx}-${fret}`;
              const cell = data.get(key);
              const total = cell?.total ?? 0;
              const correct = cell?.correct ?? 0;
              const hasData = total >= MIN_SAMPLES;
              let bg: string;
              if (total === 0) {
                bg = "transparent";
              } else if (hasData) {
                bg = rateToColor(correct / total);
              } else {
                bg = noDataBg;
              }
              return (
                <View
                  key={fret}
                  style={{
                    width: CELL - 2,
                    height: CELL - 2,
                    margin: 1,
                    borderRadius: 2,
                    backgroundColor: bg,
                    borderWidth: total === 0 ? 1 : 0,
                    borderColor: total === 0 ? emptyBorder : "transparent",
                  }}
                />
              );
            })}
          </View>
        ))}

        {/* Legend */}
        <View style={[styles.heatmapLegend, { marginLeft: LABEL_W }]}>
          <Text style={[styles.heatmapLegendText, { color: textColor }]}>苦手</Text>
          <View style={styles.heatmapGradientRow}>
            {Array.from({ length: 10 }, (_, i) => (
              <View key={i} style={{ flex: 1, height: 8, backgroundColor: rateToColor(i / 9) }} />
            ))}
          </View>
          <Text style={[styles.heatmapLegendText, { color: textColor }]}>得意</Text>
          <View
            style={[styles.heatmapLegendSwatch, { backgroundColor: noDataBg, marginLeft: 8 }]}
          />
          <Text style={[styles.heatmapLegendText, { color: textColor }]}>5問未満</Text>
          <View
            style={[
              styles.heatmapLegendSwatch,
              { borderWidth: 1, borderColor: emptyBorder, marginLeft: 4 },
            ]}
          />
          <Text style={[styles.heatmapLegendText, { color: textColor }]}>未解答</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ── Main component ────────────────────────────────────────────────

interface StatsPanelProps {
  records: QuizRecord[];
  theme: Theme;
  accidental: Accidental;
  onClearRecords: () => void;
}

export default function StatsPanel({
  records,
  theme,
  accidental,
  onClearRecords,
}: StatsPanelProps) {
  const isDark = theme === "dark";
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const {
    cardBg,
    border: cardBorder,
    textSubtle: subColor,
    pageBg,
    textDanger,
  } = getColors(isDark);

  const allNotes = useMemo(() => [...getNotesByAccidental(accidental)], [accidental]);
  const allDegrees = useMemo(() => [...DEGREE_BY_SEMITONE], []);
  const allStringKeys = ["0", "1", "2", "3", "4", "5"];
  const allFretKeys = Array.from({ length: FRET_COUNT }, (_, i) => String(i));
  const allChordKeys = CHORD_QUIZ_TYPES_ALL.map(String);
  const allScaleKeys = ALL_SCALE_TYPES.map(String);

  const modeStats = useMemo(() => {
    const modes: QuizMode[] = ["note", "degree", "chord", "scale", "diatonic"];
    return modes.map((mode) => {
      const filtered = records.filter((r) => r.mode === mode);
      return {
        key: mode,
        label: t(`stats.modes.${mode}`),
        correct: filtered.filter((r) => r.correct).length,
        total: filtered.length,
      };
    });
  }, [records, t]);

  const noteStats = useMemo(
    () =>
      buildStats(
        records,
        (r) => r.mode === "note" && r.noteName !== undefined,
        (r) => r.noteName,
        (k) => k,
        allNotes,
      ),
    [records, allNotes],
  );

  const degreeStats = useMemo(
    () =>
      buildStats(
        records,
        (r) => r.mode === "degree" && r.degreeLabel !== undefined,
        (r) => r.degreeLabel,
        (k) => k,
        allDegrees,
      ),
    [records, allDegrees],
  );

  const stringStats = useMemo(
    () =>
      buildStats(
        records,
        (r) => r.stringIdx !== undefined,
        (r) => (r.stringIdx !== undefined ? String(r.stringIdx) : undefined),
        (k) => `${6 - Number(k)}弦`,
        allStringKeys,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records],
  );

  const fretStats = useMemo(
    () =>
      buildStats(
        records,
        (r) => r.fret !== undefined,
        (r) => (r.fret !== undefined ? String(r.fret) : undefined),
        (k) => `${k}フレット`,
        allFretKeys,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records],
  );

  const heatmapData = useMemo(() => {
    const map = new Map<string, { correct: number; total: number }>();
    for (const r of records) {
      if (r.stringIdx === undefined || r.fret === undefined) continue;
      const key = `${r.stringIdx}-${r.fret}`;
      const entry = map.get(key) ?? { correct: 0, total: 0 };
      entry.total++;
      if (r.correct) entry.correct++;
      map.set(key, entry);
    }
    return map;
  }, [records]);

  const chordTypeStats = useMemo(
    () =>
      buildStats(
        records,
        (r) => r.mode === "chord" && r.chordType !== undefined,
        (r) => r.chordType,
        (k) => k,
        allChordKeys,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records],
  );

  const scaleStats = useMemo(
    () =>
      buildStats(
        records,
        (r) => r.mode === "scale" && r.scaleType !== undefined,
        (r) => r.scaleType,
        (k) => {
          const camelKey = k.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
          return t(`options.scale.${camelKey}`, k);
        },
        allScaleKeys,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records, t],
  );

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(t("stats.resetTitle"), t("stats.resetMessage"), [
      { text: t("stats.resetCancel"), style: "cancel" },
      { text: t("stats.resetOk"), style: "destructive", onPress: onClearRecords },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: pageBg }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Total count */}
      <Text style={[styles.totalText, { color: subColor }]}>
        {records.length > 0
          ? t("stats.totalRecords", { count: records.length })
          : t("stats.noRecords")}
      </Text>

      {/* Heatmap */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.cardInner}>
          <HeatmapGrid data={heatmapData} isDark={isDark} />
        </View>
      </View>

      <CollapsibleSection title={t("stats.sections.byMode")} isDark={isDark}>
        {modeStats.map((entry) => (
          <RankRow
            key={entry.key}
            label={entry.label}
            correct={entry.correct}
            total={entry.total}
            isDark={isDark}
          />
        ))}
      </CollapsibleSection>

      <CollapsibleSection title={t("stats.sections.byNote")} isDark={isDark}>
        {noteStats.map((entry) => (
          <RankRow
            key={entry.key}
            label={entry.label}
            correct={entry.correct}
            total={entry.total}
            isDark={isDark}
          />
        ))}
      </CollapsibleSection>

      <CollapsibleSection title={t("stats.sections.byDegree")} isDark={isDark}>
        {degreeStats.map((entry) => (
          <RankRow
            key={entry.key}
            label={entry.label}
            correct={entry.correct}
            total={entry.total}
            isDark={isDark}
          />
        ))}
      </CollapsibleSection>

      <CollapsibleSection title={t("stats.sections.byString")} isDark={isDark}>
        {stringStats.map((entry) => (
          <RankRow
            key={entry.key}
            label={entry.label}
            correct={entry.correct}
            total={entry.total}
            isDark={isDark}
          />
        ))}
      </CollapsibleSection>

      <CollapsibleSection title={t("stats.sections.byFret")} isDark={isDark}>
        {fretStats.map((entry) => (
          <RankRow
            key={entry.key}
            label={entry.label}
            correct={entry.correct}
            total={entry.total}
            isDark={isDark}
          />
        ))}
      </CollapsibleSection>

      <CollapsibleSection title={t("stats.sections.byChordType")} isDark={isDark}>
        {chordTypeStats.map((entry) => (
          <RankRow
            key={entry.key}
            label={entry.label}
            correct={entry.correct}
            total={entry.total}
            isDark={isDark}
          />
        ))}
      </CollapsibleSection>

      <CollapsibleSection title={t("stats.sections.byScale")} isDark={isDark}>
        {scaleStats.map((entry) => (
          <RankRow
            key={entry.key}
            label={entry.label}
            correct={entry.correct}
            total={entry.total}
            isDark={isDark}
          />
        ))}
      </CollapsibleSection>

      {/* Reset button */}
      {records.length > 0 && (
        <PillButton
          isDark={isDark}
          onPress={handleReset}
          variant="danger"
          style={{ marginTop: 4, alignSelf: "stretch", justifyContent: "center" }}
        >
          <Text style={[styles.resetText, { color: textDanger }]}>{t("stats.reset")}</Text>
        </PillButton>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 10,
    paddingBottom: 0,
  },
  totalText: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInner: {
    padding: 14,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 28,
  },
  rankRowDim: {
    opacity: 0.45,
  },
  rankLabel: {
    fontSize: 13,
    fontWeight: "600",
    width: 72,
  },
  rankBarWrapper: {
    flex: 1,
  },
  rankBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  rankBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  rankRate: {
    fontSize: 13,
    fontWeight: "700",
    width: 36,
    textAlign: "right",
  },
  rankCount: {
    fontSize: 11,
    width: 32,
    textAlign: "right",
  },
  heatmapContainer: {
    gap: 0,
    paddingTop: 4,
    paddingBottom: 8,
  },
  heatmapRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heatmapStringLabel: {
    alignItems: "flex-end",
    paddingRight: 4,
  },
  heatmapLegend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  heatmapLegendText: {
    fontSize: 9,
  },
  heatmapGradientRow: {
    flexDirection: "row",
    width: 60,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  heatmapLegendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  collapsibleBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 6,
  },
  resetButton: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  resetText: {},
});
