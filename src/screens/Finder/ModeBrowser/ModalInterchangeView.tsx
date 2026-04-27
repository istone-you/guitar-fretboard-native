import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../../i18n";
import type { Accidental, Theme, LayerConfig, ChordType, ScaleType } from "../../../types";
import { createDefaultLayer, MAX_LAYERS } from "../../../types";
import {
  getColors,
  pickNextLayerColor,
  CIRCLE_OVERLAY_COLORS,
  BLACK,
} from "../../../themes/design";
import { getRootIndex, getNotesByAccidental } from "../../../lib/fretboard";
import {
  getDiatonicChordList,
  getChordsFromScale,
  chordDisplayName,
  type KeyType,
} from "../../../lib/harmonyUtils";
import { scaleI18nKey } from "../../../lib/scaleFinder";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import BottomSheetModal, {
  SHEET_HANDLE_CLEARANCE,
  useSheetHeight,
} from "../../../components/ui/BottomSheetModal";
import SheetProgressiveHeader from "../../../components/ui/SheetProgressiveHeader";
import GlassIconButton from "../../../components/ui/GlassIconButton";
import Icon from "../../../components/ui/Icon";
import PillButton from "../../../components/ui/PillButton";
import FinderDetailSheet from "../../../components/ui/FinderDetailSheet";
import LayerDescription from "../../../components/LayerEditModal/LayerDescription";

const SOURCE_MODES: ReadonlyArray<ScaleType> = [
  "ionian",
  "dorian",
  "phrygian",
  "lydian",
  "mixolydian",
  "aeolian",
  "locrian",
  "harmonic-minor",
  "melodic-minor",
];

interface ModalInterchangeViewProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  rootNote: string;
  onRootNoteChange: (note: string) => void;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

interface PendingChord {
  rootIndex: number;
  chordType: ChordType;
  degreeLabel: string;
  borrowed: boolean;
  sourceModeLabel: string;
}

