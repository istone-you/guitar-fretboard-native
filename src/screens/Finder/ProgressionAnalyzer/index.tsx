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
import type { Accidental, Theme, ChordType, ProgressionChord } from "../../../types";
import { getColors, DIATONIC_FUNCTION_COLORS } from "../../../themes/design";
import {
  getNotesByAccidental,
  CHORD_SUFFIX_MAP,
  PROGRESSION_TEMPLATES,
  resolveProgressionDegree,
} from "../../../lib/fretboard";
import { analyzeProgression, chordDisplayName } from "../../../lib/harmonyUtils";
import TemplateFormSheet, {
  CHROMATIC_DEGREES,
  CHORD_TYPE_GROUPS,
  DEGREE_TO_OFFSET,
} from "../../Templates/TemplateFormSheet";
import type { CustomProgressionTemplate } from "../../../hooks/useProgressionTemplates";
import NoteDegreeModeToggle from "../../../components/ui/NoteDegreeModeToggle";
import NoteSelectPage from "../../../components/ui/NoteSelectPage";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import PillButton from "../../../components/ui/PillButton";
import Icon from "../../../components/ui/Icon";
import Svg, { Path } from "react-native-svg";
import { ON_ACCENT, WHITE } from "../../../themes/design";
import BottomSheetModal, {
  SHEET_HANDLE_CLEARANCE,
  useSheetHeight,
} from "../../../components/ui/BottomSheetModal";
import SheetProgressiveHeader from "../../../components/ui/SheetProgressiveHeader";
import GlassIconButton from "../../../components/ui/GlassIconButton";

const MAX_CHORDS = 16;

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

interface ProgressionAnalyzerProps {
  theme: Theme;
  accidental: Accidental;
  initialChords?: ProgressionChord[];
  initialNoteKey?: string;
  customTemplates: CustomProgressionTemplate[];
  onSaveTemplate: (name: string, chords: ProgressionChord[]) => string;
}

