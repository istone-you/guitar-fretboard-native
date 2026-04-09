import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../i18n";
import type { Theme } from "../../types";

interface QuizKindOption {
  value: string;
  label: string;
}

interface QuizSelectionScreenProps {
  theme: Theme;
  quizKindOptions: QuizKindOption[];
  onSelect: (value: string) => void;
}

const QUIZ_GROUPS: {
  modeKey: string;
  options: { value: string; typeKey: string }[];
}[] = [
  {
    modeKey: "quiz.mode.note",
    options: [
      { value: "note-choice", typeKey: "quiz.type.choice" },
      { value: "note-fretboard", typeKey: "quiz.type.fretboard" },
    ],
  },
  {
    modeKey: "quiz.mode.degree",
    options: [
      { value: "degree-choice", typeKey: "quiz.type.choice" },
      { value: "degree-fretboard", typeKey: "quiz.type.fretboard" },
    ],
  },
  {
    modeKey: "quiz.mode.chord",
    options: [
      { value: "chord-choice", typeKey: "quiz.type.identify" },
      { value: "chord-fretboard", typeKey: "quiz.type.fretboard" },
    ],
  },
  {
    modeKey: "quiz.mode.scale",
    options: [
      { value: "scale-choice", typeKey: "quiz.type.noteSelect" },
      { value: "scale-fretboard", typeKey: "quiz.type.fretboard" },
    ],
  },
  {
    modeKey: "quiz.mode.diatonic",
    options: [{ value: "diatonic-all", typeKey: "quiz.type.all" }],
  },
];

function QuizSelectionScreen({ theme, onSelect }: QuizSelectionScreenProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";

  return (
    <View
      style={[
        selectionStyles.card,
        {
          backgroundColor: isDark ? "#030712" : "#f3f4f6",
          borderColor: isDark ? "#1f2937" : "#e7e5e4",
        },
      ]}
    >
      <Text style={[selectionStyles.title, { color: isDark ? "#f9fafb" : "#1c1917" }]}>
        {t("quiz.selectTitle")}
      </Text>
      <View style={selectionStyles.groups}>
        {QUIZ_GROUPS.map((group) => (
          <View key={group.modeKey} style={selectionStyles.row}>
            <Text style={[selectionStyles.modeLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
              {t(group.modeKey)}
            </Text>
            <View style={selectionStyles.typeButtons}>
              {group.options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelect(opt.value);
                  }}
                  style={[
                    selectionStyles.typeBtn,
                    {
                      backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
                      borderColor: isDark ? "#374151" : "#d6d3d1",
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[selectionStyles.typeBtnText, { color: isDark ? "#e5e7eb" : "#1c1917" }]}
                  >
                    {t(opt.typeKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const selectionStyles = StyleSheet.create({
  card: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  groups: {
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.15)",
  },
  modeLabel: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  typeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  typeBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

interface QuizPaneProps {
  theme: Theme;
  quizKindOptions: QuizKindOption[];
  onQuizModeSelect: (value: string) => void;
}

export default function QuizPane({ theme, quizKindOptions, onQuizModeSelect }: QuizPaneProps) {
  return (
    <QuizSelectionScreen
      theme={theme}
      quizKindOptions={quizKindOptions}
      onSelect={onQuizModeSelect}
    />
  );
}
