import { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  PanResponder,
  Animated,
} from "react-native";
import { useTranslation } from "react-i18next";
import "../../i18n";
import type { Accidental, Theme } from "../../types";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { changeLocale } from "../../i18n";

const SETTINGS_ICON_DARK = require("../../../public/settings_dark.jpg");
const SETTINGS_ICON_LIGHT = require("../../../public/settings.png");

const THUMB = 24;

// Dual-thumb range slider
function RangeSlider({
  value,
  min,
  max,
  onChange,
  isDark,
}: {
  value: [number, number];
  min: number;
  max: number;
  onChange: (range: [number, number]) => void;
  isDark: boolean;
}) {
  const twRef = useRef(0);
  const [tw, setTw] = useState(0);
  const valRef = useRef(value);
  valRef.current = value;

  const minStart = useRef({ x: 0, v: 0 });
  const minPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        minStart.current = { x: e.nativeEvent.pageX, v: valRef.current[0] };
      },
      onPanResponderMove: (e) => {
        const w = twRef.current;
        if (w <= THUMB) return;
        const dx = e.nativeEvent.pageX - minStart.current.x;
        const newV = Math.round(
          Math.max(min, Math.min(
            valRef.current[1] - 1,
            minStart.current.v + (dx / (w - THUMB)) * (max - min)
          ))
        );
        onChange([newV, valRef.current[1]]);
      },
    })
  ).current;

  const maxStart = useRef({ x: 0, v: 0 });
  const maxPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        maxStart.current = { x: e.nativeEvent.pageX, v: valRef.current[1] };
      },
      onPanResponderMove: (e) => {
        const w = twRef.current;
        if (w <= THUMB) return;
        const dx = e.nativeEvent.pageX - maxStart.current.x;
        const newV = Math.round(
          Math.max(
            valRef.current[0] + 1,
            Math.min(max, maxStart.current.v + (dx / (w - THUMB)) * (max - min))
          )
        );
        onChange([valRef.current[0], newV]);
      },
    })
  ).current;

  const total = max - min;
  const minFrac = tw > THUMB ? (value[0] - min) / total : 0;
  const maxFrac = tw > THUMB ? (value[1] - min) / total : 1;
  const minLeft = minFrac * (tw - THUMB);
  const maxLeft = maxFrac * (tw - THUMB);
  const fillLeft = minLeft + THUMB / 2;
  const fillWidth = Math.max(0, maxLeft - minLeft);

  return (
    <View
      style={{ paddingVertical: 16, position: "relative" }}
      onLayout={(e) => {
        twRef.current = e.nativeEvent.layout.width;
        setTw(e.nativeEvent.layout.width);
      }}
    >
      {/* Track */}
      <View style={{ height: 4, borderRadius: 2, backgroundColor: isDark ? "#374151" : "#d6d3d1" }}>
        <View style={{
          position: "absolute",
          height: 4,
          left: fillLeft,
          width: fillWidth,
          borderRadius: 2,
          backgroundColor: isDark ? "#0284c7" : "#0ea5e9",
        }} />
      </View>
      {/* Min thumb */}
      <View
        style={{
          position: "absolute",
          top: 16 - THUMB / 2 + 2,
          left: minLeft,
          width: THUMB, height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: isDark ? "#0284c7" : "#0ea5e9",
          alignItems: "center", justifyContent: "center",
          zIndex: 3, elevation: 3,
          shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 3,
        }}
        {...minPan.panHandlers}
      >
        <Text style={{ fontSize: 9, color: "#fff", fontWeight: "700" }}>{value[0]}</Text>
      </View>
      {/* Max thumb */}
      <View
        style={{
          position: "absolute",
          top: 16 - THUMB / 2 + 2,
          left: maxLeft,
          width: THUMB, height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: isDark ? "#0284c7" : "#0ea5e9",
          alignItems: "center", justifyContent: "center",
          zIndex: 2, elevation: 3,
          shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 3,
        }}
        {...maxPan.panHandlers}
      >
        <Text style={{ fontSize: 9, color: "#fff", fontWeight: "700" }}>{value[1]}</Text>
      </View>
    </View>
  );
}

interface AppHeaderProps {
  theme: Theme;
  fretRange: [number, number];
  accidental: Accidental;
  onThemeChange: (theme: Theme) => void;
  onFretRangeChange: (range: [number, number]) => void;
  onAccidentalChange: (accidental: Accidental) => void;
}

