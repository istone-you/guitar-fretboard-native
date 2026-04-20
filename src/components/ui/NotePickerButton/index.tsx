import { useRef, useState } from "react";
import { Animated, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import type { Accidental, Theme } from "../../../types";
import { getNotesByAccidental } from "../../../lib/fretboard";
import { getColors, radius, WHITE, BLACK } from "../../../themes/design";
import { getPillStyle } from "../PillButton";
import BottomSheetModal, { SHEET_HANDLE_CLEARANCE, useSheetHeight } from "../BottomSheetModal";
import SheetProgressiveHeader from "../SheetProgressiveHeader";
import GlassIconButton from "../GlassIconButton";
import NotePill from "../NotePill";

interface NotePickerButtonProps {
  theme: Theme;
  accidental: Accidental;
  value: string;
  onChange: (note: string) => void;
  label: string;
  sheetTitle: string;
}

export default function NotePickerButton({
  theme,
  accidental,
  value,
  onChange,
  label,
  sheetTitle,
}: NotePickerButtonProps) {
  const isDark = theme === "dark";
  const sheetHeight = useSheetHeight();
  const [sheetVisible, setSheetVisible] = useState(false);

  const colors = getColors(isDark);
  const bgColor = colors.surface;
  const notes = getNotesByAccidental(accidental);
  const chipSelectedBg = isDark ? WHITE : BLACK;
  const chipSelectedText = isDark ? BLACK : WHITE;
  const chipUnselectedBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const scale = useRef(new Animated.Value(1)).current;
  const prevValue = useRef(value);
  if (prevValue.current !== value) {
    prevValue.current = value;
    scale.stopAnimation();
    scale.setValue(0.8);
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSheetVisible(true);
        }}
        activeOpacity={0.7}
      >
        <Animated.View style={[getPillStyle(colors), { transform: [{ scale }] }]}>
          <Text style={[styles.pillLabel, { color: colors.textSubtle }]}>{label}</Text>
          <Text style={[styles.pillText, { color: colors.text }]}>{value}</Text>
        </Animated.View>
      </TouchableOpacity>

      <BottomSheetModal visible={sheetVisible} onClose={() => setSheetVisible(false)}>
        {({ close, dragHandlers }) => (
          <View
            style={[
              styles.sheet,
              { height: sheetHeight, backgroundColor: bgColor, borderColor: colors.border },
            ]}
          >
            <SheetProgressiveHeader
              isDark={isDark}
              bgColor={bgColor}
              dragHandlers={dragHandlers}
              style={{ paddingTop: SHEET_HANDLE_CLEARANCE }}
            >
              <View style={styles.headerRow}>
                <GlassIconButton
                  isDark={isDark}
                  onPress={close}
                  icon="close"
                  style={styles.headerSide}
                />
                <View style={styles.headerCenter}>
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>{sheetTitle}</Text>
                </View>
                <View style={styles.headerSide} />
              </View>
            </SheetProgressiveHeader>

            <View style={styles.noteGrid}>
              {notes.map((note) => (
                <NotePill
                  key={note}
                  label={note}
                  selected={note === value}
                  activeBg={chipSelectedBg}
                  activeText={chipSelectedText}
                  inactiveBg={chipUnselectedBg}
                  inactiveText={colors.text}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onChange(note);
                  }}
                />
              ))}
            </View>
          </View>
        )}
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerSide: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  noteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
    justifyContent: "center",
  },
});
