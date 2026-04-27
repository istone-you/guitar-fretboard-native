import { useMemo, useState, useCallback, memo } from "react";
import { ScrollView, View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import type { Theme, Accidental, ProgressionChord, LayerConfig } from "../../../types";
import { createDefaultLayer, MAX_LAYERS } from "../../../types";
import { pickNextLayerColor, getColors } from "../../../themes/design";
import type { CustomProgressionTemplate } from "../../../hooks/useProgressionTemplates";
import {
  CHORD_SUFFIX_MAP,
  getNotesByAccidental,
  CHROMATIC_DEGREE_OFFSETS,
} from "../../../lib/fretboard";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import Icon from "../../../components/ui/Icon";
import PillButton from "../../../components/ui/PillButton";
import TemplateFormSheet from "../TemplateFormSheet";

interface TemplateDetailPaneProps {
  theme: Theme;
  accidental: Accidental;
  template: CustomProgressionTemplate;
  layers: LayerConfig[];
  onUpdateTemplate: (
    id: string,
    name: string,
    chords: ProgressionChord[],
    description?: string,
  ) => void;
  onAddLayer: (layer: LayerConfig) => void;
}

function TemplateDetailPane({
  theme,
  accidental,
  template,
  layers,
  onUpdateTemplate,
  onAddLayer,
}: TemplateDetailPaneProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [keyRoot, setKeyRoot] = useState("C");
  const [formVisible, setFormVisible] = useState(false);

  const colors = getColors(isDark);

  const noteNames = useMemo(() => getNotesByAccidental(accidental), [accidental]);
  const keyRootIndex = noteNames.findIndex((n) => n === keyRoot);
  const FORM_COLS = 3;
  const FORM_GAP = 8;
  const formWidth = Math.floor((screenWidth - 32 - FORM_GAP * (FORM_COLS - 1)) / FORM_COLS);
  const isFull = layers.length >= MAX_LAYERS;

  const handleKeyRootChange = useCallback((note: string) => {
    setKeyRoot(note);
  }, []);

  const handleAddLayer = useCallback(() => {
    if (isFull) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const color = pickNextLayerColor(layers);
    const layer = createDefaultLayer("progression", `layer-${Date.now()}`, color);
    layer.progressionTemplateId = template.id;
    onAddLayer(layer);
  }, [isFull, layers, template.id, onAddLayer]);

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.pageBg }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Template title + key selector + actions */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.textStrong }]} numberOfLines={2}>
            {template.name}
          </Text>
          <View style={styles.titleActions}>
            <NotePickerButton
              theme={theme}
              accidental={accidental}
              value={keyRoot}
              onChange={handleKeyRootChange}
              label={t("templates.key")}
              sheetTitle={t("templates.key")}
            />
            <PillButton
              isDark={isDark}
              onPress={handleAddLayer}
              disabled={isFull}
              style={{ paddingHorizontal: 8 }}
            >
              <Icon name="upload" size={16} color={colors.textSubtle} />
            </PillButton>
            <PillButton
              isDark={isDark}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFormVisible(true);
              }}
              style={{ paddingHorizontal: 8 }}
            >
              <Icon name="ellipsis" size={16} color={colors.textSubtle} />
            </PillButton>
          </View>
        </View>

        {/* Description */}
        {!!template.description && (
          <Text style={[styles.description, { color: colors.textSubtle }]}>
            {template.description}
          </Text>
        )}

        {/* Chord diagram list */}
        {template.chords.map((chord, i) => {
          const offset = CHROMATIC_DEGREE_OFFSETS[chord.degree] ?? 0;
          const chordRootIndex = (keyRootIndex + offset) % 12;
          const chordRootNote = noteNames[chordRootIndex] ?? noteNames[0]!;
          const degLabel = chord.degree.replace("b", "♭");
          const suffix = CHORD_SUFFIX_MAP[chord.chordType] ?? chord.chordType;
          const chordLabel = `${degLabel}${suffix} — ${chordRootNote}${suffix}`;

          const forms = getAllChordForms(chordRootIndex, chord.chordType);

          return (
            <View key={i} style={[styles.chordItem, { marginTop: i === 0 ? 16 : 28 }]}>
              <Text style={[styles.chordLabel, { color: colors.textStrong }]}>{chordLabel}</Text>
              <View style={styles.formsRow}>
                {forms.map((formCells, fi) => (
                  <ChordDiagram
                    key={fi}
                    cells={formCells}
                    rootIndex={chordRootIndex}
                    theme={theme}
                    width={formWidth}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <TemplateFormSheet
        key={template.id}
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        theme={theme}
        accidental={accidental}
        initialTemplate={template}
        onSave={(name, chords, description) => {
          onUpdateTemplate(template.id, name, chords, description);
          setFormVisible(false);
        }}
      />
    </>
  );
}

export default memo(TemplateDetailPane);

const styles = StyleSheet.create({
  container: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  titleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chordItem: {
    paddingHorizontal: 16,
    gap: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
  },
  chordLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  formsRow: {
    flexDirection: "row",
    gap: 8,
  },
});
