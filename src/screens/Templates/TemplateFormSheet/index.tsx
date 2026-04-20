import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import type { Theme, ChordType, ProgressionChord } from "../../../types";
import type { CustomProgressionTemplate } from "../../../hooks/useProgressionTemplates";
import { CHORD_SUFFIX_MAP } from "../../../lib/fretboard";
import BottomSheetModal, {
  SHEET_HANDLE_CLEARANCE,
  useSheetHeight,
} from "../../../components/ui/BottomSheetModal";
import SheetProgressiveHeader from "../../../components/ui/SheetProgressiveHeader";
import GlassIconButton from "../../../components/ui/GlassIconButton";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";

export const MAX_PROGRESSION_DEGREES = 16;

export const CHROMATIC_DEGREES: [string, string][] = [
  ["I", "I"],
  ["bII", "♭II"],
  ["II", "II"],
  ["bIII", "♭III"],
  ["III", "III"],
  ["IV", "IV"],
  ["bV", "♭V"],
  ["V", "V"],
  ["bVI", "♭VI"],
  ["VI", "VI"],
  ["bVII", "♭VII"],
  ["VII", "VII"],
];

export const CHORD_TYPE_GROUPS: {
  labelKey: "triad" | "seventh" | "tension";
  types: [ChordType, string][];
}[] = [
  {
    labelKey: "triad",
    types: [
      ["Major", "M"],
      ["Minor", "m"],
      ["dim", "dim"],
      ["aug", "aug"],
      ["sus2", "sus2"],
      ["sus4", "sus4"],
      ["7sus4", "7sus4"],
      ["5", "5"],
    ],
  },
  {
    labelKey: "seventh",
    types: [
      ["7th", "7"],
      ["maj7", "M7"],
      ["m7", "m7"],
      ["m7(b5)", "m7♭5"],
      ["dim7", "dim7"],
      ["m(maj7)", "m(M7)"],
      ["6", "6"],
      ["m6", "m6"],
    ],
  },
  {
    labelKey: "tension",
    types: [
      ["9", "9"],
      ["maj9", "M9"],
      ["m9", "m9"],
      ["add9", "add9"],
      ["m(add9)", "m(add9)"],
      ["7(b9)", "7♭9"],
      ["7(#9)", "7♯9"],
      ["11", "11"],
      ["#11", "♯11"],
      ["add11", "add11"],
      ["add#11", "add♯11"],
      ["m11", "m11"],
      ["13", "13"],
      ["b13", "♭13"],
      ["maj13", "M13"],
      ["m13", "m13"],
      ["6/9", "6/9"],
      ["m6/9", "m6/9"],
    ],
  },
];

export function chordDisplayLabel(chord: ProgressionChord): string {
  const deg = chord.degree.replace("b", "♭");
  const suffix = CHORD_SUFFIX_MAP[chord.chordType] ?? chord.chordType;
  return deg + suffix;
}

function DegreeChip({
  label,
  isDark,
  onPress,
}: {
  label: string;
  isDark: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.degreeChip,
        { backgroundColor: isDark ? "#6b7280" : "#78716c", borderColor: "transparent" },
      ]}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Text style={[styles.degreeChipText, { color: "#fff" }]}>{label}</Text>
      <Svg width={8} height={8} viewBox="0 0 12 12" fill="none" style={{ marginLeft: 4 }}>
        <Path
          d="M9 3L3 9M3 3l6 6"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </Svg>
    </TouchableOpacity>
  );
}

interface TemplateFormSheetProps {
  visible: boolean;
  onClose: () => void;
  theme: Theme;
  initialTemplate: CustomProgressionTemplate | null;
  onSave: (name: string, chords: ProgressionChord[]) => void;
}

