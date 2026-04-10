import { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Pressable,
} from "react-native";
import { useTranslation } from "react-i18next";
import Svg, { Circle, Path } from "react-native-svg";
import NormalFretboard from "../../components/NormalFretboard";
import { identifyChords, type ChordMatch } from "../../lib/chordFinder";
import { identifyScales, scaleI18nKey, type ScaleMatch } from "../../lib/scaleFinder";
import { createDefaultLayer, DEFAULT_LAYER_COLORS } from "../../types";
import type { Accidental, BaseLabelMode, Theme } from "../../types";
import { usePersistedSetting } from "../../hooks/usePersistedSetting";
import SlideToggle from "../../components/ui/SlideToggle";

const ACCENT_COLOR = DEFAULT_LAYER_COLORS[0];
const CHORD_TAG_COLOR = DEFAULT_LAYER_COLORS[1];
const SCALE_TAG_COLOR = DEFAULT_LAYER_COLORS[2];

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

  // Display settings
  const [showChords, setShowChords] = usePersistedSetting(
    "guiter:finder-show-chords",
    true,
    (v) => String(v),
    (v) => v === "true",
  );
  const [showScales, setShowScales] = usePersistedSetting(
    "guiter:finder-show-scales",
    true,
    (v) => String(v),
    (v) => v === "true",
  );
  const [showContaining, setShowContaining] = usePersistedSetting(
    "guiter:finder-show-containing",
    true,
    (v) => String(v),
    (v) => v === "true",
  );
  const [showContained, setShowContained] = usePersistedSetting(
    "guiter:finder-show-contained",
    true,
    (v) => String(v),
    (v) => v === "true",
  );
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Local root note — null until user long-presses to select
  const [rootNote, setRootNote] = useState<string | null>(null);
  // Tracks only user-added notes (root is always included separately)
  const [extraNotes, setExtraNotes] = useState<Set<string>>(new Set());
  // Increments on each note tap to remount NormalFretboard, eliminating
  // concurrent bridge-style updates that conflict with native-driver animations
  const [fretboardKey, setFretboardKey] = useState(0);
  // Tracks the last non-null rootNote so that on reset, the rootIndex passed to
  // NormalFretboard stays stable — preventing LayerOverlayDot from remounting
  // (which would reset prevVisible and prevent the ScaleAnimView fade-out)
  const lastRootNoteRef = useRef<string>(initialRootNote);
  if (rootNote !== null) lastRootNoteRef.current = rootNote;

  const isDark = theme === "dark";
  const accentColor = ACCENT_COLOR;
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
    // No fretboardKey bump — lets overlay dots play their fade-out animation naturally
  };

  const handleRootSet = (noteName: string) => {
    if (noteName === rootNote) return;
    setRootNote(noteName);
    setExtraNotes(new Set());
    // No fretboardKey bump — lets NormalFretboard detect the baseLabelMode change
    // ("note" → "degree") and play the existing labelScale animation in Fretboard
  };

  // Animate notes label when baseLabelMode changes (same as fretboard)
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

  const chordResult = useMemo(
    () => (rootNote ? identifyChords(effectiveNotes, accidental, rootNote) : null),
    [effectiveNotes, accidental, rootNote],
  );

  const scaleResult = useMemo(
    () => (rootNote ? identifyScales(effectiveNotes, accidental, rootNote) : null),
    [effectiveNotes, accidental, rootNote],
  );

  type FinderItem = { kind: "chord"; match: ChordMatch } | { kind: "scale"; match: ScaleMatch };

  const exactItems = useMemo<FinderItem[]>(() => {
    const items: FinderItem[] = [];
    if (showChords && chordResult)
      chordResult.exact.forEach((m) => items.push({ kind: "chord", match: m }));
    if (showScales && scaleResult)
      scaleResult.exact.forEach((m) => items.push({ kind: "scale", match: m }));
    return items;
  }, [showChords, showScales, chordResult, scaleResult]);

  const containedItems = useMemo<FinderItem[]>(() => {
    const items: FinderItem[] = [];
    if (showChords && chordResult)
      chordResult.contained.forEach((m) => items.push({ kind: "chord", match: m }));
    if (showScales && scaleResult)
      scaleResult.contained.forEach((m) => items.push({ kind: "scale", match: m }));
    return items;
  }, [showChords, showScales, chordResult, scaleResult]);

  const containingItems = useMemo<FinderItem[]>(() => {
    const items: FinderItem[] = [];
    if (showChords && chordResult)
      chordResult.containing.forEach((m) => items.push({ kind: "chord", match: m }));
    if (showScales && scaleResult)
      scaleResult.containing.forEach((m) => items.push({ kind: "scale", match: m }));
    return items;
  }, [showChords, showScales, chordResult, scaleResult]);

  const hasResult = chordResult !== null || scaleResult !== null;

  // Highlight all effective notes on the fretboard
  const layers = useMemo(() => {
    const layer = createDefaultLayer("custom", "finder", accentColor);
    layer.selectedNotes = new Set(effectiveNotes);
    return [layer];
  }, [effectiveNotes]);

  const renderItem = (item: FinderItem, index: number) => {
    const isChord = item.kind === "chord";
    const key = isChord
      ? `chord-${(item.match as ChordMatch).chordName}-${index}`
      : `scale-${(item.match as ScaleMatch).scaleType}-${index}`;
    const name = isChord
      ? (item.match as ChordMatch).chordName
      : `${(item.match as ScaleMatch).root} ${t(`options.scale.${scaleI18nKey((item.match as ScaleMatch).scaleType)}`)}`;
    const notes = isChord
      ? (baseLabelMode === "degree"
          ? (item.match as ChordMatch).chordDegrees
          : (item.match as ChordMatch).chordNotes
        ).join("  ")
      : (item.match as ScaleMatch).scaleNotes.join("  ");
    const tagLabel = isChord ? t("finder.chords") : t("finder.scales");
    const baseTagColor = isChord ? CHORD_TAG_COLOR : SCALE_TAG_COLOR;
    const tagColor = `${baseTagColor}${isDark ? "40" : "20"}`;
    const tagTextColor = baseTagColor;

    return (
      <View
        key={key}
        style={[styles.matchRow, { backgroundColor: cardBg, borderBottomColor: borderColor }]}
      >
        <View style={styles.matchNameRow}>
          <Text style={[styles.matchName, { color: textColor }]}>{name}</Text>
          <View style={[styles.tag, { backgroundColor: tagColor }]}>
            <Text style={[styles.tagText, { color: tagTextColor }]}>{tagLabel}</Text>
          </View>
        </View>
        <Animated.Text
          style={[styles.matchNotes, { color: subTextColor, transform: [{ scale: labelScale }] }]}
        >
          {notes}
        </Animated.Text>
      </View>
    );
  };

  const renderSection = (label: string, items: FinderItem[], topSpacing: boolean) => (
    <>
      <View
        style={[
          styles.sectionHeader,
          { backgroundColor: sectionHeaderBg },
          topSpacing && { marginTop: 8 },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: textColor }]}>{label}</Text>
        <Text style={[styles.sectionBadge, { color: subTextColor }]}>{items.length}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={[styles.emptySection, { color: subTextColor }]}>{t("finder.none")}</Text>
      ) : (
        items.map(renderItem)
      )}
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Fretboard */}
      <View style={styles.fretboardWrapper}>
        <NormalFretboard
          key={fretboardKey}
          theme={theme}
          accidental={accidental}
          baseLabelMode={rootNote ? baseLabelMode : "note"}
          fretRange={fretRange}
          rootNote={rootNote ?? lastRootNoteRef.current}
          layers={layers}
          leftHanded={leftHanded}
          disableAnimation={false}
          onNoteClick={handleNoteToggle}
          onNoteLongPress={handleRootSet}
        />
      </View>

      {/* Selected notes chips + reset button + settings */}
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
            style={[
              styles.resetBtn,
              {
                borderColor: isDark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.25)",
                backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "rgba(254,226,226,0.7)",
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.resetBtnText, { color: isDark ? "#f87171" : "#ef4444" }]}>
              {t("finder.reset")}
            </Text>
          </TouchableOpacity>
        )}

        {/* Settings button */}
        <TouchableOpacity
          onPress={() => setSettingsVisible(true)}
          style={styles.settingsBtn}
          activeOpacity={0.7}
          testID="finder-settings-btn"
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M4 6h16M4 12h16M4 18h16"
              stroke={isDark ? "#6b7280" : "#a8a29e"}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle
              cx={9}
              cy={6}
              r={2}
              fill={isDark ? "#111827" : "#f9fafb"}
              stroke={isDark ? "#6b7280" : "#a8a29e"}
              strokeWidth={2}
            />
            <Circle
              cx={15}
              cy={12}
              r={2}
              fill={isDark ? "#111827" : "#f9fafb"}
              stroke={isDark ? "#6b7280" : "#a8a29e"}
              strokeWidth={2}
            />
            <Circle
              cx={11}
              cy={18}
              r={2}
              fill={isDark ? "#111827" : "#f9fafb"}
              stroke={isDark ? "#6b7280" : "#a8a29e"}
              strokeWidth={2}
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Settings modal */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSettingsVisible(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: cardBg, borderColor }]}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: textColor }]}>{t("finder.settings")}</Text>
            <View style={[styles.modalRow, { borderBottomColor: borderColor }]}>
              <Text style={[styles.modalRowLabel, { color: textColor }]}>
                {t("finder.showChords")}
              </Text>
              <SlideToggle value={showChords} onValueChange={setShowChords} isDark={isDark} />
            </View>
            <View style={[styles.modalRow, { borderBottomColor: borderColor }]}>
              <Text style={[styles.modalRowLabel, { color: textColor }]}>
                {t("finder.showScales")}
              </Text>
              <SlideToggle value={showScales} onValueChange={setShowScales} isDark={isDark} />
            </View>
            <View style={[styles.modalRow, { borderBottomColor: borderColor }]}>
              <Text style={[styles.modalRowLabel, { color: textColor }]}>
                {t("finder.showContained")}
              </Text>
              <SlideToggle value={showContained} onValueChange={setShowContained} isDark={isDark} />
            </View>
            <View style={styles.modalRow}>
              <Text style={[styles.modalRowLabel, { color: textColor }]}>
                {t("finder.showContaining")}
              </Text>
              <SlideToggle
                value={showContaining}
                onValueChange={setShowContaining}
                isDark={isDark}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Results */}
      {hasResult && (
        <ScrollView
          style={styles.resultScroll}
          contentContainerStyle={styles.resultContent}
          showsVerticalScrollIndicator={false}
        >
          {renderSection(t("finder.exactMatch"), exactItems, false)}
          {showContained && renderSection(t("finder.containedMatch"), containedItems, true)}
          {showContaining && renderSection(t("finder.containingMatch"), containingItems, true)}
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
    backgroundColor: ACCENT_COLOR,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  chip: {
    backgroundColor: ACCENT_COLOR,
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
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    alignItems: "center",
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: "500",
  },
  settingsBtn: {
    padding: 6,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: 280,
    borderRadius: 14,
    borderWidth: 1,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 0,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalRowLabel: {
    fontSize: 14,
    flex: 1,
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
  matchNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  matchName: {
    fontSize: 16,
    fontWeight: "600",
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "600",
  },
  matchNotes: {
    fontSize: 13,
    textAlign: "right",
  },
});
