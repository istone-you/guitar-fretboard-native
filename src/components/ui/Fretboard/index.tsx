import { useRef, useMemo, memo } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from "react-native";
import * as Haptics from "expo-haptics";
import {
  FRET_COUNT,
  POSITION_MARKS,
  getNoteIndex,
  getDegreeName,
  calcDegree,
  CHORD_FORMS_6TH,
  CHORD_FORMS_5TH,
  TRIAD_STRING_SET_OPTIONS,
  buildTriadVoicing,
  getDiatonicChord,
  getOpenChordForm,
  isInScale,
  getCagedFormCells,
  getChordLayerCells,
  getOnChordVoicings,
  DEGREE_TO_SEMITONE,
  getNotesByAccidental,
  CHORD_CAGED_ORDER,
  getRootIndex,
  PROGRESSION_TEMPLATES,
  resolveProgressionDegree,
  type FretCell,
} from "../../../lib/fretboard";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
import type { Theme, Accidental, BaseLabelMode, LayerConfig } from "../../../types";
import { MAX_LAYERS } from "../../../types";

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
  const stateRef = useRef<{
    opacity: Animated.Value;
    anim: Animated.CompositeAnimation;
  } | null>(null);
  if (stateRef.current == null) {
    const val = new Animated.Value(1);
    const anim = Animated.loop(
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
    );
    anim.start();
    stateRef.current = { opacity: val, anim };
  }
  // Stable ref callback: stops animation when view unmounts (ref becomes null)
  const cleanupRef = useRef((node: View | null) => {
    if (!node && stateRef.current) {
      stateRef.current.anim.stop();
      stateRef.current = null;
    }
  }).current;

  return (
    <Animated.View style={[style, { opacity: stateRef.current.opacity }]} ref={cleanupRef}>
      {children}
    </Animated.View>
  );
}

function TriggerBounceView({
  active,
  tick,
  children,
  style,
}: {
  active: boolean;
  tick: number;
  children: React.ReactNode;
  style?: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const prevTick = useRef(tick);

  if (active && tick !== prevTick.current) {
    prevTick.current = tick;
    scale.stopAnimation();
    scale.setValue(0.82);
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 190,
      useNativeDriver: true,
    }).start();
  } else if (!active) {
    prevTick.current = tick;
  }

  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

