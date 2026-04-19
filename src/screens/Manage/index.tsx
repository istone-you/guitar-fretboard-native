import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  PanResponder,
  Animated,
  Easing,
  useWindowDimensions,
  type PanResponderInstance,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../i18n";
import Svg, { Path } from "react-native-svg";
import Icon from "../../components/ui/Icon";
import type { Theme, Accidental } from "../../types";
import type { CustomProgressionTemplate } from "../../hooks/useProgressionTemplates";
import BottomSheetModal, { SHEET_HANDLE_CLEARANCE } from "../../components/ui/BottomSheetModal";
import SheetProgressiveHeader from "../../components/ui/SheetProgressiveHeader";
import GlassIconButton from "../../components/ui/GlassIconButton";

const ROW_GAP = 8;
const ROW_RADIUS = 14;
const MAX_PROGRESSION_DEGREES = 12;

// [内部値, 表示ラベル]
const MAJOR_DEGREE_CHIPS: [string, string][] = [
  ["I", "I"],
  ["ii", "IIm"],
  ["iii", "IIIm"],
  ["IV", "IV"],
  ["V", "V"],
  ["vi", "VIm"],
  ["vii", "VIIm(-5)"],
];
const MINOR_DEGREE_CHIPS: [string, string][] = [
  ["i", "Im"],
  ["ii", "IIm(-5)"],
  ["III", "♭III"],
  ["iv", "IVm"],
  ["v", "Vm"],
  ["VI", "♭VI"],
  ["VII", "♭VII"],
];

// チップのタプル配列から直接ラベルマップを構築。
// "ii" はメジャー("IIm")を優先（マイナー"IIm(-5)"より後に書くことで上書き）。
const CHIP_LABEL_MAP: Record<string, string> = Object.fromEntries([
  ...MINOR_DEGREE_CHIPS,
  ...MAJOR_DEGREE_CHIPS,
]);
const degreeLabel = (deg: string): string => CHIP_LABEL_MAP[deg] ?? deg;

