import { useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  PanResponder,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  type PanResponderInstance,
} from "react-native";
import * as Haptics from "expo-haptics";
import Icon from "../../ui/Icon";
import type { Theme, LayerConfig } from "../../../types";
import type { LayerPreset } from "../../../hooks/useLayerPresets";
import { PROGRESSION_TEMPLATES, templateDisplayName } from "../../../lib/fretboard";
import { getColors, SEMANTIC_COLORS } from "../../../themes/design";
import BottomSheetModal, {
  SHEET_HANDLE_CLEARANCE,
  useSheetHeight,
} from "../../ui/BottomSheetModal";
import SheetProgressiveHeader from "../../ui/SheetProgressiveHeader";
import GlassIconButton from "../../ui/GlassIconButton";

interface LayerPresetModalProps {
  theme: Theme;
  visible: boolean;
  layers: LayerConfig[];
  presets: LayerPreset[];
  onSave: (name: string, layers: LayerConfig[]) => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  t: (key: string) => string;
}

function scaleTypeToKey(s: string): string {
  return s.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
}

function getLayerSummary(layer: LayerConfig, t: (k: string) => string): string {
  switch (layer.type) {
    case "scale": {
      try {
        return t(`options.scale.${scaleTypeToKey(layer.scaleType)}`);
      } catch {
        return layer.scaleType;
      }
    }
    case "chord": {
      const mode = t(`options.chordDisplayMode.${layer.chordDisplayMode}`);
      if (layer.chordDisplayMode === "triad") {
        return `${mode}: ${layer.chordType} ${t(`options.triadInversions.${layer.triadInversion}`)}`;
      }
      if (layer.chordDisplayMode === "on-chord") {
        return `${mode}: ${layer.onChordName}`;
      }
      return `${mode}: ${layer.chordType}`;
    }
    case "caged": {
      const chordLabel =
        layer.cagedChordType === "minor"
          ? t("options.diatonicKey.naturalMinor")
          : t("options.diatonicKey.major");
      return `${chordLabel}: ${[...layer.cagedForms].join(", ") || "-"}`;
    }
    case "custom": {
      const items =
        layer.customMode === "note" ? [...layer.selectedNotes] : [...layer.selectedDegrees];
      return items.slice(0, 6).join(", ") || "-";
    }
    case "progression": {
      const tpl = PROGRESSION_TEMPLATES.find(
        (tp) => tp.id === (layer.progressionTemplateId ?? "251"),
      );
      return tpl ? templateDisplayName(tpl) : (layer.progressionTemplateId ?? "-");
    }
    default:
      return "-";
  }
}

function getRawLayerSummary(raw: Record<string, unknown>, t: (k: string) => string): string {
  const type = raw.type as string;
  switch (type) {
    case "scale": {
      const key = scaleTypeToKey((raw.scaleType as string) ?? "major");
      try {
        return t(`options.scale.${key}`);
      } catch {
        return (raw.scaleType as string) ?? "-";
      }
    }
    case "chord": {
      try {
        const mode = t(`options.chordDisplayMode.${raw.chordDisplayMode}`);
        if (raw.chordDisplayMode === "on-chord") return `${mode}: ${raw.onChordName ?? "-"}`;
        return `${mode}: ${raw.chordType ?? "-"}`;
      } catch {
        return (raw.chordType as string) ?? "-";
      }
    }
    case "caged":
      return (raw.cagedForms as string[] | undefined)?.join(", ") || "-";
    case "custom": {
      const notes =
        raw.customMode === "note"
          ? ((raw.selectedNotes as string[] | undefined) ?? [])
          : ((raw.selectedDegrees as string[] | undefined) ?? []);
      return notes.slice(0, 6).join(", ") || "-";
    }
    case "progression": {
      const id = (raw.progressionTemplateId as string | undefined) ?? "251";
      const tpl = PROGRESSION_TEMPLATES.find((tp) => tp.id === id);
      return tpl ? templateDisplayName(tpl) : id;
    }
    default:
      return "-";
  }
}

function getTypeLabel(type: string, t: (k: string) => string): string {
  switch (type) {
    case "scale":
      return t("layers.scale");
    case "chord":
      return t("layers.chord");
    case "caged":
      return t("layers.caged");
    case "custom":
      return t("layers.custom");
    case "progression":
      return t("layers.progression");
    default:
      return type;
  }
}

