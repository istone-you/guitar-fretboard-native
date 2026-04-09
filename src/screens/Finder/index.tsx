import { useState, useMemo, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useTranslation } from "react-i18next";
import NormalFretboard from "../../components/NormalFretboard";
import { identifyChords, type ChordMatch } from "../../lib/chordFinder";
import { createDefaultLayer } from "../../types";
import type { Accidental, BaseLabelMode, Theme } from "../../types";

export interface FinderPaneProps {
  theme: Theme;
  accidental: Accidental;
  baseLabelMode: BaseLabelMode;
  fretRange: [number, number];
  rootNote: string;
  leftHanded?: boolean;
}

export default function FinderPane({
  theme,
  accidental,
  baseLabelMode,
  fretRange,
  rootNote: initialRootNote,
  leftHanded,
}: FinderPaneProps) {
  const { t } = useTranslation();
  // Local root note — null until user long-presses to select
  const [rootNote, setRootNote] = useState<string | null>(null);
  // Tracks only user-added notes (root is always included separately)
  const [extraNotes, setExtraNotes] = useState<Set<string>>(new Set());
  // Increments on each note change to remount NormalFretboard, eliminating
  // concurrent bridge-style updates that conflict with native-driver animations
  const [fretboardKey, setFretboardKey] = useState(0);

  const isDark = theme === "dark";
  const bgColor = isDark ? "#030712" : "#f3f4f6";
  const cardBg = isDark ? "#1a1a2e" : "#ffffff";
  const textColor = isDark ? "#e5e7eb" : "#1c1917";
  const subTextColor = isDark ? "#9ca3af" : "#6b7280";
  const sectionHeaderBg = isDark ? "#111827" : "#f9fafb";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";

  // Effective selected notes = root + user additions (only when root is set)
  const effectiveNotes = useMemo(
    () => (rootNote ? new Set([rootNote, ...extraNotes]) : new Set<string>()),
    [rootNote, extraNotes],
  );

  const handleNoteToggle = (noteName: string) => {
    // No root selected yet — ignore taps
    if (!rootNote) return;
    // Root note is fixed — cannot be removed
    if (noteName === rootNote) return;
    setExtraNotes((prev) => {
      const next = new Set(prev);
      if (next.has(noteName)) {
        next.delete(noteName);
      } else {
        next.add(noteName);
      }
      return next;
    });
    setFretboardKey((k) => k + 1);
  };

  const handleReset = () => {
    setRootNote(null);
    setExtraNotes(new Set());
    setFretboardKey((k) => k + 1);
  };

  const handleRootSet = (noteName: string) => {
    if (noteName === rootNote) return;
    setRootNote(noteName);
    setExtraNotes(new Set());
    setFretboardKey((k) => k + 1);
  };

  // Animate chord notes label when baseLabelMode changes (same as fretboard)
  const labelScale = useRef(new Animated.Value(1)).current;
  const prevBaseLabelMode = useRef(baseLabelMode);
  if (prevBaseLabelMode.current !== baseLabelMode) {
    prevBaseLabelMode.current = baseLabelMode;
    labelScale.setValue(0.8);
    Animated.spring(labelScale, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }

  const result = useMemo(
    () => (rootNote ? identifyChords(effectiveNotes, accidental, rootNote) : null),
    [effectiveNotes, accidental, rootNote],
  );

  // Highlight all effective notes on the fretboard
  const layers = useMemo(() => {
    const layer = createDefaultLayer("custom", "finder", "#ff8c00");
    layer.selectedNotes = new Set(effectiveNotes);
    return [layer];
  }, [effectiveNotes]);

  const renderMatchRow = (match: ChordMatch, index: number) => (
    <View
      key={`${match.chordName}-${index}`}
      style={[styles.matchRow, { backgroundColor: cardBg, borderBottomColor: borderColor }]}
    >
      <Text style={[styles.chordName, { color: textColor }]}>{match.chordName}</Text>
      <Animated.Text
        style={[styles.chordNotes, { color: subTextColor, transform: [{ scale: labelScale }] }]}
      >
        {(baseLabelMode === "degree" ? match.chordDegrees : match.chordNotes).join("  ")}
      </Animated.Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Fretboard */}
      <View style={styles.fretboardWrapper}>
        <NormalFretboard
          key={fretboardKey}
          theme={theme}
          accidental={accidental}
          baseLabelMode={baseLabelMode}
          fretRange={fretRange}
          rootNote={rootNote ?? initialRootNote}
          layers={layers}
          leftHanded={leftHanded}
          disableAnimation={false}
          onNoteClick={handleNoteToggle}
          onNoteLongPress={handleRootSet}
        />
      </View>

      {/* Selected notes chips + reset button */}
      <View style={[styles.selectedRow, { borderBottomColor: borderColor }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
          style={styles.chipsScroll}
        >
          {!rootNote ? (
            <Text style={[styles.placeholder, { color: subTextColor }]}>
              {t("finder.longPressInstruction")}
            </Text>
          ) : (
            <>
              {/* Root chip — not removable */}
              <View style={styles.rootChip}>
                <Text style={styles.chipText}>{rootNote}</Text>
              </View>

              {/* User-added note chips */}
              {[...extraNotes].map((note) => (
                <TouchableOpacity
                  key={note}
                  onPress={() => handleNoteToggle(note)}
                  style={styles.chip}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipText}>{note}</Text>
                </TouchableOpacity>
              ))}

              {extraNotes.size === 0 && (
                <Text style={[styles.placeholder, { color: subTextColor }]}>
                  {t("finder.tapInstruction")}
                </Text>
              )}
            </>
          )}
        </ScrollView>

        {rootNote && (
          <TouchableOpacity
            onPress={handleReset}
            style={[styles.resetBtn, { borderColor: isDark ? "#374151" : "#d1d5db" }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.resetBtnText, { color: subTextColor }]}>{t("finder.reset")}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {result && (
        <ScrollView
          style={styles.resultScroll}
          contentContainerStyle={styles.resultContent}
          showsVerticalScrollIndicator={false}
        >
          <>
            {/* 完全一致 */}
            <View style={[styles.sectionHeader, { backgroundColor: sectionHeaderBg }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {t("finder.exactMatch")}
              </Text>
              <Text style={[styles.sectionBadge, { color: subTextColor }]}>
                {result.exact.length}
              </Text>
            </View>
            {result.exact.length === 0 ? (
              <Text style={[styles.emptySection, { color: subTextColor }]}>{t("finder.none")}</Text>
            ) : (
              result.exact.map(renderMatchRow)
            )}

            {/* 部分一致 */}
            <View
              style={[styles.sectionHeader, { backgroundColor: sectionHeaderBg, marginTop: 12 }]}
            >
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {t("finder.partialMatch")}
              </Text>
              <Text style={[styles.sectionBadge, { color: subTextColor }]}>
                {result.partial.length}
              </Text>
            </View>
            {result.partial.length === 0 ? (
              <Text style={[styles.emptySection, { color: subTextColor }]}>{t("finder.none")}</Text>
            ) : (
              result.partial.map(renderMatchRow)
            )}
          </>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fretboardWrapper: {
    paddingVertical: 8,
  },
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
    borderBottomWidth: 1,
  },
  chipsScroll: {
    flex: 1,
  },
  chipsContent: {
    alignItems: "center",
  },
  placeholder: {
    fontSize: 13,
    paddingVertical: 4,
  },
  rootChip: {
    backgroundColor: "#ff8c00",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  chip: {
    backgroundColor: "#ff8c00",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  chipText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  resetBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  resetBtnText: {
    fontSize: 13,
  },
  resultScroll: {
    flex: 1,
  },
  resultContent: {
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionBadge: {
    fontSize: 13,
  },
  emptySection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chordName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  chordNotes: {
    fontSize: 13,
    textAlign: "right",
  },
});
