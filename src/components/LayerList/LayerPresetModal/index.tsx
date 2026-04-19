import { useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import type { Theme, LayerConfig } from "../../../types";
import type { LayerPreset } from "../../../hooks/useLayerPresets";
import {
  PROGRESSION_TEMPLATES,
  templateDisplayName,
  diatonicDegreeLabel,
} from "../../../lib/fretboard";
import BottomSheetModal, { SHEET_HANDLE_CLEARANCE } from "../../ui/BottomSheetModal";
import SheetProgressiveHeader from "../../ui/SheetProgressiveHeader";
import GlassIconButton from "../../ui/GlassIconButton";

interface LayerPresetModalProps {
  theme: Theme;
  visible: boolean;
  layers: LayerConfig[];
  presets: LayerPreset[];
  onSave: (name: string, layers: LayerConfig[]) => void;
  onLoad: (id: string) => void;
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
      if (layer.chordDisplayMode === "diatonic") {
        const key = t(
          `options.diatonicKey.${layer.diatonicKeyType === "natural-minor" ? "naturalMinor" : "major"}`,
        );
        const size = t(`options.diatonicChordSize.${layer.diatonicChordSize}`);
        return `${mode}: ${diatonicDegreeLabel(layer.diatonicDegree, { chordSize: layer.diatonicChordSize as "triad" | "seventh", keyType: layer.diatonicKeyType === "natural-minor" ? "minor" : "major" })} (${key} ${size})`;
      }
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
  onClose,
  t,
}: LayerPresetModalProps) {
  const isDark = theme === "dark";
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const sheetHeight = Math.max(360, Math.min(520, Math.round(winHeight * 0.62)));

  const [page, setPage] = useState<"list" | "save">("list");
  const [saveName, setSaveName] = useState("");

  // Same slide animation pattern as LayerEditModal
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pendingEnterDir = useRef(0);

  // Reset state when sheet opens
  const prevVisible = useRef(false);
  if (visible && !prevVisible.current) {
    prevVisible.current = true;
    setPage("list");
    setSaveName("");
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

  const goToSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pendingEnterDir.current = 1;
    setPage("save");
  };

  const bg = isDark ? "#1f2937" : "#fff";
  const border = isDark ? "#374151" : "#e7e5e4";
  const textPrimary = isDark ? "#e5e7eb" : "#1c1917";
  const textSecondary = isDark ? "#9ca3af" : "#78716c";
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
                  label="✕"
                  size={36}
                  style={styles.headerSide}
                />
                <View style={styles.headerCenter}>
                  <Text style={[styles.title, { color: textPrimary }]}>{t("layers.presets")}</Text>
                </View>
                <GlassIconButton
                  isDark={isDark}
                  onPress={goToSave}
                  size={36}
                  style={styles.headerSide}
                >
                  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                    <Path
                      d="M7 1v12M1 7h12"
                      stroke={iconColor}
                      strokeWidth={1.8}
                      strokeLinecap="round"
                    />
                  </Svg>
                </GlassIconButton>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <GlassIconButton
                  isDark={isDark}
                  onPress={() => {
                    Keyboard.dismiss();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    pendingEnterDir.current = -1;
                    setPage("list");
                  }}
                  label="‹"
                  fontSize={22}
                  size={36}
                  style={styles.headerSide}
                />
                <TextInput
                  style={[styles.nameInput, { color: textPrimary }]}
                  placeholder={t("manage.presetNameInput")}
                  placeholderTextColor={isDark ? "#6b7280" : "#a8a29e"}
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
                  label="✓"
                  size={36}
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
                  data={presets}
                  keyExtractor={(item) => item.id}
                  style={styles.list}
                  renderItem={({ item }) => (
                    <View style={[styles.presetRow, { borderColor: border }]}>
                      <TouchableOpacity
                        style={styles.presetInfo}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          close();
                          requestAnimationFrame(() => onLoad(item.id));
                        }}
                        activeOpacity={0.6}
                      >
                        <Text style={[styles.presetName, { color: textPrimary }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={[styles.presetMeta, { color: textSecondary }]}>
                          {item.layers.length} {t("layers.layerCount")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )
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
                        backgroundColor: isDark ? "#111827" : "#fafaf9",
                      },
                    ]}
                  >
                    <View style={[styles.colorDot, { backgroundColor: layer.color }]} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <View
                        style={[styles.typeBadge, { borderColor: isDark ? "#374151" : "#d6d3d1" }]}
                      >
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
