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
import { getCompatibleScales } from "../../../lib/harmonyUtils";
import {
  CHROMATIC_DEGREES,
  CHORD_TYPE_GROUPS,
  DEGREE_TO_OFFSET,
} from "../../Templates/TemplateFormSheet";
import NoteDegreeModeToggle from "../../../components/ui/NoteDegreeModeToggle";
import NoteSelectPage from "../../../components/ui/NoteSelectPage";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import PillButton from "../../../components/ui/PillButton";
import Icon from "../../../components/ui/Icon";
import { buildScaleOptions } from "../../../components/ui/scaleOptions";
import BottomSheetModal, {
  SHEET_HANDLE_CLEARANCE,
  useSheetHeight,
} from "../../../components/ui/BottomSheetModal";
import SheetProgressiveHeader from "../../../components/ui/SheetProgressiveHeader";
import GlassIconButton from "../../../components/ui/GlassIconButton";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import LayerDescription from "../../../components/LayerEditModal/LayerDescription";

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
  const sheetHeight = useSheetHeight();
  const borderColor = isDark ? colors.border : colors.border2;
  const calloutBorder = isDark ? colors.border2 : colors.borderStrong;

  const notes = getNotesByAccidental(accidental);
  const { groups } = buildScaleOptions(t);
  const isFull = layers.length >= MAX_LAYERS;

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
  const [modalHeaderHeight, setModalHeaderHeight] = useState(60);

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

  const sheetBg = colors.deepBg;

  return (
    <View style={[styles.root, { backgroundColor: colors.pageBg }]}>
      <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
        {step === "main" && (
          <>
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
                  maxHeight: calloutAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 300] }),
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
                    onChange={(v) => setSelectedChordGroup(v as "triad" | "seventh" | "tension")}
                    options={chordGroupOptions}
                    size="compact"
                    segmentWidth={84}
                  />
                  <View style={[styles.chipsRow, { marginTop: 16, justifyContent: "center" }]}>
                    {(
                      CHORD_TYPE_GROUPS.find((g) => g.labelKey === selectedChordGroup)?.types ?? []
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
                          <Text style={[styles.chipChordName, { color: colors.chipSelectedText }]}>
                            {chordLabel(chord)}
                          </Text>
                          <Text style={[styles.chipNoteNames, { color: colors.chipSelectedText }]}>
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
                                  <Text style={[styles.scaleName, { color: colors.textStrong }]}>
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
                                <Icon name="chevron-right" size={14} color={colors.textSubtle} />
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

      {/* Chord / Scale detail bottom sheet */}
      <BottomSheetModal visible={activeSheet !== null} onClose={() => setActiveSheet(null)}>
        {({ close, dragHandlers }) => {
          if (!activeSheet) return null;

          if (activeSheet.kind === "chord") {
            const { chord, index } = activeSheet;
            const title = chordLabel(chord);
            const chordRootIndex = (keyNoteIndex + (DEGREE_TO_OFFSET[chord.degree] ?? 0)) % 12;
            const forms = getAllChordForms(chordRootIndex, chord.chordType);
            const formWidth = Math.floor((winWidth - 32 - 8 * 2) / 3);
            const tmpChordLayer = createDefaultLayer("chord", "tmp", BLACK);
            tmpChordLayer.chordDisplayMode = "form";
            tmpChordLayer.chordType = chord.chordType;
            return (
              <View
                style={[
                  styles.sheet,
                  {
                    height: sheetHeight,
                    backgroundColor: sheetBg,
                    borderColor: colors.sheetBorder,
                  },
                ]}
              >
                <View style={{ flex: 1, overflow: "hidden" }}>
                  <ScrollView
                    contentContainerStyle={[styles.sheetContent, { paddingTop: modalHeaderHeight }]}
                    showsVerticalScrollIndicator={false}
                  >
                    {forms.length > 0 && (
                      <View style={styles.modalDiagrams}>
                        {forms.map((cells, fi) => (
                          <ChordDiagram
                            key={fi}
                            cells={cells}
                            rootIndex={chordRootIndex}
                            theme={theme}
                            width={formWidth}
                          />
                        ))}
                      </View>
                    )}
                    <View style={styles.descriptionArea}>
                      <LayerDescription theme={theme} layer={tmpChordLayer} itemOnly />
                    </View>
                    <View style={styles.chordActionRow}>
                      <PillButton
                        isDark={isDark}
                        onPress={() => {
                          handleAddChordToLayer(chord);
                          close();
                        }}
                        disabled={isFull}
                      >
                        <Icon name="upload" size={15} color={colors.textStrong} />
                        <Text style={[styles.addBtnText, { color: colors.textStrong }]}>
                          {t("finder.addToLayerTitle")}
                        </Text>
                      </PillButton>
                      <PillButton
                        isDark={isDark}
                        variant="danger"
                        onPress={() => {
                          handleRemove(index);
                          close();
                        }}
                      >
                        <Text style={[styles.addBtnText, { color: colors.textDanger }]}>
                          {t("finder.scaleCompat.removeChord")}
                        </Text>
                      </PillButton>
                    </View>
                    {isFull && (
                      <Text
                        style={[
                          styles.fullText,
                          { color: colors.textSubtle, paddingHorizontal: 16 },
                        ]}
                      >
                        {t("finder.addToLayerFull")}
                      </Text>
                    )}
                  </ScrollView>
                  <SheetProgressiveHeader
                    isDark={isDark}
                    bgColor={sheetBg}
                    dragHandlers={dragHandlers}
                    contentPaddingHorizontal={14}
                    onLayout={setModalHeaderHeight}
                    style={styles.absoluteHeader}
                  >
                    <View style={styles.headerRow}>
                      <GlassIconButton
                        isDark={isDark}
                        onPress={close}
                        icon="close"
                        style={styles.headerSide}
                      />
                      <View style={styles.headerCenter}>
                        <Text style={[styles.headerTitle, { color: colors.textStrong }]}>
                          {title}
                        </Text>
                      </View>
                      <View style={styles.headerSide} />
                    </View>
                  </SheetProgressiveHeader>
                </View>
              </View>
            );
          }

          // Scale detail sheet
          const { scaleType, label } = activeSheet;
          const tmpScaleLayer = createDefaultLayer("scale", "tmp", BLACK);
          tmpScaleLayer.scaleType = scaleType;
          return (
            <View
              style={[
                styles.sheet,
                { height: sheetHeight, backgroundColor: sheetBg, borderColor: colors.sheetBorder },
              ]}
            >
              <View style={{ flex: 1, overflow: "hidden" }}>
                <ScrollView
                  contentContainerStyle={[styles.sheetContent, { paddingTop: modalHeaderHeight }]}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.descriptionArea}>
                    <LayerDescription theme={theme} layer={tmpScaleLayer} itemOnly />
                  </View>
                  <View style={styles.addButtonArea}>
                    <PillButton
                      isDark={isDark}
                      onPress={() => {
                        handleAddToLayer(scaleType);
                        close();
                      }}
                      disabled={isFull}
                    >
                      <Icon name="upload" size={15} color={colors.textStrong} />
                      <Text style={[styles.addBtnText, { color: colors.textStrong }]}>
                        {t("finder.addToLayerTitle")}
                      </Text>
                    </PillButton>
                    {isFull && (
                      <Text style={[styles.fullText, { color: colors.textSubtle }]}>
                        {t("finder.addToLayerFull")}
                      </Text>
                    )}
                  </View>
                </ScrollView>
                <SheetProgressiveHeader
                  isDark={isDark}
                  bgColor={sheetBg}
                  dragHandlers={dragHandlers}
                  contentPaddingHorizontal={14}
                  onLayout={setModalHeaderHeight}
                  style={styles.absoluteHeader}
                >
                  <View style={styles.headerRow}>
                    <GlassIconButton
                      isDark={isDark}
                      onPress={close}
                      icon="close"
                      style={styles.headerSide}
                    />
                    <View style={styles.headerCenter}>
                      <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>
                        {noteKey}
                      </Text>
                      <Text style={[styles.headerTitle, { color: colors.textStrong }]}>
                        {label}
                      </Text>
                    </View>
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
  // Sheet styles
  sheet: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  sheetContent: {
    paddingBottom: 32,
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
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalDiagrams: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  descriptionArea: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chordActionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  addButtonArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
    alignItems: "center",
  },
  addBtnText: {},
  resetRow: {
    alignItems: "center",
  },
});
