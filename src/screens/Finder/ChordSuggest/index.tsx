import { useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../../i18n";
import type { Accidental, Theme, ProgressionChord } from "../../../types";
import { getColors } from "../../../themes/design";
import { getNotesByAccidental, CHORD_SUFFIX_MAP } from "../../../lib/fretboard";
import {
  getDiatonicSuggestions,
  getChordSuggestions,
  type ChordSuggestCategory,
  type ChordSuggestEntry,
} from "../../../lib/harmonyUtils";
import PillButton from "../../../components/ui/PillButton";
import ProgressionChordInput, {
  DEGREE_TO_OFFSET,
  OFFSET_TO_DEGREE,
  type ProgressionChordInputHandle,
} from "../../../components/ui/ProgressionChordInput";
import NoteDegreeModeToggle from "../../../components/ui/NoteDegreeModeToggle";
import NoteSelectPage from "../../../components/ui/NoteSelectPage";
import BottomSheetModal, { useSheetHeight } from "../../../components/ui/BottomSheetModal";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import TemplateFormSheet from "../../Templates/TemplateFormSheet";
import { useProgressionTemplates } from "../../../hooks/useProgressionTemplates";

const CATEGORY_ORDER: ChordSuggestCategory[] = [
  "diatonic-first",
  "diatonic",
  "two-five-entry",
  "secondary-dominant",
  "tritone-sub",
  "cadence",
  "backdoor",
  "passing",
  "borrowed",
];

const KEY_TYPE_OPTIONS = [
  { value: "major" as const, label: "Major" },
  { value: "minor" as const, label: "Minor" },
];

interface ChordSuggestProps {
  theme: Theme;
  accidental: Accidental;
}

export default function ChordSuggest({ theme, accidental }: ChordSuggestProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const sheetHeight = useSheetHeight();
  const { saveTemplate } = useProgressionTemplates();

  const [noteKey, setNoteKey] = useState("C");
  const [keyType, setKeyType] = useState<"major" | "minor">("major");
  const [inputMode, setInputMode] = useState<"degree" | "note">("note");
  const [chords, setChords] = useState<ProgressionChord[]>([]);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [showKeySheet, setShowKeySheet] = useState(false);
  const progressionInputRef = useRef<ProgressionChordInputHandle>(null);

  const notes = getNotesByAccidental(accidental);
  const keyNoteIndex = notes.findIndex((n) => n === noteKey);
  const borderColor = isDark ? colors.border : colors.border2;

  const suggestions = useMemo(() => {
    if (chords.length === 0) {
      return getDiatonicSuggestions(keyNoteIndex, keyType);
    }
    const lastChord = chords[chords.length - 1];
    const rootIdx = (keyNoteIndex + (DEGREE_TO_OFFSET[lastChord.degree] ?? 0)) % 12;
    return getChordSuggestions(rootIdx, lastChord.chordType);
  }, [chords, keyNoteIndex, keyType]);

  const grouped = useMemo(() => {
    const map = new Map<ChordSuggestCategory, ChordSuggestEntry[]>();
    for (const entry of suggestions) {
      const arr = map.get(entry.category) ?? [];
      arr.push(entry);
      map.set(entry.category, arr);
    }
    return map;
  }, [suggestions]);

  const addSuggestionToChain = (entry: ChordSuggestEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const offset = (entry.rootIndex - keyNoteIndex + 12) % 12;
    const degree = OFFSET_TO_DEGREE[offset] ?? "I";
    setChords((prev) => [...prev, { degree, chordType: entry.chordType }]);
  };

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
          keyAccessory={
            <SegmentedToggle
              theme={theme}
              value={keyType}
              onChange={(value) => setKeyType(value as "major" | "minor")}
              options={KEY_TYPE_OPTIONS}
              size="compact"
              segmentWidth={60}
            />
          }
          onKeyPress={() => setShowKeySheet(true)}
          showKeyButton
          keyRowStyle={styles.keyControls}
          chords={chords}
          onChordsChange={setChords}
          calloutBg={colors.pageBg}
          emptyText={t("finder.progressionAnalysis.empty")}
        />

        {chords.length > 0 && (
          <View style={styles.saveRow}>
            <PillButton
              isDark={isDark}
              style={styles.saveBtn}
              onPress={() => setShowSaveSheet(true)}
            >
              <Text style={[styles.saveBtnText, { color: colors.textStrong }]}>
                {t("finder.progressionAnalysis.save")}
              </Text>
            </PillButton>
            <PillButton
              isDark={isDark}
              variant="danger"
              style={styles.saveBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setChords([]);
                progressionInputRef.current?.resetSelection();
              }}
            >
              <Text style={[styles.saveBtnText, { color: colors.textDanger }]}>
                {t("finder.progressionAnalysis.reset")}
              </Text>
            </PillButton>
          </View>
        )}

        {CATEGORY_ORDER.map((category) => {
          const entries = grouped.get(category);
          if (!entries || entries.length === 0) return null;
          return (
            <View key={category} style={styles.categorySection}>
              <Text style={[styles.categoryHeader, { color: colors.textSubtle }]}>
                {t(`finder.chordSuggest.category.${category}`)}
              </Text>
              <View style={styles.entriesWrap}>
                {entries.map((entry, i) => {
                  const entryName = `${notes[entry.rootIndex]}${CHORD_SUFFIX_MAP[entry.chordType] ?? ""}`;
                  return (
                    <TouchableOpacity
                      key={`${category}-${i}`}
                      testID="entry-card"
                      style={[styles.entryCard, { borderColor, backgroundColor: colors.surface }]}
                      activeOpacity={0.7}
                      onPress={() => addSuggestionToChain(entry)}
                    >
                      <Text style={[styles.entryChordName, { color: colors.textStrong }]}>
                        {entryName}
                      </Text>
                      <Text style={[styles.entryLabel, { color: colors.textSubtle }]}>
                        {entry.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
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
                setChords([]);
                progressionInputRef.current?.resetSelection();
                close();
              }}
              onBack={close}
              dragHandlers={dragHandlers}
            />
          </View>
        )}
      </BottomSheetModal>

      <TemplateFormSheet
        key={showSaveSheet ? "open" : "closed"}
        visible={showSaveSheet}
        onClose={() => setShowSaveSheet(false)}
        theme={theme}
        accidental={accidental}
        initialTemplate={chords.length > 0 ? { id: "", name: "", chords, createdAt: 0 } : null}
        initialInputMode={inputMode}
        initialNoteKey={noteKey}
        onSave={(name, savedChords) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          saveTemplate(name, savedChords);
          setShowSaveSheet(false);
          setChords([]);
          progressionInputRef.current?.resetSelection();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  keyControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  saveRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  saveBtn: {
    flex: 1,
    justifyContent: "center",
  },
  saveBtnText: {},
  categorySection: {
    gap: 8,
  },
  categoryHeader: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  entriesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  entryCard: {
    alignItems: "center",
    gap: 2,
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 72,
  },
  entryChordName: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  entryLabel: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
});
