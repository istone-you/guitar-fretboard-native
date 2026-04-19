import { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Animated,
  Easing,
  Modal,
  TouchableWithoutFeedback,
  type PanResponderInstance,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../i18n";
import Svg, { Circle, Path } from "react-native-svg";
import Icon from "../ui/Icon";
import type { Theme, LayerConfig } from "../../types";
import { MAX_LAYERS, pickNextLayerColor } from "../../types";
import { getColors, radius } from "../../themes/tokens";
import {
  PROGRESSION_TEMPLATES,
  resolveProgressionDegree,
  getNotesByAccidental,
  getRootIndex,
  chordSuffix,
  diatonicDegreeLabel,
  templateDisplayName,
} from "../../lib/fretboard";
import LayerEditModal from "../LayerEditModal";
import LayerPresetModal from "./LayerPresetModal";
import type { LayerPreset } from "../../hooks/useLayerPresets";
import type { ProgressionTemplate } from "../../lib/fretboard";

// Layout constants
const ROW_GAP = 8;
const ROW_RADIUS = radius.md;
// Estimated slot height used as initial value for layout measurement
const ROW_ESTIMATED_HEIGHT = 84;

// ─────────────────────────────────────────────────────────────────
// Checkbox
// ─────────────────────────────────────────────────────────────────
function LayerCheckbox({
  enabled,
  color,
  isDark,
  onPress,
}: {
  enabled: boolean;
  color: string;
  isDark: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const prevEnabled = useRef(enabled);
  if (prevEnabled.current !== enabled) {
    prevEnabled.current = enabled;
    scale.stopAnimation();
    scale.setValue(0.75);
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 220,
      useNativeDriver: true,
    }).start();
  }
  const borderColor = isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.22)";
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Svg width={26} height={26} viewBox="0 0 26 26">
          <Circle
            cx={13}
            cy={13}
            r={11}
            fill={enabled ? color : "transparent"}
            stroke={enabled ? color : borderColor}
            strokeWidth={1.8}
          />
          {enabled && (
            <Path
              d="M8 13.5l4 4 7-7"
              fill="none"
              stroke="white"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────
// iOS 26-style Context Menu (centered popup — local to LayerList)
// ─────────────────────────────────────────────────────────────────
function ContextMenu({
  visible,
  isDark,
  canDuplicate,
  onEdit,
  onDuplicate,
  onDelete,
  onClose,
  t,
}: {
  visible: boolean;
  isDark: boolean;
  canDuplicate: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const prevVisible = useRef(false);

  if (prevVisible.current !== visible) {
    prevVisible.current = visible;
    if (visible) {
      opacity.setValue(0);
      scale.setValue(0.85);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 220, useNativeDriver: true }),
      ]).start();
    }
  }

  const dismiss = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.9, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      onClose();
      callback?.();
    });
  };

  if (!visible) return null;

  const menuBg = isDark ? "rgba(38,38,40,0.98)" : "rgba(255,255,255,0.98)";
  const labelColor = isDark ? "#ffffff" : "#000000";
  const dividerColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
  const iconStroke = isDark ? "#ebebf599" : "#3c3c4399";

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={() => dismiss()}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.25)", opacity }]}
        />
      </TouchableWithoutFeedback>
      <View style={menuStyles.positioner} pointerEvents="box-none">
        <Animated.View
          style={[
            menuStyles.card,
            {
              backgroundColor: menuBg,
              transform: [{ scale }],
              opacity,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: isDark ? 0.6 : 0.18,
              shadowRadius: 24,
              elevation: 20,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => dismiss(onEdit)}
            style={menuStyles.item}
            activeOpacity={0.7}
          >
            <Text style={[menuStyles.label, { color: labelColor }]}>{t("layers.edit")}</Text>
            <Icon name="edit" size={18} color={iconStroke} />
          </TouchableOpacity>
          <View style={[menuStyles.divider, { backgroundColor: dividerColor }]} />
          <TouchableOpacity
            onPress={canDuplicate ? () => dismiss(onDuplicate) : undefined}
            style={[menuStyles.item, !canDuplicate && { opacity: 0.35 }]}
            activeOpacity={0.7}
          >
            <Text style={[menuStyles.label, { color: labelColor }]}>{t("layers.duplicate")}</Text>
            <Icon name="duplicate" size={18} color={iconStroke} surfaceColor={menuBg} />
          </TouchableOpacity>
          <View style={[menuStyles.divider, { backgroundColor: dividerColor }]} />
          <TouchableOpacity
            onPress={() => dismiss(onDelete)}
            style={menuStyles.item}
            activeOpacity={0.7}
          >
            <Text style={[menuStyles.label, { color: "#ff3b30" }]}>{t("layers.delete")}</Text>
            <Icon name="trash" size={18} color="#ff3b30" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const menuStyles = StyleSheet.create({
  positioner: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { width: 240, borderRadius: 14, overflow: "hidden" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  label: { fontSize: 16, fontWeight: "400" },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 0 },
});

// ─────────────────────────────────────────────────────────────────
// LayerList props
// ─────────────────────────────────────────────────────────────────
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
  onPreviewLayer: (layer: LayerConfig | null) => void;
  onReorderLayer: (orderedIds: string[]) => void;
  previewLayer?: LayerConfig | null;
  overlayNotes: string[];
  overlaySemitones: Set<number>;
  layerNoteLabels: Map<string, string[]>;
  onLoadPreset?: (layers: LayerConfig[]) => void;
  presetModalVisible: boolean;
  onPresetModalClose: () => void;
  presets: LayerPreset[];
  onSavePreset: (name: string, layers: LayerConfig[]) => void;
  loadPreset: (id: string) => LayerConfig[] | null;
  onDeletePreset?: (id: string) => void;
  progressionTemplates?: ProgressionTemplate[];
}

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────
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
  onPreviewLayer,
  onReorderLayer,
  previewLayer: _previewLayer,
  overlayNotes: _overlayNotes,
  overlaySemitones: _overlaySemitones,
  layerNoteLabels,
  onLoadPreset,
  presetModalVisible,
  onPresetModalClose,
  presets,
  onSavePreset,
  loadPreset,
  onDeletePreset,
  progressionTemplates,
}: LayerListProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingLayer, setEditingLayer] = useState<LayerConfig | null>(null);
  const [contextMenuTarget, setContextMenuTarget] = useState<{
    layer: LayerConfig;
    slotIdx: number;
  } | null>(null);

  // ── Drag-and-drop state ────────────────────────────────────────
  // Rendered state (triggers re-renders for visual updates)
  const [draggingFromSlotIdx, setDraggingFromSlotIdx] = useState<number | null>(null);
  const [hoveredSlotIdx, setHoveredSlotIdx] = useState<number | null>(null);
  // Ref mirrors for use inside PanResponder callbacks (no stale closure issues)
  const draggingFromSlotIdxRef = useRef<number | null>(null);
  const hoveredSlotIdxRef = useRef<number | null>(null);
  const isDragActiveRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animated Y position of the floating panel (relative to list container)
  const floatY = useRef(new Animated.Value(0)).current;

  // Layout measurement refs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listContainerRef = useRef<any>(null);
  const listContainerPageY = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slotViewRefs = useRef<any[]>(Array(MAX_LAYERS).fill(null));
  // Slot layout positions relative to list container (updated via onLayout)
  const slotLayouts = useRef<{ y: number; height: number }[]>(
    Array.from({ length: MAX_LAYERS }, (_, i) => ({
      y: i * (ROW_ESTIMATED_HEIGHT + ROW_GAP),
      height: ROW_ESTIMATED_HEIGHT,
    })),
  );

  // Stable refs so PanResponder closures always see latest values
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  const onReorderLayerRef = useRef(onReorderLayer);
  onReorderLayerRef.current = onReorderLayer;

  // Map from layerId → current slot index (refreshed every render)
  const layerSlotIdxMap = useRef<Map<string, number>>(new Map());
  layerSlotIdxMap.current.clear();
  slots.forEach((slot, idx) => {
    if (slot) layerSlotIdxMap.current.set(slot.id, idx);
  });

  // ── Helper: reset drag state ───────────────────────────────────
  const clearDragState = () => {
    isDragActiveRef.current = false;
    draggingFromSlotIdxRef.current = null;
    hoveredSlotIdxRef.current = null;
    setDraggingFromSlotIdx(null);
    setHoveredSlotIdx(null);
  };

  // ── Per-layer swipe-to-delete animation ────────────────────────
  const swipeXByIdRef = useRef(new Map<string, Animated.Value>());
  const getSwipeX = (id: string) => {
    if (!swipeXByIdRef.current.has(id)) {
      swipeXByIdRef.current.set(id, new Animated.Value(0));
    }
    return swipeXByIdRef.current.get(id)!;
  };

  // ── Bounce animation for note labels ──────────────────────────
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
        const s = getLabelScale(layer.id);
        s.stopAnimation();
        s.setValue(0.93);
        Animated.spring(s, {
          toValue: 1,
          friction: 6,
          tension: 180,
          useNativeDriver: true,
        }).start();
      }
    }
  }
  prevLabelSnapshotRef.current = labelsSnapshot;

  // ── Slot change animations (per slot index) ───────────────────
  // plusScales: bounces the + icon when a slot goes filled → empty.
  // panelScales: bounces the panel row when a new panel arrives in a slot.
  const plusScales = useRef(
    Array.from({ length: MAX_LAYERS }, () => new Animated.Value(1)),
  ).current;
  const panelScales = useRef(
    Array.from({ length: MAX_LAYERS }, () => new Animated.Value(1)),
  ).current;
  const prevSlotsSnapshotRef = useRef("");
  const slotsSnapshot = slots.map((s) => s?.id ?? "null").join(",");
  if (prevSlotsSnapshotRef.current !== "" && prevSlotsSnapshotRef.current !== slotsSnapshot) {
    const prevIds = prevSlotsSnapshotRef.current.split(",");
    slots.forEach((slot, idx) => {
      const prevId = prevIds[idx];
      const currId = slot?.id ?? "null";
      if (prevId !== "null" && currId === "null") {
        // Slot just became empty → bounce plus icon in
        plusScales[idx].setValue(0);
        Animated.spring(plusScales[idx], {
          toValue: 1,
          friction: 5,
          tension: 280,
          useNativeDriver: true,
        }).start();
      }
      if (currId !== "null" && prevId !== currId) {
        // A new (or different) panel arrived in this slot → bounce the panel
        panelScales[idx].setValue(0.88);
        Animated.spring(panelScales[idx], {
          toValue: 1,
          friction: 6,
          tension: 300,
          useNativeDriver: true,
        }).start();
      }
    });
  }
  prevSlotsSnapshotRef.current = slotsSnapshot;

  const addSlotIndexRef = useRef<number | null>(null);
  const contextMenuOpenRef = useRef(false);
  contextMenuOpenRef.current = contextMenuTarget !== null;

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

  const handleDeleteLayer = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const swipeX = getSwipeX(id);
    Animated.timing(swipeX, {
      toValue: -500,
      duration: 160,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      onRemoveLayer(id);
    });
  };

  const handleSave = (layer: LayerConfig) => {
    const saveId = editingLayer?.id ?? layer.id;
    const exists = slots.some((s) => s?.id === saveId);
    if (exists) {
      onUpdateLayer(saveId, layer);
    } else {
      onAddLayer(layer, addSlotIndexRef.current ?? undefined);
    }
    addSlotIndexRef.current = null;
  };

  // ── Swipe-to-delete PanResponder (keyed by layer.id) ──────────
  const rowPanResponderMapRef = useRef<Map<string, PanResponderInstance>>(new Map());

  const getRowPanResponder = (layerId: string): PanResponderInstance => {
    const existing = rowPanResponderMapRef.current.get(layerId);
    if (existing) return existing;

    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => {
        if (contextMenuOpenRef.current) return false;
        if (isDragActiveRef.current) return false;
        const absX = Math.abs(gs.dx);
        const absY = Math.abs(gs.dy);
        return absX > 10 && absX > absY * 1.4;
      },
      onPanResponderMove: (_, gs) => {
        getSwipeX(layerId).setValue(Math.min(0, gs.dx));
      },
      onPanResponderRelease: (_, gs) => {
        const swipeX = getSwipeX(layerId);
        const shouldDelete = gs.dx < -80 || (gs.vx < -0.5 && gs.dx < -40);
        if (shouldDelete) {
          Animated.timing(swipeX, {
            toValue: -500,
            duration: 200,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }).start(() => {
            onRemoveLayer(layerId);
          });
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
        Animated.spring(getSwipeX(layerId), {
          toValue: 0,
          friction: 10,
          tension: 200,
          useNativeDriver: true,
        }).start();
      },
    });

    rowPanResponderMapRef.current.set(layerId, responder);
    return responder;
  };

  // ── Drag-handle PanResponder (keyed by layer.id) ──────────────
  // Long press (200ms) activates drag; movement tracks float position.
  // Empty slots stay fixed — only the dragged panel floats.
  const dragHandlePanResponderMapRef = useRef<Map<string, PanResponderInstance>>(new Map());

  const getDragHandlePanResponder = (layerId: string): PanResponderInstance => {
    const existing = dragHandlePanResponderMapRef.current.get(layerId);
    if (existing) return existing;

    const responder = PanResponder.create({
      // Always capture touch on the handle so the long-press timer can start.
      onStartShouldSetPanResponder: () => true,
      // Don't surrender the gesture while drag is active.
      onPanResponderTerminationRequest: () => !isDragActiveRef.current,

      onPanResponderGrant: () => {
        isDragActiveRef.current = false;

        longPressTimerRef.current = setTimeout(() => {
          const slotIdx = layerSlotIdxMap.current.get(layerId) ?? -1;
          if (slotIdx < 0) return;

          // Measure list container's absolute page Y for coordinate conversion
          listContainerRef.current?.measure(
            (_x: number, _y: number, _w: number, _h: number, _px: number, pageY: number) => {
              listContainerPageY.current = pageY;
            },
          );

          isDragActiveRef.current = true;
          floatY.setValue(slotLayouts.current[slotIdx]?.y ?? 0);
          draggingFromSlotIdxRef.current = slotIdx;
          hoveredSlotIdxRef.current = slotIdx;
          setDraggingFromSlotIdx(slotIdx);
          setHoveredSlotIdx(slotIdx);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 200);
      },

      onPanResponderMove: (evt, gs) => {
        if (!isDragActiveRef.current) {
          // Cancel timer if the finger moved too much before 200ms
          if (Math.abs(gs.dx) > 10 || Math.abs(gs.dy) > 10) {
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
          }
          return;
        }

        // Move the floating panel
        const fromSlotIdx = draggingFromSlotIdxRef.current ?? 0;
        const baseY = slotLayouts.current[fromSlotIdx]?.y ?? 0;
        floatY.setValue(baseY + gs.dy);

        // Determine which slot the finger is currently over
        const fingerPageY = evt.nativeEvent.pageY;
        const fingerRelY = fingerPageY - listContainerPageY.current;
        let newHovered = hoveredSlotIdxRef.current ?? fromSlotIdx;

        for (let i = 0; i < MAX_LAYERS; i++) {
          const layout = slotLayouts.current[i];
          if (layout && fingerRelY >= layout.y && fingerRelY <= layout.y + layout.height) {
            newHovered = i;
            break;
          }
        }
        // Clamp to valid slot range
        if (fingerRelY < (slotLayouts.current[0]?.y ?? 0)) {
          newHovered = 0;
        }
        const lastLayout = slotLayouts.current[MAX_LAYERS - 1];
        if (lastLayout && fingerRelY > lastLayout.y + lastLayout.height) {
          newHovered = MAX_LAYERS - 1;
        }

        if (newHovered !== hoveredSlotIdxRef.current) {
          hoveredSlotIdxRef.current = newHovered;
          setHoveredSlotIdx(newHovered);
          Haptics.selectionAsync();
        }
      },

      onPanResponderRelease: () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }

        if (isDragActiveRef.current) {
          const from = draggingFromSlotIdxRef.current!;
          const to = hoveredSlotIdxRef.current ?? from;

          if (from !== to) {
            // Swap the two slot positions and commit to parent
            const newSlots = [...slotsRef.current];
            [newSlots[from], newSlots[to]] = [newSlots[to], newSlots[from]];
            const orderedIds = newSlots.map((s, i) => s?.id ?? `empty-slot-${i}`);
            onReorderLayerRef.current(orderedIds);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }

        clearDragState();
      },

      onPanResponderTerminate: () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        clearDragState();
      },
    });

    dragHandlePanResponderMapRef.current.set(layerId, responder);
    return responder;
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
    if (layer.type === "caged") {
      const chordLabel =
        layer.cagedChordType === "minor"
          ? t("options.diatonicKey.naturalMinor")
          : t("options.diatonicKey.major");
      return `${chordLabel}: ${[...layer.cagedForms].join(", ") || "-"}`;
    }
    if (layer.type === "progression") {
      const template = (progressionTemplates ?? PROGRESSION_TEMPLATES).find(
        (tp) => tp.id === (layer.progressionTemplateId ?? "251"),
      );
      if (!template) return "-";
      const progKeyType = layer.progressionKeyType ?? "major";
      const notes = getNotesByAccidental(accidental);
      const keyRootIdx = getRootIndex(rootNote);
      const step = Math.min(
        Math.max(layer.progressionCurrentStep ?? 0, 0),
        template.degrees.length - 1,
      );
      const degree = template.degrees[step];
      const chord = resolveProgressionDegree(
        keyRootIdx,
        progKeyType,
        layer.progressionChordSize ?? "seventh",
        degree,
      );
      const chordName = `${notes[chord.rootIndex]}${chordSuffix(chord.chordType)}`;
      return `${templateDisplayName(template)}  ${chordName}`;
    }
    const mode = t(`options.chordDisplayMode.${layer.chordDisplayMode}`);
    if (layer.chordDisplayMode === "diatonic") {
      const key = t(
        `options.diatonicKey.${layer.diatonicKeyType === "natural-minor" ? "naturalMinor" : "major"}`,
      );
      const size = t(`options.diatonicChordSize.${layer.diatonicChordSize}`);
      return `${mode}: ${diatonicDegreeLabel(layer.diatonicDegree, { chordSize: layer.diatonicChordSize as "triad" | "seventh", keyType: layer.diatonicKeyType === "natural-minor" ? "minor" : "major" })} (${key} ${size})`;
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

  const emptySlotCount = slots.filter((s) => s === null).length;
  const dragHandleColor = colors.textSubtle;

  // ── Drag handle icon (shared between slot and floating panel) ──
  const dragHandleIcon = <Icon name="drag-handle" size={18} color={dragHandleColor} />;

  // ── Layer type label ───────────────────────────────────────────
  const getTypeLabel = (layer: LayerConfig) =>
    layer.type === "scale"
      ? t("layers.scale")
      : layer.type === "caged"
        ? t("layers.caged")
        : layer.type === "custom"
          ? t("layers.custom")
          : layer.type === "progression"
            ? t("layers.progression")
            : t("layers.chord");

  // ── Invisible spacer to maintain row height in empty/placeholder slots ──
  const heightSpacer = (
    <View style={styles.summaryArea} pointerEvents="none">
      <View style={[styles.typeBadge, { borderColor: "transparent" }]}>
        <Text style={[styles.layerType, { opacity: 0 }]}> </Text>
      </View>
      <Text style={[styles.layerSummary, { opacity: 0 }]}> </Text>
      <Text style={[styles.layerNoteLabels, { opacity: 0 }]}> </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* List container — slots at fixed positions, floating panel absolutely positioned */}
      <View
        ref={listContainerRef}
        onLayout={() => {
          // Keep absolute page Y up to date for coordinate conversion during drag
          listContainerRef.current?.measure(
            (_x: number, _y: number, _w: number, _h: number, _px: number, pageY: number) => {
              listContainerPageY.current = pageY;
            },
          );
        }}
      >
        {slots.map((slot, slotIdx) => {
          const isDraggingFrom = draggingFromSlotIdx === slotIdx;
          const isHoverTarget =
            hoveredSlotIdx === slotIdx && !isDraggingFrom && draggingFromSlotIdx !== null;
          const dragColor =
            draggingFromSlotIdx !== null ? slots[draggingFromSlotIdx]?.color : undefined;

          return (
            <View
              key={`slot-${slotIdx}`}
              ref={(ref) => {
                slotViewRefs.current[slotIdx] = ref;
              }}
              onLayout={(e) => {
                slotLayouts.current[slotIdx] = {
                  y: e.nativeEvent.layout.y,
                  height: e.nativeEvent.layout.height,
                };
              }}
              style={{ paddingBottom: ROW_GAP }}
            >
              {!slot ? (
                // ── Empty slot: show add button ────────────────────────────
                <TouchableOpacity
                  onPress={() => draggingFromSlotIdx === null && handleAdd(slotIdx)}
                  style={[
                    styles.layerRow,
                    {
                      backgroundColor: colors.surface2,
                      borderColor: isHoverTarget && dragColor ? dragColor : colors.border,
                      shadowColor: isHoverTarget && dragColor ? dragColor : "transparent",
                      shadowOpacity: isHoverTarget ? 0.45 : 0,
                      shadowRadius: isHoverTarget ? 6 : 0,
                      elevation: isHoverTarget ? 4 : 0,
                      justifyContent: "center",
                    },
                  ]}
                  activeOpacity={0.6}
                  disabled={draggingFromSlotIdx !== null}
                >
                  {/* Invisible spacer keeps height identical to filled rows */}
                  {heightSpacer}
                  <View style={StyleSheet.absoluteFill}>
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                      <Animated.View style={{ transform: [{ scale: plusScales[slotIdx] }] }}>
                        <Icon name="plus" size={20} color={colors.textSubtle} strokeWidth={2} />
                      </Animated.View>
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                // ── Filled slot: always rendered so drag handle stays mounted ──
                // When isDraggingFrom: content is opacity:0 (invisible but keeps
                // the drag handle PanResponder alive), placeholder border on top.
                <View>
                  <Animated.View
                    style={{
                      opacity: isDraggingFrom ? 0 : slot.enabled ? 1 : 0.5,
                      transform: [{ scale: panelScales[slotIdx] }],
                    }}
                  >
                    {/* Red delete background revealed on left-swipe */}
                    <View
                      style={[
                        styles.deleteBackground,
                        { backgroundColor: "#ff3b30", borderRadius: ROW_RADIUS },
                      ]}
                    >
                      <View style={styles.deleteIconWrap}>
                        <Icon name="trash" size={18} color="white" />
                      </View>
                    </View>

                    <Animated.View
                      style={[
                        styles.layerRow,
                        {
                          borderColor: isHoverTarget && dragColor ? dragColor : colors.border,
                          shadowColor: isHoverTarget && dragColor ? dragColor : "transparent",
                          shadowOpacity: isHoverTarget ? 0.45 : 0,
                          shadowRadius: isHoverTarget ? 6 : 0,
                          elevation: isHoverTarget ? 4 : 0,
                          backgroundColor: colors.surface,
                          transform: [{ translateX: getSwipeX(slot.id) }],
                        },
                      ]}
                      {...getRowPanResponder(slot.id).panHandlers}
                    >
                      <LayerCheckbox
                        enabled={slot.enabled}
                        color={slot.color}
                        isDark={isDark}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          onToggleLayer(slot.id);
                        }}
                      />

                      {/* Tap = edit, long press = context menu */}
                      <TouchableOpacity
                        style={styles.summaryTouchable}
                        onPress={() => handleEdit(slot)}
                        onLongPress={() => {
                          contextMenuOpenRef.current = true;
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                          setContextMenuTarget({ layer: slot, slotIdx });
                        }}
                        delayLongPress={500}
                        activeOpacity={0.7}
                      >
                        <View style={styles.summaryArea}>
                          <View style={[styles.typeBadge, { borderColor: colors.border }]}>
                            <Text style={[styles.layerType, { color: colors.textSubtle }]}>
                              {getTypeLabel(slot)}
                            </Text>
                          </View>
                          <Text
                            style={[styles.layerSummary, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {getSummary(slot)}
                            {slot.type === "custom" && slot.hiddenCells.size > 0 && (
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "500",
                                  color: colors.textSubtle,
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
                                color: colors.textSubtle,
                                transform: [{ scale: getLabelScale(slot.id) }],
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {layerNoteLabels.get(slot.id)?.join("  ") || " "}
                          </Animated.Text>
                        </View>
                      </TouchableOpacity>

                      {slot.type === "progression" &&
                        (() => {
                          const template = (progressionTemplates ?? PROGRESSION_TEMPLATES).find(
                            (tp) => tp.id === slot.progressionTemplateId,
                          );
                          const totalSteps = template?.degrees.length ?? 1;
                          const currentStep = slot.progressionCurrentStep ?? 0;
                          const iconColor = isDark ? "#6b7280" : "#a8a29e";
                          return (
                            <>
                              <TouchableOpacity
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  onUpdateLayer(slot.id, {
                                    ...slot,
                                    progressionCurrentStep: Math.max(0, currentStep - 1),
                                  });
                                }}
                                disabled={currentStep === 0}
                                style={[styles.actionBtn, { opacity: currentStep === 0 ? 0.3 : 1 }]}
                                activeOpacity={0.7}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              >
                                <Icon
                                  name="chevron-left"
                                  size={16}
                                  color={iconColor}
                                  strokeWidth={2.2}
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  onUpdateLayer(slot.id, {
                                    ...slot,
                                    progressionCurrentStep: Math.min(
                                      totalSteps - 1,
                                      currentStep + 1,
                                    ),
                                  });
                                }}
                                disabled={currentStep >= totalSteps - 1}
                                style={[
                                  styles.actionBtn,
                                  { opacity: currentStep >= totalSteps - 1 ? 0.3 : 1 },
                                ]}
                                activeOpacity={0.7}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              >
                                <Icon
                                  name="chevron-right"
                                  size={16}
                                  color={iconColor}
                                  strokeWidth={2.2}
                                />
                              </TouchableOpacity>
                            </>
                          );
                        })()}

                      {/* Drag handle — long press 200ms to activate drag */}
                      <View
                        style={styles.dragHandle}
                        {...getDragHandlePanResponder(slot.id).panHandlers}
                      >
                        {dragHandleIcon}
                      </View>
                    </Animated.View>
                  </Animated.View>
                  {/* Placeholder border overlay — shown when this slot is the drag source.
                      absoluteFill covers the row area; pointerEvents="none" so touches
                      pass through to the invisible (opacity:0) drag handle below. */}
                  {isDraggingFrom && (
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        {
                          borderWidth: 1,
                          borderRadius: ROW_RADIUS,
                          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
                          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                        },
                      ]}
                      pointerEvents="none"
                    />
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* ── Floating panel: follows the finger during drag ─────────────
            Absolutely positioned within list container, pointerEvents="none"
            so it doesn't consume touches needed for hover detection. */}
        {draggingFromSlotIdx !== null &&
          (() => {
            const floatingLayer = slots[draggingFromSlotIdx];
            if (!floatingLayer) return null;

            return (
              <Animated.View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: [{ translateY: floatY }],
                  zIndex: 100,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: isDark ? 0.5 : 0.22,
                  shadowRadius: 16,
                  elevation: 12,
                }}
              >
                <View style={{ paddingBottom: ROW_GAP }}>
                  <View style={{ opacity: floatingLayer.enabled ? 1 : 0.5 }}>
                    <View
                      style={[
                        styles.layerRow,
                        {
                          borderColor: floatingLayer.color,
                          backgroundColor: isDark ? "#000000" : "#ffffff",
                        },
                      ]}
                    >
                      <LayerCheckbox
                        enabled={floatingLayer.enabled}
                        color={floatingLayer.color}
                        isDark={isDark}
                        onPress={() => {}}
                      />
                      <View style={styles.summaryTouchable}>
                        <View style={styles.summaryArea}>
                          <View style={[styles.typeBadge, { borderColor: colors.border }]}>
                            <Text style={[styles.layerType, { color: colors.textSubtle }]}>
                              {getTypeLabel(floatingLayer)}
                            </Text>
                          </View>
                          <Text
                            style={[styles.layerSummary, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {getSummary(floatingLayer)}
                          </Text>
                          <Text
                            style={[styles.layerNoteLabels, { color: colors.textSubtle }]}
                            numberOfLines={1}
                          >
                            {layerNoteLabels.get(floatingLayer.id)?.join("  ") || " "}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.dragHandle}>{dragHandleIcon}</View>
                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          })()}
      </View>

      {/* iOS 26 Context Menu */}
      <ContextMenu
        visible={contextMenuTarget !== null}
        isDark={isDark}
        canDuplicate={emptySlotCount > 0}
        onEdit={() => {
          if (contextMenuTarget) handleEdit(contextMenuTarget.layer);
        }}
        onDuplicate={() => {
          if (!contextMenuTarget) return;
          const { layer } = contextMenuTarget;
          const clone: LayerConfig = {
            ...layer,
            id: `layer-${Date.now()}`,
            color: pickNextLayerColor(layers),
            cagedForms: new Set(layer.cagedForms),
            selectedNotes: new Set(layer.selectedNotes),
            selectedDegrees: new Set(layer.selectedDegrees),
            hiddenCells: new Set(layer.hiddenCells),
            chordFrames: layer.chordFrames.map((f) => ({ cells: [...f.cells] })),
          };
          onAddLayer(clone);
        }}
        onDelete={() => {
          if (contextMenuTarget) handleDeleteLayer(contextMenuTarget.layer.id);
        }}
        onClose={() => {
          contextMenuOpenRef.current = false;
          setContextMenuTarget(null);
        }}
        t={t}
      />

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
        progressionTemplates={progressionTemplates}
      />

      <LayerPresetModal
        theme={theme}
        visible={presetModalVisible}
        layers={layers}
        presets={presets}
        onSave={onSavePreset}
        onLoad={(id) => {
          const loaded = loadPreset(id);
          if (loaded) onLoadPreset?.(loaded);
        }}
        onDelete={(id) => onDeletePreset?.(id)}
        onClose={onPresetModalClose}
        t={t}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  layerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: ROW_RADIUS,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  summaryTouchable: {
    flex: 1,
  },
  summaryArea: {
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
  typeBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  dragHandle: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  deleteIconWrap: {
    paddingRight: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
