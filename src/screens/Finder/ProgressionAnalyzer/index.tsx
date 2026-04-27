import { useState, useMemo, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../../i18n";
import type { Accidental, Theme, ProgressionChord } from "../../../types";
import { getColors, DIATONIC_FUNCTION_COLORS } from "../../../themes/design";
import {
  getNotesByAccidental,
  PROGRESSION_TEMPLATES,
  resolveProgressionDegree,
} from "../../../lib/fretboard";
import { analyzeProgression, chordDisplayName } from "../../../lib/harmonyUtils";
import TemplateFormSheet from "../../Templates/TemplateFormSheet";
import ProgressionChordInput, {
  DEGREE_TO_OFFSET,
  OFFSET_TO_DEGREE,
  type ProgressionChordInputHandle,
} from "../../../components/ui/ProgressionChordInput";
import type { CustomProgressionTemplate } from "../../../hooks/useProgressionTemplates";
import NoteDegreeModeToggle from "../../../components/ui/NoteDegreeModeToggle";
import NoteSelectPage from "../../../components/ui/NoteSelectPage";
import PillButton from "../../../components/ui/PillButton";
import Icon from "../../../components/ui/Icon";
import BottomSheetModal, {
  SHEET_HANDLE_CLEARANCE,
  useSheetHeight,
} from "../../../components/ui/BottomSheetModal";
import SheetProgressiveHeader from "../../../components/ui/SheetProgressiveHeader";
import GlassIconButton from "../../../components/ui/GlassIconButton";

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
  const borderColor = isDark ? colors.border : colors.border2;

  const notes = getNotesByAccidental(accidental);
  const sheetHeight = useSheetHeight();

  const [inputMode, setInputMode] = useState<"degree" | "note">("note");
  const [noteKey, setNoteKey] = useState(initialNoteKey ?? "C");
  const [showKeySheet, setShowKeySheet] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [chords, setChords] = useState<ProgressionChord[]>(initialChords ?? []);
  const progressionInputRef = useRef<ProgressionChordInputHandle>(null);

  const keyNoteIndex = notes.findIndex((n) => n === noteKey);

  const handleLoadTemplate = (templateChords: ProgressionChord[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChords(templateChords);
    progressionInputRef.current?.resetSelection();
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

  return (
    <View style={[styles.root, { backgroundColor: colors.pageBg }]}>
      <NoteDegreeModeToggle
        theme={theme}
        value={inputMode}
        onChange={(mode) => {
          setInputMode(mode);
          progressionInputRef.current?.resetSelection();
        }}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <ProgressionChordInput
          ref={progressionInputRef}
          theme={theme}
          accidental={accidental}
          inputMode={inputMode}
          noteKey={noteKey}
          onKeyPress={() => setShowKeySheet(true)}
          keyRowStyle={styles.keyNavRow}
          chords={chords}
          onChordsChange={setChords}
          calloutBg={colors.pageBg}
          emptyText={t("finder.progressionAnalysis.empty")}
        />

        {chords.length === 0 && (
          <View style={styles.templateSection}>
            <View style={styles.orDivider}>
              <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
              <Text style={[styles.orText, { color: colors.textSubtle }]}>
                {t("finder.progressionAnalysis.or")}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
            </View>
            <View style={styles.templateRow}>
              <PillButton
                testID="load-template-btn"
                isDark={isDark}
                onPress={() => setShowTemplatePicker(true)}
              >
                <Icon name="bar-chart" size={13} color={colors.textSubtle} />
                <Text style={[styles.templateBtnText, { color: colors.textSubtle }]}>
                  {t("finder.progressionAnalysis.loadTemplate")}
                </Text>
              </PillButton>
            </View>
          </View>
        )}

        {chords.length > 0 && (
          <View style={styles.analyzeRow}>
            <PillButton isDark={isDark} style={styles.btn} onPress={() => setShowSaveSheet(true)}>
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
                progressionInputRef.current?.resetSelection();
              }}
            >
              <Text style={[styles.btnText, { color: colors.textDanger }]}>
                {t("finder.progressionAnalysis.reset")}
              </Text>
            </PillButton>
          </View>
        )}

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
                  <Text style={[styles.legendLabel, { color: colors.textSubtle }]}>{label}</Text>
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
                    <Text style={[styles.keyName, { color: colors.textStrong }]}>{keyName}</Text>
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
                              style={[styles.fnBadge, { backgroundColor: colors.secDomBadgeBg }]}
                            >
                              <Text style={[styles.fnText, { color: colors.secDomBadgeText }]}>
                                {`V/${chord.secDomTarget}`}
                              </Text>
                            </View>
                          ) : chord.borrowedDegree ? (
                            <View
                              style={[styles.fnBadge, { backgroundColor: colors.borrowedBadgeBg }]}
                            >
                              <Text style={[styles.fnText, { color: colors.borrowedBadgeText }]}>
                                {t("finder.progressionAnalysis.borrowed", {
                                  degree: chord.borrowedDegree,
                                })}
                              </Text>
                            </View>
                          ) : (
                            <Text style={[styles.nonDiatonic, { color: colors.textMuted }]}>?</Text>
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

      <BottomSheetModal visible={showKeySheet} onClose={() => setShowKeySheet(false)}>
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
            <NoteSelectPage
              theme={theme}
              bgColor={colors.deepBg}
              title={t("header.key")}
              notes={notes}
              selectedNote={noteKey}
              onSelect={(note) => {
                setNoteKey(note);
                progressionInputRef.current?.resetSelection();
                close();
              }}
              onBack={close}
              dragHandlers={dragHandlers}
            />
          </View>
        )}
      </BottomSheetModal>

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
  templateSection: {
    marginTop: -12,
    gap: 24,
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  orText: {
    fontSize: 12,
    fontWeight: "500",
  },
  templateRow: {
    alignItems: "center",
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
