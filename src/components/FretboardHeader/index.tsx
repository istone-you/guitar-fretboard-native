import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import "../../i18n";
import type { Accidental, BaseLabelMode, Theme } from "../../types";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { useRootStepper } from "../../hooks/useRootStepper";

interface FretboardHeaderProps {
  theme: Theme;
  rootNote: string;
  accidental: Accidental;
  baseLabelMode: BaseLabelMode;
  showQuiz: boolean;
  rootChangeDisabled?: boolean;
  rootStepperRef?: React.RefObject<View | null>;
  labelToggleRef?: React.RefObject<View | null>;
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
  rootStepperRef,
  labelToggleRef,
  onBaseLabelModeChange,
  onRootNoteChange,
}: FretboardHeaderProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const { stepNote } = useRootStepper({
    accidental,
    rootNote,
    rootChangeDisabled,
    onRootNoteChange,
  });

  return (
    <View style={styles.container}>
      <View ref={rootStepperRef as any} style={styles.stepperRow}>
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
          <Text style={[styles.rootNote, { color: isDark ? "#fff" : "#1c1917" }]}>{rootNote}</Text>
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
        <View ref={labelToggleRef as any}>
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
        </View>
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
    paddingVertical: 8,
    gap: 10,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  label: {
    fontSize: 12,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  stepBtnText: {
    fontSize: 20,
  },
  rootNote: {
    width: 28,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  disabled: {
    opacity: 0.4,
  },
});
