import { useState, useRef, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import type { Theme, ProgressionChord, Accidental } from "../../../types";
import type { CustomProgressionTemplate } from "../../../hooks/useProgressionTemplates";
import { getNotesByAccidental } from "../../../lib/fretboard";
import { getColors } from "../../../themes/design";
import NoteDegreeModeToggle from "../../../components/ui/NoteDegreeModeToggle";
import NoteSelectPage from "../../../components/ui/NoteSelectPage";
import BottomSheetModal, {
  SHEET_HANDLE_CLEARANCE,
  useSheetHeight,
} from "../../../components/ui/BottomSheetModal";
import SheetProgressiveHeader from "../../../components/ui/SheetProgressiveHeader";
import GlassIconButton from "../../../components/ui/GlassIconButton";
import ChevronIcon from "../../../components/ui/ChevronIcon";
import ProgressionChordInput, {
  chordDisplayLabel,
  type ProgressionChordInputHandle,
} from "../../../components/ui/ProgressionChordInput";

export {
  CHROMATIC_DEGREES,
  CHORD_TYPE_GROUPS,
  DEGREE_TO_OFFSET,
  chordDisplayLabel,
  MAX_PROGRESSION_CHORDS as MAX_PROGRESSION_DEGREES,
} from "../../../components/ui/ProgressionChordInput";

interface TemplateFormSheetProps {
  visible: boolean;
  onClose: () => void;
  theme: Theme;
  accidental: Accidental;
  initialTemplate: CustomProgressionTemplate | null;
  onSave: (name: string, chords: ProgressionChord[], description?: string) => void;
  initialInputMode?: "degree" | "note";
  initialNoteKey?: string;
}

export default function TemplateFormSheet({
  visible,
  onClose,
  theme,
  accidental,
  initialTemplate,
  onSave,
  initialInputMode,
  initialNoteKey,
}: TemplateFormSheetProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const sheetHeight = useSheetHeight();
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const descriptionSheetHeight = Math.max(460, Math.min(700, Math.round(winHeight * 0.78)));

  const colors = getColors(isDark);
  const calloutBorder = isDark ? colors.border2 : colors.borderStrong;

  const [formName, setFormName] = useState(() => initialTemplate?.name ?? "");
  const [formDescription, setFormDescription] = useState(() => initialTemplate?.description ?? "");
  const [formChords, setFormChords] = useState<ProgressionChord[]>(() =>
    initialTemplate?.chords ? [...initialTemplate.chords] : [],
  );
  const [inputMode, setInputMode] = useState<"degree" | "note">(initialInputMode ?? "degree");
  const [noteKey, setNoteKey] = useState(initialNoteKey ?? "C");
  const [step, setStep] = useState<"main" | "keySelect" | "description" | "progression">("main");
  const [headerHeight, setHeaderHeight] = useState(96);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(sheetHeight)).current;
  const pendingEnterDir = useRef(0);
  const progressionInputRef = useRef<ProgressionChordInputHandle>(null);

  const noteNames = getNotesByAccidental(accidental);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const dir = pendingEnterDir.current;
    if (dir !== 0) {
      pendingEnterDir.current = 0;
      slideAnim.stopAnimation();
      slideAnim.setValue(dir * winWidth);
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 120,
        friction: 20,
        useNativeDriver: false,
      }).start();
    }
  }, [step]);

  const navigateToKeySelect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pendingEnterDir.current = 1;
    setStep("keySelect");
  };

  const navigateToDescription = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pendingEnterDir.current = 1;
    Animated.timing(heightAnim, {
      toValue: descriptionSheetHeight,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    setStep("description");
  };

  const navigateToProgression = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pendingEnterDir.current = 1;
    setStep("progression");
  };

  const navigateBack = (target: "main" | "progression" = "main") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pendingEnterDir.current = -1;
    if (step === "description") {
      Animated.timing(heightAnim, {
        toValue: sheetHeight,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
    setStep(target);
  };

  const resetForm = () => {
    setFormName(initialTemplate?.name ?? "");
    setFormDescription(initialTemplate?.description ?? "");
    setFormChords(initialTemplate?.chords ? [...initialTemplate.chords] : []);
    setInputMode(initialInputMode ?? "degree");
    setNoteKey(initialNoteKey ?? "C");
    setStep("main");
    heightAnim.setValue(sheetHeight);
    progressionInputRef.current?.resetSelection();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = (close: () => void) => {
    const trimmed = formName.trim();
    if (!trimmed || formChords.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(trimmed, formChords, formDescription.trim() || undefined);
    close();
  };

  return (
    <BottomSheetModal visible={visible} onClose={handleClose}>
      {({ close, dragHandlers }) => (
        <Animated.View
          style={[
            styles.sheet,
            {
              height: heightAnim,
              backgroundColor: colors.sheetBg,
              borderColor: colors.border2,
            },
          ]}
        >
          <View style={{ flex: 1, overflow: "hidden" }}>
            <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
              {/* Step: Main */}
              {step === "main" && (
                <>
                  <SheetProgressiveHeader
                    isDark={isDark}
                    bgColor={colors.sheetBg}
                    dragHandlers={dragHandlers}
                    style={{ paddingTop: SHEET_HANDLE_CLEARANCE }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <GlassIconButton
                        isDark={isDark}
                        onPress={close}
                        icon="close"
                        style={{ width: 36 }}
                      />
                      <TextInput
                        style={{
                          flex: 1,
                          textAlign: "center",
                          color: colors.textStrong,
                          fontSize: 16,
                          fontWeight: "600",
                          marginHorizontal: 8,
                          paddingVertical: 4,
                        }}
                        placeholder={t("templates.templateName")}
                        placeholderTextColor={colors.textMuted}
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
                    contentContainerStyle={{
                      paddingHorizontal: 16,
                      paddingTop: 8,
                      paddingBottom: 24,
                    }}
                  >
                    {/* 進行・説明文 nav rows */}
                    <View
                      style={[
                        styles.navSection,
                        {
                          borderColor: calloutBorder,
                          marginTop: 8,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={navigateToProgression}
                        style={[
                          styles.iosRow,
                          {
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: calloutBorder,
                          },
                        ]}
                        activeOpacity={0.6}
                      >
                        <Text style={[styles.iosRowLabel, { color: colors.textStrong }]}>
                          {t("templates.progression")}
                        </Text>
                        <View style={styles.iosRowRight}>
                          <Text
                            style={[styles.iosRowValue, { color: colors.textSubtle }]}
                            numberOfLines={1}
                          >
                            {formChords.length === 0
                              ? t("finder.none")
                              : formChords.length <= 4
                                ? formChords.map(chordDisplayLabel).join("–")
                                : `${formChords.slice(0, 4).map(chordDisplayLabel).join("–")}…`}
                          </Text>
                          <ChevronIcon size={12} color={colors.textMuted} direction="right" />
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={navigateToDescription}
                        style={styles.iosRow}
                        activeOpacity={0.6}
                      >
                        <Text style={[styles.iosRowLabel, { color: colors.textStrong }]}>
                          {t("templates.description")}
                        </Text>
                        <View style={styles.iosRowRight}>
                          <Text
                            style={[styles.iosRowValue, { color: colors.textSubtle }]}
                            numberOfLines={1}
                          >
                            {formDescription.trim() || t("finder.none")}
                          </Text>
                          <ChevronIcon size={12} color={colors.textMuted} direction="right" />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </>
              )}

              {/* Step: コード進行入力 */}
              {step === "progression" && (
                <View style={{ flex: 1 }}>
                  <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                      paddingHorizontal: 16,
                      paddingTop: headerHeight + 8,
                      paddingBottom: 24,
                    }}
                  >
                    {/* 音名・度数 モードトグル */}
                    <NoteDegreeModeToggle
                      theme={theme}
                      value={inputMode}
                      onChange={(mode) => {
                        setInputMode(mode);
                        progressionInputRef.current?.resetSelection();
                      }}
                    />

                    <ProgressionChordInput
                      ref={progressionInputRef}
                      theme={theme}
                      accidental={accidental}
                      inputMode={inputMode}
                      noteKey={noteKey}
                      onKeyPress={navigateToKeySelect}
                      keyRowStyle={styles.keyNavRow}
                      topSlot={
                        <Text
                          style={[
                            styles.formLabel,
                            { color: colors.textSubtle, marginTop: 14, textAlign: "center" },
                          ]}
                        >
                          {inputMode === "note" ? t("noteFilter.title") : t("templates.degrees")}
                        </Text>
                      }
                      progressionSlot={
                        <Text
                          style={[
                            styles.formLabel,
                            { color: colors.textSubtle, marginTop: 14, textAlign: "center" },
                          ]}
                        >
                          {t("templates.progression")}
                        </Text>
                      }
                      chords={formChords}
                      onChordsChange={setFormChords}
                      calloutBg={colors.sheetBg}
                    />
                  </ScrollView>
                  <SheetProgressiveHeader
                    isDark={isDark}
                    bgColor={colors.sheetBg}
                    dragHandlers={dragHandlers}
                    contentPaddingHorizontal={14}
                    onLayout={setHeaderHeight}
                    style={styles.absoluteHeader}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <GlassIconButton
                        isDark={isDark}
                        onPress={() => navigateBack("main")}
                        icon="back"
                        style={styles.subHeaderLeft}
                      />
                      <View style={styles.subHeaderCenter}>
                        <Text style={[styles.subHeaderTitle, { color: colors.textStrong }]}>
                          {t("templates.progression")}
                        </Text>
                      </View>
                      <View style={styles.subHeaderRight} />
                    </View>
                  </SheetProgressiveHeader>
                </View>
              )}

              {/* Step: キー選択 */}
              {step === "keySelect" && (
                <NoteSelectPage
                  theme={theme}
                  bgColor={colors.sheetBg}
                  title={t("templates.key")}
                  notes={noteNames}
                  selectedNote={noteKey}
                  onSelect={(note) => {
                    setNoteKey(note);
                    progressionInputRef.current?.resetSelection();
                  }}
                  onBack={() => navigateBack("progression")}
                  dragHandlers={dragHandlers}
                />
              )}

              {/* Step: 説明文編集 */}
              {step === "description" && (
                <View style={{ flex: 1 }}>
                  <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                  >
                    <ScrollView
                      style={{ flex: 1 }}
                      contentContainerStyle={{
                        paddingTop: headerHeight,
                        paddingHorizontal: 16,
                        paddingBottom: 24,
                      }}
                      keyboardShouldPersistTaps="handled"
                    >
                      <TextInput
                        style={[styles.descriptionInput, { color: colors.textStrong }]}
                        placeholder={t("templates.descriptionPlaceholder")}
                        placeholderTextColor={colors.textMuted}
                        value={formDescription}
                        onChangeText={setFormDescription}
                        multiline
                        maxLength={500}
                        autoFocus
                        textAlignVertical="top"
                      />
                    </ScrollView>
                  </KeyboardAvoidingView>
                  <SheetProgressiveHeader
                    isDark={isDark}
                    bgColor={colors.sheetBg}
                    dragHandlers={dragHandlers}
                    contentPaddingHorizontal={14}
                    onLayout={setHeaderHeight}
                    style={styles.absoluteHeader}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <GlassIconButton
                        isDark={isDark}
                        onPress={() => navigateBack()}
                        icon="back"
                        style={styles.subHeaderLeft}
                      />
                      <View style={styles.subHeaderCenter}>
                        <Text style={[styles.subHeaderTitle, { color: colors.textStrong }]}>
                          {t("templates.description")}
                        </Text>
                      </View>
                      <View style={styles.subHeaderRight} />
                    </View>
                  </SheetProgressiveHeader>
                </View>
              )}
            </Animated.View>
          </View>
        </Animated.View>
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
    borderCurve: "continuous",
    height: 32,
    minWidth: 36,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
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
  degreeChip: {
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
  keyNavRow: {
    alignItems: "center",
    paddingBottom: 12,
  },
  navSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iosSection: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iosRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    paddingVertical: 8,
  },
  iosRowLabel: {
    fontSize: 15,
    fontWeight: "400",
    flex: 1,
  },
  iosRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
    maxWidth: "55%",
  },
  iosRowValue: {
    fontSize: 14,
    textAlign: "right",
    flexShrink: 1,
  },
  absoluteHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingTop: SHEET_HANDLE_CLEARANCE,
  },
  subHeaderLeft: {
    width: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  subHeaderRight: {
    width: 40,
  },
  subHeaderCenter: {
    flex: 1,
    alignItems: "center",
  },
  subHeaderTitle: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  descriptionInput: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 120,
    paddingVertical: 12,
  },
});
