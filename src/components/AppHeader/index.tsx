import { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { Theme } from "../../types";
import SettingsModal, { type SettingsModalRef } from "./SettingsModal";
import type { Accidental } from "../../types";
import GlassIconButton from "../ui/GlassIconButton";

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
  const settingsModalRef = useRef<SettingsModalRef>(null);

  return (
    <View style={[styles.header, { backgroundColor: isDark ? "#000000" : "#ffffff" }]}>
      {onBack ? (
        <GlassIconButton
          isDark={isDark}
          onPress={onBack}
          label="‹"
          fontSize={22}
          style={styles.backBtn}
        />
      ) : (
        title && (
          <Text
            style={[styles.pageTitle, { color: isDark ? "#f9fafb" : "#1c1917" }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        )
      )}

      <TouchableOpacity
        testID="settings-button"
        onPress={() => settingsModalRef.current?.open()}
        style={styles.headerBtn}
        activeOpacity={0.7}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
            stroke={isDark ? "#e5e7eb" : "#1c1917"}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
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
