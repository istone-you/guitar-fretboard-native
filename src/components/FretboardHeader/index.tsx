import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import "../../i18n";
import type { Accidental, BaseLabelMode, Theme } from "../../types";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { NOTES_SHARP, NOTES_FLAT } from "../../logic/fretboard";

interface FretboardHeaderProps {
  theme: Theme;
  rootNote: string;
  accidental: Accidental;
  baseLabelMode: BaseLabelMode;
  showQuiz: boolean;
  rootChangeDisabled?: boolean;
  onBaseLabelModeChange: (mode: BaseLabelMode) => void;
  onRootNoteChange: (note: string) => void;
}

export default function FretboardHeader({
  theme,
  rootNote,
  accidental,
  baseLabelMode,
  showQuiz,
  rootChangeDisabled = false,
  onBaseLabelModeChange,
  onRootNoteChange,
}: FretboardHeaderProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const notes: string[] = [...(accidental === "sharp" ? NOTES_SHARP : NOTES_FLAT)];
  const currentIndex = notes.indexOf(rootNote);

  const stepNote = (dir: 1 | -1) => {
    if (rootChangeDisabled) return;
    const next = (currentIndex + dir + 12) % 12;
    onRootNoteChange(notes[next]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepperRow}>
        <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
          {t("header.root")}:
        </Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            onPress={() => stepNote(-1)}
            disabled={rootChangeDisabled}
            style={[styles.stepBtn, rootChangeDisabled && styles.disabled]}
            activeOpacity={0.7}
          >
            <Text style={[styles.stepBtnText, { color: isDark ? "#9ca3af" : "#78716c" }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.rootNote, { color: isDark ? "#fff" : "#1c1917" }]}>
            {rootNote}
          </Text>
          <TouchableOpacity
            onPress={() => stepNote(1)}
            disabled={rootChangeDisabled}
            style={[styles.stepBtn, rootChangeDisabled && styles.disabled]}
            activeOpacity={0.7}
          >
            <Text style={[styles.stepBtnText, { color: isDark ? "#9ca3af" : "#78716c" }]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!showQuiz && (
        <SegmentedToggle
          theme={theme}
          value={baseLabelMode}
          onChange={onBaseLabelModeChange}
          options={[
            { value: "note" as BaseLabelMode, label: t("header.note") },
            { value: "degree" as BaseLabelMode, label: t("header.degree") },
          ]}
          size="compact"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 13,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  stepBtnText: {
    fontSize: 22,
  },
  rootNote: {
    width: 32,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  disabled: {
    opacity: 0.4,
  },
});
