import { useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import type { Theme } from "../../../types";
import ChevronIcon from "../../ui/ChevronIcon";
import BottomSheetModal, { SHEET_HANDLE_CLEARANCE } from "../../ui/BottomSheetModal";
import SheetProgressiveHeader from "../../ui/SheetProgressiveHeader";
import GlassIconButton from "../../ui/GlassIconButton";

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
  const { height: winHeight } = useWindowDimensions();

  const [settingsPage, setSettingsPage] = useState<string | null>(null);
  const [headerHeight, setHeaderHeight] = useState(96);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pendingEnterDir = useRef(0);

  const sheetHeight = Math.max(360, Math.min(520, Math.round(winHeight * 0.62)));
  const bgColor = isDark ? "#111827" : "#fafaf9";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4";
  const labelColor = isDark ? "#e5e7eb" : "#1c1917";
  const valueColor = isDark ? "#9ca3af" : "#78716c";

  // LayerEditModal と同じページ遷移アニメーション
  useLayoutEffect(() => {
    const dir = pendingEnterDir.current;
    if (dir !== 0) {
      pendingEnterDir.current = 0;
      slideAnim.stopAnimation();
      slideAnim.setValue(dir * 400);
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 120,
        friction: 20,
        useNativeDriver: false,
      }).start();
    }
  }, [settingsPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigateToPage = (page: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // サブページへ進む: 右からスライドイン / メインへ戻る: 左からスライドイン
    pendingEnterDir.current = page !== null ? 1 : -1;
    setSettingsPage(page);
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      {({ close, dragHandlers }) => (
        <View
          style={[
            styles.bottomSheetModal,
            { height: sheetHeight, backgroundColor: bgColor, borderColor },
          ]}
        >
          <View style={{ flex: 1, overflow: "hidden" }}>
            <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={[styles.sheetScrollContent, { paddingTop: headerHeight }]}
                showsVerticalScrollIndicator
                indicatorStyle={isDark ? "white" : "black"}
              >
                <View style={styles.settingsBody}>
                  {settingsPage == null ? (
                    <>
                      <View style={[styles.iosSection, { borderColor }]}>
                        {settingsRows.map(({ key, label, summary }, i) => (
                          <TouchableOpacity
                            key={key}
                            style={[
                              styles.iosRow,
                              i < settingsRows.length - 1 && {
                                borderBottomWidth: StyleSheet.hairlineWidth,
                                borderBottomColor: borderColor,
                              },
                            ]}
                            onPress={() => navigateToPage(key)}
                            activeOpacity={0.6}
                          >
                            <Text style={[styles.iosRowLabel, { color: labelColor }]}>{label}</Text>
                            <View style={styles.iosRowRight}>
                              <Text style={[styles.iosRowValue, { color: valueColor }]}>
                                {summary}
                              </Text>
                              <ChevronIcon
                                size={12}
                                color={isDark ? "#6b7280" : "#a8a29e"}
                                direction="right"
                              />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  ) : (
                    (() => {
                      const subPage = settingsSubPages[settingsPage!];
                      if (!subPage) return null;
                      return (
                        <>
                          <View style={[styles.chipGrid, { paddingTop: 8, paddingBottom: 4 }]}>
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
                        </>
                      );
                    })()
                  )}
                </View>
              </ScrollView>
            </Animated.View>

            {/* Absolute glass header */}
            {settingsPage == null ? (
              <SheetProgressiveHeader
                isDark={isDark}
                bgColor={bgColor}
                dragHandlers={dragHandlers}
                contentPaddingHorizontal={14}
                onLayout={setHeaderHeight}
                style={styles.absoluteHeader}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <GlassIconButton
                    isDark={isDark}
                    onPress={close}
                    icon="close"
                    style={styles.headerLeft}
                    testID="settings-close-btn"
                  />
                  <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: labelColor }]}>{t("settings")}</Text>
                  </View>
                  <View style={styles.headerRight} />
                </View>
              </SheetProgressiveHeader>
            ) : (
              <SheetProgressiveHeader
                isDark={isDark}
                bgColor={bgColor}
                dragHandlers={dragHandlers}
                contentPaddingHorizontal={14}
                onLayout={setHeaderHeight}
                style={styles.absoluteHeader}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <GlassIconButton
                    isDark={isDark}
                    onPress={() => navigateToPage(null)}
                    icon="back"
                    style={styles.headerLeft}
                    testID="settings-back-btn"
                  />
                  <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: labelColor }]}>
                      {settingsSubPages[settingsPage!]?.title ?? ""}
                    </Text>
                  </View>
                  <View style={styles.headerRight} />
                </View>
              </SheetProgressiveHeader>
            )}
          </View>
        </View>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  // Bottom sheet container (same as LayerEditModal)
  bottomSheetModal: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    overflow: "hidden",
  },
  absoluteHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingTop: SHEET_HANDLE_CLEARANCE,
  },
  headerLeft: {
    width: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
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
  sheetScroll: {
    flex: 1,
    width: "100%",
  },
  sheetScrollContent: {
    paddingBottom: 24,
  },
  settingsBody: {
    paddingHorizontal: 16,
    gap: 6,
    paddingTop: 6,
    paddingBottom: 8,
  },
  // iOS-style rows (same as LayerEditModal)
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
  // Chip grid for sub-pages
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 52,
    alignItems: "center",
  },
});
