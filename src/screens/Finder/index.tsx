import { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Switch,
  useWindowDimensions,
} from "react-native";
import { ContextMenu } from "../../components/ui/ContextMenu";
import BottomSheetModal, { SHEET_HANDLE_CLEARANCE } from "../../components/ui/BottomSheetModal";
import SheetProgressiveHeader from "../../components/ui/SheetProgressiveHeader";
import GlassIconButton from "../../components/ui/GlassIconButton";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import NormalFretboard from "../../components/NormalFretboard";
import { identifyChords, type ChordMatch } from "../../lib/chordFinder";
import { identifyScales, scaleI18nKey, type ScaleMatch } from "../../lib/scaleFinder";
import { createDefaultLayer, pickNextLayerColor, MAX_LAYERS } from "../../types";
import type {
  Accidental,
  BaseLabelMode,
  Theme,
  LayerConfig,
  ChordType,
  ScaleType,
} from "../../types";
import { usePersistedSetting } from "../../hooks/usePersistedSetting";
import LayerDescription from "../../components/LayerEditModal/LayerDescription";
import ColorPicker from "../../components/ui/ColorPicker";
import { SegmentedToggle } from "../../components/ui/SegmentedToggle";

type FinderItem = { kind: "chord"; match: ChordMatch } | { kind: "scale"; match: ScaleMatch };

export interface FinderPaneProps {
  theme: Theme;
  accidental: Accidental;
  baseLabelMode: BaseLabelMode;
  fretRange: [number, number];
  rootNote: string;
  leftHanded?: boolean;
  finderRoot: string | null;
  finderNotes: Set<string>;
  onFinderRootChange: (note: string | null) => void;
  onFinderNotesChange: (notes: Set<string>) => void;
  dotColor: string;
  onDotColorChange: (color: string) => void;
  layers: LayerConfig[];
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onBaseLabelModeChange: (mode: BaseLabelMode) => void;
}

