import { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../../i18n";
import type { Accidental, Theme, ChordType, ProgressionChord } from "../../../types";
import { getColors } from "../../../themes/design";
import { getRootIndex, getNotesByAccidental, CHORD_SUFFIX_MAP } from "../../../lib/fretboard";
import {
  getChordSuggestions,
  type ChordSuggestCategory,
  type ChordSuggestEntry,
} from "../../../lib/harmonyUtils";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import NotePill from "../../../components/ui/NotePill";
import Icon from "../../../components/ui/Icon";
import PillButton from "../../../components/ui/PillButton";
import TemplateFormSheet from "../../Templates/TemplateFormSheet";
import { useProgressionTemplates } from "../../../hooks/useProgressionTemplates";

const CHORD_TYPES: ChordType[] = ["Major", "Minor", "maj7", "m7", "7th"];
const CHORD_LABELS: Partial<Record<ChordType, string>> = {
  Major: "Major",
  Minor: "Minor",
  maj7: "maj7",
  m7: "m7",
  "7th": "7",
};

const CATEGORY_ORDER: ChordSuggestCategory[] = [
  "diatonic",
  "two-five-entry",
  "secondary-dominant",
  "tritone-sub",
  "cadence",
  "backdoor",
  "passing",
  "borrowed",
];

// offset (0–11) → ProgressionChord degree string
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

interface ChainItem {
  rootIndex: number;
  chordType: ChordType;
}

interface ChordSuggestProps {
  theme: Theme;
  accidental: Accidental;
}

export default function ChordSuggest({ theme, accidental }: ChordSuggestProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { saveTemplate } = useProgressionTemplates();

  const [rootNote, setRootNote] = useState("C");
  const [selectedChordType, setSelectedChordType] = useState<ChordType>("Major");
  const [chain, setChain] = useState<ChainItem[]>([]);
  const [showSaveSheet, setShowSaveSheet] = useState(false);

  const sourceRootIndex = getRootIndex(rootNote);
  const notes = getNotesByAccidental(accidental);
  const borderColor = isDark ? colors.border : colors.border2;

  const sourceChordName = `${rootNote}${CHORD_SUFFIX_MAP[selectedChordType] ?? ""}`;

  // Current source for suggestions = last chain item, or user-selected chord
  const currentRootIndex = chain.length > 0 ? chain[chain.length - 1].rootIndex : sourceRootIndex;
  const currentChordType = chain.length > 0 ? chain[chain.length - 1].chordType : selectedChordType;

  const suggestions = useMemo(
    () => getChordSuggestions(currentRootIndex, currentChordType),
    [currentRootIndex, currentChordType],
  );

  const grouped = useMemo(() => {
    const map = new Map<ChordSuggestCategory, ChordSuggestEntry[]>();
    for (const entry of suggestions) {
      const arr = map.get(entry.category) ?? [];
      arr.push(entry);
      map.set(entry.category, arr);
    }
    return map;
  }, [suggestions]);

  const addToChain = (entry: ChordSuggestEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChain((prev) => [...prev, { rootIndex: entry.rootIndex, chordType: entry.chordType }]);
  };

  const undoLast = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChain((prev) => prev.slice(0, -1));
  };

  const chainAsProgressionChords = (): ProgressionChord[] => {
    const allChords: ChainItem[] = [
      { rootIndex: sourceRootIndex, chordType: selectedChordType },
      ...chain,
    ];
    return allChords.map(({ rootIndex, chordType }) => {
      const offset = (rootIndex - sourceRootIndex + 12) % 12;
      return { degree: OFFSET_TO_DEGREE[offset] ?? "I", chordType };
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      {/* Root picker */}
      <View style={[styles.rootRow, { borderBottomColor: borderColor }]}>
        <NotePickerButton
          theme={theme}
          accidental={accidental}
          value={rootNote}
          onChange={(note) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setRootNote(note);
            setChain([]);
          }}
          label={t("header.root")}
          sheetTitle={t("header.root")}
        />
      </View>

      {/* Chord type chips */}
      <View style={[styles.chipsRow, { borderBottomColor: borderColor }]}>
        {CHORD_TYPES.map((ct) => (
          <NotePill
            key={ct}
            label={CHORD_LABELS[ct] ?? ct}
            selected={selectedChordType === ct}
            activeBg={colors.chipSelectedBg}
            activeText={colors.chipSelectedText}
            inactiveBg={colors.chipUnselectedBg}
            inactiveText={colors.text}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedChordType(ct);
              setChain([]);
            }}
          />
        ))}
      </View>

      {/* Chain bar */}
      <View style={[styles.chainBarOuter, { borderBottomColor: borderColor }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chainBarContent}
          style={styles.chainBarScroll}
        >
          <View style={[styles.chainChipSource, { backgroundColor: colors.chipUnselectedBg }]}>
            <Text style={[styles.chainChipText, { color: colors.textStrong }]}>
              {sourceChordName}
            </Text>
          </View>
          {chain.length === 0 ? (
            <Text style={[styles.chainHint, { color: colors.textSubtle }]}>
              {t("finder.chordSuggest.chainHint")}
            </Text>
          ) : (
            chain.map((item, i) => {
              const itemName = `${notes[item.rootIndex]}${CHORD_SUFFIX_MAP[item.chordType] ?? ""}`;
              return (
                <View key={i} style={styles.chainArrowGroup}>
                  <Icon name="chevron-right" size={10} color={colors.textSubtle} />
                  <View
                    style={[styles.chainChipItem, { backgroundColor: colors.chipUnselectedBg }]}
                  >
                    <Text style={[styles.chainChipText, { color: colors.textStrong }]}>
                      {itemName}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
        {chain.length > 0 && (
          <TouchableOpacity
            testID="chain-undo"
            onPress={undoLast}
            style={[styles.undoBtn, { borderColor }]}
            hitSlop={8}
          >
            <Icon name="chevron-left" size={14} color={colors.textSubtle} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Save as template button */}
        {chain.length > 0 && (
          <View style={styles.saveRow}>
            <PillButton
              isDark={isDark}
              style={styles.saveBtn}
              onPress={() => setShowSaveSheet(true)}
            >
              <Text style={[styles.saveBtnText, { color: colors.textStrong }]}>
                {t("finder.progressionAnalysis.saveAsTemplate")}
              </Text>
            </PillButton>
          </View>
        )}

        {/* Grouped suggestions */}
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
                      onPress={() => addToChain(entry)}
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

      <TemplateFormSheet
        key={showSaveSheet ? "open" : "closed"}
        visible={showSaveSheet}
        onClose={() => setShowSaveSheet(false)}
        theme={theme}
        accidental={accidental}
        initialTemplate={
          chain.length > 0
            ? { id: "", name: "", chords: chainAsProgressionChords(), createdAt: 0 }
            : null
        }
        initialInputMode="note"
        initialNoteKey={rootNote}
        onSave={(name, savedChords) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          saveTemplate(name, savedChords);
          setShowSaveSheet(false);
          setChain([]);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chainBarOuter: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  chainBarScroll: {
    flex: 1,
  },
  chainBarContent: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 4,
    flexDirection: "row",
  },
  chainChipSource: {
    borderRadius: 8,
    borderCurve: "continuous",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chainChipItem: {
    borderRadius: 8,
    borderCurve: "continuous",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chainChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  chainArrowGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chainHint: {
    fontSize: 12,
    marginLeft: 4,
  },
  undoBtn: {
    width: 32,
    height: 32,
    marginRight: 8,
    borderRadius: 8,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  saveRow: {
    flexDirection: "row",
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
});
