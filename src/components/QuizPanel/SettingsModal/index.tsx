import { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import type { Theme } from "../../../types";
import ChevronIcon from "../../ui/ChevronIcon";

interface SettingsRow {
  key: string;
  label: string;
  summary: string;
}

interface SubPage {
  title: string;
  items: string[];
  selected: string[];
  labels: Record<string, string> | null;
  toggle: (v: string) => void;
}

interface SettingsModalProps {
  theme: Theme;
  visible: boolean;
  settingsRows: SettingsRow[];
  settingsSubPages: Record<string, SubPage>;
  onClose: () => void;
}

export default function SettingsModal({
  theme,
  visible,
  settingsRows,
  settingsSubPages,
  onClose,
}: SettingsModalProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const [settingsPage, setSettingsPage] = useState<string | null>(null);
  const settingsScale = useRef(new Animated.Value(1)).current;
  const settingsOpacity = useRef(new Animated.Value(1)).current;

  const bouncePopup = () => {
    settingsScale.stopAnimation();
    settingsScale.setValue(1);
    Animated.sequence([
      Animated.timing(settingsScale, {
        toValue: 1.06,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(settingsScale, {
        toValue: 1,
        friction: 8,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const navigateToPage = (page: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bouncePopup();
    setSettingsPage(page);
  };

  const handleClose = () => {
    Animated.timing(settingsOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setSettingsPage(null);
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      onShow={() => {
        setSettingsPage(null);
        settingsOpacity.setValue(1);
        settingsScale.setValue(0.5);
        Animated.spring(settingsScale, {
          toValue: 1,
          friction: 8,
          tension: 150,
          useNativeDriver: true,
        }).start();
      }}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Animated.View
          style={[
            styles.popup,
            {
              backgroundColor: isDark ? "rgba(17,24,39,0.97)" : "rgba(250,250,249,0.97)",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4",
              transform: [{ scale: settingsScale }],
              opacity: settingsOpacity,
            },
          ]}
        >
          <Pressable>
            <View style={styles.content}>
              {settingsPage == null ? (
                <View>
                  <Text
                    style={[
                      styles.title,
                      {
                        color: isDark ? "#e5e7eb" : "#1c1917",
                        marginBottom: 8,
                        textAlign: "center",
                      },
                    ]}
                  >
                    {t("settings")}
                  </Text>
                  {settingsRows.map(({ key, label, summary }, i) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.row,
                        i < settingsRows.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4",
                        },
                      ]}
                      onPress={() => navigateToPage(key)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.rowLabel, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                        {label}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ fontSize: 15, color: isDark ? "#e5e7eb" : "#44403c" }}>
                          {summary}
                        </Text>
                        <ChevronIcon size={14} color={isDark ? "#6b7280" : "#a8a29e"} />
                      </View>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      handleClose();
                    }}
                    style={[styles.confirmBtn, { backgroundColor: isDark ? "#e5e7eb" : "#1c1917" }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.confirmBtnText, { color: isDark ? "#1c1917" : "#fff" }]}>
                      {t("layers.confirm")}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                (() => {
                  const subPage = settingsSubPages[settingsPage!];
                  if (!subPage) return null;
                  return (
                    <View>
                      <View style={styles.subHeader}>
                        <TouchableOpacity
                          onPress={() => navigateToPage(null)}
                          style={styles.backBtn}
                        >
                          <Text
                            style={[styles.backText, { color: isDark ? "#e5e7eb" : "#1c1917" }]}
                          >
                            ‹
                          </Text>
                        </TouchableOpacity>
                        <Text
                          pointerEvents="none"
                          style={[
                            styles.title,
                            {
                              color: isDark ? "#e5e7eb" : "#1c1917",
                              position: "absolute",
                              left: 0,
                              right: 0,
                              textAlign: "center",
                            },
                          ]}
                        >
                          {subPage.title}
                        </Text>
                      </View>
                      <View style={[styles.chipGrid, { paddingTop: 12, paddingBottom: 4 }]}>
                        {subPage.items.map((item) => {
                          const active = subPage.selected.includes(item);
                          const chipLabel = subPage.labels?.[item] ?? item;
                          return (
                            <TouchableOpacity
                              key={item}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                subPage.toggle(item);
                              }}
                              style={[
                                styles.chip,
                                {
                                  backgroundColor: active
                                    ? isDark
                                      ? "#e5e7eb"
                                      : "#1c1917"
                                    : isDark
                                      ? "#374151"
                                      : "#fff",
                                  borderColor: active
                                    ? "transparent"
                                    : isDark
                                      ? "#4b5563"
                                      : "#d6d3d1",
                                },
                              ]}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={{
                                  fontSize: 14,
                                  color: active
                                    ? isDark
                                      ? "#1c1917"
                                      : "#fff"
                                    : isDark
                                      ? "#e5e7eb"
                                      : "#44403c",
                                }}
                              >
                                {chipLabel}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          navigateToPage(null);
                        }}
                        style={[
                          styles.confirmBtn,
                          { backgroundColor: isDark ? "#e5e7eb" : "#1c1917" },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[styles.confirmBtnText, { color: isDark ? "#1c1917" : "#fff" }]}
                        >
                          {t("layers.confirm")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()
              )}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  popup: {
    borderWidth: 1,
    borderRadius: 20,
    width: 340,
  },
  content: {
    padding: 20,
    gap: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    minHeight: 48,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backBtn: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -8,
  },
  backText: {
    fontSize: 32,
    lineHeight: 36,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 52,
    alignItems: "center",
  },
  confirmBtn: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: "center",
    alignSelf: "center",
    marginTop: 16,
  },
  confirmBtnText: {
    fontWeight: "600",
    fontSize: 14,
  },
});