export default function FinderPane({
  theme,
  accidental,
  baseLabelMode,
  fretRange,
  rootNote: initialRootNote,
  leftHanded,
  finderRoot,
  finderNotes,
  onFinderRootChange,
  onFinderNotesChange,
  dotColor,
  onDotColorChange,
  layers,
  onAddLayerAndNavigate,
  onBaseLabelModeChange,
}: FinderPaneProps) {
  const { t } = useTranslation();
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
  const [pendingItem, setPendingItem] = useState<FinderItem | null>(null);
  const [settingsHeaderHeight, setSettingsHeaderHeight] = useState(96);
  const insets = useSafeAreaInsets();
  const { height: winHeight } = useWindowDimensions();
  const sheetHeight = Math.max(360, Math.min(520, Math.round(winHeight * 0.62)));

  // Lifted to parent — persists across navigation
  const rootNote = finderRoot;
  const extraNotes = finderNotes;
  // Increments on each note tap to remount NormalFretboard, eliminating
  // concurrent bridge-style updates that conflict with native-driver animations
  const [fretboardKey, setFretboardKey] = useState(0);
  // Tracks the last non-null rootNote so that on reset, the rootIndex passed to
  // NormalFretboard stays stable — preventing LayerOverlayDot from remounting
  // (which would reset prevVisible and prevent the ScaleAnimView fade-out)
  const lastRootNoteRef = useRef<string>(initialRootNote);
  if (rootNote !== null) lastRootNoteRef.current = rootNote;

  const isDark = theme === "dark";
  const accentColor = dotColor;
  const bgColor = isDark ? "#000000" : "#ffffff";
  const cardBg = isDark ? "#1a1a2e" : "#ffffff";
  const textColor = isDark ? "#e5e7eb" : "#1c1917";
  const subTextColor = isDark ? "#9ca3af" : "#6b7280";
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
    const next = new Set(extraNotes);
    if (next.has(noteName)) {
      next.delete(noteName);
    } else {
      next.add(noteName);
    }
    onFinderNotesChange(next);
    setFretboardKey((k) => k + 1);
  };

  const handleReset = () => {
    onFinderRootChange(null);
    onFinderNotesChange(new Set());
    // No fretboardKey bump — lets overlay dots play their fade-out animation naturally
  };

  const handleRootSet = (noteName: string) => {
    if (noteName === rootNote) return;
    onFinderRootChange(noteName);
    onFinderNotesChange(new Set());
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
  const finderLayers = useMemo(() => {
    const layer = createDefaultLayer("custom", "finder", accentColor);
    layer.selectedNotes = new Set(effectiveNotes);
    return [layer];
  }, [effectiveNotes, accentColor]);

  const handleSetNotes = () => {
    if (!pendingItem) return;
    const allNotes =
      pendingItem.kind === "chord" ? pendingItem.match.chordNotes : pendingItem.match.scaleNotes;
    const root = pendingItem.match.root;
    onFinderRootChange(root);
    onFinderNotesChange(new Set(allNotes.filter((n) => n !== root)));
    setPendingItem(null);
  };

  const handleConfirmAdd = () => {
    if (!pendingItem) return;
    let newLayer: LayerConfig;
    if (pendingItem.kind === "chord") {
      newLayer = createDefaultLayer("chord", `layer-${Date.now()}`, pickNextLayerColor(layers));
      newLayer.chordDisplayMode = "form";
      newLayer.chordType = pendingItem.match.chordType as ChordType;
    } else {
      newLayer = createDefaultLayer("scale", `layer-${Date.now()}`, pickNextLayerColor(layers));
      newLayer.scaleType = pendingItem.match.scaleType as ScaleType;
    }
    setPendingItem(null);
    onAddLayerAndNavigate(newLayer);
  };

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

    return (
      <TouchableOpacity
        key={key}
        activeOpacity={0.7}
        onPress={() => setPendingItem(item)}
        style={[styles.matchRow, { backgroundColor: cardBg, borderBottomColor: borderColor }]}
      >
        <View style={styles.matchNameRow}>
          <Text style={[styles.matchName, { color: textColor }]}>{name}</Text>
          <View style={[styles.tag, { borderColor: isDark ? "#374151" : "#d6d3d1" }]}>
            <Text style={[styles.tagText, { color: isDark ? "#9ca3af" : "#78716c" }]}>
              {tagLabel}
            </Text>
          </View>
        </View>
        <Animated.Text
          style={[styles.matchNotes, { color: subTextColor, transform: [{ scale: labelScale }] }]}
        >
          {notes}
        </Animated.Text>
      </TouchableOpacity>
    );
  };

  const renderSection = (label: string, items: FinderItem[], topSpacing: boolean) => (
    <>
      <View style={[styles.sectionHeader, topSpacing && { marginTop: 8 }]}>
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
        <View style={styles.labelToggleRow}>
          <SegmentedToggle
            theme={theme}
            value={baseLabelMode}
            onChange={onBaseLabelModeChange}
            options={[
              { value: "note" as BaseLabelMode, label: t("header.note") },
              { value: "degree" as BaseLabelMode, label: t("header.degree") },
            ]}
            size="compact"
          />
        </View>
        <NormalFretboard
          key={fretboardKey}
          theme={theme}
          accidental={accidental}
          baseLabelMode={rootNote ? baseLabelMode : "note"}
          fretRange={fretRange}
          rootNote={rootNote ?? lastRootNoteRef.current}
          layers={finderLayers}
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
              <View style={[styles.rootChip, { backgroundColor: accentColor }]}>
                <Text style={styles.chipText}>{rootNote}</Text>
              </View>

              {/* User-added note chips */}
              {[...extraNotes].map((note) => (
                <TouchableOpacity
                  key={note}
                  onPress={() => handleNoteToggle(note)}
                  style={[styles.chip, { backgroundColor: accentColor }]}
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

      {/* Settings bottom sheet */}
      <BottomSheetModal visible={settingsVisible} onClose={() => setSettingsVisible(false)}>
        {({ close, dragHandlers }) => {
          const sheetBg = isDark ? "#111827" : "#fafaf9";
          const sheetBorder = isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4";
          const labelColor = isDark ? "#e5e7eb" : "#1c1917";
          return (
            <View
              style={[
                styles.bottomSheetModal,
                { height: sheetHeight, backgroundColor: sheetBg, borderColor: sheetBorder },
              ]}
            >
              <View style={{ flex: 1, overflow: "hidden" }}>
                <ScrollView
                  style={styles.sheetScroll}
                  contentContainerStyle={[
                    styles.sheetScrollContent,
                    { paddingTop: settingsHeaderHeight },
                  ]}
                  showsVerticalScrollIndicator
                  indicatorStyle={isDark ? "white" : "black"}
                >
                  <View style={styles.settingsBody}>
                    {/* Color */}
                    <View style={[styles.iosSection, { borderColor: sheetBorder }]}>
                      <View
                        style={[
                          styles.iosRow,
                          {
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: sheetBorder,
                          },
                        ]}
                      >
                        <Text style={[styles.iosRowLabel, { color: labelColor }]}>
                          {t("finder.color")}
                        </Text>
                      </View>
                      <View style={[styles.colorPickerRow]}>
                        <ColorPicker value={dotColor} onChange={onDotColorChange} isDark={isDark} />
                      </View>
                    </View>
                    {/* Toggles */}
                    <View style={[styles.iosSection, { borderColor: sheetBorder }]}>
                      {(
                        [
                          [t("finder.showChords"), showChords, setShowChords],
                          [t("finder.showScales"), showScales, setShowScales],
                          [t("finder.showContained"), showContained, setShowContained],
                          [t("finder.showContaining"), showContaining, setShowContaining],
                        ] as [string, boolean, (v: boolean) => void][]
                      ).map(([label, value, setter], i, arr) => (
                        <View
                          key={label}
                          style={[
                            styles.iosRow,
                            i < arr.length - 1 && {
                              borderBottomWidth: StyleSheet.hairlineWidth,
                              borderBottomColor: sheetBorder,
                            },
                          ]}
                        >
                          <Text style={[styles.iosRowLabel, { color: labelColor }]}>{label}</Text>
                          <Switch
                            value={value}
                            onValueChange={setter}
                            trackColor={{ false: isDark ? "#4b5563" : "#d6d3d1", true: "#34c759" }}
                            ios_backgroundColor={isDark ? "#4b5563" : "#d6d3d1"}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                </ScrollView>
                {/* Absolute glass header */}
                <SheetProgressiveHeader
                  isDark={isDark}
                  bgColor={sheetBg}
                  dragHandlers={dragHandlers}
                  contentPaddingHorizontal={14}
                  onLayout={setSettingsHeaderHeight}
                  style={styles.absoluteHeader}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <GlassIconButton
                      isDark={isDark}
                      onPress={close}
                      label="✕"
                      style={styles.headerLeft}
                    />
                    <View style={styles.headerCenter}>
                      <Text style={[styles.headerTitle, { color: labelColor }]}>
                        {t("finder.settings")}
                      </Text>
                    </View>
                    <View style={styles.headerRight} />
                  </View>
                </SheetProgressiveHeader>
              </View>
            </View>
          );
        }}
      </BottomSheetModal>

      {/* Add-to-layer confirmation — shared ContextMenu design */}
      {(() => {
        const isFull = layers.length >= MAX_LAYERS;
        const itemName = pendingItem
          ? pendingItem.kind === "chord"
            ? pendingItem.match.chordName
            : `${pendingItem.match.root} ${t(`options.scale.${scaleI18nKey(pendingItem.match.scaleType)}`)}`
          : "";
        const isAlreadySet = (() => {
          if (!pendingItem) return false;
          const itemRoot = pendingItem.match.root;
          const allNotes =
            pendingItem.kind === "chord"
              ? pendingItem.match.chordNotes
              : pendingItem.match.scaleNotes;
          const itemExtra = new Set(allNotes.filter((n) => n !== itemRoot));
          if (rootNote !== itemRoot) return false;
          if (extraNotes.size !== itemExtra.size) return false;
          for (const n of itemExtra) if (!extraNotes.has(n)) return false;
          return true;
        })();
        const descLayer: LayerConfig | null = (() => {
          if (!pendingItem) return null;
          if (pendingItem.kind === "chord") {
            const layer = createDefaultLayer("chord", "finder-desc", "#000");
            layer.chordDisplayMode = "form";
            layer.chordType = pendingItem.match.chordType as ChordType;
            return layer;
          } else {
            const layer = createDefaultLayer("scale", "finder-desc", "#000");
            layer.scaleType = pendingItem.match.scaleType as ScaleType;
            return layer;
          }
        })();
        return (
          <ContextMenu
            visible={pendingItem !== null}
            isDark={isDark}
            title={itemName}
            footer={
              descLayer ? <LayerDescription theme={theme} layer={descLayer} itemOnly /> : undefined
            }
            items={[
              {
                label: t("finder.addToLayerTitle"),
                subtitle: isFull ? t("finder.addToLayerFull") : undefined,
                icon: (
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 5v14M5 12h14"
                      stroke={isDark ? "#ebebf599" : "#3c3c4399"}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  </Svg>
                ),
                onPress: handleConfirmAdd,
                disabled: isFull,
              },
              {
                label: t("finder.setNotes"),
                subtitle: isAlreadySet ? t("finder.setNotesAlreadySet") : undefined,
                disabled: isAlreadySet,
                icon: (
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M9 18V5l12-2v13"
                      stroke={isDark ? "#ebebf599" : "#3c3c4399"}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Circle
                      cx={6}
                      cy={18}
                      r={3}
                      stroke={isDark ? "#ebebf599" : "#3c3c4399"}
                      strokeWidth={2}
                    />
                    <Circle
                      cx={18}
                      cy={16}
                      r={3}
                      stroke={isDark ? "#ebebf599" : "#3c3c4399"}
                      strokeWidth={2}
                    />
                  </Svg>
                ),
                onPress: handleSetNotes,
              },
            ]}
            onClose={() => setPendingItem(null)}
          />
        );
      })()}

      {/* Results */}
      {hasResult && (
        <ScrollView
          style={styles.resultScroll}
          contentContainerStyle={[styles.resultContent, { paddingBottom: insets.bottom + 80 }]}
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
  labelToggleRow: {
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingBottom: 6,
    marginBottom: 12,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  chip: {
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
  // Bottom sheet styles (same as LayerEditModal)
  bottomSheetModal: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    overflow: "hidden",
  },
  absoluteHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingTop: SHEET_HANDLE_CLEARANCE,
  },
  headerLeft: {
    width: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  sheetScroll: {
    flex: 1,
    width: "100%",
  },
  sheetScrollContent: {
    paddingBottom: 24,
  },
  settingsBody: {
    paddingHorizontal: 16,
    gap: 6,
    paddingTop: 6,
    paddingBottom: 8,
  },
  iosSection: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iosRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    paddingVertical: 8,
  },
  iosRowLabel: {
    fontSize: 15,
    fontWeight: "400",
    flex: 1,
  },
  colorPickerRow: {
    paddingVertical: 12,
  },
  resultScroll: {
    flex: 1,
  },
  resultContent: {
    paddingBottom: 16,
  }, // Note: dynamic bottom padding added inline via insets
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
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
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
