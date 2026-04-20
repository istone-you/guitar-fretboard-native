import { useLayoutEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  useWindowDimensions,
  FlatList,
  Switch,
  type GestureResponderHandlers,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../i18n";
import type {
  Theme,
  LayerType,
  LayerConfig,
  ChordDisplayMode,
  ScaleType,
  ChordType,
} from "../../types";
import { createDefaultLayer } from "../../types";
import ChevronIcon from "../ui/ChevronIcon";
import ColorPicker from "../ui/ColorPicker";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { buildScaleOptions } from "../ui/scaleOptions";
import LayerDescription from "./LayerDescription";
import BottomSheetModal, { SHEET_HANDLE_CLEARANCE, useSheetHeight } from "../ui/BottomSheetModal";
import GlassIconButton from "../ui/GlassIconButton";
import SheetProgressiveHeader from "../ui/SheetProgressiveHeader";
import PillButton from "../ui/PillButton";
import {
  CHORD_CAGED_ORDER,
  CHORD_SEMITONES,
  CHORD_TYPES_CORE,
  CUSTOM_DEGREE_CHIPS,
  DEGREE_BY_SEMITONE,
  DIATONIC_CHORDS,
  TRIAD_INVERSION_OPTIONS,
  PROGRESSION_TEMPLATES,
  chordSuffix,
  getDiatonicChord,
  getNotesByAccidental,
  getOnChordListForRoot,
  getRootIndex,
  diatonicDegreeLabel,
  templateDisplayName,
  type ProgressionTemplate,
} from "../../lib/fretboard";

const CHORD_TYPES = CHORD_TYPES_CORE;

interface SelectOption {
  value: string;
  label: string;
  isSection?: boolean; // non-selectable section header
}

interface SelectContext {
  title: string;
  options: SelectOption[];
  currentValue: string;
  onSelect: (v: string) => void;
  hideBack?: boolean; // type selection: no back button (type is topmost page)
  backStep?: "settings" | "chips"; // override back destination (default: "settings")
}

function BounceChip({
  label,
  active,
  color,
  isDark,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  isDark: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const prevActive = useRef(active);

  if (prevActive.current !== active) {
    prevActive.current = active;
    scale.stopAnimation();
    scale.setValue(0.8);
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.customChip,
          {
            backgroundColor: active ? color : isDark ? "#1f2937" : "#fafaf9",
            borderColor: active ? color : isDark ? "#374151" : "#d6d3d1",
          },
        ]}
        activeOpacity={0.7}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: active ? "#fff" : isDark ? "#e5e7eb" : "#44403c",
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface LayerEditModalProps {
  theme: Theme;
  visible: boolean;
  rootNote: string;
  accidental: "sharp" | "flat";
  initialLayer?: LayerConfig | null;
  defaultColor: string;
  onClose: () => void;
  onSave: (layer: LayerConfig) => void;
  onPreview?: (layer: LayerConfig) => void;
  progressionTemplates?: ProgressionTemplate[];
}

export default function LayerEditModal({
  theme,
  visible,
  rootNote,
  accidental,
  initialLayer,
  defaultColor,
  onClose,
  onSave,
  onPreview,
  progressionTemplates,
}: LayerEditModalProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const { width: winWidth } = useWindowDimensions();
  const sheetHeight = useSheetHeight();

  const [step, setStep] = useState<"settings" | "color" | "chips" | "select" | "caged">(
    initialLayer ? "settings" : "select",
  );
  const [layer, setLayer] = useState<LayerConfig>(
    initialLayer ?? createDefaultLayer("scale", `layer-${Date.now()}`, defaultColor),
  );
  const [extractChordType, setExtractChordType] = useState("Major");
  const slideAnim = useRef(new Animated.Value(0)).current;
  const selectContextRef = useRef<SelectContext | null>(null);
  // Direction for the next slide animation: positive = from right, negative = from left, 0 = none
  const pendingEnterDir = useRef(0);
  const sheetScrollRef = useRef<ScrollView>(null);
  const flashSheetScrollIndicator = () => {
    requestAnimationFrame(() => {
      sheetScrollRef.current?.flashScrollIndicators();
    });
  };
  const [headerHeight, setHeaderHeight] = useState(96);

  // Reset state when modal opens with different layer.
  const prevVisible = useRef(false);
  const prevInitialId = useRef(initialLayer?.id);
  let resolvedStep = step;
  if (visible && (!prevVisible.current || prevInitialId.current !== initialLayer?.id)) {
    prevVisible.current = visible;
    prevInitialId.current = initialLayer?.id;
    resolvedStep = initialLayer ? "settings" : "select";
    if (initialLayer) {
      if (resolvedStep !== step) setStep(resolvedStep);
      setLayer(initialLayer);
    } else {
      const newLayer = createDefaultLayer("scale", `layer-${Date.now()}`, defaultColor);
      selectContextRef.current = {
        title: t("layers.type"),
        options: [
          { value: "scale", label: t("layers.scale") },
          { value: "chord", label: t("layers.chord") },
          { value: "caged", label: t("layers.caged") },
          { value: "custom", label: t("layers.custom") },
          { value: "progression", label: t("layers.progression") },
        ],
        currentValue: "",
        onSelect: (v) => {
          const newType = v as LayerType;
          const nextLayer = createDefaultLayer(newType, newLayer.id, newLayer.color);
          setLayer(nextLayer);
          onPreview?.(nextLayer);
        },
        hideBack: true,
      };
      if (resolvedStep !== step) setStep(resolvedStep);
      setLayer(newLayer);
      // No initial slide-in: content appears immediately when sheet opens
      slideAnim.setValue(0);
    }
  }
  if (!visible && prevVisible.current) {
    prevVisible.current = false;
  }

  const update = (partial: Partial<LayerConfig>) => {
    const next = { ...layer, ...partial };
    setLayer(next);
    onPreview?.(next);
  };

  // After React commits a step change, set the start position and begin spring animation.
  // useLayoutEffect fires synchronously after commit but before the native paint, so the new
  // content is never visible at position 0 even for a single frame.
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
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate forward: new page slides in from right
  const navigate = (
    target: "settings" | "color" | "chips" | "select" | "caged",
    context?: SelectContext,
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (context) selectContextRef.current = context;
    pendingEnterDir.current = 1;
    setStep(target);
  };

  // Navigate back to settings: settings slides in from left
  const navigateBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pendingEnterDir.current = -1;
    setStep("settings");
  };

  // Navigate to parent (type select): slides in from left (going up the hierarchy)
  const navigateToParent = (context: SelectContext) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectContextRef.current = context;
    pendingEnterDir.current = -1;
    setStep("select");
  };

  const { options: scaleOptions } = buildScaleOptions(t);
  const notes = getNotesByAccidental(accidental);
  const rootIndex = getRootIndex(rootNote);

  const diatonicKeyOptions = [
    { value: "major", label: t("options.diatonicKey.major") },
    { value: "natural-minor", label: t("options.diatonicKey.naturalMinor") },
  ];
  const diatonicChordSizeOptions = [
    { value: "triad", label: t("options.diatonicChordSize.triad") },
    { value: "seventh", label: t("options.diatonicChordSize.seventh") },
  ];
  const chordDisplayOptions: { value: ChordDisplayMode; label: string }[] = [
    { value: "form", label: t("options.chordDisplayMode.form") },
    { value: "triad", label: t("options.chordDisplayMode.triad") },
    { value: "diatonic", label: t("options.chordDisplayMode.diatonic") },
    { value: "on-chord", label: t("options.chordDisplayMode.on-chord") },
  ];
  const onChordOptions = getOnChordListForRoot(rootNote).map((v) => ({ value: v, label: v }));
  const triadInversionOptions = TRIAD_INVERSION_OPTIONS.map(({ value }) => ({
    value,
    label: t(`options.triadInversions.${value}`),
  }));
  // Progression options — ビルトインとカスタムをセクション分けして表示
  const progressionTemplateOptions: SelectOption[] = (() => {
    const builtins = PROGRESSION_TEMPLATES.map((t_) => ({
      value: t_.id,
      label: templateDisplayName(t_),
    }));
    const customs = (progressionTemplates ?? [])
      .filter((t_) => t_.id.startsWith("tpl-"))
      .map((t_) => ({ value: t_.id, label: t_.name }));
    const result: SelectOption[] = [];
    if (customs.length > 0) {
      result.push(
        { value: "__custom__", label: t("templates.custom"), isSection: true },
        ...customs,
      );
    }
    result.push(
      { value: "__builtin__", label: t("templates.builtIn"), isSection: true },
      ...builtins,
    );
    return result;
  })();
  const progressionKeyTypeOptions = [
    { value: "major", label: t("options.diatonicKey.major") },
    { value: "minor", label: t("options.diatonicKey.naturalMinor") },
  ];
  const diatonicScaleType = `${layer.diatonicKeyType}-${layer.diatonicChordSize}`;

  const diatonicCodeOptions = (DIATONIC_CHORDS[diatonicScaleType] ?? []).map(({ value }) => {
    const chord = getDiatonicChord(rootIndex, diatonicScaleType, value);
    return {
      value,
      label: `${diatonicDegreeLabel(value, { chordSize: layer.diatonicChordSize as "triad" | "seventh", keyType: layer.diatonicKeyType === "natural-minor" ? "minor" : "major" })} (${notes[chord.rootIndex]}${chordSuffix(chord.chordType)})`,
    };
  });

  const bgColor = isDark ? "#111827" : "#fafaf9";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4";
  const labelColor = isDark ? "#e5e7eb" : "#1c1917";
  const valueColor = isDark ? "#9ca3af" : "#78716c";
  const chevronColor = isDark ? "#6b7280" : "#a8a29e";
  const secondaryLabelColor = isDark ? "#6b7280" : "#a8a29e";

  // iOS-style nav row (label + value + chevron)
  const renderNavRow = (label: string, value: string, onPress: () => void, isLast = false) => (
    <TouchableOpacity
      key={label}
      onPress={onPress}
      style={[
        styles.iosRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
      ]}
      activeOpacity={0.6}
    >
      <Text style={[styles.iosRowLabel, { color: labelColor }]}>{label}</Text>
      <View style={styles.iosRowRight}>
        <Text style={[styles.iosRowValue, { color: valueColor }]} numberOfLines={1}>
          {value}
        </Text>
        <ChevronIcon size={12} color={chevronColor} direction="right" />
      </View>
    </TouchableOpacity>
  );

  // iOS-style toggle row
  const renderToggleRow = (
    label: string,
    active: boolean,
    onToggle: () => void,
    isLast = false,
  ) => (
    <View
      key={label}
      style={[
        styles.iosRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
      ]}
    >
      <Text style={[styles.iosRowLabel, { color: labelColor }]}>{label}</Text>
      <Switch
        value={active}
        onValueChange={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        trackColor={{ false: isDark ? "#4b5563" : "#d6d3d1", true: "#34c759" }}
        ios_backgroundColor={isDark ? "#4b5563" : "#d6d3d1"}
      />
    </View>
  );

  // Section wrapper: just groups rows with a bottom divider between sections
  const renderSection = (children: React.ReactNode) => (
    <View style={[styles.iosSection, { borderColor }]}>{children}</View>
  );

  // Sub-page header: chevron back button + centered title (absolute — content scrolls behind it)
  const renderSubPageHeader = (
    title: string,
    onBack: () => void,
    dh?: GestureResponderHandlers,
  ) => (
    <SheetProgressiveHeader
      isDark={isDark}
      bgColor={bgColor}
      dragHandlers={dh ?? {}}
      contentPaddingHorizontal={14}
      onLayout={setHeaderHeight}
      style={styles.absoluteHeader}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <GlassIconButton
          isDark={isDark}
          onPress={onBack}
          icon="back"
          style={styles.headerLeft}
          testID="sub-page-back"
        />
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: labelColor }]}>{title}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>
    </SheetProgressiveHeader>
  );

  // Find label by value from options array
  const findLabel = (options: { value: string; label: string }[], value: string) =>
    options.find((o) => o.value === value)?.label ?? value;

  return (
    <>
      {/* Settings / color / chips / select / type — bottom sheet */}
      <BottomSheetModal
        visible={visible}
        onClose={() => {
          if (step !== "select") onSave(layer);
          onClose();
        }}
      >
        {({ close, closeWithCallback, dragHandlers }) => (
          <View
            style={[
              styles.modal,
              styles.bottomSheetModal,
              { height: sheetHeight, backgroundColor: bgColor, borderColor },
            ]}
          >
            <View style={{ flex: 1, overflow: "hidden" }}>
              <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
                {/* Step: Settings */}
                {step === "settings" && (
                  <View style={{ flex: 1 }}>
                    {/* Scroll content starts at top; paddingTop reserves space for the absolute header */}
                    <ScrollView
                      ref={sheetScrollRef}
                      style={styles.sheetScroll}
                      contentContainerStyle={[
                        styles.sheetScrollContent,
                        { paddingTop: headerHeight },
                      ]}
                      showsVerticalScrollIndicator
                      indicatorStyle={isDark ? "white" : "black"}
                      persistentScrollbar
                      onLayout={flashSheetScrollIndicator}
                      onContentSizeChange={flashSheetScrollIndicator}
                    >
                      <View style={styles.settingsBody}>
                        {/* Scale settings */}
                        {layer.type === "scale" &&
                          renderSection(
                            renderNavRow(
                              t("mobileControls.scaleKind"),
                              findLabel(scaleOptions, layer.scaleType),
                              () =>
                                navigate("select", {
                                  title: t("mobileControls.scaleKind"),
                                  options: scaleOptions,
                                  currentValue: layer.scaleType,
                                  onSelect: (v) => update({ scaleType: v as ScaleType }),
                                }),
                              true,
                            ),
                          )}

                        {/* Chord settings */}
                        {layer.type === "chord" && (
                          <>
                            {renderSection(
                              <>
                                {renderNavRow(
                                  t("controls.displayMode"),
                                  findLabel(chordDisplayOptions, layer.chordDisplayMode),
                                  () =>
                                    navigate("select", {
                                      title: t("controls.displayMode"),
                                      options: chordDisplayOptions,
                                      currentValue: layer.chordDisplayMode,
                                      onSelect: (v) => {
                                        const newMode = v as ChordDisplayMode;
                                        const patch: Partial<LayerConfig> = {
                                          chordDisplayMode: newMode,
                                        };
                                        if (newMode === "triad") {
                                          const triadTypes = [
                                            "Major",
                                            "Minor",
                                            "Diminished",
                                            "Augmented",
                                          ];
                                          if (!triadTypes.includes(layer.chordType)) {
                                            patch.chordType = "Major";
                                          }
                                        }
                                        update(patch);
                                      },
                                    }),
                                )}
                                {layer.chordDisplayMode !== "on-chord" &&
                                  renderNavRow(
                                    layer.chordDisplayMode === "diatonic"
                                      ? t("controls.degree")
                                      : t("controls.chord"),
                                    layer.chordDisplayMode === "diatonic"
                                      ? diatonicDegreeLabel(layer.diatonicDegree, {
                                          chordSize: layer.diatonicChordSize as "triad" | "seventh",
                                          keyType:
                                            layer.diatonicKeyType === "natural-minor"
                                              ? "minor"
                                              : "major",
                                        })
                                      : layer.chordType,
                                    () => {
                                      const opts =
                                        layer.chordDisplayMode === "form"
                                          ? CHORD_TYPES.map((v) => ({ value: v, label: v }))
                                          : layer.chordDisplayMode === "triad"
                                            ? ["Major", "Minor", "Diminished", "Augmented"].map(
                                                (v) => ({ value: v, label: v }),
                                              )
                                            : diatonicCodeOptions;
                                      navigate("select", {
                                        title:
                                          layer.chordDisplayMode === "diatonic"
                                            ? t("controls.degree")
                                            : t("controls.chord"),
                                        options: opts,
                                        currentValue:
                                          layer.chordDisplayMode === "diatonic"
                                            ? layer.diatonicDegree
                                            : layer.chordType,
                                        onSelect: (v) =>
                                          layer.chordDisplayMode === "diatonic"
                                            ? update({ diatonicDegree: v })
                                            : update({ chordType: v as ChordType }),
                                      });
                                    },
                                    layer.chordDisplayMode !== "diatonic" &&
                                      layer.chordDisplayMode !== "triad",
                                  )}
                                {layer.chordDisplayMode === "on-chord" &&
                                  renderNavRow(
                                    t("controls.chord"),
                                    layer.onChordName,
                                    () =>
                                      navigate("select", {
                                        title: t("controls.chord"),
                                        options: onChordOptions,
                                        currentValue: layer.onChordName,
                                        onSelect: (v) => update({ onChordName: v }),
                                      }),
                                    true,
                                  )}
                                {(layer.chordDisplayMode === "diatonic" ||
                                  layer.chordDisplayMode === "triad") &&
                                  renderNavRow(
                                    layer.chordDisplayMode === "diatonic"
                                      ? t("controls.key")
                                      : t("controls.inversion"),
                                    findLabel(
                                      layer.chordDisplayMode === "diatonic"
                                        ? diatonicKeyOptions
                                        : triadInversionOptions,
                                      layer.chordDisplayMode === "diatonic"
                                        ? layer.diatonicKeyType
                                        : layer.triadInversion,
                                    ),
                                    () => {
                                      const isDiatonic = layer.chordDisplayMode === "diatonic";
                                      navigate("select", {
                                        title: isDiatonic
                                          ? t("controls.key")
                                          : t("controls.inversion"),
                                        options: isDiatonic
                                          ? diatonicKeyOptions
                                          : triadInversionOptions,
                                        currentValue: isDiatonic
                                          ? layer.diatonicKeyType
                                          : layer.triadInversion,
                                        onSelect: (v) => {
                                          if (!isDiatonic) {
                                            update({ triadInversion: v });
                                            return;
                                          }
                                          const patch: Partial<LayerConfig> = {
                                            diatonicKeyType: v,
                                          };
                                          const scaleKey = `${v}-${layer.diatonicChordSize}`;
                                          const validDegrees = (
                                            DIATONIC_CHORDS[scaleKey] ?? []
                                          ).map((item) => item.value);
                                          if (!validDegrees.includes(layer.diatonicDegree)) {
                                            patch.diatonicDegree = validDegrees[0] ?? "I";
                                          }
                                          update(patch);
                                        },
                                      });
                                    },
                                    layer.chordDisplayMode !== "diatonic",
                                  )}
                                {layer.chordDisplayMode === "diatonic" &&
                                  renderNavRow(
                                    t("controls.chordType"),
                                    findLabel(diatonicChordSizeOptions, layer.diatonicChordSize),
                                    () =>
                                      navigate("select", {
                                        title: t("controls.chordType"),
                                        options: diatonicChordSizeOptions,
                                        currentValue: layer.diatonicChordSize,
                                        onSelect: (v) => {
                                          const patch: Partial<LayerConfig> = {
                                            diatonicChordSize: v,
                                          };
                                          const scaleKey = `${layer.diatonicKeyType}-${v}`;
                                          const validDegrees = (
                                            DIATONIC_CHORDS[scaleKey] ?? []
                                          ).map((item) => item.value);
                                          if (!validDegrees.includes(layer.diatonicDegree)) {
                                            patch.diatonicDegree = validDegrees[0] ?? "I";
                                          }
                                          update(patch);
                                        },
                                      }),
                                    true,
                                  )}
                              </>,
                            )}
                            {renderSection(
                              renderToggleRow(
                                t("layers.chordFrame"),
                                layer.showChordFrame ?? true,
                                () => update({ showChordFrame: !(layer.showChordFrame ?? true) }),
                                true,
                              ),
                            )}
                          </>
                        )}

                        {/* CAGED settings */}
                        {layer.type === "caged" && (
                          <>
                            {renderSection(
                              <>
                                {renderNavRow(
                                  t("controls.chord"),
                                  findLabel(
                                    [
                                      { value: "major", label: t("options.diatonicKey.major") },
                                      {
                                        value: "minor",
                                        label: t("options.diatonicKey.naturalMinor"),
                                      },
                                    ],
                                    layer.cagedChordType,
                                  ),
                                  () =>
                                    navigate("select", {
                                      title: t("controls.chord"),
                                      options: [
                                        { value: "major", label: t("options.diatonicKey.major") },
                                        {
                                          value: "minor",
                                          label: t("options.diatonicKey.naturalMinor"),
                                        },
                                      ],
                                      currentValue: layer.cagedChordType,
                                      onSelect: (v) =>
                                        update({ cagedChordType: v as "major" | "minor" }),
                                    }),
                                  true,
                                )}
                              </>,
                            )}
                            {renderSection(
                              renderNavRow(
                                t("mobileControls.cagedForms"),
                                layer.cagedForms.size === 0
                                  ? t("finder.none")
                                  : CHORD_CAGED_ORDER.filter((k) => layer.cagedForms.has(k)).join(
                                      ", ",
                                    ),
                                () => navigate("caged"),
                                true,
                              ),
                            )}
                            {renderSection(
                              renderToggleRow(
                                t("layers.chordFrame"),
                                layer.showChordFrame ?? true,
                                () => update({ showChordFrame: !(layer.showChordFrame ?? true) }),
                                true,
                              ),
                            )}
                          </>
                        )}

                        {/* Custom settings */}
                        {layer.type === "custom" &&
                          renderSection(
                            renderNavRow(
                              layer.customMode === "note"
                                ? t("noteFilter.title")
                                : t("degreeFilter.title"),
                              (() => {
                                const items =
                                  layer.customMode === "note"
                                    ? [...layer.selectedNotes]
                                    : [...layer.selectedDegrees];
                                if (items.length === 0) return t("finder.none");
                                if (items.length <= 4) return items.join(", ");
                                return `${items.slice(0, 4).join(", ")}…`;
                              })(),
                              () => navigate("chips"),
                              true,
                            ),
                          )}

                        {/* Progression settings */}
                        {layer.type === "progression" && (
                          <>
                            {renderSection(
                              <>
                                {renderNavRow(
                                  t("controls.template"),
                                  findLabel(
                                    progressionTemplateOptions,
                                    layer.progressionTemplateId ?? "251",
                                  ),
                                  () =>
                                    navigate("select", {
                                      title: t("controls.template"),
                                      options: progressionTemplateOptions,
                                      currentValue: layer.progressionTemplateId ?? "251",
                                      onSelect: (v) =>
                                        update({
                                          progressionTemplateId: v,
                                          progressionCurrentStep: 0,
                                        }),
                                    }),
                                )}
                                {renderNavRow(
                                  t("controls.keyType"),
                                  findLabel(
                                    progressionKeyTypeOptions,
                                    layer.progressionKeyType ?? "major",
                                  ),
                                  () =>
                                    navigate("select", {
                                      title: t("controls.keyType"),
                                      options: progressionKeyTypeOptions,
                                      currentValue: layer.progressionKeyType ?? "major",
                                      onSelect: (v) =>
                                        update({ progressionKeyType: v as "major" | "minor" }),
                                    }),
                                )}
                                {renderToggleRow(
                                  t("layers.chordFrame"),
                                  layer.showChordFrame ?? false,
                                  () =>
                                    update({ showChordFrame: !(layer.showChordFrame ?? false) }),
                                )}
                                {renderToggleRow(
                                  t("controls.showPrevGhost"),
                                  layer.progressionShowPrevGhost ?? false,
                                  () =>
                                    update({
                                      progressionShowPrevGhost: !(
                                        layer.progressionShowPrevGhost ?? false
                                      ),
                                    }),
                                )}
                                {renderToggleRow(
                                  t("controls.showNextGhost"),
                                  layer.progressionShowNextGhost ?? false,
                                  () =>
                                    update({
                                      progressionShowNextGhost: !(
                                        layer.progressionShowNextGhost ?? false
                                      ),
                                    }),
                                  true,
                                )}
                              </>,
                            )}
                          </>
                        )}

                        {/* Color */}
                        {renderSection(
                          <TouchableOpacity
                            onPress={() => navigate("color")}
                            style={[styles.iosRow]}
                            activeOpacity={0.6}
                          >
                            <Text style={[styles.iosRowLabel, { color: labelColor }]}>
                              {t("layerColors")}
                            </Text>
                            <View style={styles.iosRowRight}>
                              <View
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: 7,
                                  backgroundColor: layer.color,
                                  marginRight: 4,
                                  borderWidth: 1,
                                  borderColor: isDark
                                    ? "rgba(255,255,255,0.15)"
                                    : "rgba(0,0,0,0.12)",
                                }}
                              />
                              <ChevronIcon size={12} color={chevronColor} direction="right" />
                            </View>
                          </TouchableOpacity>,
                        )}

                        {/* Description — always visible at bottom */}
                        <View style={{ paddingTop: 8, paddingBottom: 4 }}>
                          <LayerDescription
                            theme={theme}
                            layer={layer}
                            progressionTemplates={progressionTemplates}
                          />
                        </View>
                      </View>
                    </ScrollView>
                    {/* Absolute glass header — settings rows scroll up behind it */}
                    <SheetProgressiveHeader
                      isDark={isDark}
                      bgColor={bgColor}
                      dragHandlers={dragHandlers}
                      contentPaddingHorizontal={14}
                      onLayout={setHeaderHeight}
                      style={styles.absoluteHeader}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        {/* LEFT: back to type selection (backward animation) */}
                        <GlassIconButton
                          isDark={isDark}
                          onPress={() =>
                            navigateToParent({
                              title: t("layers.type"),
                              options: [
                                { value: "scale", label: t("layers.scale") },
                                { value: "chord", label: t("layers.chord") },
                                { value: "caged", label: t("layers.caged") },
                                { value: "custom", label: t("layers.custom") },
                                { value: "progression", label: t("layers.progression") },
                              ],
                              currentValue: layer.type,
                              onSelect: (v) => {
                                const newType = v as LayerType;
                                if (newType !== layer.type) {
                                  const nextLayer = {
                                    ...createDefaultLayer(newType, layer.id, layer.color),
                                  };
                                  setLayer(nextLayer);
                                  onPreview?.(nextLayer);
                                }
                              },
                              hideBack: true,
                            })
                          }
                          icon="back"
                          style={styles.headerLeft}
                        />

                        {/* CENTER: type name (also tappable, same backward animation) */}
                        <TouchableOpacity
                          onPress={() =>
                            navigateToParent({
                              title: t("layers.type"),
                              options: [
                                { value: "scale", label: t("layers.scale") },
                                { value: "chord", label: t("layers.chord") },
                                { value: "caged", label: t("layers.caged") },
                                { value: "custom", label: t("layers.custom") },
                                { value: "progression", label: t("layers.progression") },
                              ],
                              currentValue: layer.type,
                              onSelect: (v) => {
                                const newType = v as LayerType;
                                if (newType !== layer.type) {
                                  const nextLayer = {
                                    ...createDefaultLayer(newType, layer.id, layer.color),
                                  };
                                  setLayer(nextLayer);
                                  onPreview?.(nextLayer);
                                }
                              },
                              hideBack: true,
                            })
                          }
                          style={styles.headerCenter}
                          activeOpacity={0.6}
                        >
                          <Text style={[styles.headerTitle, { color: labelColor }]}>
                            {t(`layers.${layer.type}`)}
                          </Text>
                        </TouchableOpacity>

                        {/* RIGHT: confirm (checkmark) button */}
                        <View style={styles.headerRight}>
                          <GlassIconButton
                            isDark={isDark}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              closeWithCallback(() => {
                                onSave(layer);
                                onClose();
                              });
                            }}
                            icon="check"
                            testID="settings-confirm-btn"
                            style={styles.helpBtn}
                          />
                        </View>
                      </View>
                    </SheetProgressiveHeader>
                  </View>
                )}

                {/* Step: Color picker */}
                {step === "color" && (
                  <View style={{ flex: 1 }}>
                    <ScrollView
                      ref={sheetScrollRef}
                      style={styles.sheetScroll}
                      contentContainerStyle={[
                        styles.sheetScrollContent,
                        { paddingTop: headerHeight },
                      ]}
                      showsVerticalScrollIndicator
                      indicatorStyle={isDark ? "white" : "black"}
                      persistentScrollbar
                      onLayout={flashSheetScrollIndicator}
                      onContentSizeChange={flashSheetScrollIndicator}
                    >
                      <View style={[styles.settingsBody, { paddingTop: 8 }]}>
                        <View style={[styles.iosRow, { paddingVertical: 12 }]}>
                          <ColorPicker
                            value={layer.color}
                            onChange={(color) => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              update({ color });
                            }}
                            isDark={isDark}
                            style={{ flex: 1 }}
                          />
                        </View>
                      </View>
                    </ScrollView>
                    {renderSubPageHeader(t("layerColors"), navigateBack, dragHandlers)}
                  </View>
                )}

                {/* Step: Chips (custom layer notes/degrees) */}
                {step === "chips" && (
                  <View style={{ flex: 1 }}>
                    <ScrollView
                      ref={sheetScrollRef}
                      style={styles.sheetScroll}
                      contentContainerStyle={[
                        styles.sheetScrollContent,
                        { paddingTop: headerHeight },
                      ]}
                      showsVerticalScrollIndicator
                      indicatorStyle={isDark ? "white" : "black"}
                      persistentScrollbar
                      onLayout={flashSheetScrollIndicator}
                      onContentSizeChange={flashSheetScrollIndicator}
                    >
                      <View style={[styles.settingsBody, { paddingTop: 8 }]}>
                        {/* Mode (note / degree) inline segment toggle */}
                        {renderSection(
                          <View style={[styles.iosRow, { justifyContent: "center" }]}>
                            <SegmentedToggle
                              theme={theme}
                              value={layer.customMode ?? "note"}
                              onChange={(mode) => update({ customMode: mode as "note" | "degree" })}
                              options={[
                                { value: "note", label: t("noteFilter.title") },
                                { value: "degree", label: t("degreeFilter.title") },
                              ]}
                              size="compact"
                            />
                          </View>,
                        )}
                        <View style={styles.customChipsGrid}>
                          {(layer.customMode === "note" ? notes : [...CUSTOM_DEGREE_CHIPS]).map(
                            (item) => {
                              const active =
                                layer.customMode === "note"
                                  ? layer.selectedNotes.has(item)
                                  : layer.selectedDegrees.has(item);
                              return (
                                <BounceChip
                                  key={item}
                                  label={item}
                                  active={active}
                                  color={labelColor}
                                  isDark={isDark}
                                  onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    if (layer.customMode === "note") {
                                      const next = new Set(layer.selectedNotes);
                                      if (next.has(item)) next.delete(item);
                                      else next.add(item);
                                      update({ selectedNotes: next });
                                    } else {
                                      const next = new Set(layer.selectedDegrees);
                                      if (next.has(item)) next.delete(item);
                                      else next.add(item);
                                      update({ selectedDegrees: next });
                                    }
                                  }}
                                />
                              );
                            },
                          )}
                        </View>
                        <View style={styles.customActionRow}>
                          <PillButton
                            isDark={isDark}
                            onPress={() =>
                              navigate("select", {
                                title: t("layers.extractFromChord"),
                                options: CHORD_TYPES.map((v) => ({ value: v, label: v })),
                                currentValue: extractChordType,
                                backStep: "chips",
                                onSelect: (v) => {
                                  setExtractChordType(v);
                                  const semitones = CHORD_SEMITONES[v];
                                  if (!semitones) return;
                                  if (layer.customMode === "note") {
                                    const ri = getRootIndex(rootNote);
                                    update({
                                      selectedNotes: new Set(
                                        [...semitones].map((s) => notes[(ri + s) % 12]),
                                      ),
                                    });
                                  } else {
                                    update({
                                      selectedDegrees: new Set(
                                        DEGREE_BY_SEMITONE.filter((_, i) => semitones.has(i)),
                                      ),
                                    });
                                  }
                                },
                              })
                            }
                            style={{ flex: 1, justifyContent: "center" }}
                          >
                            <Text style={{ fontSize: 13, fontWeight: "500", color: labelColor }}>
                              {t("layers.extractFromChord")}
                            </Text>
                          </PillButton>
                          <PillButton
                            isDark={isDark}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              update({ selectedNotes: new Set(), selectedDegrees: new Set() });
                            }}
                            variant="danger"
                            disabled={
                              layer.selectedNotes.size === 0 && layer.selectedDegrees.size === 0
                            }
                            style={{ flex: 1, justifyContent: "center" }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "500",
                                color: isDark ? "#f87171" : "#ef4444",
                              }}
                            >
                              {t("layers.reset")}
                            </Text>
                          </PillButton>
                        </View>
                      </View>
                    </ScrollView>
                    {renderSubPageHeader(
                      layer.customMode === "note" ? t("noteFilter.title") : t("degreeFilter.title"),
                      navigateBack,
                      dragHandlers,
                    )}
                  </View>
                )}

                {/* Step: CAGED forms */}
                {step === "caged" && (
                  <View style={{ flex: 1 }}>
                    <ScrollView
                      ref={sheetScrollRef}
                      style={styles.sheetScroll}
                      contentContainerStyle={[
                        styles.sheetScrollContent,
                        { paddingTop: headerHeight },
                      ]}
                      showsVerticalScrollIndicator
                      indicatorStyle={isDark ? "white" : "black"}
                    >
                      <View style={[styles.settingsBody, { paddingTop: 8 }]}>
                        <View style={[styles.iosRow, { justifyContent: "center", gap: 10 }]}>
                          {CHORD_CAGED_ORDER.map((key) => {
                            const active = layer.cagedForms.has(key);
                            return (
                              <TouchableOpacity
                                key={key}
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  const next = new Set(layer.cagedForms);
                                  if (next.has(key)) next.delete(key);
                                  else next.add(key);
                                  update({ cagedForms: next });
                                }}
                                style={[
                                  styles.cagedBtn,
                                  {
                                    backgroundColor: active
                                      ? labelColor
                                      : isDark
                                        ? "#374151"
                                        : "#f5f5f4",
                                    borderColor: active
                                      ? "transparent"
                                      : isDark
                                        ? "#4b5563"
                                        : "#d6d3d1",
                                  },
                                ]}
                                activeOpacity={0.7}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              >
                                <Text
                                  style={{
                                    fontSize: 14,
                                    fontWeight: "bold",
                                    color: active
                                      ? isDark
                                        ? "#000"
                                        : "#fff"
                                      : isDark
                                        ? "#f3f4f6"
                                        : "#44403c",
                                  }}
                                >
                                  {key}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    </ScrollView>
                    {renderSubPageHeader(
                      t("mobileControls.cagedForms"),
                      navigateBack,
                      dragHandlers,
                    )}
                  </View>
                )}

                {/* Step: Generic select list */}
                {step === "select" && selectContextRef.current && (
                  <View style={{ flex: 1 }}>
                    <FlatList
                      data={selectContextRef.current.options}
                      keyExtractor={(item) => item.value}
                      style={styles.sheetScroll}
                      contentContainerStyle={[
                        styles.sheetScrollContent,
                        { paddingTop: headerHeight + 8, paddingHorizontal: 16 },
                      ]}
                      showsVerticalScrollIndicator
                      indicatorStyle={isDark ? "white" : "black"}
                      renderItem={({ item, index }) => {
                        const ctx = selectContextRef.current!;
                        if (item.isSection) {
                          return (
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "700",
                                letterSpacing: 0.7,
                                textTransform: "uppercase",
                                color: secondaryLabelColor,
                                paddingTop: index === 0 ? 0 : 16,
                                paddingBottom: 6,
                              }}
                            >
                              {item.label}
                            </Text>
                          );
                        }
                        const isSelected = item.value === ctx.currentValue;
                        const nextItem = ctx.options[index + 1];
                        const isLast = !nextItem || nextItem.isSection;
                        return (
                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              ctx.onSelect(item.value);
                              ctx.currentValue = item.value;
                              if (ctx.hideBack) {
                                navigate("settings");
                              } else if (ctx.backStep) {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                pendingEnterDir.current = -1;
                                setStep(ctx.backStep);
                              } else {
                                navigateBack();
                              }
                            }}
                            style={[
                              styles.selectRow,
                              !isLast && {
                                borderBottomWidth: StyleSheet.hairlineWidth,
                                borderBottomColor: borderColor,
                              },
                            ]}
                            activeOpacity={0.6}
                          >
                            <Text
                              style={[
                                styles.selectRowLabel,
                                {
                                  color: labelColor,
                                  fontWeight: isSelected ? "600" : "400",
                                },
                              ]}
                            >
                              {item.label}
                            </Text>
                            {isSelected && (
                              <Text style={{ color: labelColor, fontSize: 16 }}>✓</Text>
                            )}
                          </TouchableOpacity>
                        );
                      }}
                    />
                    {selectContextRef.current.hideBack ? (
                      /* Type selection: ✕ on LEFT — centered title — spacer RIGHT */
                      <SheetProgressiveHeader
                        isDark={isDark}
                        bgColor={bgColor}
                        contentPaddingHorizontal={14}
                        onLayout={setHeaderHeight}
                        style={styles.absoluteHeader}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <GlassIconButton
                            isDark={isDark}
                            onPress={() => close()}
                            icon="close"
                            style={styles.headerLeft}
                            testID="sub-page-back"
                          />
                          <View style={styles.headerCenter}>
                            <Text style={[styles.headerTitle, { color: labelColor }]}>
                              {selectContextRef.current.title}
                            </Text>
                          </View>
                          <View style={styles.headerRight} />
                        </View>
                      </SheetProgressiveHeader>
                    ) : (
                      renderSubPageHeader(
                        selectContextRef.current.title,
                        navigateBack,
                        dragHandlers,
                      )
                    )}
                  </View>
                )}
              </Animated.View>
            </View>
          </View>
        )}
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  modal: {
    borderWidth: 1,
  },
  centerModal: {
    borderRadius: 20,
    width: 300,
    padding: 20,
  },
  typeSheetModal: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
    paddingBottom: 40,
  },
  /** Absolute glass header — sits on top of scroll content */
  absoluteHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingTop: SHEET_HANDLE_CLEARANCE,
  },
  bottomSheetModal: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    overflow: "hidden",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  typeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  typeBtn: {
    flexBasis: "45%",
    flexGrow: 1,
    maxWidth: "48%",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
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
  helpBtn: {
    alignItems: "center",
    justifyContent: "center",
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
  // Section: groups rows with bottom separator between sections
  iosSection: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  // iOS row
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
  // Select list
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    minHeight: 44,
  },
  selectRowLabel: {
    fontSize: 15,
    flex: 1,
  },
  cagedRow: {
    flexDirection: "row",
    gap: 8,
  },
  cagedBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 4,
  },
  modeSegment: {
    flexDirection: "row",
    gap: 4,
  },
  modeSegmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  customChipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  customChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  customActionRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  customActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
});