export default function ModalInterchangeView({
  theme,
  accidental,
  layers,
  globalRootNote,
  rootNote,
  onRootNoteChange,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: ModalInterchangeViewProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const sheetHeight = useSheetHeight();
  const { width: screenWidth } = useWindowDimensions();

  const [keyType, setKeyType] = useState<KeyType>("major");
  const [sourceMode, setSourceMode] = useState<ScaleType>("aeolian");
  const [sourceModeSheetVisible, setSourceModeSheetVisible] = useState(false);
  const [sourceModeHeaderHeight, setSourceModeHeaderHeight] = useState(96);
  const [pendingChord, setPendingChord] = useState<PendingChord | null>(null);

  const notes = getNotesByAccidental(accidental);
  const isFull = layers.length >= MAX_LAYERS;
  const borderColor = isDark ? colors.border : colors.border2;
  const formWidth = Math.floor((screenWidth - 32 - 8 * 2) / 3);

  const keyTypeOptions: { value: KeyType; label: string }[] = [
    { value: "major", label: "Major" },
    { value: "minor", label: "Minor" },
  ];

  const handleKeyTypeChange = (newKeyType: KeyType) => {
    setKeyType(newKeyType);
    setSourceMode(newKeyType === "major" ? "aeolian" : "dorian");
  };

  const parentRootIndex = getRootIndex(rootNote);

  const annotatedChords = useMemo(() => {
    const parentDiatonic = getDiatonicChordList(parentRootIndex, keyType);
    const parentSet = new Set(parentDiatonic.map((c) => `${c.rootIndex}:${c.chordType}`));
    const sourceChords = getChordsFromScale(parentRootIndex, sourceMode, "triad");
    return sourceChords.map((c) => ({
      ...c,
      borrowed: !parentSet.has(`${c.rootIndex}:${c.chordType}`),
    }));
  }, [parentRootIndex, keyType, sourceMode]);

  const hasBorrowedChords = annotatedChords.some((c) => c.borrowed);

  const sourceModeLabel = t(`options.scale.${scaleI18nKey(sourceMode)}`);

  const pendingTmpLayer = useMemo(() => {
    if (!pendingChord) return null;
    const layer = createDefaultLayer("chord", "mi-tmp", BLACK);
    layer.chordDisplayMode = "form";
    layer.chordType = pendingChord.chordType;
    return layer;
  }, [pendingChord]);

  const handleAdd = useCallback(
    (chordRootIndex: number, chordType: ChordType) => {
      if (isFull) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const color = pickNextLayerColor(layers);
      const layer = createDefaultLayer("chord", `layer-${Date.now()}`, color);
      layer.chordDisplayMode = "form";
      layer.chordType = chordType;
      const chordRootName = notes[chordRootIndex];
      if (chordRootName !== globalRootNote) {
        layer.layerRoot = chordRootName;
        onEnablePerLayerRoot?.();
      }
      onAddLayerAndNavigate(layer);
    },
    [isFull, layers, notes, globalRootNote, onAddLayerAndNavigate, onEnablePerLayerRoot],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      {/* Key + source mode controls */}
      <View style={[styles.keyRow, { borderBottomColor: borderColor }]}>
        <View style={styles.keyControls}>
          <NotePickerButton
            theme={theme}
            accidental={accidental}
            value={rootNote}
            onChange={(note) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRootNoteChange(note);
            }}
            label={t("header.key")}
            sheetTitle={t("header.key")}
          />
          <SegmentedToggle
            theme={theme}
            value={keyType}
            onChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleKeyTypeChange(v as KeyType);
            }}
            options={keyTypeOptions}
            size="compact"
            segmentWidth={60}
          />
        </View>
      </View>

      {/* Source mode selector */}
      <View style={[styles.sourceModeRow, { borderBottomColor: borderColor }]}>
        <Text style={[styles.sourceModeLabel, { color: colors.textSubtle }]}>
          {t("finder.modes.sourceMode")}
        </Text>
        <PillButton
          isDark={isDark}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSourceModeSheetVisible(true);
          }}
          style={styles.sourceModeBtn}
        >
          <Text style={[styles.sourceModeBtnText, { color: colors.textSubtle }]}>
            {sourceModeLabel}
          </Text>
          <Icon name="chevron-down" size={12} color={colors.textSubtle} />
        </PillButton>
      </View>

      {/* Chord list */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {annotatedChords.map((chord) => (
          <TouchableOpacity
            key={`${chord.rootIndex}-${chord.chordType}`}
            testID={`mi-chord-${chord.degreeLabel}`}
            style={[
              styles.chordRow,
              {
                borderColor,
                backgroundColor: colors.surface,
                borderLeftWidth: chord.borrowed ? 3 : StyleSheet.hairlineWidth,
                borderLeftColor: chord.borrowed
                  ? CIRCLE_OVERLAY_COLORS.modalInterchange
                  : borderColor,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPendingChord({
                rootIndex: chord.rootIndex,
                chordType: chord.chordType,
                degreeLabel: chord.degreeLabel,
                borrowed: chord.borrowed,
                sourceModeLabel,
              });
            }}
          >
            <View style={styles.chordLeft}>
              <Text style={[styles.chordName, { color: colors.textStrong }]}>
                {chordDisplayName(chord.rootIndex, chord.chordType, notes)}
              </Text>
              <Text style={[styles.chordDegree, { color: colors.textSubtle }]}>
                {chord.degreeLabel}
              </Text>
            </View>
            {chord.borrowed && (
              <Text
                style={[styles.borrowedBadge, { color: CIRCLE_OVERLAY_COLORS.modalInterchange }]}
              >
                {t("finder.modes.borrowed")}
              </Text>
            )}
            <Icon name="chevron-right" size={14} color={colors.textSubtle} />
          </TouchableOpacity>
        ))}

        {!hasBorrowedChords && annotatedChords.length > 0 && (
          <Text style={[styles.allSharedText, { color: colors.textSubtle }]}>
            {t("finder.modes.allShared")}
          </Text>
        )}
      </ScrollView>

      {/* Chord detail sheet */}
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
              <View style={[styles.badge, { backgroundColor: colors.surface }]}>
                <Text style={[styles.badgeLabel, { color: colors.textSubtle }]}>
                  {pendingChord.degreeLabel}
                </Text>
              </View>
              {pendingChord.borrowed && (
                <View style={[styles.badge, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.badgeLabel, { color: colors.textSubtle }]}>
                    {t("finder.modes.borrowedFromMode", { mode: pendingChord.sourceModeLabel })}
                  </Text>
                </View>
              )}
              {!pendingChord.borrowed && (
                <View style={[styles.badge, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.badgeLabel, { color: colors.textSubtle }]}>
                    {t("finder.modes.sharedWithKey")}
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
              {getAllChordForms(pendingChord.rootIndex, pendingChord.chordType).map((cells, fi) => (
                <ChordDiagram
                  key={fi}
                  cells={cells}
                  rootIndex={pendingChord.rootIndex}
                  theme={theme}
                  width={formWidth}
                />
              ))}
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
          pendingChord ? () => handleAdd(pendingChord.rootIndex, pendingChord.chordType) : undefined
        }
      />

      {/* Source mode picker sheet */}
      <BottomSheetModal
        visible={sourceModeSheetVisible}
        onClose={() => setSourceModeSheetVisible(false)}
      >
        {({ close, dragHandlers }) => {
          const sheetBg = colors.deepBg;
          return (
            <View
              style={[
                styles.pickerSheet,
                { height: sheetHeight, backgroundColor: sheetBg, borderColor: colors.sheetBorder },
              ]}
            >
              <View style={{ flex: 1, overflow: "hidden" }}>
                <ScrollView
                  contentContainerStyle={{ paddingTop: sourceModeHeaderHeight }}
                  showsVerticalScrollIndicator={false}
                >
                  {SOURCE_MODES.map((mode) => {
                    const label = t(`options.scale.${scaleI18nKey(mode)}`);
                    const isSelected = sourceMode === mode;
                    return (
                      <TouchableOpacity
                        key={mode}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSourceMode(mode);
                          close();
                        }}
                        style={[styles.modeOption, { borderBottomColor: borderColor }]}
                      >
                        <Text
                          style={[
                            styles.modeOptionLabel,
                            {
                              color: isSelected ? colors.chipSelectedBg : colors.text,
                              fontWeight: isSelected ? "700" : "400",
                            },
                          ]}
                        >
                          {label}
                        </Text>
                        {isSelected && (
                          <Icon name="check" size={16} color={colors.chipSelectedBg} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <SheetProgressiveHeader
                  isDark={isDark}
                  bgColor={sheetBg}
                  dragHandlers={dragHandlers}
                  contentPaddingHorizontal={14}
                  onLayout={setSourceModeHeaderHeight}
                  style={styles.absoluteHeader}
                >
                  <View style={styles.headerRow}>
                    <GlassIconButton
                      isDark={isDark}
                      onPress={close}
                      icon="close"
                      style={styles.headerSide}
                    />
                    <View style={styles.headerCenter} />
                    <View style={styles.headerSide} />
                  </View>
                </SheetProgressiveHeader>
              </View>
            </View>
          );
        }}
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  keyRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  keyControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  sourceModeRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sourceModeLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  sourceModeBtn: {
    paddingHorizontal: 10,
    gap: 4,
  },
  sourceModeBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  chordRow: {
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
  borrowedBadge: {
    fontSize: 11,
    fontWeight: "700",
  },
  allSharedText: {
    fontSize: 12,
    textAlign: "center",
    paddingTop: 16,
    paddingBottom: 8,
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
    borderCurve: "continuous",
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
  pickerSheet: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  modeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modeOptionLabel: {
    fontSize: 16,
  },
  absoluteHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingTop: SHEET_HANDLE_CLEARANCE,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerSide: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
});
