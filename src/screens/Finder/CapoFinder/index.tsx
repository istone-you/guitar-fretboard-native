import { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../../i18n";
import type { Accidental, Theme } from "../../../types";
import { getColors } from "../../../themes/design";
import { getNotesByAccidental, getRootIndex } from "../../../lib/fretboard";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import Icon from "../../../components/ui/Icon";
import PillButton from "../../../components/ui/PillButton";

type CapoMode = "form-to-sound" | "sound-to-form";

interface CapoFinderProps {
  theme: Theme;
  accidental: Accidental;
}

export default function CapoFinder({ theme, accidental }: CapoFinderProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();

  const [capoMode, setCapoMode] = useState<CapoMode>("form-to-sound");
  const [capoFret, setCapoFret] = useState(0);
  const [formKey, setFormKey] = useState("C");
  const [targetKey, setTargetKey] = useState("G");
  const [shapeKey, setShapeKey] = useState("E");

  const notes = getNotesByAccidental(accidental);
  const borderColor = isDark ? colors.border : colors.border2;

  const actualSoundIndex = (getRootIndex(formKey) + capoFret) % 12;
  const actualSound = notes[actualSoundIndex];

  const capoNeeded = (getRootIndex(targetKey) - getRootIndex(shapeKey) + 12) % 12;

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View style={[styles.modeRow, { borderBottomColor: borderColor }]}>
        <SegmentedToggle
          theme={theme}
          value={capoMode}
          onChange={(v) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCapoMode(v as CapoMode);
          }}
          options={[
            { value: "form-to-sound" as CapoMode, label: t("finder.capo.modeFormToSound") },
            { value: "sound-to-form" as CapoMode, label: t("finder.capo.modeSoundToForm") },
          ]}
          size="compact"
          segmentWidth={100}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {capoMode === "form-to-sound" ? (
          <>
            <View style={[styles.row, { borderBottomColor: borderColor }]}>
              <Text style={[styles.rowLabel, { color: colors.textSubtle }]}>
                {t("finder.capo.capoFret")}
              </Text>
              <View style={styles.stepper}>
                <PillButton
                  isDark={isDark}
                  testID="capo-fret-decrement"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCapoFret((f) => Math.max(0, f - 1));
                  }}
                >
                  <Icon name="chevron-left" size={16} color={colors.textStrong} />
                </PillButton>
                <Text
                  testID="capo-fret-value"
                  style={[styles.fretNumber, { color: colors.textStrong }]}
                >
                  {capoFret}
                </Text>
                <PillButton
                  isDark={isDark}
                  testID="capo-fret-increment"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCapoFret((f) => Math.min(11, f + 1));
                  }}
                >
                  <Icon name="chevron-right" size={16} color={colors.textStrong} />
                </PillButton>
              </View>
            </View>

            <View style={[styles.row, { borderBottomColor: borderColor }]}>
              <Text style={[styles.rowLabel, { color: colors.textSubtle }]}>
                {t("finder.capo.formKey")}
              </Text>
              <NotePickerButton
                theme={theme}
                accidental={accidental}
                value={formKey}
                onChange={(note) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFormKey(note);
                }}
                label={t("header.root")}
                sheetTitle={t("header.root")}
              />
            </View>

            <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor }]}>
              <Text style={[styles.resultLabel, { color: colors.textSubtle }]}>
                {t("finder.capo.actualSound")}
              </Text>
              <Text
                testID="actual-sound-value"
                style={[styles.resultNote, { color: colors.textStrong }]}
              >
                {actualSound}
              </Text>
              {capoFret === 0 && (
                <Text style={[styles.resultHint, { color: colors.textSubtle }]}>
                  {t("finder.capo.noCapo")}
                </Text>
              )}
            </View>
          </>
        ) : (
          <>
            <View style={[styles.row, { borderBottomColor: borderColor }]}>
              <Text style={[styles.rowLabel, { color: colors.textSubtle }]}>
                {t("finder.capo.targetKey")}
              </Text>
              <NotePickerButton
                theme={theme}
                accidental={accidental}
                value={targetKey}
                onChange={(note) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTargetKey(note);
                }}
                label={t("header.root")}
                sheetTitle={t("header.root")}
              />
            </View>

            <View style={[styles.row, { borderBottomColor: borderColor }]}>
              <Text style={[styles.rowLabel, { color: colors.textSubtle }]}>
                {t("finder.capo.shapeKey")}
              </Text>
              <NotePickerButton
                theme={theme}
                accidental={accidental}
                value={shapeKey}
                onChange={(note) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShapeKey(note);
                }}
                label={t("header.root")}
                sheetTitle={t("header.root")}
              />
            </View>

            <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor }]}>
              <Text style={[styles.resultLabel, { color: colors.textSubtle }]}>
                {t("finder.capo.capoPosition")}
              </Text>
              <Text
                testID="capo-result-value"
                style={[styles.resultNote, { color: colors.textStrong }]}
              >
                {capoNeeded === 0 ? t("finder.capo.noCapo") : `${capoNeeded}`}
              </Text>
              {capoNeeded > 9 && (
                <Text style={[styles.resultHint, { color: colors.textSubtle }]}>
                  {t("finder.capo.highFret")}
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fretNumber: {
    fontSize: 22,
    fontWeight: "700",
    minWidth: 28,
    textAlign: "center",
  },
  resultCard: {
    marginTop: 24,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  resultNote: {
    fontSize: 56,
    fontWeight: "700",
    letterSpacing: -1,
  },
  resultHint: {
    fontSize: 12,
  },
});
