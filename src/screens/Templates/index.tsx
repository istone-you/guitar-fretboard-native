import { useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import {
  View,
  Text,
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
import { getColors, SEMANTIC_COLORS, DEFAULT_LAYER_COLORS } from "../../themes/design";
import Icon from "../../components/ui/Icon";
import PillButton from "../../components/ui/PillButton";
import SceneHeader from "../../components/AppHeader/SceneHeader";
import TemplateDetailPane from "./Detail";
import type { Theme, Accidental, ProgressionChord, LayerConfig } from "../../types";
import type { CustomProgressionTemplate } from "../../hooks/useProgressionTemplates";
import TemplateFormSheet, { chordDisplayLabel } from "./TemplateFormSheet";

const ROW_GAP = 8;
const ROW_RADIUS = 14;

export interface TemplatesPaneHandle {
  openTemplateForm: (template: CustomProgressionTemplate | null) => void;
}

export interface TemplatesPaneProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  customTemplates: CustomProgressionTemplate[];
  onSaveTemplate: (name: string, chords: ProgressionChord[]) => void;
  onUpdateTemplate: (id: string, name: string, chords: ProgressionChord[]) => void;
  onDeleteTemplate: (id: string) => void;
  onReorderTemplates: (orderedIds: string[]) => void;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  // Header props
  fretRange: [number, number];
  leftHanded?: boolean;
  onThemeChange: (theme: Theme) => void;
  onFretRangeChange: (range: [number, number]) => void;
  onAccidentalChange: (accidental: Accidental) => void;
  onLeftHandedChange: (value: boolean) => void;
}

const TemplatesPane = forwardRef<TemplatesPaneHandle, TemplatesPaneProps>(function TemplatesPane(
  {
    theme,
    accidental,
    layers,
    customTemplates,
    onSaveTemplate,
    onUpdateTemplate,
    onDeleteTemplate,
    onReorderTemplates,
    onAddLayerAndNavigate,
    fretRange,
    leftHanded,
    onThemeChange,
    onFretRangeChange,
    onAccidentalChange,
    onLeftHandedChange,
  }: TemplatesPaneProps,
  ref,
) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();

  const colors = getColors(isDark);

  const [templateFormVisible, setTemplateFormVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomProgressionTemplate | null>(null);

  // Detail pane navigation
  const [detailTemplateId, setDetailTemplateId] = useState<string | null>(null);
  const detailTemplate = detailTemplateId
    ? (customTemplates.find((t) => t.id === detailTemplateId) ?? null)
    : null;
  const detailSlideAnim = useRef(new Animated.Value(0)).current;

  const handleOpenTemplateDetail = useCallback(
    (template: CustomProgressionTemplate) => {
      detailSlideAnim.setValue(winWidth);
      setDetailTemplateId(template.id);
      setTimeout(() => {
        Animated.timing(detailSlideAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start();
      }, 0);
    },
    [detailSlideAnim, winWidth],
  );

  const handleCloseTemplateDetail = useCallback(() => {
    Animated.timing(detailSlideAnim, {
      toValue: winWidth,
      duration: 120,
      useNativeDriver: true,
    }).start(() => setDetailTemplateId(null));
  }, [detailSlideAnim, winWidth]);

  // Swipe-right to close detail pane
  const detailTemplateRef = useRef(detailTemplate);
  detailTemplateRef.current = detailTemplate;
  const handleCloseTemplateDetailRef = useRef(handleCloseTemplateDetail);
  handleCloseTemplateDetailRef.current = handleCloseTemplateDetail;
  const detailSwipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        detailTemplateRef.current !== null && g.dx > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (g.dx > 0) detailSlideAnim.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > 80 || (g.dx > 30 && g.vx > 0.5)) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          handleCloseTemplateDetailRef.current();
        } else {
          Animated.timing(detailSlideAnim, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.timing(detailSlideAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const openTemplateForm = (template: CustomProgressionTemplate | null) => {
    setEditingTemplate(template);
    setTemplateFormVisible(true);
  };

  useImperativeHandle(ref, () => ({ openTemplateForm }));

  // Scroll control (disable during drag)
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // Drag & swipe state
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
  const onDeleteTemplateRef = useRef(onDeleteTemplate);
  onDeleteTemplateRef.current = onDeleteTemplate;

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
          }).start(() => onDeleteTemplateRef.current(templateId));
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

  const dragHandleIcon = <Icon name="drag-handle" size={18} color={colors.dragHandle} />;

  const renderDeleteBackground = () => (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        {
          justifyContent: "center",
          alignItems: "flex-end",
          backgroundColor: SEMANTIC_COLORS.destructive,
          borderRadius: ROW_RADIUS,
        },
      ]}
    >
      <View style={{ paddingRight: 20 }}>
        <Icon name="trash" size={18} color="white" />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <SceneHeader
        theme={theme}
        title={detailTemplate !== null ? undefined : t("tabs.templates")}
        accidental={accidental}
        fretRange={fretRange}
        leftHanded={leftHanded}
        onBack={detailTemplate !== null ? handleCloseTemplateDetail : undefined}
        onThemeChange={onThemeChange}
        onFretRangeChange={onFretRangeChange}
        onAccidentalChange={onAccidentalChange}
        onLeftHandedChange={onLeftHandedChange}
      />
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
            scrollEnabled={scrollEnabled}
          >
            {/* Section: Progression Templates */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                {t("templates.progressionTemplates").toUpperCase()}
              </Text>
              <PillButton
                isDark={isDark}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  openTemplateForm(null);
                }}
                style={{ paddingHorizontal: 8 }}
              >
                <Icon name="plus" size={16} color={colors.textMuted} />
              </PillButton>
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
                  <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
                    {t("templates.noTemplates")}
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
                                backgroundColor: colors.pageBg,
                                borderColor: isHoverTarget
                                  ? DEFAULT_LAYER_COLORS[0]
                                  : colors.border2,
                                transform: [{ translateX: getTemplateSwipeX(tpl.id) }],
                              },
                            ]}
                            {...getTemplateRowPanResponder(tpl.id).panHandlers}
                          >
                            <TouchableOpacity
                              style={{ flex: 1 }}
                              onPress={() => handleOpenTemplateDetail(tpl)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[styles.rowPrimary, { color: colors.textStrong }]}
                                numberOfLines={1}
                              >
                                {tpl.name}
                              </Text>
                              <Text style={[styles.rowSecondary, { color: colors.textSubtle }]}>
                                {tpl.chords.map((c) => chordDisplayLabel(c)).join(" - ")}
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
                                borderColor: colors.dragPlaceholderBorder,
                                backgroundColor: colors.dragPlaceholderBg,
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
                          style={[
                            styles.row,
                            { backgroundColor: colors.pageBg, borderColor: colors.border2 },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[styles.rowPrimary, { color: colors.textStrong }]}
                              numberOfLines={1}
                            >
                              {floatingTpl.name}
                            </Text>
                            <Text style={[styles.rowSecondary, { color: colors.textSubtle }]}>
                              {floatingTpl.chords.map((c) => chordDisplayLabel(c)).join(" - ")}
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

          <TemplateFormSheet
            key={editingTemplate?.id ?? "new"}
            visible={templateFormVisible}
            onClose={() => setTemplateFormVisible(false)}
            theme={theme}
            accidental={accidental}
            initialTemplate={editingTemplate}
            onSave={(name, chords) => {
              if (editingTemplate) {
                onUpdateTemplate(editingTemplate.id, name, chords);
              } else {
                onSaveTemplate(name, chords);
              }
            }}
          />
        </View>

        {/* Detail pane slides over */}
        {detailTemplate !== null && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.pageBg, transform: [{ translateX: detailSlideAnim }] },
            ]}
            {...detailSwipeResponder.panHandlers}
          >
            <TemplateDetailPane
              theme={theme}
              accidental={accidental}
              template={detailTemplate}
              layers={layers}
              onUpdateTemplate={onUpdateTemplate}
              onAddLayer={(layer) => {
                handleCloseTemplateDetail();
                onAddLayerAndNavigate(layer);
              }}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
});

export default TemplatesPane;

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
});
