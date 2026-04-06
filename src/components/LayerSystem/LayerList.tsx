import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, PanResponder, Animated } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../i18n";
import Svg, { Circle, Path } from "react-native-svg";
import type { Theme, LayerConfig } from "../../types";
import { MAX_LAYERS, DEFAULT_LAYER_COLORS } from "../../types";
import LayerEditModal from "./LayerEditModal";

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
  onAddLayer: (layer: LayerConfig) => void;
  onUpdateLayer: (id: string, layer: LayerConfig) => void;
  onRemoveLayer: (id: string) => void;
  onToggleLayer: (id: string) => void;
  onReorderLayers: (layers: LayerConfig[]) => void;
  onPreviewLayer: (layer: LayerConfig | null) => void;
  previewLayer?: LayerConfig | null;
  overlayNotes: string[];
  overlaySemitones: Set<number>;
  layerNoteLabels: Map<string, string[]>;
  onStartCellEdit?: (mode: "hide" | "frame", layerId: string, draftLayer?: LayerConfig) => void;
  reopenLayerId?: string | null;
  onClearReopenLayerId?: () => void;
}

export default function LayerList({
  theme,
  rootNote,
  accidental,
  layers,
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
  onStartCellEdit,
  reopenLayerId,
  onClearReopenLayerId,
}: LayerListProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingLayer, setEditingLayer] = useState<LayerConfig | null>(null);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const rowHeight = useRef(56);
  const [, setDeleteAnimTick] = useState(0);
  const dragY = useRef(new Animated.Value(0)).current;
  const liftScale = useRef(new Animated.Value(1)).current;
  const deleteShiftMapRef = useRef<Map<string, Animated.Value>>(new Map());
  const rowAnimMapRef = useRef<Map<string, Animated.Value>>(new Map());
  const rowSnapAnimMapRef = useRef<Map<string, Animated.Value>>(new Map());
  const prevLayerIdsRef = useRef<string[]>(layers.map((l) => l.id));
  const initializedRef = useRef(false);
  const addBtnAnim = useRef(new Animated.Value(layers.length < MAX_LAYERS ? 1 : 0)).current;
  const prevShowAddBtnRef = useRef(layers.length < MAX_LAYERS);
  const addBtnPrevYRef = useRef<number | null>(null);

  const getRowAnim = (id: string) => {
    const existing = rowAnimMapRef.current.get(id);
    if (existing) return existing;
    const value = new Animated.Value(1);
    rowAnimMapRef.current.set(id, value);
    return value;
  };

  const getRowSnapAnim = (id: string) => {
    const existing = rowSnapAnimMapRef.current.get(id);
    if (existing) return existing;
    const value = new Animated.Value(1);
    rowSnapAnimMapRef.current.set(id, value);
    return value;
  };

  const replayRowAppear = (id: string) => {
    const anim = getRowAnim(id);
    anim.stopAnimation();
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      friction: 8,
      tension: 130,
      useNativeDriver: true,
    }).start();
  };

  const replayRowSnap = (id: string) => {
    const anim = getRowSnapAnim(id);
    anim.stopAnimation();
    anim.setValue(0.95);
    Animated.spring(anim, {
      toValue: 1,
      friction: 6,
      tension: 260,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (!initializedRef.current) {
      layers.forEach((layer) => {
        rowAnimMapRef.current.set(layer.id, new Animated.Value(1));
      });
      prevLayerIdsRef.current = layers.map((l) => l.id);
      initializedRef.current = true;
      return;
    }

    const prevIds = new Set(prevLayerIdsRef.current);
    const currentIds = new Set(layers.map((l) => l.id));
    const prevOrder = prevLayerIdsRef.current;
    const currentOrder = layers.map((l) => l.id);

    // Animate enter for newly added rows.
    layers.forEach((layer) => {
      if (!prevIds.has(layer.id)) {
        const anim = getRowAnim(layer.id);
        anim.setValue(0);
        Animated.spring(anim, {
          toValue: 1,
          friction: 8,
          tension: 130,
          useNativeDriver: true,
        }).start();
      }
    });

    // Cleanup stale anim refs for removed rows.
    prevIds.forEach((id) => {
      if (!currentIds.has(id)) {
        rowAnimMapRef.current.delete(id);
        rowSnapAnimMapRef.current.delete(id);
      }
    });

    // Animate upward shift of remaining rows after a deletion.
    if (currentOrder.length < prevOrder.length) {
      const removedId = prevOrder.find((id) => !currentIds.has(id));
      const removedIdx = removedId != null ? prevOrder.indexOf(removedId) : -1;
      if (removedIdx >= 0) {
        currentOrder.slice(removedIdx).forEach((id) => {
          const shift = new Animated.Value(ROW_STRIDE);
          deleteShiftMapRef.current.set(id, shift);
          Animated.timing(shift, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            deleteShiftMapRef.current.delete(id);
            setDeleteAnimTick((v) => v + 1);
          });
        });
        setDeleteAnimTick((v) => v + 1);
      }
    }

    prevLayerIdsRef.current = layers.map((l) => l.id);
  }, [layers]);

  useEffect(() => {
    const showAddBtn = layers.length < MAX_LAYERS;
    if (showAddBtn && !prevShowAddBtnRef.current) {
      addBtnAnim.setValue(0);
      Animated.spring(addBtnAnim, {
        toValue: 1,
        friction: 8,
        tension: 130,
        useNativeDriver: true,
      }).start();
    } else if (!showAddBtn) {
      addBtnAnim.setValue(0);
    }
    prevShowAddBtnRef.current = showAddBtn;
  }, [layers.length, addBtnAnim]);

  // Reopen modal for a specific layer (e.g. after cell edit cancel)
  useEffect(() => {
    if (reopenLayerId) {
      const target =
        (previewLayer && previewLayer.id === reopenLayerId ? previewLayer : null) ??
        layers.find((l) => l.id === reopenLayerId);
      if (target) {
        setEditingLayer(target);
        setEditModalVisible(true);
      }
      onClearReopenLayerId?.();
    }
  }, [reopenLayerId, previewLayer, layers, onClearReopenLayerId]);

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingLayer(null);
    setEditModalVisible(true);
  };

  const handleEdit = (layer: LayerConfig) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingLayer(layer);
    setEditModalVisible(true);
  };

  const handleSave = (layer: LayerConfig) => {
    const saveId = editingLayer?.id ?? layer.id;
    const exists = layers.some((l) => l.id === saveId);
    if (exists) onUpdateLayer(saveId, layer);
    else onAddLayer(layer);
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

  const ROW_STRIDE = rowHeight.current + ROW_GAP;

  const createDragResponder = (idx: number, layerId: string) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dy) > 10 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderGrant: () => {
        setDraggingLayerId(layerId);
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
        const maxUp = -idx * ROW_STRIDE;
        const maxDown = (layers.length - 1 - idx) * ROW_STRIDE;
        dragY.setValue(Math.max(maxUp, Math.min(maxDown, gs.dy)));
      },
      onPanResponderRelease: (_, gs) => {
        const sourceIdx = layers.findIndex((l) => l.id === layerId);
        if (sourceIdx >= 0 && Math.abs(gs.dy) > ROW_STRIDE * 0.4 && layers.length > 1) {
          const offset = Math.round(gs.dy / ROW_STRIDE);
          const targetIdx = Math.max(0, Math.min(sourceIdx + offset, layers.length - 1));
          if (targetIdx !== sourceIdx) {
            // Collect IDs of all affected rows (between source and target, inclusive)
            const minIdx = Math.min(sourceIdx, targetIdx);
            const maxIdx = Math.max(sourceIdx, targetIdx);
            const affectedIds = layers
              .filter((_, i) => i >= minIdx && i <= maxIdx && layers[i].id !== layerId)
              .map((l) => l.id);
            const reordered = [...layers];
            const [moved] = reordered.splice(sourceIdx, 1);
            reordered.splice(targetIdx, 0, moved);
            onReorderLayers(reordered);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Keep the dragged visual until the reordered frame is painted.
            requestAnimationFrame(() => {
              setDraggingLayerId(null);
              dragY.setValue(0);
              replayRowSnap(layerId);
              for (const id of affectedIds) replayRowAppear(id);
            });
            Animated.spring(liftScale, {
              toValue: 1,
              friction: 8,
              tension: 200,
              useNativeDriver: true,
            }).start();
            return;
          }
        }
        Animated.spring(liftScale, {
          toValue: 1,
          friction: 8,
          tension: 200,
          useNativeDriver: true,
        }).start();
        setDraggingLayerId(null);
        dragY.setValue(0);
      },
    });

  return (
    <View style={styles.container}>
      {layers.map((layer, idx) => {
        const panResponder = createDragResponder(idx, layer.id);
        const isDragging = draggingLayerId === layer.id;
        const rowAnim = getRowAnim(layer.id);
        const rowSnapAnim = getRowSnapAnim(layer.id);
        const rowOpacity = layer.enabled
          ? rowAnim
          : rowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            });
        return (
          <Animated.View
            key={layer.id}
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
                  { translateY: deleteShiftMapRef.current.get(layer.id) ?? 0 },
                  { scale: rowAnim },
                  { scale: rowSnapAnim },
                ],
                zIndex: isDragging ? 10 : 1,
                opacity: rowOpacity,
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
                  <Text style={{ fontWeight: "300" }}> ({t("layers.displayEdited")})</Text>
                )}
              </Text>
              <Text
                style={[styles.layerNoteLabels, { color: isDark ? "#9ca3af" : "#78716c" }]}
                numberOfLines={1}
              >
                {layerNoteLabels.get(layer.id)?.join("  ") || " "}
              </Text>
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
              disabled={layers.length >= MAX_LAYERS}
              style={[styles.actionBtn, { opacity: layers.length >= MAX_LAYERS ? 0.35 : 1 }]}
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

      {layers.length < MAX_LAYERS && (
        <Animated.View
          onLayout={(e) => {
            const y = e.nativeEvent.layout.y;
            const prevY = addBtnPrevYRef.current;
            addBtnPrevYRef.current = y;
            if (prevY != null && Math.abs(prevY - y) > 0.5) {
              addBtnAnim.stopAnimation();
              addBtnAnim.setValue(0);
              Animated.spring(addBtnAnim, {
                toValue: 1,
                friction: 8,
                tension: 130,
                useNativeDriver: true,
              }).start();
            }
          }}
          style={{ transform: [{ scale: addBtnAnim }], opacity: addBtnAnim }}
        >
          <TouchableOpacity
            onPress={handleAdd}
            style={[
              styles.addBtn,
              {
                borderColor: isDark ? "#374151" : "#d6d3d1",
                minHeight: rowHeight.current,
              },
            ]}
            activeOpacity={0.7}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 5v14M5 12h14"
                stroke={isDark ? "#6b7280" : "#a8a29e"}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
        </Animated.View>
      )}

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
        onStartCellEdit={(mode, layerId, draftLayer) => {
          setEditModalVisible(false);
          onStartCellEdit?.(mode, layerId, draftLayer);
        }}
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
  addBtn: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