export default function AppHeader({
  theme,
  fretRange,
  accidental,
  onThemeChange,
  onFretRangeChange,
  onAccidentalChange,
}: AppHeaderProps) {
  const { t, i18n } = useTranslation();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const isDark = theme === "dark";

  const overlayAnim = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(700)).current;

  const openSettings = () => {
    setSettingsVisible(true);
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(panelAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  };

  const closeSettings = () => {
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(panelAnim, { toValue: 700, duration: 240, useNativeDriver: true }),
    ]).start(() => setSettingsVisible(false));
  };

  const handleLocaleChange = (locale: "ja" | "en") => {
    void changeLocale(locale);
  };

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: isDark ? "#111111" : "#fafaf9",
          borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4",
        },
      ]}
    >
      <View style={styles.headerSide} />

      <Text style={[styles.title, { color: isDark ? "#fff" : "#1c1917" }]}>
        Guitar Fretboard
      </Text>

      <View style={[styles.headerSide, styles.headerRight]}>
        <TouchableOpacity
          onPress={openSettings}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <Image
            source={isDark ? SETTINGS_ICON_DARK : SETTINGS_ICON_LIGHT}
            style={styles.settingsIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={settingsVisible}
        transparent
        animationType="none"
        onRequestClose={closeSettings}
      >
        {/* Overlay fades in separately */}
        <Animated.View style={[styles.modalOverlay, { opacity: overlayAnim }]}>
          <Pressable style={{ flex: 1 }} onPress={closeSettings} />
        </Animated.View>

        {/* Panel slides up separately */}
        <Animated.View
          style={[
            styles.settingsPanel,
            {
              backgroundColor: isDark ? "#1a1a1a" : "#fff",
              borderColor: isDark ? "#374151" : "#e7e5e4",
              transform: [{ translateY: panelAnim }],
            },
          ]}
        >
          <View style={styles.settingsHeader}>
            <Text style={[styles.settingsTitle, { color: isDark ? "#fff" : "#1c1917" }]}>
              {t("settings")}
            </Text>
            <TouchableOpacity onPress={closeSettings} activeOpacity={0.7}>
              <Text style={{ fontSize: 20, color: isDark ? "#9ca3af" : "#78716c" }}>✕</Text>
            </TouchableOpacity>
          </View>

          <View>
            {/* Theme */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("theme")}
              </Text>
              <SegmentedToggle
                theme={theme}
                value={theme}
                onChange={onThemeChange}
                options={[
                  { value: "dark" as Theme, label: t("dark") },
                  { value: "light" as Theme, label: t("light") },
                ]}
                size="compact"
              />
            </View>

            {/* Accidental */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("accidental")}
              </Text>
              <SegmentedToggle
                theme={theme}
                value={accidental}
                onChange={onAccidentalChange}
                options={[
                  { value: "sharp" as Accidental, label: "♯" },
                  { value: "flat" as Accidental, label: "♭" },
                ]}
                size="compact"
              />
            </View>

            {/* Language */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("language")}
              </Text>
              <SegmentedToggle
                theme={theme}
                value={(i18n.language === "en" ? "en" : "ja") as "ja" | "en"}
                onChange={handleLocaleChange}
                options={[
                  { value: "ja" as const, label: "JA" },
                  { value: "en" as const, label: "EN" },
                ]}
                size="compact"
              />
            </View>

            {/* Fret range */}
            <View style={[styles.settingRow, { borderBottomWidth: 0, paddingBottom: 4 }]}>
              <Text style={[styles.settingLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {t("settingsPanel.fretRange")}
              </Text>
              <Text style={[styles.fretRangeValue, { color: isDark ? "#e5e7eb" : "#1c1917" }]}>
                {fretRange[0]} – {fretRange[1]}
              </Text>
            </View>
            <View style={{ paddingBottom: 16, paddingHorizontal: 4 }}>
              <RangeSlider
                value={fretRange}
                min={0}
                max={14}
                onChange={onFretRangeChange}
                isDark={isDark}
              />
            </View>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerSide: {
    width: 36,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  headerBtn: {
    padding: 6,
  },
  settingsIcon: {
    width: 22,
    height: 22,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  settingsPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 40,
  },
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  settingLabel: {
    fontSize: 14,
  },
  fretRangeValue: {
    fontSize: 14,
    fontWeight: "600",
  },
});
