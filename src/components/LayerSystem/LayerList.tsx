import { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Animated,
  type PanResponderInstance,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../i18n";
import Svg, { Circle, Path } from "react-native-svg";
import type { Theme, LayerConfig } from "../../types";
import { MAX_LAYERS, DEFAULT_LAYER_COLORS } from "../../types";
import LayerEditModal from "./LayerEditModal";
import LayerPresetModal from "./LayerPresetModal";
import { useLayerPresets } from "../../hooks/useLayerPresets";

function LayerToggle({
  active,
  color,
  isDark,
  onPress,
}: {
  active: boolean;
  color: string;
  isDark: boolean;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const prevActive = useRef(active);

  if (prevActive.current !== active) {
    prevActive.current = active;
    Animated.timing(anim, {
      toValue: active ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }

  const thumbX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });
  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? "#4b5563" : "#d6d3d1", color],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[styles.toggle, { backgroundColor: bgColor }]}>
        <Animated.View style={[styles.toggleThumb, { transform: [{ translateX: thumbX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

interface LayerListProps {
  theme: Theme;
  rootNote: string;
  accidental: "sharp" | "flat";
  layers: LayerConfig[];
  slots: (LayerConfig | null)[];
  onAddLayer: (layer: LayerConfig, slotIndex?: number) => void;
  onUpdateLayer: (id: string, layer: LayerConfig) => void;
  onRemoveLayer: (id: string) => void;
  onToggleLayer: (id: string) => void;
  onReorderLayers: (slots: (LayerConfig | null)[]) => void;
  onPreviewLayer: (layer: LayerConfig | null) => void;
  previewLayer?: LayerConfig | null;
  overlayNotes: string[];
  overlaySemitones: Set<number>;
  layerNoteLabels: Map<string, string[]>;
  onLoadPreset?: (layers: LayerConfig[]) => void;
}

export default function LayerList({
  theme,
  rootNote,
  accidental,
  layers,
  slots,
  onAddLayer,
  onUpdateLayer,
  onRemoveLayer,
  onToggleLayer,
  onReorderLayers,
  onPreviewLayer,
  previewLayer,
  overlayNotes,
  overlaySemitones,
  layerNoteLabels,
  onLoadPreset,
}: LayerListProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingLayer, setEditingLayer] = useState<LayerConfig | null>(null);
  const [presetModalVisible, setPresetModalVisible] = useState(false);
  const { presets, savePreset, loadPreset, deletePreset } = useLayerPresets();
  const [draggingSlotIdx, setDraggingSlotIdx] = useState<number | null>(null);
  const rowHeight = useRef(56);
  const dragY = useRef(new Animated.Value(0)).current;
  const liftScale = useRef(new Animated.Value(1)).current;

  // One animation value per slot — used for all transitions (add/remove/swap)
  const slotAnims = useRef(Array.from({ length: MAX_LAYERS }, () => new Animated.Value(1))).current;
  const prevSlotIdsRef = useRef(slots.map((s) => s?.id ?? null));
  const initializedRef = useRef(false);

  // Bounce animation for note labels
  const labelScaleMapRef = useRef<Map<string, Animated.Value>>(new Map());
  const prevLabelSnapshotRef = useRef("");

  const getLabelScale = (id: string) => {
    const existing = labelScaleMapRef.current.get(id);
    if (existing) return existing;
    const value = new Animated.Value(1);
    labelScaleMapRef.current.set(id, value);
    return value;
  };

  const labelsSnapshot = layers
    .map((l) => `${l.id}:${layerNoteLabels.get(l.id)?.join(",") ?? ""}`)
    .join("|");
  if (prevLabelSnapshotRef.current !== "" && prevLabelSnapshotRef.current !== labelsSnapshot) {
    for (const layer of layers) {
      const prevEntry = prevLabelSnapshotRef.current
        .split("|")
        .find((e) => e.startsWith(`${layer.id}:`));
      const currEntry = `${layer.id}:${layerNoteLabels.get(layer.id)?.join(",") ?? ""}`;
      if (prevEntry !== currEntry) {
        const scale = getLabelScale(layer.id);
        scale.stopAnimation();
        scale.setValue(0.93);
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 180,
          useNativeDriver: true,
        }).start();
      }
    }
  }
  prevLabelSnapshotRef.current = labelsSnapshot;

  // Detect per-slot changes and bounce the slot that changed
  const currentSlotIds = slots.map((s) => s?.id ?? null);
  if (initializedRef.current) {
    for (let i = 0; i < MAX_LAYERS; i++) {
      if (prevSlotIdsRef.current[i] !== currentSlotIds[i]) {
        const anim = slotAnims[i];
        anim.stopAnimation();
        anim.setValue(0);
        Animated.spring(anim, {
          toValue: 1,
          friction: 8,
          tension: 130,
          useNativeDriver: true,
        }).start();
      }
    }
  } else {
    initializedRef.current = true;
  }
  prevSlotIdsRef.current = currentSlotIds;

  // Reopen modal after cell edit ends
  const addSlotIndexRef = useRef<number | null>(null);

  const handleAdd = (slotIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addSlotIndexRef.current = slotIndex;
    setEditingLayer(null);
    setEditModalVisible(true);
  };

  const handleEdit = (layer: LayerConfig) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addSlotIndexRef.current = null;
    setEditingLayer(layer);
    setEditModalVisible(true);
  };

  const handleSave = (layer: LayerConfig) => {
    const saveId = editingLayer?.id ?? layer.id;
    const exists = layers.some((l) => l.id === saveId);
    if (exists) {
      onUpdateLayer(saveId, layer);
    } else {
      onAddLayer(layer, addSlotIndexRef.current ?? undefined);
    }
    addSlotIndexRef.current = null;
  };

  const pickNextLayerColor = (currentLayers: LayerConfig[]) => {
    const usedColors = new Set(currentLayers.map((l) => l.color));
    return (
      DEFAULT_LAYER_COLORS.find((c) => !usedColors.has(c)) ??
      DEFAULT_LAYER_COLORS[currentLayers.length % DEFAULT_LAYER_COLORS.length]
    );
  };

  const nextColor = pickNextLayerColor(layers);

  const getSummary = (layer: LayerConfig): string => {
    if (layer.type === "custom") {
      const items =
        layer.customMode === "note" ? [...layer.selectedNotes] : [...layer.selectedDegrees];
      return items.length > 0 ? items.join(", ") : "-";
    }
    if (layer.type === "scale") {
      return t(
        `options.scale.${layer.scaleType.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())}`,
      );
    }
    const mode = t(`options.chordDisplayMode.${layer.chordDisplayMode}`);
    if (layer.chordDisplayMode === "power") return mode;
    if (layer.chordDisplayMode === "caged") {
      return `${mode}: ${[...layer.cagedForms].join(", ")}`;
    }
    if (layer.chordDisplayMode === "diatonic") {
      const key = t(
        `options.diatonicKey.${layer.diatonicKeyType === "natural-minor" ? "naturalMinor" : "major"}`,
      );
      const size = t(`options.diatonicChordSize.${layer.diatonicChordSize}`);
      return `${mode}: ${layer.diatonicDegree} (${key} ${size})`;
    }
    if (layer.chordDisplayMode === "triad") {
      const inv = t(`options.triadInversions.${layer.triadInversion}`);
      return `${mode}: ${layer.chordType} ${inv}`;
    }
    if (layer.chordDisplayMode === "on-chord") {
      return `${mode}: ${layer.onChordName}`;
    }
    return `${mode}: ${layer.chordType}`;
  };

  // Drag: swap slots. Refs for fresh values inside PanResponder callbacks.
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  const onReorderRef = useRef(onReorderLayers);
  onReorderRef.current = onReorderLayers;

  const panResponderMapRef = useRef<Map<number, PanResponderInstance>>(new Map());

  const getSlotDragResponder = (slotIdx: number) => {
    const existing = panResponderMapRef.current.get(slotIdx);
    if (existing) return existing;
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dy) > 10 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderGrant: () => {
        setDraggingSlotIdx(slotIdx);
        dragY.setValue(0);
        Animated.spring(liftScale, {
          toValue: 1.03,
          friction: 8,
          tension: 200,
          useNativeDriver: true,
        }).start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      },
      onPanResponderMove: (_, gs) => {
        const stride = rowHeight.current + ROW_GAP;
        const maxUp = -slotIdx * stride;
        const maxDown = (MAX_LAYERS - 1 - slotIdx) * stride;
        dragY.setValue(Math.max(maxUp, Math.min(maxDown, gs.dy)));
      },
      onPanResponderRelease: (_, gs) => {
        const stride = rowHeight.current + ROW_GAP;
        if (Math.abs(gs.dy) > stride * 0.4) {
          const offset = Math.round(gs.dy / stride);
          const targetIdx = Math.max(0, Math.min(slotIdx + offset, MAX_LAYERS - 1));
          if (targetIdx !== slotIdx) {
            const swapped = [...slotsRef.current];
            [swapped[slotIdx], swapped[targetIdx]] = [swapped[targetIdx], swapped[slotIdx]];
            onReorderRef.current(swapped);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
        Animated.spring(liftScale, {
          toValue: 1,
          friction: 8,
          tension: 200,
          useNativeDriver: true,
        }).start();
        setDraggingSlotIdx(null);
        dragY.setValue(0);
      },
    });
    panResponderMapRef.current.set(slotIdx, responder);
    return responder;
  };

  return (
    <View style={styles.container}>
      {slots.map((slot, slotIdx) => {
        if (!slot) {
          // Empty slot → add button
          return (
            <Animated.View
              key={`slot-${slotIdx}`}
              style={{
                transform: [{ scale: slotAnims[slotIdx] }],
                opacity: slotAnims[slotIdx],
              }}
            >
              <TouchableOpacity
                onPress={() => handleAdd(slotIdx)}
                style={[
                  styles.layerRow,
                  {
                    borderColor: isDark ? "#374151" : "#d6d3d1",
                    borderStyle: "dashed",
                    justifyContent: "center",
                  },
                ]}
                activeOpacity={0.7}
              >
                {/* Invisible spacer matching summaryArea height */}
                <View style={styles.summaryArea} pointerEvents="none">
                  <Text style={[styles.layerType, { opacity: 0 }]}> </Text>
                  <Text style={[styles.layerSummary, { opacity: 0 }]}> </Text>
                  <Text style={[styles.layerNoteLabels, { opacity: 0 }]}> </Text>
                </View>
                <View style={StyleSheet.absoluteFill}>
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M12 5v14M5 12h14"
                        stroke={isDark ? "#6b7280" : "#a8a29e"}
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                    </Svg>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        }

        // Filled slot → layer row
        const layer = slot;
        const panResponder = getSlotDragResponder(slotIdx);
        const isDragging = draggingSlotIdx === slotIdx;
        const emptySlotCount = slots.filter((s) => s === null).length;
        const slotScale = slotAnims[slotIdx];
        return (
          <Animated.View
            key={`slot-${slotIdx}`}
            onLayout={(e) => {
              rowHeight.current = e.nativeEvent.layout.height;
            }}
            style={[
              styles.layerRow,
              {
                borderColor: isDark ? "#374151" : "#e7e5e4",
                backgroundColor: isDark ? "#1f2937" : "#fafaf9",
                transform: [
                  ...(isDragging ? [{ translateY: dragY }, { scale: liftScale }] : []),
                  { scale: slotScale },
                ],
                zIndex: isDragging ? 10 : 1,
                opacity: layer.enabled
                  ? slotScale
                  : slotScale.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.5],
                    }),
                ...(isDragging && {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 8,
                }),
              },
            ]}
            {...panResponder.panHandlers}
          >
            {/* Toggle */}
            <LayerToggle
              active={layer.enabled}
              color={layer.color}
              isDark={isDark}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggleLayer(layer.id);
              }}
            />

            {/* Summary */}
            <View style={styles.summaryArea}>
              <Text style={[styles.layerType, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                {layer.type === "scale"
                  ? t("layers.scale")
                  : layer.type === "custom"
                    ? t("layers.custom")
                    : t("layers.chord")}
              </Text>
              <Text
                style={[
                  styles.layerSummary,
                  {
                    color: isDark ? "#e5e7eb" : "#1c1917",
                  },
                ]}
                numberOfLines={1}
              >
                {getSummary(layer)}
                {layer.type === "custom" && layer.hiddenCells.size > 0 && (
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: isDark ? "#9ca3af" : "#78716c",
                    }}
                  >
                    ({t("layers.displayEdited")})
                  </Text>
                )}
              </Text>
              <Animated.Text
                style={[
                  styles.layerNoteLabels,
                  {
                    color: isDark ? "#9ca3af" : "#78716c",
                    transform: [{ scale: getLabelScale(layer.id) }],
                  },
                ]}
                numberOfLines={1}
              >
                {layerNoteLabels.get(layer.id)?.join("  ") || " "}
              </Animated.Text>
            </View>

            {/* Duplicate button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const dupeColor = pickNextLayerColor(layers);
                const clone: LayerConfig = {
                  ...layer,
                  id: `layer-${Date.now()}`,
                  color: dupeColor,
                  cagedForms: new Set(layer.cagedForms),
                  selectedNotes: new Set(layer.selectedNotes),
                  selectedDegrees: new Set(layer.selectedDegrees),
                  hiddenCells: new Set(layer.hiddenCells),
                  chordFrames: layer.chordFrames.map((f) => ({
                    cells: [...f.cells],
                  })),
                };
                onAddLayer(clone);
              }}
              disabled={emptySlotCount === 0}
              style={[styles.actionBtn, { opacity: emptySlotCount === 0 ? 0.35 : 1 }]}
              activeOpacity={0.7}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M4 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                  stroke={isDark ? "#6b7280" : "#a8a29e"}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M10 9h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"
                  fill={isDark ? "#1f2937" : "#fafaf9"}
                  stroke={isDark ? "#6b7280" : "#a8a29e"}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            {/* Settings button */}
            <TouchableOpacity
              onPress={() => handleEdit(layer)}
              style={styles.actionBtn}
              activeOpacity={0.7}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke={isDark ? "#6b7280" : "#a8a29e"}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle
                  cx={9}
                  cy={6}
                  r={2}
                  fill={isDark ? "#1f2937" : "#fafaf9"}
                  stroke={isDark ? "#6b7280" : "#a8a29e"}
                  strokeWidth={2}
                />
                <Circle
                  cx={15}
                  cy={12}
                  r={2}
                  fill={isDark ? "#1f2937" : "#fafaf9"}
                  stroke={isDark ? "#6b7280" : "#a8a29e"}
                  strokeWidth={2}
                />
                <Circle
                  cx={11}
                  cy={18}
                  r={2}
                  fill={isDark ? "#1f2937" : "#fafaf9"}
                  stroke={isDark ? "#6b7280" : "#a8a29e"}
                  strokeWidth={2}
                />
              </Svg>
            </TouchableOpacity>

            {/* Remove button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onRemoveLayer(layer.id);
              }}
              style={styles.actionBtn}
              activeOpacity={0.7}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6l12 12"
                  stroke={isDark ? "#6b7280" : "#a8a29e"}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      {/* Preset button */}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setPresetModalVisible(true);
        }}
        style={[styles.presetBtn, { borderColor: isDark ? "#374151" : "#d6d3d1" }]}
        activeOpacity={0.7}
      >
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path
            d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"
            stroke={isDark ? "#6b7280" : "#a8a29e"}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <Text style={[styles.presetBtnText, { color: isDark ? "#9ca3af" : "#78716c" }]}>
          {t("layers.presets")}
        </Text>
      </TouchableOpacity>

      <LayerEditModal
        theme={theme}
        visible={editModalVisible}
        rootNote={rootNote}
        accidental={accidental}
        initialLayer={editingLayer}
        defaultColor={nextColor}
        onClose={() => {
          setEditModalVisible(false);
          onPreviewLayer(null);
        }}
        onSave={handleSave}
        onPreview={onPreviewLayer}
        overlayNotes={overlayNotes}
        overlaySemitones={overlaySemitones}
      />

      <LayerPresetModal
        theme={theme}
        visible={presetModalVisible}
        layers={layers}
        presets={presets}
        onSave={savePreset}
        onLoad={(id) => {
          const loaded = loadPreset(id);
          if (loaded) onLoadPreset?.(loaded);
        }}
        onDelete={deletePreset}
        onClose={() => setPresetModalVisible(false)}
        t={t}
      />
    </View>
  );
}

const ROW_GAP = 8;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: ROW_GAP,
  },
  layerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
  },
  toggleThumb: {
    position: "absolute",
    top: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  summaryArea: {
    flex: 1,
    gap: 2,
  },
  layerType: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  layerSummary: {
    fontSize: 14,
    fontWeight: "500",
  },
  layerNoteLabels: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "monospace",
  },
  actionBtn: {
    padding: 8,
  },
  addBtn: {},
  presetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