const LayerOverlayDot = memo(function LayerOverlayDot({
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

  // Bounce when label text changes (e.g. note ↔ degree switch)
  const textScale = useRef(new Animated.Value(1)).current;
  const prevLabelText = useRef(labelText);
  if (overlay && prevLabelText.current !== labelText) {
    prevLabelText.current = labelText;
    if (!disableAnimation) {
      textScale.stopAnimation();
      textScale.setValue(0.82);
      Animated.spring(textScale, {
        toValue: 1,
        friction: 5,
        tension: 150,
        useNativeDriver: true,
      }).start();
    }
  }

  const inset = overlayInset - 0.4 + idx * 2;

  return (
    <ScaleAnimView
      key={`layer-anim-${idx}-${remountSeed.current}`}
      skipAnimation={disableAnimation}
      visible={overlay != null}
      color={overlay?.color}
      style={{
        position: "absolute",
        top: inset,
        left: inset,
        right: inset,
        bottom: inset,
        borderRadius: overlaySize / 2,
        alignItems: "center",
        justifyContent: "center",
        zIndex: overlay?.zIndex ?? 12 + idx,
        opacity: 0.92,
      }}
    >
      {overlay && (
        <Animated.Text
          style={{
            fontSize: overlayFontSize,
            color: "#fff",
            fontWeight: "bold",
            transform: [{ scale: textScale }],
          }}
        >
          {labelText}
        </Animated.Text>
      )}
    </ScaleAnimView>
  );
});

const FRETBOARD_SIZE = {
  cellWidth: 34,
  rowHeight: 26,
  rowGap: 1,
  headerFontSize: 12,
  markHeight: 12,
  customSize: 4,
  customGap: 2,
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

export interface FretboardProps {
  theme: Theme;
  rootNote: string;
  accidental: Accidental;
  baseLabelMode: BaseLabelMode;
  fretRange: [number, number];
  onNoteClick: (noteName: string) => void;
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
  quizColor?: string;
  layers?: LayerConfig[];
  disableAnimation?: boolean;
  leftHanded?: boolean;
  onNoteLongPress?: (noteName: string) => void;
}

export default function Fretboard({
  theme,
  rootNote,
  accidental,
  baseLabelMode,
  fretRange,
  onNoteClick,
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
  quizColor,
  layers = [],
  disableAnimation = false,
  leftHanded = false,
  onNoteLongPress,
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
      } else if (layer.type === "caged") {
        const seen = new Set<string>();
        for (const key of CHORD_CAGED_ORDER) {
          if (!layer.cagedForms.has(key)) continue;
          for (const cell of getCagedFormCells(key, rootIndex, layer.cagedChordType)) {
            const k = `${cell.string}-${cell.fret}`;
            if (seen.has(k)) continue;
            seen.add(k);
            cells.push(cell);
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
            layer.onChordName,
          ),
        );
      } else if (layer.type === "custom") {
        const customNotes = getNotesByAccidental(accidental);
        // Convert selected degrees to semitone set for matching (supports tension degrees)
        const selectedSemitones =
          layer.customMode === "degree"
            ? new Set(
                [...layer.selectedDegrees]
                  .map((d) => DEGREE_TO_SEMITONE[d])
                  .filter((v) => v !== undefined),
              )
            : null;
        for (let s = 0; s < 6; s++) {
          for (let f = fretMin; f <= fretMax; f++) {
            const noteIdx = getNoteIndex(s, f);
            const noteName = customNotes[noteIdx];
            if (layer.customMode === "note" && layer.selectedNotes.has(noteName)) {
              cells.push({ string: s, fret: f });
            } else if (layer.customMode === "degree" && selectedSemitones) {
              const semitone = calcDegree(noteIdx, rootIndex);
              if (selectedSemitones.has(semitone)) {
                cells.push({ string: s, fret: f });
              }
            }
          }
        }
      } else if (layer.type === "progression") {
        const template = PROGRESSION_TEMPLATES.find(
          (t) => t.id === (layer.progressionTemplateId ?? "251"),
        );
        if (!template) return;
        const steps = template.degrees;
        const currentStep = Math.min(
          Math.max(layer.progressionCurrentStep ?? 0, 0),
          steps.length - 1,
        );
        const ghostColor = hexToRgba(layer.color, 0.3);

        const getStepCells = (stepIdx: number): FretCell[] => {
          const degree = steps[stepIdx];
          const chord = resolveProgressionDegree(
            rootIndex,
            layer.progressionKeyType ?? "major",
            layer.progressionChordSize ?? "seventh",
            degree,
          );
          return getChordLayerCells(chord.rootIndex, "form", chord.chordType, "root", "", degree);
        };

        // Ghost: previous step
        if (layer.progressionShowPrevGhost && currentStep > 0) {
          for (const cell of getStepCells(currentStep - 1)) {
            const cellKey = `${cell.string}-${cell.fret}`;
            if (!map.has(cellKey)) map.set(cellKey, []);
            map.get(cellKey)!.push({ color: ghostColor, zIndex: 11 + idx });
          }
        }
        // Ghost: next step
        if (layer.progressionShowNextGhost && currentStep < steps.length - 1) {
          for (const cell of getStepCells(currentStep + 1)) {
            const cellKey = `${cell.string}-${cell.fret}`;
            if (!map.has(cellKey)) map.set(cellKey, []);
            map.get(cellKey)!.push({ color: ghostColor, zIndex: 11 + idx });
          }
        }
        // Current step → pushed to cells, mapped to layer.color below
        cells.push(...getStepCells(currentStep));
      }
      for (const cell of cells) {
        const cellKey = `${cell.string}-${cell.fret}`;
        if (layer.type === "custom") {
          if (layer.hiddenCells.has(cellKey)) continue;
        }
        if (!map.has(cellKey)) map.set(cellKey, []);
        map.get(cellKey)!.push({ color: layer.color, zIndex: 12 + idx });
      }
    });
    return map;
  }, [layers, rootIndex, fretMin, fretMax, accidental]);

  // Chord groups from layer system (for border rendering)
  const layerChordGroups = useMemo(() => {
    const groups: { group: ChordGroup; color: string; visible: boolean }[] = [];
    for (const layer of layers) {
      if (!layer.enabled) continue;

      // CAGED layer type
      if (layer.type === "caged") {
        const color = layer.color;
        const frameVisible = layer.showChordFrame !== false;
        for (const key of CHORD_CAGED_ORDER) {
          if (!layer.cagedForms.has(key)) continue;
          const cells = getCagedFormCells(key, rootIndex, layer.cagedChordType);
          if (cells.length === 0) continue;
          const frets = cells.map((c) => c.fret);
          const strings = cells.map((c) => c.string);
          groups.push({
            group: {
              id: `layer-caged-${layer.id}-${key}`,
              kind: "caged",
              cells,
              minFret: Math.min(...frets),
              maxFret: Math.max(...frets),
              minString: Math.min(...strings),
              maxString: Math.max(...strings),
            },
            color,
            visible: frameVisible,
          });
        }
        continue;
      }

      if (
        layer.type !== "chord" &&
        !(layer.type === "progression" && layer.showChordFrame === true)
      )
        continue;
      const color = layer.color;
      const frameVisible = layer.showChordFrame !== false;
      const ri = rootIndex;

      if (layer.chordDisplayMode === "triad") {
        for (const opt of TRIAD_STRING_SET_OPTIONS) {
          const layoutValue = `${opt.value}-${layer.triadInversion}`;
          const cells = buildTriadVoicing(ri, layer.chordType, layoutValue);
          if (cells.length === 0) continue;
          const frets = cells.map((c) => c.fret);
          const strings = cells.map((c) => c.string);
          groups.push({
            group: {
              id: `layer-triad-${layer.id}-${opt.value}`,
              kind: "triad",
              cells,
              minFret: Math.min(...frets),
              maxFret: Math.max(...frets),
              minString: Math.min(...strings),
              maxString: Math.max(...strings),
            },
            color,
            visible: frameVisible,
          });
        }
        continue;
      }

      if (layer.chordDisplayMode === "on-chord") {
        const voicings = getOnChordVoicings(layer.onChordName);
        for (const [vi, voicing] of voicings.entries()) {
          if (voicing.length === 0) continue;
          const frets = voicing.map((c) => c.fret);
          const strings = voicing.map((c) => c.string);
          groups.push({
            group: {
              id: `layer-onchord-${layer.id}-${vi}`,
              kind: "on-chord",
              cells: voicing,
              minFret: Math.min(...frets),
              maxFret: Math.max(...frets),
              minString: Math.min(...strings),
              maxString: Math.max(...strings),
            },
            color,
            visible: frameVisible,
          });
        }
        continue;
      }

      let effRootIndex = ri;
      let effChordType = layer.chordType;
      if (layer.type === "progression") {
        const template = PROGRESSION_TEMPLATES.find(
          (t) => t.id === (layer.progressionTemplateId ?? "251"),
        );
        if (!template) continue;
        const currentStep = Math.min(
          Math.max(layer.progressionCurrentStep ?? 0, 0),
          template.degrees.length - 1,
        );
        const chord = resolveProgressionDegree(
          rootIndex,
          layer.progressionKeyType ?? "major",
          layer.progressionChordSize ?? "seventh",
          template.degrees[currentStep],
        );
        effRootIndex = chord.rootIndex;
        effChordType = chord.chordType;
      } else if (layer.chordDisplayMode === "diatonic") {
        const chord = getDiatonicChord(
          ri,
          `${layer.diatonicKeyType}-${layer.diatonicChordSize}`,
          layer.diatonicDegree,
        );
        effRootIndex = chord.rootIndex;
        effChordType = chord.chordType;
      }
      const effDisplayMode =
        layer.type === "progression" || layer.chordDisplayMode === "diatonic"
          ? "form"
          : layer.chordDisplayMode;

      const movable: ChordGroup[] = [0, 1].flatMap((rsi) => {
        const fullForm = (rsi === 0 ? CHORD_FORMS_6TH : CHORD_FORMS_5TH)[effChordType];
        if (!fullForm) return [];
        let rootFret = -1;
        for (let f = 0; f < FRET_COUNT; f++) {
          if (getNoteIndex(rsi, f) === effRootIndex) {
            rootFret = f;
            break;
          }
        }
        if (rootFret === -1) return [];
        const cells = fullForm
          .map(({ string, fretOffset }) => ({ string, fret: rootFret + fretOffset }))
          .filter(({ fret }) => fret >= 0 && fret < FRET_COUNT);
        if (cells.length === 0) return [];
        const frets = cells.map((c) => c.fret);
        const strings = cells.map((c) => c.string);
        return [
          {
            id: `layer-${layer.id}-${rsi}`,
            kind: rsi === 0 ? "6th" : "5th",
            rootStringIdx: rsi,
            cells,
            minFret: Math.min(...frets),
            maxFret: Math.max(...frets),
            minString: Math.min(...strings),
            maxString: Math.max(...strings),
          },
        ];
      });

      for (const g of movable) groups.push({ group: g, color, visible: frameVisible });

      if (effDisplayMode === "form") {
        const openForm = getOpenChordForm(effRootIndex, effChordType);
        if (openForm) {
          const openKey = openForm
            .map((c) => `${c.string}-${c.fret}`)
            .sort()
            .join("|");
          const overlaps = movable.some(
            (g) =>
              g.cells
                .map((c) => `${c.string}-${c.fret}`)
                .sort()
                .join("|") === openKey,
          );
          if (!overlaps) {
            const frets = openForm.map((c) => c.fret);
            const strings = openForm.map((c) => c.string);
            groups.push({
              group: {
                id: `layer-open-${layer.id}`,
                kind: "open",
                cells: openForm,
                minFret: Math.min(...frets),
                maxFret: Math.max(...frets),
                minString: Math.min(...strings),
                maxString: Math.max(...strings),
              },
              color,
              visible: frameVisible,
            });
          }
        }
      }
    }
    // Custom layer chord frames
    for (const layer of layers) {
      if (!layer.enabled || layer.type !== "custom" || layer.chordFrames.length === 0) continue;
      const color = layer.color;
      const frameVisible = true;
      for (const [frameIdx, frame] of layer.chordFrames.entries()) {
        if (frame.cells.length === 0) continue;
        const frameCells = frame.cells.map((key) => {
          const [s, f] = key.split("-").map(Number);
          return { string: s, fret: f };
        });
        const frets = frameCells.map((c) => c.fret);
        const strings = frameCells.map((c) => c.string);
        groups.push({
          group: {
            id: `layer-custom-frame-${layer.id}-${frameIdx}`,
            kind: "custom-frame",
            cells: frameCells,
            minFret: Math.min(...frets),
            maxFret: Math.max(...frets),
            minString: Math.min(...strings),
            maxString: Math.max(...strings),
          },
          color,
          visible: frameVisible,
        });
      }
    }

    return groups;
  }, [layers, rootIndex]);

  const visibleFrets = Array.from({ length: fretMax - fretMin + 1 }, (_, i) => fretMin + i);
  const displayFrets = leftHanded ? [...visibleFrets].reverse() : visibleFrets;

  const totalWidth = visibleFrets.length * size.cellWidth;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ width: totalWidth, marginLeft: 8 }}>
        {/* Fret number header */}
        <View style={styles.row}>
          {displayFrets.map((fret) => (
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

        {/* Position customs */}
        <View style={[styles.row, { marginBottom: 4 }]}>
          {displayFrets.map((fret) => {
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
                  gap: size.customGap,
                }}
              >
                {mark === "double" ? (
                  <>
                    <View
                      style={{
                        width: size.customSize,
                        height: size.customSize,
                        borderRadius: size.customSize / 2,
                        backgroundColor: isDark ? "#6b7280" : "#a8a29e",
                      }}
                    />
                    <View
                      style={{
                        width: size.customSize,
                        height: size.customSize,
                        borderRadius: size.customSize / 2,
                        backgroundColor: isDark ? "#6b7280" : "#a8a29e",
                      }}
                    />
                  </>
                ) : mark === "single" ? (
                  <View
                    style={{
                      width: size.customSize,
                      height: size.customSize,
                      borderRadius: size.customSize / 2,
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
          {layerChordGroups
            .filter(({ group }) => group.minFret >= fretMin && group.maxFret <= fretMax)
            .map(({ group, color, visible }) => {
              const top = (STRING_COUNT - 1 - group.maxString) * (size.rowHeight + size.rowGap);
              const left = leftHanded
                ? (fretMax - group.maxFret) * size.cellWidth
                : (group.minFret - fretMin) * size.cellWidth;
              const width = (group.maxFret - group.minFret + 1) * size.cellWidth;
              const height =
                (group.maxString - group.minString + 1) * size.rowHeight +
                (group.maxString - group.minString) * size.rowGap;

              return (
                <ScaleAnimView
                  key={group.id}
                  skipAnimation={disableAnimation}
                  visible={visible}
                  style={{
                    position: "absolute",
                    top,
                    left,
                    width,
                    height,
                    borderRadius: 12,
                    borderWidth: 2,
                    zIndex: 6,
                    borderColor: `${color}99`,
                    backgroundColor: `${color}14`,
                    pointerEvents: "none",
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
              size={size}
              visibleFrets={displayFrets}
              leftHanded={leftHanded}
              onNoteClick={onNoteClick}
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
              quizColor={quizColor}
              layerOverlays={layerOverlays}
              disableAnimation={disableAnimation}
              onNoteLongPress={onNoteLongPress}
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
  size: typeof FRETBOARD_SIZE;
  visibleFrets: number[];
  onNoteClick: (noteName: string) => void;

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
  quizColor?: string;
  layerOverlays?: Map<string, { color: string; zIndex: number }[]>;
  disableAnimation?: boolean;
  leftHanded?: boolean;
  onNoteLongPress?: (noteName: string) => void;
}

const StringRow = memo(function StringRow({
  theme,
  stringIdx,
  accidental,
  rootIndex,
  baseLabelMode,
  labelScale,
  size,
  visibleFrets,
  onNoteClick,

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
  quizColor,
  layerOverlays,
  disableAnimation = false,
  leftHanded = false,
  onNoteLongPress,
}: StringRowProps) {
  const isDark = theme === "dark";
  const NOTES = getNotesByAccidental(accidental);
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
        const degreeName = getDegreeName(noteIdx, rootIndex);

        const labelText = baseLabelMode === "degree" ? degreeName : noteName;

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

        const handleLongPress = onNoteLongPress
          ? () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onNoteLongPress(noteName);
            }
          : undefined;

        const overlayInset = size.overlayInset;
        const overlaySize = size.rowHeight - overlayInset * 2;
        const cellKey = `${stringIdx}-${fret}`;

        return (
          <TouchableOpacity
            key={fret}
            onPress={handlePress}
            onLongPress={handleLongPress}
            style={{
              width: size.cellWidth,
              height: size.rowHeight,
              alignItems: "center",
              justifyContent: "center",
              borderLeftWidth: fret === 0 && leftHanded ? 4 : 1,
              borderLeftColor:
                fret === 0 && leftHanded
                  ? isDark
                    ? "#d1d5db"
                    : "#78716c"
                  : isDark
                    ? "#4b5563"
                    : "#d6d3d1",
              ...(fret === 0 && !leftHanded
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

            {/* Base label */}
            {!shouldSuppressRegularDisplay && (
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

            {/* Layer system overlays */}
            <TriggerBounceView
              active={false}
              tick={0}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: "none",
                zIndex: 20,
              }}
            >
              {Array.from({ length: MAX_LAYERS }, (_, idx) => {
                const overlay = layerOverlays?.get(cellKey)?.[idx];
                return (
                  <LayerOverlayDot
                    key={`layer-slot-${idx}-r${rootIndex}`}
                    idx={idx}
                    overlay={overlay}
                    overlayInset={overlayInset}
                    overlaySize={overlaySize}
                    overlayFontSize={size.overlayFontSize}
                    labelText={hideChordNoteLabels ? "?" : labelText}
                    disableAnimation={disableAnimation}
                  />
                );
              })}
            </TriggerBounceView>

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
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
