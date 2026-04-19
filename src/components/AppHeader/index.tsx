import { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { Theme } from "../../types";
import SettingsModal, { type SettingsModalRef } from "./SettingsModal";
import type { Accidental } from "../../types";
import GlassIconButton from "../ui/GlassIconButton";
import Icon from "../ui/Icon";
import { getColors } from "../../themes/tokens";

interface HeaderBarProps {
  theme: Theme;
  title?: string;
  accidental: Accidental;
  onBack?: () => void;
  fretRange: [number, number];
  onThemeChange: (theme: Theme) => void;
  onFretRangeChange: (range: [number, number]) => void;
  onAccidentalChange: (accidental: Accidental) => void;
  leftHanded?: boolean;
  onLeftHandedChange?: (value: boolean) => void;
}

export default function HeaderBar({
  theme,
  title,
  accidental,
  onBack,
  fretRange,
  onThemeChange,
  onFretRangeChange,
  onAccidentalChange,
  leftHanded = false,
  onLeftHandedChange,
}: HeaderBarProps) {
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const settingsModalRef = useRef<SettingsModalRef>(null);

  return (
    <View style={[styles.header, { backgroundColor: "transparent" }]}>
      {onBack ? (
        <GlassIconButton isDark={isDark} onPress={onBack} icon="back" style={styles.backBtn} />
      ) : (
        title && (
          <Text style={[styles.pageTitle, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
        )
      )}

      <TouchableOpacity
        testID="settings-button"
        onPress={() => settingsModalRef.current?.open()}
        style={styles.headerBtn}
        activeOpacity={0.7}
        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
      >
        <Icon name="settings" size={22} color={colors.text} />
      </TouchableOpacity>

      <SettingsModal
        ref={settingsModalRef}
        theme={theme}
        accidental={accidental}
        fretRange={fretRange}
        leftHanded={leftHanded}
        onThemeChange={onThemeChange}
        onAccidentalChange={onAccidentalChange}
        onFretRangeChange={onFretRangeChange}
        onLeftHandedChange={onLeftHandedChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 52,
  },
  backBtn: {
    marginRight: 8,
  },
  pageTitle: {
    flex: 1,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerBtn: {
    position: "absolute",
    right: 12,
    padding: 6,
  },
});
