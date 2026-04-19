import { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import "../../i18n";
import type { Accidental, BaseLabelMode, Theme } from "../../types";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import GlassIconButton from "../ui/GlassIconButton";
import BottomSheetModal, { SHEET_HANDLE_CLEARANCE } from "../ui/BottomSheetModal";
import SheetProgressiveHeader from "../ui/SheetProgressiveHeader";
import Icon from "../ui/Icon";
import { getNotesByAccidental } from "../../lib/fretboard";
import { getColors, radius } from "../../themes/tokens";
import PillButton, { getPillStyle } from "../ui/PillButton";

interface FretboardControlsProps {
  theme: Theme;
  rootNote: string;
  accidental: Accidental;
  baseLabelMode: BaseLabelMode;
  onRootNoteChange: (note: string) => void;
  onBaseLabelModeChange: (mode: BaseLabelMode) => void;
  onPresetPress?: () => void;
}

export default function FretboardControls({
  theme,
  rootNote,
  accidental,
  baseLabelMode,
  onRootNoteChange,
  onBaseLabelModeChange,
  onPresetPress,
}: FretboardControlsProps) {
  const { t, i18n } = useTranslation();
  const isDark = theme === "dark";
  const { height: winHeight } = useWindowDimensions();
  const sheetHeight = Math.max(360, Math.min(520, Math.round(winHeight * 0.62)));
  const [sheetVisible, setSheetVisible] = useState(false);

  // Root note bounce animation
  const rootScale = useRef(new Animated.Value(1)).current;
  const prevRootNote = useRef(rootNote);
  if (prevRootNote.current !== rootNote) {
    prevRootNote.current = rootNote;
    rootScale.stopAnimation();
    rootScale.setValue(0.8);
    Animated.spring(rootScale, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }

  const colors = getColors(isDark);
  const bgColor = colors.surface;
  const notes = getNotesByAccidental(accidental);

  return (
    <View style={[styles.container, { position: "relative" }]}>
      {/* Note / Degree label toggle — left */}
      <View style={styles.left}>
        <SegmentedToggle
          theme={theme}
          value={baseLabelMode}
          onChange={onBaseLabelModeChange}
          options={[
            { value: "note" as BaseLabelMode, label: t("header.note") },
            { value: "degree" as BaseLabelMode, label: t("header.degree") },
          ]}
          size="compact"
          segmentWidth={i18n.language === "en" ? 72 : 56}
        />
      </View>

      {/* Root note + Preset — right */}
      <View style={styles.right}>
        {/* Root note pill — tap to open picker (Animated.View for bounce) */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSheetVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Animated.View style={[getPillStyle(colors), { transform: [{ scale: rootScale }] }]}>
            <Text style={[styles.pillLabel, { color: colors.textSubtle }]}>{t("header.root")}</Text>
            <Text style={[styles.pillText, { color: colors.text }]}>{rootNote}</Text>
          </Animated.View>
        </TouchableOpacity>

        {/* Preset button */}
        {onPresetPress && (
          <PillButton
            isDark={isDark}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPresetPress();
            }}
          >
            <Icon name="bookmark" size={16} color={colors.textSubtle} />
          </PillButton>
        )}
      </View>

      {/* Root note picker bottom sheet */}
      <BottomSheetModal visible={sheetVisible} onClose={() => setSheetVisible(false)}>
        {({ close, dragHandlers }) => (
          <View
            style={[
              styles.sheet,
              {
                height: sheetHeight,
                backgroundColor: bgColor,
                borderColor: colors.border,
              },
            ]}
          >
            <SheetProgressiveHeader
              isDark={isDark}
              bgColor={bgColor}
              dragHandlers={dragHandlers}
              style={{ paddingTop: SHEET_HANDLE_CLEARANCE }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <GlassIconButton
                  isDark={isDark}
                  onPress={close}
                  icon="close"
                  style={styles.headerLeft}
                />
                <View style={styles.headerCenter}>
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>
                    {t("header.root")}
                  </Text>
                </View>
                <View style={styles.headerRight} />
              </View>
            </SheetProgressiveHeader>

            <View style={styles.noteGrid}>
              {notes.map((note) => {
                const isSelected = note === rootNote;
                return (
                  <TouchableOpacity
                    key={note}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onRootNoteChange(note);
                    }}
                    activeOpacity={0.75}
                    style={styles.noteBtn}
                  >
                    <View
                      style={[
                        styles.notePill,
                        isSelected && {
                          backgroundColor: isDark ? "#ffffff" : "#1c1917",
                        },
                        !isSelected && {
                          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.noteText,
                          {
                            color: isSelected ? (isDark ? "#1c1917" : "#ffffff") : colors.text,
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {note}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    paddingBottom: 32,
    overflow: "hidden",
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  headerLeft: {
    width: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  noteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
    justifyContent: "center",
  },
  noteBtn: {
    width: "22%",
  },
  notePill: {
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  noteText: {
    fontSize: 16,
    fontFamily: "monospace",
  },
});