export default function ProgressionAnalyzer({
  theme,
  accidental,
  initialChords,
  initialNoteKey,
  customTemplates,
  onSaveTemplate,
}: ProgressionAnalyzerProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const borderColor = isDark ? colors.border : colors.border2;
  const calloutBorder = isDark ? colors.border2 : colors.borderStrong;

  const notes = getNotesByAccidental(accidental);
  const sheetHeight = useSheetHeight();

  const [inputMode, setInputMode] = useState<"degree" | "note">("note");
  const [noteKey, setNoteKey] = useState(initialNoteKey ?? "C");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [selectedDegree, setSelectedDegree] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [selectedChordGroup, setSelectedChordGroup] = useState<"triad" | "seventh" | "tension">(
    "triad",
  );
  const [chords, setChords] = useState<ProgressionChord[]>(initialChords ?? []);
  const [step, setStep] = useState<"main" | "keySelect">("main");

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

  const handleLoadTemplate = (templateChords: ProgressionChord[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChords(templateChords);
    hideCallout(() => {
      setSelectedDegree(null);
      setSelectedNote(null);
    });
    setShowTemplatePicker(false);
  };

  const templateChordsFrom = (tpl: (typeof PROGRESSION_TEMPLATES)[number]): ProgressionChord[] => {
    if (tpl.chords) return tpl.chords;
    return (tpl.degrees ?? []).map((d) => {
      const { rootIndex, chordType } = resolveProgressionDegree(0, d);
      return { degree: OFFSET_TO_DEGREE[rootIndex] ?? "I", chordType };
    });
  };

  const chordsForAnalysis = useMemo(
    () =>
      chords.map((c) => ({
        rootIndex: (keyNoteIndex + (DEGREE_TO_OFFSET[c.degree] ?? 0)) % 12,
        chordType: c.chordType,
      })),
    [chords, keyNoteIndex],
  );

  const analysisResults = useMemo(() => {
    if (chordsForAnalysis.length === 0) return [];
    return analyzeProgression(chordsForAnalysis);
  }, [chordsForAnalysis]);

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
              {/* Template load button */}
              <View style={styles.templateRow}>
                <TouchableOpacity
                  testID="load-template-btn"
                  onPress={() => setShowTemplatePicker(true)}
                  activeOpacity={0.7}
                  style={[styles.templateBtn, { backgroundColor: colors.surface, borderColor }]}
                >
                  <Icon name="bar-chart" size={13} color={colors.textSubtle} />
                  <Text style={[styles.templateBtnText, { color: colors.textSubtle }]}>
                    {t("finder.progressionAnalysis.loadTemplate")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Key picker (note mode only) */}
              {inputMode === "note" && (
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
                    <Text style={[styles.keyPillValue, { color: colors.textStrong }]}>
                      {noteKey}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

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
                  {t("finder.progressionAnalysis.empty")}
                </Text>
              ) : (
                <View style={styles.chipsRow}>
                  {chords.map((chord, i) => (
                    <View
                      key={`${chord.degree}-${chord.chordType}-${i}`}
                      style={styles.progressionItem}
                    >
                      {i > 0 && <Text style={[styles.arrow, { color: colors.textSubtle }]}>→</Text>}
                      <TouchableOpacity
                        testID={`chord-chip-${i}`}
                        onPress={() => handleRemove(i)}
                        style={[
                          styles.addedChip,
                          {
                            backgroundColor: isDark ? colors.textMuted : colors.textSubtle,
                            borderColor: "transparent",
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pickerChipText, { color: WHITE }]}>
                          {chordLabel(chord)}
                        </Text>
                        <Svg
                          width={8}
                          height={8}
                          viewBox="0 0 12 12"
                          fill="none"
                          style={{ marginLeft: 4 }}
                        >
                          <Path
                            d="M9 3L3 9M3 3l6 6"
                            stroke={ON_ACCENT.iconStroke}
                            strokeWidth={1.8}
                            strokeLinecap="round"
                          />
                        </Svg>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Save / Reset buttons */}
              {chords.length > 0 && (
                <View style={styles.analyzeRow}>
                  <PillButton
                    isDark={isDark}
                    style={styles.btn}
                    onPress={() => setShowSaveSheet(true)}
                  >
                    <Text style={[styles.btnText, { color: colors.textStrong }]}>
                      {t("finder.progressionAnalysis.save")}
                    </Text>
                  </PillButton>
                  <PillButton
                    isDark={isDark}
                    variant="danger"
                    style={styles.btn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setChords([]);
                      hideCallout(() => {
                        setSelectedDegree(null);
                        setSelectedNote(null);
                      });
                    }}
                  >
                    <Text style={[styles.btnText, { color: colors.textDanger }]}>
                      {t("finder.progressionAnalysis.reset")}
                    </Text>
                  </PillButton>
                </View>
              )}

              {/* Results */}
              {chords.length > 0 && analysisResults.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
                  {t("finder.progressionAnalysis.noResult")}
                </Text>
              )}
              {analysisResults.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { color: colors.textSubtle }]}>
                    {t("finder.progressionAnalysis.result")}
                  </Text>

                  {/* Legend */}
                  <View style={[styles.legend, { borderColor }]}>
                    {(
                      [
                        {
                          badge: "T",
                          bg: DIATONIC_FUNCTION_COLORS.T,
                          text: "#ffffff",
                          label: t("finder.progressionAnalysis.legendT"),
                        },
                        {
                          badge: "SD",
                          bg: DIATONIC_FUNCTION_COLORS.SD,
                          text: "#ffffff",
                          label: t("finder.progressionAnalysis.legendSD"),
                        },
                        {
                          badge: "D",
                          bg: DIATONIC_FUNCTION_COLORS.D,
                          text: "#ffffff",
                          label: t("finder.progressionAnalysis.legendD"),
                        },
                        {
                          badge: "V/x",
                          bg: colors.secDomBadgeBg,
                          text: colors.secDomBadgeText,
                          label: t("finder.progressionAnalysis.legendSecDom"),
                        },
                        {
                          badge: t("finder.progressionAnalysis.borrowed", { degree: "x" }),
                          bg: colors.borrowedBadgeBg,
                          text: colors.borrowedBadgeText,
                          label: t("finder.progressionAnalysis.legendBorrowed"),
                        },
                      ] as const
                    ).map(({ badge, bg, text, label }) => (
                      <View key={badge} style={styles.legendRow}>
                        <View style={[styles.fnBadge, { backgroundColor: bg }]}>
                          <Text style={[styles.fnText, { color: text }]}>{badge}</Text>
                        </View>
                        <Text style={[styles.legendLabel, { color: colors.textSubtle }]}>
                          {label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {analysisResults.map((result, ri) => {
                    const keyName = `${notes[result.rootIndex]} ${result.keyType === "major" ? "Major" : "Minor"}`;
                    const matched = result.chords.filter((c) => c.isDiatonic).length;
                    const total = result.chords.length;
                    return (
                      <View key={ri} style={[styles.card, { borderColor }]}>
                        <View style={styles.resultHeader}>
                          <Text style={[styles.keyName, { color: colors.textStrong }]}>
                            {keyName}
                          </Text>
                          <Text style={[styles.scoreText, { color: colors.textSubtle }]}>
                            {t("finder.progressionAnalysis.keyScore", {
                              matched: String(matched),
                              total: String(total),
                            })}
                          </Text>
                        </View>
                        <View style={styles.chipsRow}>
                          {result.chords.map((chord, ci) => {
                            const name = chordDisplayName(chord.rootIndex, chord.chordType, notes);
                            return (
                              <View
                                key={ci}
                                testID={`result-chord-${ri}-${ci}`}
                                style={[
                                  styles.resultChip,
                                  {
                                    backgroundColor: chord.isDiatonic
                                      ? colors.surface2
                                      : colors.chipUnselectedBg,
                                  },
                                ]}
                              >
                                <Text style={[styles.resultChipName, { color: colors.textStrong }]}>
                                  {name}
                                </Text>
                                {chord.isDiatonic && chord.degree ? (
                                  <View style={styles.badgeRow}>
                                    <Text style={[styles.degreeText, { color: colors.textSubtle }]}>
                                      {chord.degree}
                                    </Text>
                                    {chord.fn && (
                                      <View
                                        style={[
                                          styles.fnBadge,
                                          { backgroundColor: DIATONIC_FUNCTION_COLORS[chord.fn] },
                                        ]}
                                      >
                                        <Text style={styles.fnText}>{chord.fn}</Text>
                                      </View>
                                    )}
                                  </View>
                                ) : chord.secDomTarget ? (
                                  <View
                                    style={[
                                      styles.fnBadge,
                                      { backgroundColor: colors.secDomBadgeBg },
                                    ]}
                                  >
                                    <Text
                                      style={[styles.fnText, { color: colors.secDomBadgeText }]}
                                    >
                                      {`V/${chord.secDomTarget}`}
                                    </Text>
                                  </View>
                                ) : chord.borrowedDegree ? (
                                  <View
                                    style={[
                                      styles.fnBadge,
                                      { backgroundColor: colors.borrowedBadgeBg },
                                    ]}
                                  >
                                    <Text
                                      style={[styles.fnText, { color: colors.borrowedBadgeText }]}
                                    >
                                      {t("finder.progressionAnalysis.borrowed", {
                                        degree: chord.borrowedDegree,
                                      })}
                                    </Text>
                                  </View>
                                ) : (
                                  <Text style={[styles.nonDiatonic, { color: colors.textMuted }]}>
                                    ?
                                  </Text>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
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

      {/* Template picker sheet */}
      <BottomSheetModal visible={showTemplatePicker} onClose={() => setShowTemplatePicker(false)}>
        {({ close, dragHandlers }) => (
          <View
            style={[
              styles.sheet,
              {
                height: sheetHeight,
                backgroundColor: colors.deepBg,
                borderColor: colors.sheetBorder,
              },
            ]}
          >
            <SheetProgressiveHeader
              isDark={isDark}
              bgColor={colors.deepBg}
              dragHandlers={dragHandlers}
              style={{ paddingTop: SHEET_HANDLE_CLEARANCE }}
            >
              <View style={styles.sheetHeaderRow}>
                <GlassIconButton
                  isDark={isDark}
                  onPress={close}
                  icon="close"
                  style={{ width: 36 }}
                />
                <Text style={[styles.sheetTitle, { color: colors.textStrong }]}>
                  {t("finder.progressionAnalysis.loadTemplate")}
                </Text>
                <View style={{ width: 36 }} />
              </View>
            </SheetProgressiveHeader>
            <ScrollView
              contentContainerStyle={styles.pickerContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Built-in */}
              <Text style={[styles.pickerSection, { color: colors.textSubtle }]}>
                {t("finder.progressionAnalysis.builtIn")}
              </Text>
              {PROGRESSION_TEMPLATES.map((tpl) => (
                <TouchableOpacity
                  key={tpl.id}
                  testID={`template-item-${tpl.id}`}
                  onPress={() => handleLoadTemplate(templateChordsFrom(tpl))}
                  activeOpacity={0.7}
                  style={[styles.pickerRow, { borderBottomColor: borderColor }]}
                >
                  <Text style={[styles.pickerName, { color: colors.textStrong }]}>{tpl.name}</Text>
                  <Text
                    style={[styles.pickerPreview, { color: colors.textSubtle }]}
                    numberOfLines={1}
                  >
                    {templateChordsFrom(tpl)
                      .map((c) => c.degree)
                      .join(" → ")}
                  </Text>
                </TouchableOpacity>
              ))}
              {/* Custom */}
              {customTemplates.length > 0 && (
                <>
                  <Text style={[styles.pickerSection, { color: colors.textSubtle, marginTop: 16 }]}>
                    {t("finder.progressionAnalysis.custom")}
                  </Text>
                  {customTemplates.map((tpl) => (
                    <TouchableOpacity
                      key={tpl.id}
                      testID={`template-item-${tpl.id}`}
                      onPress={() => handleLoadTemplate(tpl.chords)}
                      activeOpacity={0.7}
                      style={[styles.pickerRow, { borderBottomColor: borderColor }]}
                    >
                      <Text style={[styles.pickerName, { color: colors.textStrong }]}>
                        {tpl.name}
                      </Text>
                      <Text
                        style={[styles.pickerPreview, { color: colors.textSubtle }]}
                        numberOfLines={1}
                      >
                        {tpl.chords.map((c) => c.degree).join(" → ")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        )}
      </BottomSheetModal>

      {/* Save as template sheet */}
      <TemplateFormSheet
        key={showSaveSheet ? "open" : "closed"}
        visible={showSaveSheet}
        onClose={() => setShowSaveSheet(false)}
        theme={theme}
        accidental={accidental}
        initialTemplate={
          chords.length > 0
            ? ({ id: "", name: "", chords, createdAt: 0 } as CustomProgressionTemplate)
            : null
        }
        initialInputMode={inputMode}
        initialNoteKey={noteKey}
        onSave={(name, savedChords) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSaveTemplate(name, savedChords);
          setShowSaveSheet(false);
        }}
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
    borderCurve: "continuous",
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
    borderCurve: "continuous",
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
    borderCurve: "continuous",
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    marginBottom: 4,
  },
  chordTypeChip: {
    borderWidth: 2,
    borderRadius: 16,
    borderCurve: "continuous",
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
    fontSize: 12,
  },
  addedChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: 16,
    borderCurve: "continuous",
    height: 32,
    minWidth: 32,
    paddingHorizontal: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
  analyzeRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 20,
  },
  btn: {
    flex: 1,
    justifyContent: "center",
  },
  btnText: {},
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  card: {
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  keyName: {
    fontSize: 16,
    fontWeight: "700",
  },
  scoreText: {
    fontSize: 13,
    fontWeight: "600",
  },
  resultChip: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderCurve: "continuous",
    gap: 4,
    minWidth: 52,
  },
  resultChipName: {
    fontSize: 14,
    fontWeight: "700",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  degreeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  fnBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderCurve: "continuous",
  },
  fnText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#ffffff",
  },
  nonDiatonic: {
    fontSize: 11,
    fontWeight: "600",
  },
  legend: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  templateRow: {
    alignItems: "center",
  },
  templateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  templateBtnText: {
    fontSize: 13,
    fontWeight: "500",
  },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  saveSheet: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
    paddingBottom: 40,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  pickerContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  pickerSection: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pickerRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  pickerName: {
    fontSize: 15,
    fontWeight: "600",
  },
  pickerPreview: {
    fontSize: 12,
  },
});