export default function LayerPresetModal({
  theme,
  visible,
  layers,
  presets,
  onSave,
  onLoad,
  onDelete,
  onClose,
  t,
}: LayerPresetModalProps) {
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const { width: winWidth } = useWindowDimensions();
  const sheetHeight = useSheetHeight();

  const [page, setPage] = useState<"list" | "detail" | "save">("list");
  const [saveName, setSaveName] = useState("");
  const [detailPresetId, setDetailPresetId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const swipeXRef = useRef(new Map<string, Animated.Value>());
  const panResponderMapRef = useRef(new Map<string, PanResponderInstance>());

  const getSwipeX = (id: string) => {
    if (!swipeXRef.current.has(id)) {
      swipeXRef.current.set(id, new Animated.Value(0));
    }
    return swipeXRef.current.get(id)!;
  };

  const getRowPanResponder = (presetId: string): PanResponderInstance => {
    const existing = panResponderMapRef.current.get(presetId);
    if (existing) return existing;
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onPanResponderTerminationRequest: () => false,
      onMoveShouldSetPanResponder: (_, gs) => {
        const absX = Math.abs(gs.dx);
        const absY = Math.abs(gs.dy);
        if (absX > 5 && absX >= absY) {
          flatListRef.current?.setNativeProps({ scrollEnabled: false });
        }
        return absX > 10 && absX > absY * 1.4;
      },
      onPanResponderMove: (_, gs) => {
        getSwipeX(presetId).setValue(Math.min(0, gs.dx));
      },
      onPanResponderRelease: (_, gs) => {
        flatListRef.current?.setNativeProps({ scrollEnabled: true });
        const swipeX = getSwipeX(presetId);
        const shouldDelete = gs.dx < -80 || (gs.vx < -0.5 && gs.dx < -40);
        if (shouldDelete) {
          Animated.timing(swipeX, {
            toValue: -500,
            duration: 200,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }).start(() => onDelete(presetId));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          Animated.spring(swipeX, {
            toValue: 0,
            friction: 10,
            tension: 200,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        flatListRef.current?.setNativeProps({ scrollEnabled: true });
        Animated.spring(getSwipeX(presetId), {
          toValue: 0,
          friction: 10,
          tension: 200,
          useNativeDriver: true,
        }).start();
      },
    });
    panResponderMapRef.current.set(presetId, responder);
    return responder;
  };

  // Same slide animation pattern as LayerEditModal
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pendingEnterDir = useRef(0);

  // Reset state when sheet opens
  const prevVisible = useRef(false);
  if (visible && !prevVisible.current) {
    prevVisible.current = true;
    setPage("list");
    setSaveName("");
    setDetailPresetId(null);
    slideAnim.setValue(0);
  }
  if (!visible && prevVisible.current) {
    prevVisible.current = false;
  }

  // After React commits a page change, start slide animation from correct position
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
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const goToDetail = (presetId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDetailPresetId(presetId);
    pendingEnterDir.current = 1;
    setPage("detail");
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pendingEnterDir.current = -1;
    setPage("list");
  };

  const goToSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pendingEnterDir.current = 1;
    setPage("save");
  };

  const bg = colors.sheetBg;
  const border = isDark ? colors.border : colors.border2;
  const textPrimary = colors.textStrong;
  const textSecondary = colors.textSubtle;
  const iconColor = isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.5)";

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      {({ close, closeWithCallback, dragHandlers }) => (
        <View
          style={[styles.sheet, { height: sheetHeight, backgroundColor: bg, borderColor: border }]}
        >
          {/* Header stays fixed; only body slides */}
          <SheetProgressiveHeader
            isDark={isDark}
            bgColor={bg}
            dragHandlers={dragHandlers}
            style={{ paddingTop: SHEET_HANDLE_CLEARANCE }}
          >
            {page === "list" ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <GlassIconButton
                  isDark={isDark}
                  onPress={close}
                  icon="close"
                  style={styles.headerSide}
                />
                <View style={styles.headerCenter}>
                  <Text style={[styles.title, { color: textPrimary }]}>{t("layers.presets")}</Text>
                </View>
                <GlassIconButton
                  isDark={isDark}
                  onPress={goToSave}
                  icon="plus"
                  style={styles.headerSide}
                />
              </View>
            ) : page === "detail" ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <GlassIconButton
                  isDark={isDark}
                  onPress={goBack}
                  icon="back"
                  style={styles.headerSide}
                />
                <View style={styles.headerCenter}>
                  <Text style={[styles.title, { color: textPrimary }]} numberOfLines={1}>
                    {presets.find((p) => p.id === detailPresetId)?.name ?? ""}
                  </Text>
                </View>
                <GlassIconButton
                  isDark={isDark}
                  onPress={() => {
                    if (!detailPresetId) return;
                    const id = detailPresetId;
                    close();
                    requestAnimationFrame(() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onLoad(id);
                    });
                  }}
                  icon="upload"
                  style={styles.headerSide}
                />
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <GlassIconButton
                  isDark={isDark}
                  onPress={() => {
                    Keyboard.dismiss();
                    goBack();
                  }}
                  icon="back"
                  style={styles.headerSide}
                />
                <TextInput
                  style={[styles.nameInput, { color: textPrimary }]}
                  placeholder={t("templates.presetNameInput")}
                  placeholderTextColor={colors.textMuted}
                  value={saveName}
                  onChangeText={setSaveName}
                  maxLength={30}
                  autoFocus
                />
                <GlassIconButton
                  isDark={isDark}
                  onPress={() => {
                    const name = saveName.trim();
                    if (!name || layers.length === 0) return;
                    Keyboard.dismiss();
                    closeWithCallback(() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onSave(name, layers);
                      onClose();
                    });
                  }}
                  icon="check"
                  disabled={!saveName.trim() || layers.length === 0}
                  style={[
                    styles.headerSide,
                    { opacity: !saveName.trim() || layers.length === 0 ? 0.35 : 1 },
                  ]}
                />
              </View>
            )}
          </SheetProgressiveHeader>

          {/* Body slides on page change */}
          <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
            {page === "list" ? (
              presets.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: textSecondary }]}>
                    {t("layers.noPresets")}
                  </Text>
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={presets}
                  keyExtractor={(item) => item.id}
                  style={styles.list}
                  renderItem={({ item }) => (
                    <View style={styles.presetRowOuter}>
                      <View style={styles.deleteBackground}>
                        <View style={{ paddingRight: 20 }}>
                          <Icon name="trash" size={18} color="white" />
                        </View>
                      </View>
                      <Animated.View
                        style={[
                          styles.presetRow,
                          {
                            backgroundColor: bg,
                            borderColor: border,
                            transform: [{ translateX: getSwipeX(item.id) }],
                          },
                        ]}
                        {...getRowPanResponder(item.id).panHandlers}
                      >
                        <TouchableOpacity
                          style={styles.presetInfo}
                          onPress={() => goToDetail(item.id)}
                          activeOpacity={0.6}
                        >
                          <Text
                            style={[styles.presetName, { color: textPrimary }]}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          <Text style={[styles.presetMeta, { color: textSecondary }]}>
                            {item.layers.length} {t("layers.layerCount")}
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    </View>
                  )}
                />
              )
            ) : page === "detail" ? (
              /* Detail page: layers in this preset */
              <FlatList
                data={presets.find((p) => p.id === detailPresetId)?.layers ?? []}
                keyExtractor={(_, i) => String(i)}
                style={styles.list}
                contentContainerStyle={{ paddingVertical: 8 }}
                renderItem={({ item: rawLayer }) => (
                  <View
                    style={[
                      styles.layerRow,
                      {
                        borderColor: border,
                        backgroundColor: colors.deepBg,
                      },
                    ]}
                  >
                    <View
                      style={[styles.colorDot, { backgroundColor: rawLayer.color as string }]}
                    />
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={[styles.typeBadge, { borderColor: colors.border2 }]}>
                        <Text style={[styles.typeLabel, { color: textSecondary }]}>
                          {getTypeLabel(rawLayer.type as string, t)}
                        </Text>
                      </View>
                      <Text style={[styles.layerSummary, { color: textPrimary }]} numberOfLines={1}>
                        {getRawLayerSummary(rawLayer, t)}
                      </Text>
                    </View>
                  </View>
                )}
              />
            ) : (
              /* Save page: layer summary list */
              <FlatList
                data={layers}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={{ paddingVertical: 8 }}
                renderItem={({ item: layer }) => (
                  <View
                    style={[
                      styles.layerRow,
                      {
                        borderColor: border,
                        backgroundColor: colors.deepBg,
                      },
                    ]}
                  >
                    <View style={[styles.colorDot, { backgroundColor: layer.color }]} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={[styles.typeBadge, { borderColor: colors.border2 }]}>
                        <Text style={[styles.typeLabel, { color: textSecondary }]}>
                          {getTypeLabel(layer.type, t)}
                        </Text>
                      </View>
                      <Text style={[styles.layerSummary, { color: textPrimary }]} numberOfLines={1}>
                        {getLayerSummary(layer, t)}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}
          </Animated.View>
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
    paddingBottom: 32,
    overflow: "hidden",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSide: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  nameInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 8,
    paddingVertical: 4,
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  presetRowOuter: {
    overflow: "hidden",
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "flex-end",
    backgroundColor: SEMANTIC_COLORS.destructive,
  },
  presetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  presetInfo: {
    flex: 1,
    gap: 2,
  },
  presetName: {
    fontSize: 15,
    fontWeight: "500",
  },
  presetMeta: {
    fontSize: 12,
  },
  layerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  typeBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  layerSummary: {
    fontSize: 13,
    fontWeight: "400",
  },
});
