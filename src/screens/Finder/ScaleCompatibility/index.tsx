import { useState, useMemo, useRef, useLayoutEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../../i18n";
import type {
  Accidental,
  Theme,
  ChordType,
  ProgressionChord,
  ScaleType,
  LayerConfig,
} from "../../../types";
import { createDefaultLayer, MAX_LAYERS } from "../../../types";
import { getColors, pickNextLayerColor, BLACK } from "../../../themes/design";
import {
  getNotesByAccidental,
  CHORD_SUFFIX_MAP,
  SCALE_DEGREES,
  CHORD_SEMITONES,
} from "../../../lib/fretboard";
import {
  getCompatibleScales,
  getChordsFromScale,
  chordDisplayName,
} from "../../../lib/harmonyUtils";
import {
  CHROMATIC_DEGREES,
  CHORD_TYPE_GROUPS,
  DEGREE_TO_OFFSET,
} from "../../Templates/TemplateFormSheet";
import NoteDegreeModeToggle from "../../../components/ui/NoteDegreeModeToggle";
import NoteSelectPage from "../../../components/ui/NoteSelectPage";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import PillButton from "../../../components/ui/PillButton";
import { buildScaleOptions } from "../../../components/ui/scaleOptions";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import LayerDescription from "../../../components/LayerEditModal/LayerDescription";
import FinderDetailSheet from "../../../components/ui/FinderDetailSheet";

const MAX_CHORDS = 8;

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

type SheetState =
  | { kind: "chord"; chord: ProgressionChord; index: number }
  | { kind: "scale"; scaleType: ScaleType; label: string };

interface ScaleCompatibilityProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

export default function ScaleCompatibility({
  theme,
  accidental,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: ScaleCompatibilityProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const borderColor = isDark ? colors.border : colors.border2;
  const calloutBorder = isDark ? colors.border2 : colors.borderStrong;

  const notes = getNotesByAccidental(accidental);
  const { groups } = buildScaleOptions(t);
  const isFull = layers.length >= MAX_LAYERS;

  const [directionMode, setDirectionMode] = useState<"chord-to-scale" | "scale-to-chord">(
    "chord-to-scale",
  );
  const [inputMode, setInputMode] = useState<"degree" | "note">("note");
  const [noteKey, setNoteKey] = useState("C");
  const [selectedDegree, setSelectedDegree] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [selectedChordGroup, setSelectedChordGroup] = useState<"triad" | "seventh" | "tension">(
    "triad",
  );
  const [chords, setChords] = useState<ProgressionChord[]>([]);
  const [step, setStep] = useState<"main" | "keySelect">("main");
  const [activeSheet, setActiveSheet] = useState<SheetState | null>(null);
  const [selectedScaleType, setSelectedScaleType] = useState<ScaleType | null>(null);
  const [scaleChordSize, setScaleChordSize] = useState<"triad" | "seventh">("triad");
  const [pendingDerivedChord, setPendingDerivedChord] = useState<{
    rootIndex: number;
    chordType: ChordType;
    degreeLabel: string;
  } | null>(null);

  const calloutAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pendingEnterDir = useRef(0);

  const keyNoteIndex = notes.findIndex((n) => n === noteKey);

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const dir = pendingEnterDir.current;
    if (dir !== 0) {
      pendingEnterDir.current = 0;
      slideAnim.stopAnimation();
      slideAnim.setValue(dir * winWidth);
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 120,
        friction: 20,
        useNativeDriver: false,
      }).start();
    }
  }, [step]);

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
    if (!selectedDegree || chords.length >= MAX_CHORDS) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const deg = selectedDegree;
    setChords((prev) => [...prev, { degree: deg, chordType }]);
    hideCallout(() => {
      setSelectedDegree(null);
      setSelectedNote(null);
    });
  };

  const handleRemove = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChords((prev) => prev.filter((_, i) => i !== index));
  };

  const chordsAbsolute = useMemo(
    () =>
      chords.map((c) => ({
        rootIndex: (keyNoteIndex + (DEGREE_TO_OFFSET[c.degree] ?? 0)) % 12,
        chordType: c.chordType,
      })),
    [chords, keyNoteIndex],
  );

  const allChordTonePCs = useMemo(() => {
    const pcs = new Set<number>();
    for (const ca of chordsAbsolute) {
      for (const s of CHORD_SEMITONES[ca.chordType] ?? new Set<number>()) {
        pcs.add((ca.rootIndex + s) % 12);
      }
    }
    return pcs;
  }, [chordsAbsolute]);

  const getChordNoteNames = (chord: ProgressionChord): string[] => {
    const rootIdx = (keyNoteIndex + (DEGREE_TO_OFFSET[chord.degree] ?? 0)) % 12;
    const semitones = [...(CHORD_SEMITONES[chord.chordType] ?? new Set<number>())].sort(
      (a, b) => a - b,
    );
    return semitones.map((s) => notes[(rootIdx + s) % 12]);
  };

  const getScaleNoteNames = (scaleType: ScaleType): string[] => {
    const degrees = SCALE_DEGREES[scaleType];
    if (!degrees) return [];
    return [...degrees].sort((a, b) => a - b).map((d) => notes[(keyNoteIndex + d) % 12]);
  };

  const compatibleScales = useMemo(
    () => new Set(getCompatibleScales(chordsAbsolute, keyNoteIndex)),
    [chordsAbsolute, keyNoteIndex],
  );

  const derivedChords = useMemo(
    () =>
      selectedScaleType ? getChordsFromScale(keyNoteIndex, selectedScaleType, scaleChordSize) : [],
    [selectedScaleType, keyNoteIndex, scaleChordSize],
  );

  const handleAddToLayer = (scaleType: ScaleType) => {
    if (isFull) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const color = pickNextLayerColor(layers);
    const layer = createDefaultLayer("scale", `layer-${Date.now()}`, color);
    layer.scaleType = scaleType;
    if (noteKey !== globalRootNote) {
      layer.layerRoot = noteKey;
      onEnablePerLayerRoot?.();
    }
    onAddLayerAndNavigate(layer);
  };

  const handleAddChordToLayer = (chord: ProgressionChord) => {
    if (isFull) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const color = pickNextLayerColor(layers);
    const layer = createDefaultLayer("chord", `layer-${Date.now()}`, color);
    layer.chordDisplayMode = "form";
    layer.chordType = chord.chordType;
    const chordRootNote = degreeToNote(chord.degree);
    if (chordRootNote !== globalRootNote) {
      layer.layerRoot = chordRootNote;
      onEnablePerLayerRoot?.();
    }
    onAddLayerAndNavigate(layer);
  };

  const handleAddDerivedChordToLayer = (chordRootIndex: number, chordType: ChordType) => {
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
  };

  const directionOptions = [
    { value: "chord-to-scale" as const, label: t("finder.scaleCompat.dirChordToScale") },
    { value: "scale-to-chord" as const, label: t("finder.scaleCompat.dirScaleToChord") },
  ];

  const scaleChordSizeOptions = [
    { value: "triad" as const, label: t("options.diatonicChordSize.triad") },
    { value: "seventh" as const, label: t("options.diatonicChordSize.seventh") },
  ];

  const chordGroupOptions = [
    { value: "triad" as const, label: t("options.diatonicChordSize.triad") },
    { value: "seventh" as const, label: t("options.diatonicChordSize.seventh") },
    { value: "tension" as const, label: t("templates.tension") },
  ];

  const chordLabel = (chord: ProgressionChord): string => {
    if (inputMode === "note") {
      const noteName = degreeToNote(chord.degree);
      const suffix = CHORD_SUFFIX_MAP[chord.chordType] ?? chord.chordType;
      return `${noteName}${suffix}`;
    }
    const deg = chord.degree.replace("b", "♭");
    const suffix = CHORD_SUFFIX_MAP[chord.chordType] ?? chord.chordType;
    return `${deg}${suffix}`;
  };

  const hasAnyCompatible =
    chords.length > 0 &&
    groups.some((g) => g.options.some((opt) => compatibleScales.has(opt.value)));

  const sheetDerivedData = useMemo(() => {
    if (!activeSheet) return null;
    if (activeSheet.kind === "chord") {
      const { chord, index } = activeSheet;
      const chordRootIndex = (keyNoteIndex + (DEGREE_TO_OFFSET[chord.degree] ?? 0)) % 12;
      const forms = getAllChordForms(chordRootIndex, chord.chordType);
      const formWidth = Math.floor((winWidth - 32 - 8 * 2) / 3);
      const tmpLayer = createDefaultLayer("chord", "tmp", BLACK);
      tmpLayer.chordDisplayMode = "form";
      tmpLayer.chordType = chord.chordType;
      return { kind: "chord" as const, chord, index, chordRootIndex, forms, formWidth, tmpLayer };
    }
    const { scaleType, label } = activeSheet;
    const tmpLayer = createDefaultLayer("scale", "tmp", BLACK);
    tmpLayer.scaleType = scaleType;
    return { kind: "scale" as const, scaleType, label, tmpLayer };
  }, [activeSheet, keyNoteIndex, winWidth]);

  return (
    <View style={[styles.root, { backgroundColor: colors.pageBg }]}>
      <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
        {step === "main" && (
          <>
            {/* Direction toggle */}
            <View style={[styles.directionRow, { borderBottomColor: borderColor }]}>
              <SegmentedToggle
                theme={theme}
                value={directionMode}
                onChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDirectionMode(v as "chord-to-scale" | "scale-to-chord");
                }}
                options={directionOptions}
                size="compact"
                segmentWidth={140}
              />
            </View>

            {directionMode === "chord-to-scale" && (
              <NoteDegreeModeToggle
                theme={theme}
                value={inputMode}
                onChange={(mode) => {
                  setInputMode(mode);
                  hideCallout(() => {
                    setSelectedDegree(null);
                    setSelectedNote(null);
                  });
                }}
              />
            )}

            <ScrollView
              contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
            >
              {/* Key picker */}
              <View style={styles.keyNavRow}>
                <TouchableOpacity
                  testID="key-nav-btn"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    pendingEnterDir.current = 1;
                    setStep("keySelect");
                  }}
                  activeOpacity={0.7}
                  style={[styles.keyPill, { backgroundColor: colors.surface, borderColor }]}
                >
                  <Text style={[styles.keyPillLabel, { color: colors.textSubtle }]}>
                    {t("templates.key")}
                  </Text>
                  <Text style={[styles.keyPillValue, { color: colors.textStrong }]}>{noteKey}</Text>
                </TouchableOpacity>
              </View>

              {directionMode === "scale-to-chord" && (
                <>
                  {/* Scale type picker */}
                  {groups.map((group) => (
                    <View key={group.title}>
                      <Text style={[styles.groupTitle, { color: colors.textSubtle }]}>
                        {group.title}
                      </Text>
                      <View style={[styles.chipsRow, { justifyContent: "flex-start" }]}>
                        {group.options.map((opt) => {
                          const isActive = selectedScaleType === opt.value;
                          return (
                            <TouchableOpacity
                              key={opt.value}
                              testID={`scale-type-chip-${opt.value}`}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectedScaleType(isActive ? null : opt.value);
                              }}
                              style={[
                                styles.pickerChip,
                                {
                                  backgroundColor: isActive ? colors.primaryBtn : colors.fillIdle,
                                  borderColor: isActive ? "transparent" : colors.borderStrong,
                                },
                              ]}
                              activeOpacity={0.7}
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
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}

                  {/* Derived chords */}
                  {selectedScaleType === null ? (
                    <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
                      {t("finder.scaleCompat.derivedChordsEmpty")}
                    </Text>
                  ) : (
                    <View style={[styles.card, { borderColor }]}>
                      <View
                        style={[
                          styles.cardHeader,
                          {
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          },
                        ]}
                      >
                        <Text style={[styles.cardTitle, { color: colors.textStrong }]}>
                          {noteKey}{" "}
                          {groups
                            .flatMap((g) => g.options)
                            .find((o) => o.value === selectedScaleType)?.label ?? selectedScaleType}
                        </Text>
                        <SegmentedToggle
                          theme={theme}
                          value={scaleChordSize}
                          onChange={(v) => setScaleChordSize(v as "triad" | "seventh")}
                          options={scaleChordSizeOptions}
                          size="compact"
                          segmentWidth={60}
                        />
                      </View>
                      {derivedChords.map((chord) => {
                        const chordNotes = [
                          ...(CHORD_SEMITONES[chord.chordType] ?? new Set<number>()),
                        ]
                          .sort((a, b) => a - b)
                          .map((s) => notes[(chord.rootIndex + s) % 12]);
                        return (
                          <TouchableOpacity
                            key={`${chord.degreeOffset}-${chord.chordType}`}
                            testID={`derived-chord-${chord.degreeLabel}`}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setPendingDerivedChord({
                                rootIndex: chord.rootIndex,
                                chordType: chord.chordType,
                                degreeLabel: chord.degreeLabel,
                              });
                            }}
                            style={[styles.scaleRow, { borderTopColor: borderColor }]}
                            activeOpacity={0.7}
                          >
                            <View style={styles.scaleInfo}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Text
                                  style={[styles.chipDegreeLabel, { color: colors.textSubtle }]}
                                >
                                  {chord.degreeLabel}
                                </Text>
                                <Text style={[styles.scaleName, { color: colors.textStrong }]}>
                                  {chordDisplayName(chord.rootIndex, chord.chordType, notes)}
                                </Text>
                              </View>
                              <View style={styles.noteChipsRow}>
                                {chordNotes.map((n) => (
                                  <View
                                    key={n}
                                    style={[
                                      styles.noteChip,
                                      { backgroundColor: colors.chipSelectedBg },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.noteChipText,
                                        { color: colors.chipSelectedText },
                                      ]}
                                    >
                                      {n}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                  {isFull && (
                    <Text style={[styles.fullText, { color: colors.textSubtle }]}>
                      {t("finder.addToLayerFull")}
                    </Text>
                  )}
                </>
              )}

              {directionMode === "chord-to-scale" && (
                <>
                  {/* Degree / note chips */}
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

                  {/* Chord type callout */}
                  <Animated.View
                    pointerEvents={selectedDegree ? "auto" : "none"}
                    style={{
                      opacity: calloutAnim,
                      maxHeight: calloutAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 300],
                      }),
                      overflow: "hidden",
                      marginTop: 8,
                    }}
                  >
                    <View
                      style={[
                        styles.callout,
                        { backgroundColor: colors.pageBg, borderColor: calloutBorder },
                      ]}
                    >
                      <SegmentedToggle
                        theme={theme}
                        value={selectedChordGroup}
                        onChange={(v) =>
                          setSelectedChordGroup(v as "triad" | "seventh" | "tension")
                        }
                        options={chordGroupOptions}
                        size="compact"
                        segmentWidth={84}
                      />
                      <View style={[styles.chipsRow, { marginTop: 16, justifyContent: "center" }]}>
                        {(
                          CHORD_TYPE_GROUPS.find((g) => g.labelKey === selectedChordGroup)?.types ??
                          []
                        ).map(([chordType, label]) => (
                          <TouchableOpacity
                            key={chordType}
                            testID={`chord-type-${chordType}`}
                            onPress={() => handleChordTypePress(chordType)}
                            disabled={chords.length >= MAX_CHORDS}
                            style={[
                              styles.chordTypeChip,
                              { backgroundColor: colors.pageBg, borderColor: colors.borderStrong },
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
                        ))}
                      </View>
                    </View>
                  </Animated.View>

                  {/* Added chords */}
                  {chords.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
                      {t("finder.scaleCompat.empty")}
                    </Text>
                  ) : (
                    <>
                      <View style={styles.chipsRow}>
                        {chords.map((chord, i) => (
                          <View
                            key={`${chord.degree}-${chord.chordType}-${i}`}
                            style={styles.progressionItem}
                          >
                            {i > 0 && (
                              <Text style={[styles.arrow, { color: colors.textSubtle }]}>+</Text>
                            )}
                            <TouchableOpacity
                              testID={`chord-chip-${i}`}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setActiveSheet({ kind: "chord", chord, index: i });
                              }}
                              style={[styles.addedChip, { backgroundColor: colors.chipSelectedBg }]}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[styles.chipChordName, { color: colors.chipSelectedText }]}
                              >
                                {chordLabel(chord)}
                              </Text>
                              <Text
                                style={[styles.chipNoteNames, { color: colors.chipSelectedText }]}
                              >
                                {getChordNoteNames(chord).join("  ")}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                      <View style={styles.resetRow}>
                        <PillButton
                          isDark={isDark}
                          variant="danger"
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            hideCallout(() => {
                              setSelectedDegree(null);
                              setSelectedNote(null);
                            });
                            setChords([]);
                          }}
                        >
                          <Text style={[styles.addBtnText, { color: colors.textDanger }]}>
                            {t("finder.scaleCompat.reset")}
                          </Text>
                        </PillButton>
                      </View>
                    </>
                  )}

                  {/* Compatible scale results */}
                  {chords.length > 0 && (
                    <>
                      {!hasAnyCompatible ? (
                        <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
                          {t("finder.scaleCompat.noResult")}
                        </Text>
                      ) : (
                        groups.map((group) => {
                          const compatibleOptions = group.options.filter((opt) =>
                            compatibleScales.has(opt.value),
                          );
                          if (compatibleOptions.length === 0) return null;
                          return (
                            <View key={group.title} style={[styles.card, { borderColor }]}>
                              <View style={styles.cardHeader}>
                                <Text style={[styles.cardTitle, { color: colors.textStrong }]}>
                                  {group.title}
                                </Text>
                              </View>
                              {compatibleOptions.map((opt) => {
                                const scaleNotes = getScaleNoteNames(opt.value);
                                return (
                                  <TouchableOpacity
                                    key={opt.value}
                                    testID={`scale-row-${opt.value}`}
                                    onPress={() => {
                                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                      setActiveSheet({
                                        kind: "scale",
                                        scaleType: opt.value,
                                        label: opt.label,
                                      });
                                    }}
                                    style={[styles.scaleRow, { borderTopColor: borderColor }]}
                                    activeOpacity={0.7}
                                  >
                                    <View style={styles.scaleInfo}>
                                      <Text
                                        style={[styles.scaleName, { color: colors.textStrong }]}
                                      >
                                        {opt.label}
                                      </Text>
                                      <View style={styles.noteChipsRow}>
                                        {scaleNotes.map((n) => {
                                          const isChordTone = allChordTonePCs.has(
                                            (notes as readonly string[]).indexOf(n),
                                          );
                                          return (
                                            <View
                                              key={n}
                                              style={[
                                                styles.noteChip,
                                                {
                                                  backgroundColor: isChordTone
                                                    ? colors.primaryBtn
                                                    : colors.chipUnselectedBg,
                                                },
                                              ]}
                                            >
                                              <Text
                                                style={[
                                                  styles.noteChipText,
                                                  {
                                                    color: isChordTone
                                                      ? colors.primaryBtnText
                                                      : colors.textDim,
                                                  },
                                                ]}
                                              >
                                                {n}
                                              </Text>
                                            </View>
                                          );
                                        })}
                                      </View>
                                    </View>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          );
                        })
                      )}
                      {isFull && (
                        <Text style={[styles.fullText, { color: colors.textSubtle }]}>
                          {t("finder.addToLayerFull")}
                        </Text>
                      )}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </>
        )}

        {step === "keySelect" && (
          <NoteSelectPage
            theme={theme}
            bgColor={colors.pageBg}
            title={t("templates.key")}
            notes={notes}
            selectedNote={noteKey}
            onSelect={(note) => {
              if (note !== noteKey) {
                setNoteKey(note);
                hideCallout(() => {
                  setSelectedDegree(null);
                  setSelectedNote(null);
                });
              }
            }}
            onBack={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              pendingEnterDir.current = -1;
              setStep("main");
            }}
          />
        )}
      </Animated.View>

      <FinderDetailSheet
        visible={activeSheet !== null}
        onClose={() => setActiveSheet(null)}
        theme={theme}
        title={
          sheetDerivedData
            ? sheetDerivedData.kind === "chord"
              ? chordLabel(sheetDerivedData.chord)
              : sheetDerivedData.label
            : ""
        }
        subtitle={sheetDerivedData?.kind === "scale" ? noteKey : undefined}
        mediaContent={
          sheetDerivedData?.kind === "chord" && sheetDerivedData.forms.length > 0 ? (
            <View style={styles.modalDiagrams}>
              {sheetDerivedData.forms.map((cells, fi) => (
                <ChordDiagram
                  key={fi}
                  cells={cells}
                  rootIndex={sheetDerivedData.chordRootIndex}
                  theme={theme}
                  width={sheetDerivedData.formWidth}
                />
              ))}
            </View>
          ) : null
        }
        description={
          sheetDerivedData ? (
            <LayerDescription theme={theme} layer={sheetDerivedData.tmpLayer} itemOnly />
          ) : null
        }
        isFull={isFull}
        onAddLayer={
          sheetDerivedData
            ? sheetDerivedData.kind === "chord"
              ? () => handleAddChordToLayer(sheetDerivedData.chord)
              : () => handleAddToLayer(sheetDerivedData.scaleType)
            : undefined
        }
        extraAction={
          sheetDerivedData?.kind === "chord"
            ? {
                label: t("finder.scaleCompat.removeChord"),
                variant: "danger",
                position: "after",
                onPress: () => handleRemove(sheetDerivedData.index),
              }
            : undefined
        }
      />

      {/* Derived chord detail sheet (scale-to-chord mode) */}
      <FinderDetailSheet
        visible={pendingDerivedChord !== null}
        onClose={() => setPendingDerivedChord(null)}
        theme={theme}
        title={
          pendingDerivedChord
            ? chordDisplayName(pendingDerivedChord.rootIndex, pendingDerivedChord.chordType, notes)
            : ""
        }
        topContent={
          pendingDerivedChord ? (
            <View style={{ paddingTop: 4 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: getColors(isDark).textSubtle }}
              >
                {pendingDerivedChord.degreeLabel}
              </Text>
            </View>
          ) : null
        }
        mediaContent={
          pendingDerivedChord &&
          getAllChordForms(pendingDerivedChord.rootIndex, pendingDerivedChord.chordType).length >
            0 ? (
            <View style={styles.modalDiagrams}>
              {getAllChordForms(pendingDerivedChord.rootIndex, pendingDerivedChord.chordType).map(
                (cells, fi) => (
                  <ChordDiagram
                    key={fi}
                    cells={cells}
                    rootIndex={pendingDerivedChord.rootIndex}
                    theme={theme}
                    width={Math.floor((winWidth - 32 - 8 * 2) / 3)}
                  />
                ),
              )}
            </View>
          ) : null
        }
        description={(() => {
          if (!pendingDerivedChord) return null;
          const tmp = createDefaultLayer("chord", "tmp", BLACK);
          tmp.chordDisplayMode = "form";
          tmp.chordType = pendingDerivedChord.chordType;
          return <LayerDescription theme={theme} layer={tmp} itemOnly />;
        })()}
        isFull={isFull}
        onAddLayer={
          pendingDerivedChord
            ? () =>
                handleAddDerivedChordToLayer(
                  pendingDerivedChord.rootIndex,
                  pendingDerivedChord.chordType,
                )
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  keyNavRow: {
    alignItems: "center",
  },
  keyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  keyPillLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  keyPillValue: {
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
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    marginBottom: 4,
  },
  chordTypeChip: {
    borderWidth: 2,
    borderRadius: 16,
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
    fontSize: 14,
    fontWeight: "600",
  },
  addedChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 56,
    gap: 3,
  },
  chipChordName: {
    fontSize: 14,
    fontWeight: "700",
  },
  chipNoteNames: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  cardHeader: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  scaleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  scaleInfo: {
    flex: 1,
    gap: 6,
  },
  scaleName: {
    fontSize: 14,
    fontWeight: "600",
  },
  noteChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  noteChip: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  noteChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  fullText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  modalDiagrams: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  addBtnText: {},
  resetRow: {
    alignItems: "center",
  },
  directionRow: {
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4,
  },
  chipDegreeLabel: {
    fontSize: 11,
    fontWeight: "600",
    minWidth: 32,
  },
});
