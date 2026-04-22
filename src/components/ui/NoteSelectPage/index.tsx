import { useState } from "react";
import { View, Text, StyleSheet, type GestureResponderHandlers } from "react-native";
import type { Theme } from "../../../types";
import { getColors } from "../../../themes/design";
import { SHEET_HANDLE_CLEARANCE } from "../BottomSheetModal";
import SheetProgressiveHeader from "../SheetProgressiveHeader";
import GlassIconButton from "../GlassIconButton";
import NotePill from "../NotePill";

interface NoteSelectPageProps {
  theme: Theme;
  bgColor: string;
  title: string;
  notes: readonly string[];
  selectedNote: string;
  onSelect: (note: string) => void;
  onBack: () => void;
  dragHandlers?: GestureResponderHandlers;
}

export default function NoteSelectPage({
  theme,
  bgColor,
  title,
  notes,
  selectedNote,
  onSelect,
  onBack,
  dragHandlers,
}: NoteSelectPageProps) {
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const [headerHeight, setHeaderHeight] = useState(96);

  return (
    <View style={{ flex: 1 }}>
      <SheetProgressiveHeader
        isDark={isDark}
        bgColor={bgColor}
        dragHandlers={dragHandlers ?? {}}
        contentPaddingHorizontal={14}
        onLayout={setHeaderHeight}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <GlassIconButton isDark={isDark} onPress={onBack} icon="back" style={styles.headerSide} />
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.textStrong }]}>{title}</Text>
          </View>
          <View style={styles.headerSide} />
        </View>
      </SheetProgressiveHeader>
      <View style={[styles.noteGrid, { paddingTop: headerHeight + 8 }]}>
        {notes.map((note) => (
          <NotePill
            key={note}
            label={note}
            selected={note === selectedNote}
            activeBg={colors.chipSelectedBg}
            activeText={colors.chipSelectedText}
            inactiveBg={colors.chipUnselectedBg}
            inactiveText={colors.text}
            onPress={() => {
              onSelect(note);
              onBack();
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingTop: SHEET_HANDLE_CLEARANCE,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerSide: {
    width: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  noteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 10,
    justifyContent: "center",
  },
});
