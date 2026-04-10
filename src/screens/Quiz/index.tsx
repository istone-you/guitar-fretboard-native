import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
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
  onShowStats: () => void;
}

const QUIZ_GROUPS: {
  modeKey: string;
  descKey: string;
  icon: string;
  options: { value: string; typeKey: string }[];
}[] = [
  {
    modeKey: "quiz.mode.note",
    descKey: "quiz.desc.note",
    icon: "♩",
    options: [
      { value: "note-choice", typeKey: "quiz.type.choice" },
      { value: "note-fretboard", typeKey: "quiz.type.fretboard" },
    ],
  },
  {
    modeKey: "quiz.mode.degree",
    descKey: "quiz.desc.degree",
    icon: "°",
    options: [
      { value: "degree-choice", typeKey: "quiz.type.choice" },
      { value: "degree-fretboard", typeKey: "quiz.type.fretboard" },
    ],
  },
  {
    modeKey: "quiz.mode.chord",
    descKey: "quiz.desc.chord",
    icon: "♯",
    options: [
      { value: "chord-choice", typeKey: "quiz.type.identify" },
      { value: "chord-fretboard", typeKey: "quiz.type.fretboard" },
    ],
  },
  {
    modeKey: "quiz.mode.scale",
    descKey: "quiz.desc.scale",
    icon: "≈",
    options: [
      { value: "scale-choice", typeKey: "quiz.type.noteSelect" },
      { value: "scale-fretboard", typeKey: "quiz.type.fretboard" },
    ],
  },
  {
    modeKey: "quiz.mode.diatonic",
    descKey: "quiz.desc.diatonic",
    icon: "Ⅶ",
    options: [{ value: "diatonic-all", typeKey: "quiz.type.all" }],
  },
];

function QuizSelectionScreen({ theme, onSelect, onShowStats }: QuizSelectionScreenProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";

  return (
    <ScrollView
      style={[selectionStyles.container, { backgroundColor: isDark ? "#030712" : "#f3f4f6" }]}
      contentContainerStyle={selectionStyles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={selectionStyles.titleRow}>
        <Text style={[selectionStyles.title, { color: isDark ? "#f9fafb" : "#1c1917" }]}>
          {t("quiz.selectTitle")}
        </Text>
        <TouchableOpacity
          onPress={onShowStats}
          style={selectionStyles.statsBtn}
          activeOpacity={0.7}
          testID="quiz-stats-btn"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 20V10"
              stroke={isDark ? "#6b7280" : "#a8a29e"}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Path
              d="M12 20V4"
              stroke={isDark ? "#6b7280" : "#a8a29e"}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Path
              d="M6 20v-6"
              stroke={isDark ? "#6b7280" : "#a8a29e"}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
          <Text style={[selectionStyles.statsBtnText, { color: isDark ? "#6b7280" : "#a8a29e" }]}>
            {t("tabs.stats")}
          </Text>
        </TouchableOpacity>
      </View>
      {QUIZ_GROUPS.map((group) => {
        const accentColor = isDark ? "#e5e7eb" : "#1c1917";
        const iconBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
        const cardBg = isDark ? "#111827" : "#ffffff";
        const btnBg = isDark ? "#374151" : "#1c1917";
        return (
          <View
            key={group.modeKey}
            style={[
              selectionStyles.card,
              {
                backgroundColor: cardBg,
                borderColor: isDark ? "#1f2937" : "#e5e7eb",
              },
            ]}
          >
            <View style={selectionStyles.cardInner}>
              <View style={selectionStyles.cardTop}>
                <View style={[selectionStyles.iconCircle, { backgroundColor: iconBg }]}>
                  <Text style={[selectionStyles.iconText, { color: accentColor }]}>
                    {group.icon}
                  </Text>
                </View>
                <View style={selectionStyles.textBlock}>
                  <Text
                    style={[selectionStyles.modeLabel, { color: isDark ? "#f9fafb" : "#1c1917" }]}
                  >
                    {t(group.modeKey)}
                  </Text>
                  <Text
                    style={[selectionStyles.modeDesc, { color: isDark ? "#9ca3af" : "#78716c" }]}
                  >
                    {t(group.descKey)}
                  </Text>
                </View>
              </View>
              <View style={selectionStyles.typeButtons}>
                {group.options.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onSelect(opt.value);
                    }}
                    style={[selectionStyles.typeBtn, { backgroundColor: btnBg }]}
                    activeOpacity={0.75}
                  >
                    <Text style={selectionStyles.typeBtnText}>{t(opt.typeKey)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const selectionStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  statsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statsBtnText: {
    fontSize: 13,
    fontWeight: "500",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInner: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 18,
    fontWeight: "700",
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  modeDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  typeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  typeBtn: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
  },
});

interface QuizPaneProps {
  theme: Theme;
  quizKindOptions: QuizKindOption[];
  onQuizModeSelect: (value: string) => void;
  onShowStats: () => void;
}

export default function QuizPane({
  theme,
  quizKindOptions,
  onQuizModeSelect,
  onShowStats,
}: QuizPaneProps) {
  return (
    <QuizSelectionScreen
      theme={theme}
      quizKindOptions={quizKindOptions}
      onSelect={onQuizModeSelect}
      onShowStats={onShowStats}
    />
  );
}