export default function TemplateFormSheet({
  visible,
  onClose,
  theme,
  initialTemplate,
  onSave,
}: TemplateFormSheetProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const sheetHeight = useSheetHeight();

  const bg = isDark ? "#1f2937" : "#fff";
  const border = isDark ? "#374151" : "#e7e5e4";
  const textPrimary = isDark ? "#e5e7eb" : "#1c1917";
  const textSecondary = isDark ? "#9ca3af" : "#78716c";
  const calloutBorder = isDark ? "#374151" : "#d6d3d1";

  const [formName, setFormName] = useState(() => initialTemplate?.name ?? "");
  const [formChords, setFormChords] = useState<ProgressionChord[]>(() =>
    initialTemplate?.chords ? [...initialTemplate.chords] : [],
  );
  const [selectedDegree, setSelectedDegree] = useState<string | null>(null);
  const [selectedChordGroup, setSelectedChordGroup] = useState<"triad" | "seventh" | "tension">(
    "triad",
  );

  const calloutAnim = useRef(new Animated.Value(0)).current;

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

  const handleChordTypePress = (chordType: ChordType) => {
    if (!selectedDegree || formChords.length >= MAX_PROGRESSION_DEGREES) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const deg = selectedDegree;
    setFormChords((prev) => [...prev, { degree: deg, chordType }]);
    hideCallout(() => setSelectedDegree(null));
  };

  const resetForm = () => {
    setFormName(initialTemplate?.name ?? "");
    setFormChords(initialTemplate?.chords ? [...initialTemplate.chords] : []);
    setSelectedDegree(null);
    setSelectedChordGroup("triad");
    calloutAnim.setValue(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = (close: () => void) => {
    const trimmed = formName.trim();
    if (!trimmed || formChords.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(trimmed, formChords);
    close();
  };

  const chordGroupOptions = [
    { value: "triad" as const, label: t("options.diatonicChordSize.triad") },
    { value: "seventh" as const, label: t("options.diatonicChordSize.seventh") },
    { value: "tension" as const, label: t("templates.tension") },
  ];

  return (
    <BottomSheetModal visible={visible} onClose={handleClose}>
      {({ close, dragHandlers }) => (
        <View
          style={[styles.sheet, { height: sheetHeight, backgroundColor: bg, borderColor: border }]}
        >
          <SheetProgressiveHeader
            isDark={isDark}
            bgColor={bg}
            dragHandlers={dragHandlers}
            style={{ paddingTop: SHEET_HANDLE_CLEARANCE }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <GlassIconButton isDark={isDark} onPress={close} icon="close" style={{ width: 36 }} />
              <TextInput
                style={{
                  flex: 1,
                  textAlign: "center",
                  color: textPrimary,
                  fontSize: 16,
                  fontWeight: "600",
                  marginHorizontal: 8,
                  paddingVertical: 4,
                }}
                placeholder={t("templates.templateName")}
                placeholderTextColor={isDark ? "#6b7280" : "#a8a29e"}
                value={formName}
                onChangeText={setFormName}
                maxLength={30}
              />
              <GlassIconButton
                isDark={isDark}
                onPress={() => handleSave(close)}
                icon="check"
                disabled={!formName.trim() || formChords.length === 0}
                style={{
                  width: 36,
                  opacity: !formName.trim() || formChords.length === 0 ? 0.35 : 1,
                }}
              />
            </View>
          </SheetProgressiveHeader>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
          >
            {/* 度数セレクター */}
            <Text
              style={[
                styles.formLabel,
                { color: textSecondary, marginTop: 14, textAlign: "center" },
              ]}
            >
              {t("templates.degrees")}
            </Text>
            <View style={[styles.chipsRow, { justifyContent: "center" }]}>
              {CHROMATIC_DEGREES.map(([deg, label]) => {
                const isActive = selectedDegree === deg;
                return (
                  <TouchableOpacity
                    key={deg}
                    onPress={() => handleDegreePress(deg)}
                    style={[
                      styles.degreePickerChip,
                      {
                        backgroundColor: isActive
                          ? isDark
                            ? "#3b82f6"
                            : "#2563eb"
                          : isDark
                            ? "#374151"
                            : "#f5f5f4",
                        borderColor: isActive ? "transparent" : isDark ? "#4b5563" : "#d6d3d1",
                      },
                    ]}
                    activeOpacity={0.7}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Text
                      style={[
                        styles.degreeChipText,
                        { color: isActive ? "#fff" : isDark ? "#e5e7eb" : "#44403c" },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* コードタイプパネル */}
            <Animated.View
              pointerEvents={selectedDegree ? "auto" : "none"}
              style={{
                opacity: calloutAnim,
                maxHeight: calloutAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 300],
                }),
                overflow: "hidden",
                marginTop: 8,
              }}
            >
              {/* パネル本体 */}
              <View style={[styles.callout, { backgroundColor: bg, borderColor: calloutBorder }]}>
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
                      onPress={() => handleChordTypePress(chordType)}
                      disabled={formChords.length >= MAX_PROGRESSION_DEGREES}
                      style={[
                        styles.chordTypeChip,
                        {
                          backgroundColor: isDark ? "#1f2937" : "#fff",
                          borderColor: isDark ? "#4b5563" : "#d6d3d1",
                        },
                      ]}
                      activeOpacity={0.7}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    >
                      <Text
                        style={[styles.degreeChipText, { color: isDark ? "#e5e7eb" : "#44403c" }]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* コード進行 */}
            <Text
              style={[
                styles.formLabel,
                { color: textSecondary, marginTop: 14, textAlign: "center" },
              ]}
            >
              {t("templates.progression")}
            </Text>
            {formChords.length > 0 && (
              <View style={styles.chipsRow}>
                {formChords.map((chord, i) => (
                  <View
                    key={`${chord.degree}-${chord.chordType}-${i}`}
                    style={styles.progressionItem}
                  >
                    {i > 0 && (
                      <Text style={[styles.progressionArrow, { color: textSecondary }]}>→</Text>
                    )}
                    <DegreeChip
                      label={chordDisplayLabel(chord)}
                      isDark={isDark}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setFormChords((prev) => prev.filter((_, idx) => idx !== i));
                      }}
                    />
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  formLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  degreePickerChip: {
    borderWidth: 2,
    borderRadius: 16,
    height: 32,
    minWidth: 36,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  callout: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    marginBottom: 4,
  },
  chordTypeChip: {
    borderWidth: 2,
    borderRadius: 16,
    height: 32,
    width: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  degreeChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: 16,
    height: 32,
    minWidth: 32,
    paddingHorizontal: 8,
  },
  degreeChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressionArrow: {
    fontSize: 12,
    fontWeight: "400",
  },
});
