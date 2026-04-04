import { useRef, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from "react-native";
import * as Haptics from "expo-haptics";
import {
  FRET_COUNT,
  NOTES_SHARP,
  NOTES_FLAT,
  POSITION_MARKS,
  getNoteIndex,
  getDegreeName,
  calcDegree,
  CHORD_FORMS_6TH,
  CHORD_FORMS_5TH,
  POWER_CHORD_FORMS,
  TRIAD_STRING_SET_OPTIONS,
  buildTriadVoicing,
  getDiatonicChord,
  getOpenChordForm,
  isInScale,
  calcCagedPositions,
  getCagedFormCells,
  getChordLayerCells,
  CHORD_CAGED_ORDER,
  getRootIndex,
  type FretCell,
  type CagedPositionValue,
} from "../../logic/fretboard";
import type {
  Theme,
  Accidental,
  BaseLabelMode,
  ChordDisplayMode,
  ScaleType,
  ChordType,
  LayerConfig,
} from "../../types";
import { MAX_LAYERS } from "../../types";

const STRING_COUNT = 6;

// Animated scale-in/out wrapper
function ScaleAnimView({
  children,
  style,
  visible,
  color,
  skipAnimation,
}: {
  children?: React.ReactNode;
  style: any;
  visible: boolean;
  color?: string;
  skipAnimation?: boolean;
}) {
  const scale = useRef(new Animated.Value(0)).current;
  const prevVisible = useRef(false);
  const lastColor = useRef(color);

  if (visible && color) lastColor.current = color;

  const runShowSpring = () => {
    if (skipAnimation) {
      scale.setValue(1);
      return;
    }
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  if (visible && !prevVisible.current) {
    prevVisible.current = true;
    scale.stopAnimation();
    runShowSpring();
  } else if (!visible && prevVisible.current) {
    prevVisible.current = false;
    scale.stopAnimation();
    if (skipAnimation) {
      scale.setValue(0);
    } else {
      Animated.spring(scale, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  }

  const bgStyle = lastColor.current
    ? {
        backgroundColor: lastColor.current,
        borderWidth: 1.5,
        borderColor: "rgba(0,0,0,0.15)",
      }
    : {};

  return (
    <Animated.View style={[style, bgStyle, { transform: [{ scale }] }]}>{children}</Animated.View>
  );
}

// Fade transition when text changes
function PulseView({ children, style }: { children: React.ReactNode; style: any }) {
  const opacity = useRef(
    (() => {
      const val = new Animated.Value(1);
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
      return val;
    })(),
  ).current;

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

function LayerOverlayDot({
  idx,
  overlay,
  overlayInset,
  overlaySize,
  overlayFontSize,
  labelText,
  disableAnimation,
}: {
  idx: number;
  overlay?: { color: string; zIndex: number };
  overlayInset: number;
  overlaySize: number;
  overlayFontSize: number;
  labelText: string;
  disableAnimation: boolean;
}) {
  const remountSeed = useRef(0);
  const prevColor = useRef<string | undefined>(overlay?.color);

  if (overlay?.color && prevColor.current && prevColor.current !== overlay.color) {
    remountSeed.current += 1;
  }
  if (overlay?.color) {
    prevColor.current = overlay.color;
  }

  return (
    <ScaleAnimView
      key={`layer-anim-${idx}-${remountSeed.current}`}
      skipAnimation={disableAnimation}
      visible={overlay != null}
      color={overlay?.color}
      style={{
        position: "absolute",
        top: overlayInset + idx * 2,
        left: overlayInset + idx * 2,
        right: overlayInset + idx * 2,
        bottom: overlayInset + idx * 2,
        borderRadius: overlaySize / 2,
        alignItems: "center",
        justifyContent: "center",
        zIndex: overlay?.zIndex ?? 12 + idx,
        opacity: 0.92,
      }}
    >
      {overlay && (
        <Text
          style={{
            fontSize: overlayFontSize,
            color: "#fff",
            fontWeight: "bold",
          }}
        >
          {labelText}
        </Text>
      )}
    </ScaleAnimView>
  );
}

const FRETBOARD_SIZE = {
  cellWidth: 34,
  rowHeight: 26,
  rowGap: 1,
  headerFontSize: 12,
  markHeight: 12,
  markerSize: 4,
  markerGap: 2,
  baseFontSize: 12,
  overlayFontSize: 12,
  rootRingInset: 1,
  overlayInset: 2,
  chordBorderWidth: 2,
} as const;

interface ChordGroup {
  id: string;
  kind: string;
  cells: FretCell[];
  minFret: number;
  maxFret: number;
  minString: number;
  maxString: number;
  rootStringIdx?: number;
}

function buildCellKey(cells: FretCell[]): string {
  return cells
    .map((cell) => `${cell.string}-${cell.fret}`)
    .sort()
    .join("|");
}

export interface FretboardProps {
  theme: Theme;
  rootNote: string;
  accidental: Accidental;
  baseLabelMode: BaseLabelMode;
  fretRange: [number, number];
  showChord: boolean;
  chordDisplayMode: ChordDisplayMode;
  showScale: boolean;
  scaleType: ScaleType;
  showCaged: boolean;
  cagedForms: Set<string>;
  chordType: ChordType;
  triadPosition: string;
  diatonicScaleType: string;
  diatonicDegree: string;
  onNoteClick: (noteName: string) => void;
  highlightedNotes?: Set<string>;
  highlightedDegrees?: Set<string>;
  quizModeActive?: boolean;
  quizCell?: { stringIdx: number; fret: number };
  quizAnswerMode?: boolean;
  quizTargetString?: number;
  quizAnsweredCell?: { stringIdx: number; fret: number } | null;
  quizCorrectCell?: { stringIdx: number; fret: number } | null;
  quizSelectedCells?: { stringIdx: number; fret: number }[];
  onQuizCellClick?: (stringIdx: number, fret: number) => void;
  quizRevealNoteNames?: string[] | null;
  suppressRegularDisplay?: boolean;
  hideChordNoteLabels?: boolean;
  chordColor?: string;
  scaleColor?: string;
  cagedColor?: string;
  quizColor?: string;
  layers?: LayerConfig[];
  disableAnimation?: boolean;
}

export default function Fretboard({
  theme,
  rootNote,
  accidental,
  baseLabelMode,
  fretRange,
  showChord,
  chordDisplayMode,
  showScale,
  scaleType,
  showCaged,
  cagedForms,
  chordType,
  triadPosition,
  diatonicScaleType,
  diatonicDegree,
  onNoteClick,
  highlightedNotes = new Set(),
  highlightedDegrees = new Set(),
  quizModeActive = false,
  quizCell,
  quizAnswerMode = false,
  quizTargetString,
  quizAnsweredCell,
  quizCorrectCell,
  quizSelectedCells = [],
  onQuizCellClick,
  quizRevealNoteNames = null,
  suppressRegularDisplay = false,
  hideChordNoteLabels = false,
  chordColor = "#ffd700",
  scaleColor = "#ff69b6",
  cagedColor = "#40e0d0",
  quizColor,
  layers = [],
  disableAnimation = false,
}: FretboardProps) {
  const [fretMin, fretMax] = fretRange;
  const quizActive = quizModeActive && quizCell !== undefined;

  // Label switch animation
  const labelScale = useRef(new Animated.Value(1)).current;
  const prevBaseLabelMode = useRef(baseLabelMode);
  const prevRootForDegree = useRef(rootNote);
  const labelChanged =
    prevBaseLabelMode.current !== baseLabelMode ||
    (baseLabelMode === "degree" && prevRootForDegree.current !== rootNote);
  prevBaseLabelMode.current = baseLabelMode;
  prevRootForDegree.current = rootNote;
  if (labelChanged) {
    if (!disableAnimation) {
      labelScale.setValue(0.8);
      Animated.spring(labelScale, {
        toValue: 1,
        friction: 5,
        tension: 150,
        useNativeDriver: true,
      }).start();
    }
  }
  const size = FRETBOARD_SIZE;
  const isDark = theme === "dark";
  const rootIndex = getRootIndex(rootNote);
  const diatonicChord =
    chordDisplayMode === "diatonic"
      ? getDiatonicChord(rootIndex, diatonicScaleType, diatonicDegree)
      : null;
  const effectiveDisplayMode = chordDisplayMode === "diatonic" ? "form" : chordDisplayMode;
  const effectiveRootIndex = diatonicChord != null ? diatonicChord.rootIndex : rootIndex;
  const effectiveChordType: ChordType = diatonicChord != null ? diatonicChord.chordType : chordType;

  const chordGroups = useMemo<ChordGroup[]>(() => {
    if (!showChord) return [];

    if (chordDisplayMode === "triad") {
      const groups: ChordGroup[] = [];
      for (const stringSetOpt of TRIAD_STRING_SET_OPTIONS) {
        const layoutValue = `${stringSetOpt.value}-${triadPosition}`;
        const cells = buildTriadVoicing(rootIndex, chordType, layoutValue);
        if (cells.length === 0) continue;
        const frets = cells.map((cell) => cell.fret);
        const strings = cells.map((cell) => cell.string);
        groups.push({
          id: `triad-${stringSetOpt.value}-${rootIndex}-${chordType}-${triadPosition}`,
          kind: "triad",
          cells,
          minFret: Math.min(...frets),
          maxFret: Math.max(...frets),
          minString: Math.min(...strings),
          maxString: Math.max(...strings),
        });
      }
      return groups;
    }

    if (chordDisplayMode === "caged") {
      const groups: ChordGroup[] = [];
      for (const key of CHORD_CAGED_ORDER) {
        if (!cagedForms.has(key)) continue;
        const cells = getCagedFormCells(key, rootIndex);
        if (cells.length === 0) continue;
        const frets = cells.map((c) => c.fret);
        const strings = cells.map((c) => c.string);
        groups.push({
          id: `caged-${key}-${rootIndex}`,
          kind: "caged",
          cells,
          minFret: Math.min(...frets),
          maxFret: Math.max(...frets),
          minString: Math.min(...strings),
          maxString: Math.max(...strings),
        });
      }
      return groups;
    }

    const movableGroups: ChordGroup[] = [0, 1].flatMap((rootStringIdx) => {
      const fullForm =
        effectiveDisplayMode === "power"
          ? POWER_CHORD_FORMS[rootStringIdx]
          : (rootStringIdx === 0 ? CHORD_FORMS_6TH : CHORD_FORMS_5TH)[effectiveChordType];
      if (!fullForm) return [];

      let rootFret = -1;
      for (let fret = 0; fret < FRET_COUNT; fret++) {
        if (getNoteIndex(rootStringIdx, fret) === effectiveRootIndex) {
          rootFret = fret;
          break;
        }
      }
      if (rootFret === -1) return [];

      const cells = fullForm
        .map(({ string, fretOffset }) => ({
          string,
          fret: rootFret + fretOffset,
        }))
        .filter(({ fret }) => fret >= 0 && fret < FRET_COUNT);
      if (cells.length === 0) return [];

      const frets = cells.map((cell) => cell.fret);
      const strings = cells.map((cell) => cell.string);
      return [
        {
          id: `${rootStringIdx}-${effectiveDisplayMode}-${effectiveChordType}-${effectiveRootIndex}`,
          kind: rootStringIdx === 0 ? "6th" : "5th",
          rootStringIdx,
          cells,
          minFret: Math.min(...frets),
          maxFret: Math.max(...frets),
          minString: Math.min(...strings),
          maxString: Math.max(...strings),
        },
      ];
    });

    if (effectiveDisplayMode !== "form") return movableGroups;

    const openForm = getOpenChordForm(effectiveRootIndex, effectiveChordType);
    if (!openForm) return movableGroups;
    const openFormKey = buildCellKey(openForm);
    const overlapsMovableGroup = movableGroups.some(
      (group) => buildCellKey(group.cells) === openFormKey,
    );
    if (overlapsMovableGroup) return movableGroups;

    const frets = openForm.map((cell) => cell.fret);
    const strings = openForm.map((cell) => cell.string);
    return [
      ...movableGroups,
      {
        id: `open-${effectiveChordType}-${effectiveRootIndex}`,
        kind: "open",
        cells: openForm,
        minFret: Math.min(...frets),
        maxFret: Math.max(...frets),
        minString: Math.min(...strings),
        maxString: Math.max(...strings),
      },
    ];
  }, [
    showChord,
    chordDisplayMode,
    rootIndex,
    chordType,
    triadPosition,
    effectiveDisplayMode,
    effectiveChordType,
    effectiveRootIndex,
    cagedForms,
  ]);

  const chordPositions = useMemo(() => {
    const set = new Set<string>();
    chordGroups.forEach((group) => {
      group.cells.forEach(({ string, fret }) => {
        set.add(`${string}-${fret}`);
      });
    });
    return set;
  }, [chordGroups]);

  const cagedPositions = useMemo(() => {
    if (!showCaged || cagedForms.size === 0) return new Map<string, CagedPositionValue>();
    const merged = new Map<string, CagedPositionValue>();
    for (const key of cagedForms) {
      for (const [cell, val] of calcCagedPositions(key, rootIndex)) {
        if (!merged.has(cell) || val.degree === "R") {
          merged.set(cell, val);
        }
      }
    }
    return merged;
  }, [showCaged, cagedForms, rootIndex]);

  // New layer system overlays
  const layerOverlays = useMemo(() => {
    const map = new Map<string, { color: string; zIndex: number }[]>();
    layers.forEach((layer, idx) => {
      if (!layer.enabled) return;
      const cells: { string: number; fret: number }[] = [];
      if (layer.type === "scale") {
        // Generate all cells where the note is in the scale
        for (let s = 0; s < 6; s++) {
          for (let f = fretMin; f <= fretMax; f++) {
            const noteIdx = getNoteIndex(s, f);
            const semitone = calcDegree(noteIdx, rootIndex);
            if (isInScale(semitone, layer.scaleType)) {
              cells.push({ string: s, fret: f });
            }
          }
        }
      } else if (layer.type === "chord") {
        const diatonicScale = `${layer.diatonicKeyType}-${layer.diatonicChordSize}`;
        cells.push(
          ...getChordLayerCells(
            rootIndex,
            layer.chordDisplayMode,
            layer.chordType,
            layer.triadInversion,
            diatonicScale,
            layer.diatonicDegree,
            layer.cagedForms,
          ),
        );
      }
      for (const cell of cells) {
        const key = `${cell.string}-${cell.fret}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ color: layer.color, zIndex: 12 + idx });
      }
    });
    return map;
  }, [layers, rootIndex, fretMin, fretMax]);

  const visibleFrets = Array.from({ length: fretMax - fretMin + 1 }, (_, i) => fretMin + i);

  const totalWidth = visibleFrets.length * size.cellWidth;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ width: totalWidth, marginLeft: 8 }}>
        {/* Fret number header */}
        <View style={styles.row}>
          {visibleFrets.map((fret) => (
            <View
              key={fret}
              style={{
                width: size.cellWidth,
                height: size.markHeight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: size.headerFontSize,
                  color: isDark ? "#6b7280" : "#78716c",
                  fontFamily: "monospace",
                }}
              >
                {fret}
              </Text>
            </View>
          ))}
        </View>

        {/* Position markers */}
        <View style={[styles.row, { marginBottom: 4 }]}>
          {visibleFrets.map((fret) => {
            const mark = POSITION_MARKS[fret];
            return (
              <View
                key={fret}
                style={{
                  width: size.cellWidth,
                  height: size.markHeight,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: size.markerGap,
                }}
              >
                {mark === "double" ? (
                  <>
                    <View
                      style={{
                        width: size.markerSize,
                        height: size.markerSize,
                        borderRadius: size.markerSize / 2,
                        backgroundColor: isDark ? "#6b7280" : "#a8a29e",
                      }}
                    />
                    <View
                      style={{
                        width: size.markerSize,
                        height: size.markerSize,
                        borderRadius: size.markerSize / 2,
                        backgroundColor: isDark ? "#6b7280" : "#a8a29e",
                      }}
                    />
                  </>
                ) : mark === "single" ? (
                  <View
                    style={{
                      width: size.markerSize,
                      height: size.markerSize,
                      borderRadius: size.markerSize / 2,
                      backgroundColor: isDark ? "#6b7280" : "#a8a29e",
                    }}
                  />
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Chord group overlays + string rows */}
        <View style={{ position: "relative" }}>
          {chordGroups
            .filter((group) => group.maxFret >= fretMin && group.minFret <= fretMax)
            .map((group) => {
              const clampedMin = Math.max(group.minFret, fretMin);
              const clampedMax = Math.min(group.maxFret, fretMax);
              const top = (STRING_COUNT - 1 - group.maxString) * (size.rowHeight + size.rowGap);
              const left = (clampedMin - fretMin) * size.cellWidth;
              const width = (clampedMax - clampedMin + 1) * size.cellWidth;
              const height =
                (group.maxString - group.minString + 1) * size.rowHeight +
                (group.maxString - group.minString) * size.rowGap;

              return (
                <View
                  key={group.id}
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top,
                    left,
                    width,
                    height,
                    borderRadius: 12,
                    borderWidth: 2,
                    zIndex: 6,
                    borderColor: `${chordColor}99`,
                    backgroundColor: `${chordColor}14`,
                  }}
                />
              );
            })}

          {Array.from({ length: STRING_COUNT }, (_, i) => STRING_COUNT - 1 - i).map((stringIdx) => (
            <StringRow
              key={stringIdx}
              theme={theme}
              stringIdx={stringIdx}
              accidental={accidental}
              rootIndex={rootIndex}
              baseLabelMode={baseLabelMode}
              labelScale={labelScale}
              showScale={showScale}
              scaleType={scaleType}
              cagedPositions={cagedPositions}
              chordPositions={chordPositions}
              size={size}
              visibleFrets={visibleFrets}
              onNoteClick={onNoteClick}
              highlightedNotes={highlightedNotes}
              highlightedDegrees={highlightedDegrees}
              quizActive={quizActive}
              quizTargetFret={quizCell?.stringIdx === stringIdx ? quizCell.fret : null}
              quizAnswerMode={quizAnswerMode}
              quizTargetString={quizTargetString}
              quizAnsweredCell={quizAnsweredCell}
              quizCorrectCell={quizCorrectCell}
              quizSelectedCells={quizSelectedCells}
              onQuizCellClick={onQuizCellClick}
              quizRevealNoteNames={quizRevealNoteNames}
              suppressRegularDisplay={suppressRegularDisplay}
              hideChordNoteLabels={hideChordNoteLabels}
              chordColor={chordColor}
              scaleColor={scaleColor}
              cagedColor={cagedColor}
              quizColor={quizColor}
              layerOverlays={layerOverlays}
              disableAnimation={disableAnimation}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

interface StringRowProps {
  theme: Theme;
  stringIdx: number;
  accidental: Accidental;
  rootIndex: number;
  baseLabelMode: BaseLabelMode;
  labelScale: Animated.Value;
  showScale: boolean;
  scaleType: ScaleType;
  cagedPositions: Map<string, CagedPositionValue>;
  chordPositions: Set<string>;
  size: typeof FRETBOARD_SIZE;
  visibleFrets: number[];
  onNoteClick: (noteName: string) => void;
  highlightedNotes: Set<string>;
  highlightedDegrees: Set<string>;
  quizActive: boolean;
  quizTargetFret: number | null;
  quizAnswerMode?: boolean;
  quizTargetString?: number;
  quizAnsweredCell?: { stringIdx: number; fret: number } | null;
  quizCorrectCell?: { stringIdx: number; fret: number } | null;
  quizSelectedCells?: { stringIdx: number; fret: number }[];
  onQuizCellClick?: (stringIdx: number, fret: number) => void;
  quizRevealNoteNames?: string[] | null;
  suppressRegularDisplay?: boolean;
  hideChordNoteLabels?: boolean;
  chordColor?: string;
  scaleColor?: string;
  cagedColor?: string;
  quizColor?: string;
  layerOverlays?: Map<string, { color: string; zIndex: number }[]>;
  disableAnimation?: boolean;
}

function StringRow({
  theme,
  stringIdx,
  accidental,
  rootIndex,
  baseLabelMode,
  labelScale,
  showScale,
  scaleType,
  cagedPositions,
  chordPositions,
  size,
  visibleFrets,
  onNoteClick,
  highlightedNotes,
  highlightedDegrees,
  quizActive,
  quizTargetFret,
  quizAnswerMode = false,
  quizTargetString,
  quizAnsweredCell,
  quizCorrectCell,
  quizSelectedCells = [],
  onQuizCellClick,
  quizRevealNoteNames,
  suppressRegularDisplay = false,
  hideChordNoteLabels = false,
  chordColor = "#ffd700",
  scaleColor = "#ff69b6",
  cagedColor = "#40e0d0",
  quizColor,
  layerOverlays,
  disableAnimation = false,
}: StringRowProps) {
  const isDark = theme === "dark";
  const NOTES = accidental === "sharp" ? NOTES_SHARP : NOTES_FLAT;
  const shouldSuppressRegularDisplay = suppressRegularDisplay || quizActive || quizAnswerMode;

  const isNonTargetString =
    quizAnswerMode && quizTargetString != null && stringIdx !== quizTargetString;
  const isTargetString =
    quizAnswerMode && (quizTargetString == null || stringIdx === quizTargetString);

  return (
    <View style={[styles.row, { marginBottom: size.rowGap, opacity: isNonTargetString ? 0.3 : 1 }]}>
      {visibleFrets.map((fret) => {
        const noteIdx = getNoteIndex(stringIdx, fret);
        const noteName = NOTES[noteIdx];
        const semitone = calcDegree(noteIdx, rootIndex);
        const degreeName = getDegreeName(noteIdx, rootIndex);

        const inChord = chordPositions.has(`${stringIdx}-${fret}`);
        const cagedCell = cagedPositions.get(`${stringIdx}-${fret}`);
        const labelText = baseLabelMode === "degree" ? degreeName : noteName;
        const isHighlighted =
          (baseLabelMode === "note" && highlightedNotes.has(noteName)) ||
          (baseLabelMode === "degree" && highlightedDegrees.has(degreeName));

        const inScale = showScale && isInScale(semitone, scaleType);
        const inCaged = !!cagedCell;
        // For non-animated logic, keep combined overlayColor
        let overlayColor: string | null = null;
        if (inScale) overlayColor = scaleColor;
        if (inCaged) overlayColor = cagedColor;

        const isAnswered = quizAnswerMode && quizAnsweredCell != null;
        const isTappedCell =
          isAnswered &&
          quizAnsweredCell?.stringIdx === stringIdx &&
          quizAnsweredCell?.fret === fret;
        const isCorrectCell =
          isAnswered && quizCorrectCell?.stringIdx === stringIdx && quizCorrectCell?.fret === fret;
        const isSelectedCell = quizSelectedCells.some(
          (cell) => cell.stringIdx === stringIdx && cell.fret === fret,
        );
        const shouldRevealChoiceAnswer =
          quizRevealNoteNames != null && quizRevealNoteNames.includes(noteName);

        let quizAnswerOverlay: "correct" | "wrong" | "correct-hint" | null = null;
        if (isTappedCell) {
          quizAnswerOverlay = isCorrectCell ? "correct" : "wrong";
        } else if (isCorrectCell && !isTappedCell) {
          quizAnswerOverlay = "correct-hint";
        }

        const handlePress = () => {
          if (quizAnswerMode) {
            if (isTargetString && !isAnswered && onQuizCellClick) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onQuizCellClick(stringIdx, fret);
            }
            return;
          }
          onNoteClick(noteName);
        };

        const overlayInset = size.overlayInset;
        const overlaySize = size.rowHeight - overlayInset * 2;

        return (
          <TouchableOpacity
            key={fret}
            onPress={handlePress}
            style={{
              width: size.cellWidth,
              height: size.rowHeight,
              alignItems: "center",
              justifyContent: "center",
              borderLeftWidth: 1,
              borderLeftColor: isDark ? "#4b5563" : "#d6d3d1",
              ...(fret === 0
                ? {
                    borderRightWidth: 4,
                    borderRightColor: isDark ? "#d1d5db" : "#78716c",
                  }
                : {}),
              position: "relative",
            }}
            activeOpacity={0.7}
          >
            {/* Guitar string line */}
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: isDark ? "#6b7280" : "#a8a29e",
              }}
            />

            {/* Highlight ring */}
            <ScaleAnimView
              skipAnimation={disableAnimation}
              visible={isHighlighted}
              style={{
                position: "absolute",
                top: overlayInset - 2,
                left: overlayInset - 2,
                right: overlayInset - 2,
                bottom: overlayInset - 2,
                borderRadius: (overlaySize + 4) / 2,
                borderWidth: 2,
                borderColor: isDark ? "#e5e7eb" : "#1c1917",
                zIndex: 25,
              }}
            />

            {/* Base label */}
            {!overlayColor && !inChord && !shouldSuppressRegularDisplay && (
              <Animated.View
                style={{
                  backgroundColor: isDark ? "#111827" : "#f5f5f4",
                  borderRadius:
                    (baseLabelMode === "degree" ? overlaySize - 4 : overlaySize - 8) / 2,
                  width: baseLabelMode === "degree" ? overlaySize - 4 : overlaySize - 8,
                  height: baseLabelMode === "degree" ? overlaySize - 4 : overlaySize - 8,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 0,
                  transform: [{ scale: labelScale }],
                }}
              >
                <Text
                  style={{
                    fontSize: size.baseFontSize,
                    color: "#6b7280",
                    fontFamily: "monospace",
                    fontWeight: "500",
                  }}
                >
                  {labelText}
                </Text>
              </Animated.View>
            )}

            {/* Scale overlay (behind CAGED) */}
            {!quizAnswerOverlay && !shouldRevealChoiceAnswer && !isSelectedCell && (
              <ScaleAnimView
                key={`scale-${scaleColor}`}
                skipAnimation={disableAnimation}
                visible={inScale}
                color={scaleColor}
                style={{
                  position: "absolute",
                  top: overlayInset,
                  left: overlayInset,
                  right: overlayInset,
                  bottom: overlayInset,
                  borderRadius: overlaySize / 2,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  opacity: 0.92,
                }}
              >
                <Animated.Text
                  style={{
                    fontSize: size.overlayFontSize,
                    color: "#fff",
                    fontWeight: "bold",
                    transform: [{ scale: labelScale }],
                  }}
                >
                  {labelText}
                </Animated.Text>
              </ScaleAnimView>
            )}
            {/* CAGED overlay (in front of scale) */}
            {!quizAnswerOverlay && !shouldRevealChoiceAnswer && !isSelectedCell && (
              <ScaleAnimView
                key={`caged-${cagedColor}`}
                skipAnimation={disableAnimation}
                visible={inCaged}
                color={cagedColor}
                style={{
                  position: "absolute",
                  top: overlayInset,
                  left: overlayInset,
                  right: overlayInset,
                  bottom: overlayInset,
                  borderRadius: overlaySize / 2,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 11,
                  opacity: 0.92,
                }}
              >
                <Animated.Text
                  style={{
                    fontSize: size.overlayFontSize,
                    color: "#fff",
                    fontWeight: "bold",
                    transform: [{ scale: labelScale }],
                  }}
                >
                  {labelText}
                </Animated.Text>
              </ScaleAnimView>
            )}

            {/* Chord dot */}
            {!quizAnswerOverlay && (
              <ScaleAnimView
                key={`chord-${chordColor}`}
                skipAnimation={disableAnimation}
                visible={inChord}
                color={chordColor}
                style={{
                  position: "absolute",
                  top: overlayInset,
                  left: overlayInset,
                  right: overlayInset,
                  bottom: overlayInset,
                  borderRadius: overlaySize / 2,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 20,
                  opacity: 0.92,
                }}
              >
                <Animated.Text
                  style={{
                    fontSize: size.overlayFontSize,
                    color: "#fff",
                    fontWeight: "bold",
                    transform: [{ scale: labelScale }],
                  }}
                >
                  {hideChordNoteLabels ? "?" : labelText}
                </Animated.Text>
              </ScaleAnimView>
            )}

            {/* New layer system overlays */}
            {Array.from({ length: MAX_LAYERS }, (_, idx) => {
              const overlay = layerOverlays?.get(`${stringIdx}-${fret}`)?.[idx];
              return (
                <LayerOverlayDot
                  key={`layer-slot-${idx}`}
                  idx={idx}
                  overlay={overlay}
                  overlayInset={overlayInset}
                  overlaySize={overlaySize}
                  overlayFontSize={size.overlayFontSize}
                  labelText={labelText}
                  disableAnimation={disableAnimation}
                />
              );
            })}

            {/* Quiz target (pulsing) */}
            {fret === quizTargetFret && !quizAnswerMode && (
              <PulseView
                style={{
                  position: "absolute",
                  top: overlayInset,
                  left: overlayInset,
                  right: overlayInset,
                  bottom: overlayInset,
                  borderRadius: overlaySize / 2,
                  backgroundColor: quizColor ?? (isDark ? "#e5e7eb" : "#1c1917"),
                  borderWidth: 1.5,
                  borderColor: "rgba(0,0,0,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 30,
                }}
              >
                <Text
                  style={{
                    fontSize: size.overlayFontSize,
                    color: quizColor ? "#fff" : isDark ? "#1c1917" : "#fff",
                    fontWeight: "bold",
                  }}
                >
                  ?
                </Text>
              </PulseView>
            )}

            {/* Quiz fretboard target hint ring */}
            {quizAnswerMode && isTargetString && !isAnswered && (
              <View
                style={{
                  position: "absolute",
                  top: overlayInset,
                  left: overlayInset,
                  right: overlayInset,
                  bottom: overlayInset,
                  borderRadius: overlaySize / 2,
                  borderWidth: 2,
                  borderColor: isDark ? "rgba(229,231,235,0.5)" : "rgba(28,25,23,0.5)",
                  zIndex: 15,
                }}
              />
            )}

            {/* Selected cell (multi-select) */}
            {!isAnswered && (
              <ScaleAnimView
                skipAnimation={disableAnimation}
                visible={isSelectedCell}
                color={quizColor ?? (isDark ? "#e5e7eb" : "#1c1917")}
                style={{
                  position: "absolute",
                  top: overlayInset,
                  left: overlayInset,
                  right: overlayInset,
                  bottom: overlayInset,
                  borderRadius: overlaySize / 2,
                  zIndex: 29,
                  opacity: 0.9,
                }}
              />
            )}

            {/* Choice answer reveal */}
            {shouldRevealChoiceAnswer && (
              <View
                style={{
                  position: "absolute",
                  top: overlayInset,
                  left: overlayInset,
                  right: overlayInset,
                  bottom: overlayInset,
                  borderRadius: overlaySize / 2,
                  backgroundColor: "#16a34a",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 29,
                  opacity: 0.75,
                }}
              >
                <Text
                  style={{
                    fontSize: size.overlayFontSize,
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  {noteName}
                </Text>
              </View>
            )}

            {/* Quiz answer overlays */}
            {quizAnswerOverlay === "correct" && (
              <View
                style={{
                  position: "absolute",
                  top: overlayInset,
                  left: overlayInset,
                  right: overlayInset,
                  bottom: overlayInset,
                  borderRadius: overlaySize / 2,
                  backgroundColor: "#16a34a",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 30,
                }}
              >
                <Text
                  style={{
                    fontSize: size.overlayFontSize,
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  {noteName}
                </Text>
              </View>
            )}
            {quizAnswerOverlay === "wrong" && (
              <View
                style={{
                  position: "absolute",
                  top: overlayInset,
                  left: overlayInset,
                  right: overlayInset,
                  bottom: overlayInset,
                  borderRadius: overlaySize / 2,
                  backgroundColor: "#ef4444",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 30,
                }}
              >
                <Text
                  style={{
                    fontSize: size.overlayFontSize,
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  {noteName}
                </Text>
              </View>
            )}
            {quizAnswerOverlay === "correct-hint" && (
              <View
                style={{
                  position: "absolute",
                  top: overlayInset,
                  left: overlayInset,
                  right: overlayInset,
                  bottom: overlayInset,
                  borderRadius: overlaySize / 2,
                  backgroundColor: "#16a34a",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 29,
                  opacity: 0.7,
                }}
              >
                <Text
                  style={{
                    fontSize: size.overlayFontSize,
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  {noteName}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