// ─────────────────────────────────────────────────────────────────
// DegreeChip — shared chip for palette (add) and progression (remove)
// ─────────────────────────────────────────────────────────────────
function DegreeChip({
  label,
  variant,
  isDark,
  onPress,
  disabled,
}: {
  label: string;
  variant: "palette" | "selected";
  isDark: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const isSelected = variant === "selected";
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.degreeChip,
        {
          backgroundColor: isSelected
            ? isDark
              ? "#6b7280"
              : "#78716c"
            : isDark
              ? "#374151"
              : "#f5f5f4",
          borderColor: isSelected ? "transparent" : isDark ? "#4b5563" : "#d6d3d1",
          opacity: disabled ? 0.35 : 1,
        },
      ]}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Text
        style={[
          styles.degreeChipText,
          { color: isSelected ? "#fff" : isDark ? "#e5e7eb" : "#44403c" },
        ]}
      >
        {label}
      </Text>
      {isSelected && (
        <Svg width={8} height={8} viewBox="0 0 12 12" fill="none" style={{ marginLeft: 4 }}>
          <Path
            d="M9 3L3 9M3 3l6 6"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      )}
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────
export interface ManagePaneProps {
  theme: Theme;
  rootNote: string;
  accidental: Accidental;
  fretRange: [number, number];
  leftHanded: boolean;
  customTemplates: CustomProgressionTemplate[];
  onSaveTemplate: (name: string, degrees: string[]) => void;
  onUpdateTemplate: (id: string, name: string, degrees: string[]) => void;
  onDeleteTemplate: (id: string) => void;
  onReorderTemplates: (orderedIds: string[]) => void;
}

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────
export default function ManagePane({
  theme,
  rootNote: _rootNote,
  accidental: _accidental,
  fretRange: _fretRange,
  leftHanded: _leftHanded,
  customTemplates,
  onSaveTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onReorderTemplates,
}: ManagePaneProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const insets = useSafeAreaInsets();
  const { height: winHeight } = useWindowDimensions();
  const sheetHeight = Math.max(360, Math.min(520, Math.round(winHeight * 0.62)));

  const bg = isDark ? "#1f2937" : "#fff";
  const border = isDark ? "#374151" : "#e7e5e4";
  const textPrimary = isDark ? "#e5e7eb" : "#1c1917";
  const textSecondary = isDark ? "#9ca3af" : "#78716c";
  const rowBg = isDark ? "#000000" : "#ffffff";
  const rowBorderColor = isDark ? "#374151" : "#e7e5e4";
  const dragHandleColor = isDark ? "#4b5563" : "#c4c4c6";
  const sectionHeaderColor = isDark ? "#6b7280" : "#a8a29e";

  // ── Bottom sheet state ─────────────────────────────────────────
  const [templateFormVisible, setTemplateFormVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomProgressionTemplate | null>(null);

  // ── Template form state ────────────────────────────────────────
  const [formName, setFormName] = useState("");
  const [formDegrees, setFormDegrees] = useState<string[]>([]);

  const openTemplateForm = (template: CustomProgressionTemplate | null) => {
    if (template) {
      setFormName(template.name);
      setFormDegrees([...template.degrees]);
    } else {
      setFormName("");
      setFormDegrees([]);
    }
    setEditingTemplate(template);
    setTemplateFormVisible(true);
  };

  const handleSaveTemplate = () => {
    const trimmed = formName.trim();
    if (!trimmed || formDegrees.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (editingTemplate) {
      onUpdateTemplate(editingTemplate.id, trimmed, formDegrees);
    } else {
      onSaveTemplate(trimmed, formDegrees);
    }
    setTemplateFormVisible(false);
  };

  // ── Scroll control (disable during drag) ──────────────────────
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // ─────────────────────────────────────────────────────────────
  // TEMPLATE SECTION drag & swipe state
  // ─────────────────────────────────────────────────────────────
  const [templateDraggingFrom, setTemplateDraggingFrom] = useState<number | null>(null);
  const [templateHovered, setTemplateHovered] = useState<number | null>(null);
  const templateDraggingFromRef = useRef<number | null>(null);
  const templateHoveredRef = useRef<number | null>(null);
  const templateDragActiveRef = useRef(false);
  const templateLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const templateFloatY = useRef(new Animated.Value(0)).current;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const templateContainerRef = useRef<any>(null);
  const templateContainerPageY = useRef(0);
  const templateSlotLayouts = useRef<{ y: number; height: number }[]>([]);
  const customTemplatesRef = useRef(customTemplates);
  customTemplatesRef.current = customTemplates;
  const onReorderTemplatesRef = useRef(onReorderTemplates);
  onReorderTemplatesRef.current = onReorderTemplates;

  const clearTemplateDragState = () => {
    templateDragActiveRef.current = false;
    templateDraggingFromRef.current = null;
    templateHoveredRef.current = null;
    setTemplateDraggingFrom(null);
    setTemplateHovered(null);
    setScrollEnabled(true);
  };

  const templateSwipeXRef = useRef(new Map<string, Animated.Value>());
  const getTemplateSwipeX = (id: string) => {
    if (!templateSwipeXRef.current.has(id)) {
      templateSwipeXRef.current.set(id, new Animated.Value(0));
    }
    return templateSwipeXRef.current.get(id)!;
  };

  const templateRowPanResponderMapRef = useRef<Map<string, PanResponderInstance>>(new Map());

  const getTemplateRowPanResponder = (templateId: string): PanResponderInstance => {
    const existing = templateRowPanResponderMapRef.current.get(templateId);
    if (existing) return existing;
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onPanResponderTerminationRequest: () => false,
      onMoveShouldSetPanResponder: (_, gs) => {
        if (templateDragActiveRef.current) return false;
        const absX = Math.abs(gs.dx);
        const absY = Math.abs(gs.dy);
        // Disable scroll early when horizontal intent is detected to prevent
        // the ScrollView from stealing the gesture on slight vertical deviation
        if (absX > 5 && absX >= absY) {
          scrollViewRef.current?.setNativeProps({ scrollEnabled: false });
        }
        return absX > 10 && absX > absY * 1.4;
      },
      onPanResponderMove: (_, gs) => {
        getTemplateSwipeX(templateId).setValue(Math.min(0, gs.dx));
      },
      onPanResponderRelease: (_, gs) => {
        scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
        const swipeX = getTemplateSwipeX(templateId);
        const shouldDelete = gs.dx < -80 || (gs.vx < -0.5 && gs.dx < -40);
        if (shouldDelete) {
          Animated.timing(swipeX, {
            toValue: -500,
            duration: 200,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }).start(() => onDeleteTemplate(templateId));
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
        scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
        Animated.spring(getTemplateSwipeX(templateId), {
          toValue: 0,
          friction: 10,
          tension: 200,
          useNativeDriver: true,
        }).start();
      },
    });
    templateRowPanResponderMapRef.current.set(templateId, responder);
    return responder;
  };

  const templateDragHandleMapRef = useRef<Map<string, PanResponderInstance>>(new Map());

  const getTemplateDragHandleResponder = (templateId: string): PanResponderInstance => {
    const existing = templateDragHandleMapRef.current.get(templateId);
    if (existing) return existing;
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => !templateDragActiveRef.current,
      onPanResponderGrant: () => {
        templateDragActiveRef.current = false;
        templateLongPressTimerRef.current = setTimeout(() => {
          const slotIdx = customTemplatesRef.current.findIndex((tp) => tp.id === templateId);
          if (slotIdx < 0) return;
          templateContainerRef.current?.measure(
            (_x: number, _y: number, _w: number, _h: number, _px: number, pageY: number) => {
              templateContainerPageY.current = pageY;
            },
          );
          templateDragActiveRef.current = true;
          templateFloatY.setValue(templateSlotLayouts.current[slotIdx]?.y ?? 0);
          templateDraggingFromRef.current = slotIdx;
          templateHoveredRef.current = slotIdx;
          setTemplateDraggingFrom(slotIdx);
          setTemplateHovered(slotIdx);
          setScrollEnabled(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 200);
      },
      onPanResponderMove: (evt, gs) => {
        if (!templateDragActiveRef.current) {
          if (Math.abs(gs.dx) > 10 || Math.abs(gs.dy) > 10) {
            if (templateLongPressTimerRef.current) {
              clearTimeout(templateLongPressTimerRef.current);
              templateLongPressTimerRef.current = null;
            }
          }
          return;
        }
        const fromIdx = templateDraggingFromRef.current ?? 0;
        templateFloatY.setValue((templateSlotLayouts.current[fromIdx]?.y ?? 0) + gs.dy);
        const fingerRelY = evt.nativeEvent.pageY - templateContainerPageY.current;
        let newHovered = templateHoveredRef.current ?? fromIdx;
        const count = customTemplatesRef.current.length;
        for (let i = 0; i < count; i++) {
          const layout = templateSlotLayouts.current[i];
          if (layout && fingerRelY >= layout.y && fingerRelY <= layout.y + layout.height) {
            newHovered = i;
            break;
          }
        }
        if (fingerRelY < (templateSlotLayouts.current[0]?.y ?? 0)) newHovered = 0;
        const last = templateSlotLayouts.current[count - 1];
        if (last && fingerRelY > last.y + last.height) newHovered = count - 1;
        if (newHovered !== templateHoveredRef.current) {
          templateHoveredRef.current = newHovered;
          setTemplateHovered(newHovered);
          Haptics.selectionAsync();
        }
      },
      onPanResponderRelease: () => {
        if (templateLongPressTimerRef.current) {
          clearTimeout(templateLongPressTimerRef.current);
          templateLongPressTimerRef.current = null;
        }
        if (templateDragActiveRef.current) {
          const from = templateDraggingFromRef.current!;
          const to = templateHoveredRef.current ?? from;
          if (from !== to) {
            const newItems = [...customTemplatesRef.current];
            [newItems[from], newItems[to]] = [newItems[to], newItems[from]];
            onReorderTemplatesRef.current(newItems.map((tp) => tp.id));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
        clearTemplateDragState();
      },
      onPanResponderTerminate: () => {
        if (templateLongPressTimerRef.current) {
          clearTimeout(templateLongPressTimerRef.current);
          templateLongPressTimerRef.current = null;
        }
        clearTemplateDragState();
      },
    });
    templateDragHandleMapRef.current.set(templateId, responder);
    return responder;
  };

  // ── Shared drag handle icon ──────────────────────────────────
  const dragHandleIcon = <Icon name="drag-handle" size={18} color={dragHandleColor} />;

  // ─────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────
  const renderDeleteBackground = () => (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        {
          justifyContent: "center",
          alignItems: "flex-end",
          backgroundColor: "#ff3b30",
          borderRadius: ROW_RADIUS,
        },
      ]}
    >
      <View style={{ paddingRight: 20 }}>
        <Icon name="trash" size={18} color="white" />
      </View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#ffffff" }}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        scrollEnabled={scrollEnabled}
      >
        {/* ── Section: Progression Templates ──────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: sectionHeaderColor }]}>
            {t("manage.progressionTemplates").toUpperCase()}
          </Text>
          <TouchableOpacity
            onPress={() => openTemplateForm(null)}
            style={[styles.addButton, { borderColor: isDark ? "#9ca3af" : "#6b7280" }]}
            activeOpacity={0.6}
            hitSlop={{ top: 11, bottom: 11, left: 11, right: 11 }}
          >
            <Icon name="plus" size={14} color={isDark ? "#9ca3af" : "#6b7280"} strokeWidth={3.5} />
          </TouchableOpacity>
        </View>

        <View
          style={styles.sectionContainer}
          ref={templateContainerRef}
          onLayout={() => {
            templateContainerRef.current?.measure(
              (_x: number, _y: number, _w: number, _h: number, _px: number, pageY: number) => {
                templateContainerPageY.current = pageY;
              },
            );
          }}
        >
          {customTemplates.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                {t("manage.noTemplates")}
              </Text>
            </View>
          ) : (
            customTemplates.map((tpl, idx) => {
              const isDraggingFrom = templateDraggingFrom === idx;
              const isHoverTarget =
                templateHovered === idx && !isDraggingFrom && templateDraggingFrom !== null;

              return (
                <View
                  key={tpl.id}
                  onLayout={(e) => {
                    templateSlotLayouts.current[idx] = {
                      y: e.nativeEvent.layout.y,
                      height: e.nativeEvent.layout.height,
                    };
                  }}
                  style={{ paddingBottom: ROW_GAP }}
                >
                  <View>
                    <Animated.View style={{ opacity: isDraggingFrom ? 0 : 1 }}>
                      {renderDeleteBackground()}
                      <Animated.View
                        style={[
                          styles.row,
                          {
                            backgroundColor: rowBg,
                            borderColor: isHoverTarget ? "#ff69b6" : rowBorderColor,
                            transform: [{ translateX: getTemplateSwipeX(tpl.id) }],
                          },
                        ]}
                        {...getTemplateRowPanResponder(tpl.id).panHandlers}
                      >
                        <TouchableOpacity
                          style={{ flex: 1 }}
                          onPress={() => openTemplateForm(tpl)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[styles.rowPrimary, { color: textPrimary }]}
                            numberOfLines={1}
                          >
                            {tpl.name}
                          </Text>
                          <Text style={[styles.rowSecondary, { color: textSecondary }]}>
                            {tpl.degrees.map((d) => degreeLabel(d)).join(" - ")}
                          </Text>
                        </TouchableOpacity>
                        <View
                          style={styles.dragHandle}
                          {...getTemplateDragHandleResponder(tpl.id).panHandlers}
                        >
                          {dragHandleIcon}
                        </View>
                      </Animated.View>
                    </Animated.View>
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
                </View>
              );
            })
          )}

          {/* Floating panel for template drag */}
          {templateDraggingFrom !== null &&
            (() => {
              const floatingTpl = customTemplates[templateDraggingFrom];
              if (!floatingTpl) return null;
              return (
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: [{ translateY: templateFloatY }],
                    zIndex: 100,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isDark ? 0.5 : 0.22,
                    shadowRadius: 16,
                    elevation: 12,
                  }}
                >
                  <View style={{ paddingBottom: ROW_GAP }}>
                    <View
                      style={[styles.row, { backgroundColor: rowBg, borderColor: rowBorderColor }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rowPrimary, { color: textPrimary }]} numberOfLines={1}>
                          {floatingTpl.name}
                        </Text>
                        <Text style={[styles.rowSecondary, { color: textSecondary }]}>
                          {floatingTpl.degrees.map((d) => degreeLabel(d)).join(" - ")}
                        </Text>
                      </View>
                      <View style={styles.dragHandle}>{dragHandleIcon}</View>
                    </View>
                  </View>
                </Animated.View>
              );
            })()}
        </View>
      </ScrollView>

      {/* ── Template Form Sheet (always mounted) ────────────────── */}
      <BottomSheetModal visible={templateFormVisible} onClose={() => setTemplateFormVisible(false)}>
        {({ close, dragHandlers }) => (
          <View
            style={[
              styles.sheet,
              { height: sheetHeight, backgroundColor: bg, borderColor: border },
            ]}
          >
            <SheetProgressiveHeader
              isDark={isDark}
              bgColor={bg}
              dragHandlers={dragHandlers}
              style={{ paddingTop: SHEET_HANDLE_CLEARANCE }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <GlassIconButton
                  isDark={isDark}
                  onPress={close}
                  icon="close"
                  style={{ width: 36 }}
                />
                <TextInput
                  style={{
                    flex: 1,
                    textAlign: "center",
                    color: textPrimary,
                    fontSize: 16,
                    fontWeight: "600",
                    marginHorizontal: 8,
                    paddingVertical: 4,
                  }}
                  placeholder={t("manage.templateName")}
                  placeholderTextColor={isDark ? "#6b7280" : "#a8a29e"}
                  value={formName}
                  onChangeText={setFormName}
                  maxLength={30}
                />
                <GlassIconButton
                  isDark={isDark}
                  onPress={() => {
                    handleSaveTemplate();
                    close();
                  }}
                  icon="check"
                  style={{
                    width: 36,
                    opacity: !formName.trim() || formDegrees.length === 0 ? 0.35 : 1,
                  }}
                />
              </View>
            </SheetProgressiveHeader>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
            >
              {/* Degree palette — メジャー行 + マイナー行を常時表示。自由に混在可 */}
              {(
                [
                  { label: t("options.diatonicKey.major"), chips: MAJOR_DEGREE_CHIPS },
                  { label: t("options.diatonicKey.naturalMinor"), chips: MINOR_DEGREE_CHIPS },
                ] as const
              ).map(({ label, chips }) => (
                <View key={label} style={{ marginTop: 14 }}>
                  <Text style={[styles.formLabel, { color: textSecondary, marginTop: 0 }]}>
                    {label}
                  </Text>
                  <View style={styles.chipsRow}>
                    {chips.map(([deg, lbl]) => (
                      <DegreeChip
                        key={`${label}-${deg}`}
                        label={lbl}
                        variant="palette"
                        isDark={isDark}
                        disabled={formDegrees.length >= MAX_PROGRESSION_DEGREES}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setFormDegrees((prev) => [...prev, deg]);
                        }}
                      />
                    ))}
                  </View>
                </View>
              ))}

              {/* Progression chips */}
              <Text style={[styles.formLabel, { color: textSecondary, marginTop: 12 }]}>
                {t("manage.progression")}
              </Text>
              {formDegrees.length === 0 ? (
                <Text style={[styles.emptyText, { color: textSecondary, marginTop: 4 }]}>-</Text>
              ) : (
                <View style={styles.chipsRow}>
                  {formDegrees.map((deg, i) => (
                    <View key={`${deg}-${i}`} style={styles.progressionItem}>
                      {i > 0 && (
                        <Text style={[styles.progressionArrow, { color: textSecondary }]}>→</Text>
                      )}
                      <DegreeChip
                        label={degreeLabel(deg)}
                        variant="selected"
                        isDark={isDark}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setFormDegrees((prev) => prev.filter((_, idx) => idx !== i));
                        }}
                      />
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  addButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionContainer: {
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: ROW_RADIUS,
    paddingVertical: 10,
    paddingLeft: 20,
    paddingRight: 12,
    gap: 8,
  },
  rowPrimary: {
    fontSize: 14,
    fontWeight: "500",
  },
  rowSecondary: {
    fontSize: 12,
    marginTop: 2,
  },
  dragHandle: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyRow: {
    paddingVertical: 20,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  formLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  degreeChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: 16,
    height: 32,
    minWidth: 32,
    paddingHorizontal: 8,
  },
  degreeChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressionArrow: {
    fontSize: 12,
    fontWeight: "400",
  },
});
