import { useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
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
} from "../../types";

const STRING_COUNT = 6;

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
}: FretboardProps) {
  const [fretMin, fretMax] = fretRange;
  const quizActive = quizModeActive && quizCell !== undefined;
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
                    borderColor: hideChordNoteLabels ? "rgba(14,165,233,0.7)" : `${chordColor}99`,
                    backgroundColor: hideChordNoteLabels
                      ? "rgba(14,165,233,0.1)"
                      : `${chordColor}14`,
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
}

function StringRow({
  theme,
  stringIdx,
  accidental,
  rootIndex,
  baseLabelMode,
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

        const isRoot = semitone === 0;
        const inChord = chordPositions.has(`${stringIdx}-${fret}`);
        const cagedCell = cagedPositions.get(`${stringIdx}-${fret}`);
        const labelText = baseLabelMode === "degree" ? degreeName : noteName;
        const isHighlighted =
          (baseLabelMode === "note" && highlightedNotes.has(noteName)) ||
          (baseLabelMode === "degree" && highlightedDegrees.has(degreeName));

        let overlayColor: string | null = null;
        if (showScale && isInScale(semitone, scaleType)) {
          overlayColor = scaleColor;
        }
        if (cagedCell) {
          overlayColor = cagedColor;
        }

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

            {/* Root ring */}
            {isRoot && !shouldSuppressRegularDisplay && (
              <View
                style={{
                  position: "absolute",
                  top: overlayInset,
                  left: overlayInset,
                  right: overlayInset,
                  bottom: overlayInset,
                  borderRadius: overlaySize / 2,
                  borderWidth: 2,
                  borderColor: "#ef4444",
                  zIndex: 18,
                }}
              />
            )}

            {/* Highlight ring */}
            {isHighlighted && (
              <View
                style={{
                  position: "absolute",
                  top: Math.max(0, overlayInset - 1),
                  left: Math.max(0, overlayInset - 1),
                  right: Math.max(0, overlayInset - 1),
                  bottom: Math.max(0, overlayInset - 1),
                  borderRadius: (overlaySize + 2) / 2,
                  borderWidth: 2,
                  borderColor: isDark ? "#93c5fd" : "#3b82f6",
                  zIndex: 25,
                }}
              />
            )}

            {/* Base label */}
            {!overlayColor && !inChord && !shouldSuppressRegularDisplay && (
              <Text
                style={{
                  fontSize: size.baseFontSize,
                  color: "#6b7280",
                  fontFamily: "monospace",
                  fontWeight: isHighlighted ? "bold" : "normal",
                  zIndex: 0,
                }}
              >
                {labelText}
              </Text>
            )}

            {/* Scale / CAGED overlay */}
            {overlayColor && !quizAnswerOverlay && !shouldRevealChoiceAnswer && !isSelectedCell && (
              <View
                style={{
                  position: "absolute",
                  top: overlayInset,
                  left: overlayInset,
                  right: overlayInset,
                  bottom: overlayInset,
                  borderRadius: overlaySize / 2,
                  backgroundColor: overlayColor,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  opacity: 0.85,
                }}
              >
                <Text
                  style={{
                    fontSize: size.overlayFontSize,
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  {labelText}
                </Text>
              </View>
            )}

            {/* Chord dot */}
            {inChord && !quizAnswerOverlay && (
              <View
                style={{
                  position: "absolute",
                  top: overlayInset,
                  left: overlayInset,
                  right: overlayInset,
                  bottom: overlayInset,
                  borderRadius: overlaySize / 2,
                  backgroundColor: chordColor,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 20,
                  opacity: 0.85,
                }}
              >
                <Text
                  style={{
                    fontSize: size.overlayFontSize,
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  {hideChordNoteLabels ? "?" : labelText}
                </Text>
              </View>
            )}

            {/* Quiz target */}
            {fret === quizTargetFret && !quizAnswerMode && (
              <View
                style={{
                  position: "absolute",
                  top: overlayInset,
                  left: overlayInset,
                  right: overlayInset,
                  bottom: overlayInset,
                  borderRadius: overlaySize / 2,
                  backgroundColor: "#0ea5e9",
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
                  ?
                </Text>
              </View>
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
                  borderColor: "rgba(56,189,248,0.5)",
                  zIndex: 15,
                }}
              />
            )}

            {/* Selected cell (multi-select) */}
            {isSelectedCell && !isAnswered && (
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
                  opacity: 0.9,
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
