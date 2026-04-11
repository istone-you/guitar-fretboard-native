import { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
  FlatList,
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
import AnimatedModal from "../ui/AnimatedModal";
import BottomSheetModal from "../ui/BottomSheetModal";
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
} from "../../lib/fretboard";

const CHORD_TYPES = CHORD_TYPES_CORE;

interface SelectContext {
  title: string;
  options: { value: string; label: string }[];
  currentValue: string;
  onSelect: (v: string) => void;
  hideBack?: boolean; // type selection: no back button (type is topmost page)
  backStep?: "settings" | "chips"; // override back destination (default: "settings")
}

function SlideToggle({
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
      useNativeDriver: false,
    }).start();
  }

  const thumbX = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 23] });
  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? "#4b5563" : "#d6d3d1", color],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[styles.slideToggle, { backgroundColor: bgColor }]}>
        <Animated.View style={[styles.slideToggleThumb, { transform: [{ translateX: thumbX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
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
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "500",
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
}: LayerEditModalProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const { height: winHeight, width: winWidth } = useWindowDimensions();

  const [step, setStep] = useState<"type" | "settings" | "color" | "chips" | "select" | "caged">(
    initialLayer ? "settings" : "type",
  );
  const [layer, setLayer] = useState<LayerConfig>(
    initialLayer ?? createDefaultLayer("scale", `layer-${Date.now()}`, defaultColor),
  );
  const [extractChordType, setExtractChordType] = useState("Major");
  const [showDescription, setShowDescription] = useState(false);
  const descAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const selectContextRef = useRef<SelectContext | null>(null);

  const sheetScrollRef = useRef<ScrollView>(null);
  const flashSheetScrollIndicator = () => {
    requestAnimationFrame(() => {
      sheetScrollRef.current?.flashScrollIndicators();
    });
  };

  // Reset state when modal opens with different layer.
  const prevVisible = useRef(visible);
  const prevInitialId = useRef(initialLayer?.id);
  let resolvedStep = step;
  if (visible && (!prevVisible.current || prevInitialId.current !== initialLayer?.id)) {
    prevVisible.current = visible;
    prevInitialId.current = initialLayer?.id;
    resolvedStep = initialLayer ? "settings" : "type";
    if (resolvedStep !== step) setStep(resolvedStep);
    if (initialLayer) {
      setLayer(initialLayer);
    } else {
      setLayer(createDefaultLayer("scale", `layer-${Date.now()}`, defaultColor));
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

  // Navigate forward: new page slides in from right
  const navigate = (
    target: "settings" | "color" | "chips" | "select" | "caged",
    context?: SelectContext,
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (context) selectContextRef.current = context;
    setStep(target);
    slideAnim.setValue(winWidth);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 120,
      friction: 20,
      useNativeDriver: true,
    }).start();
  };

  // Navigate back to settings: settings slides in from left
  const navigateBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep("settings");
    slideAnim.setValue(-winWidth);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 120,
      friction: 20,
      useNativeDriver: true,
    }).start();
  };

  // Navigate to parent (type select): slides in from left (going up the hierarchy)
  const navigateToParent = (context: SelectContext) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectContextRef.current = context;
    setStep("select");
    slideAnim.setValue(-winWidth);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 120,
      friction: 20,
      useNativeDriver: true,
    }).start();
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
  const sheetHeight = Math.max(360, Math.min(520, Math.round(winHeight * 0.62)));

  // Progression options
  const progressionTemplateOptions = PROGRESSION_TEMPLATES.map((t_) => ({
    value: t_.id,
    label: t_.name,
  }));
  const progressionKeyTypeOptions = [
    { value: "major", label: t("options.diatonicKey.major") },
    { value: "minor", label: t("options.diatonicKey.naturalMinor") },
  ];
  const progressionChordSizeOptions = [
    { value: "triad", label: t("options.diatonicChordSize.triad") },
    { value: "seventh", label: t("options.diatonicChordSize.seventh") },
  ];

  const diatonicScaleType = `${layer.diatonicKeyType}-${layer.diatonicChordSize}`;

  const diatonicCodeOptions = (DIATONIC_CHORDS[diatonicScaleType] ?? []).map(({ value }) => {
    const chord = getDiatonicChord(rootIndex, diatonicScaleType, value);
    return {
      value,
      label: `${value} (${notes[chord.rootIndex]}${chordSuffix(chord.chordType)})`,
    };
  });

  const bgColor = isDark ? "#111827" : "#fafaf9";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4";
  const labelColor = isDark ? "#e5e7eb" : "#1c1917";
  const valueColor = isDark ? "#9ca3af" : "#78716c";
  const chevronColor = isDark ? "#6b7280" : "#a8a29e";

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
      <SlideToggle
        active={active}
        color="#34c759"
        isDark={isDark}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
      />
    </View>
  );

  // Section wrapper: just groups rows with a bottom divider between sections
  const renderSection = (children: React.ReactNode) => (
    <View style={[styles.iosSection, { borderColor }]}>{children}</View>
  );

  // Sub-page header: chevron back button + centered title
  const renderSubPageHeader = (title: string, onBack: () => void) => (
    <View style={[styles.pageHeader, { borderBottomColor: borderColor, backgroundColor: bgColor }]}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.headerLeft}
        activeOpacity={0.7}
        testID="sub-page-back"
      >
        <ChevronIcon size={20} color={chevronColor} direction="left" />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={[styles.headerTitle, { color: labelColor }]}>{title}</Text>
      </View>
      <View style={styles.headerRight} />
    </View>
  );

  // Find label by value from options array
  const findLabel = (options: { value: string; label: string }[], value: string) =>
    options.find((o) => o.value === value)?.label ?? value;

  return (
    <>
      {/* Type selection — center modal */}
      <AnimatedModal visible={visible && resolvedStep === "type"} onClose={onClose}>
        {({ closeWithCallback }) => (
          <View
            style={[styles.modal, styles.centerModal, { backgroundColor: bgColor, borderColor }]}
          >
            <View style={styles.typeSelection}>
              <Text style={[styles.title, { color: isDark ? "#fff" : "#1c1917" }]}>
                {t("layers.addLayer")}
              </Text>
              <View style={styles.typeButtons}>
                {(["scale", "chord", "caged", "custom", "progression"] as LayerType[]).map(
                  (type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const newLayer = createDefaultLayer(type, layer.id, layer.color);
                        setLayer(newLayer);
                        onPreview?.(newLayer);
                        closeWithCallback(() => setStep("settings"));
                      }}
                      style={[
                        styles.typeBtn,
                        {
                          borderColor: isDark ? "#374151" : "#d6d3d1",
                          backgroundColor: isDark ? "#1f2937" : "#fafaf9",
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: isDark ? "#fff" : "#1c1917",
                        }}
                      >
                        {t(`layers.${type}`)}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
            </View>
          </View>
        )}
      </AnimatedModal>

      {/* Settings / color / chips / select — bottom sheet */}
      <BottomSheetModal visible={visible && resolvedStep !== "type"} onClose={onClose}>
        {({ close }) => (
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
                    {/* Fixed header outside ScrollView — guarantees full width */}
                    <View
                      style={[
                        styles.pageHeader,
                        { backgroundColor: bgColor, borderBottomColor: borderColor },
                      ]}
                    >
                      {/* LEFT: back to type selection (backward animation) */}
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
                        style={styles.headerLeft}
                        activeOpacity={0.7}
                      >
                        <ChevronIcon size={20} color={chevronColor} direction="left" />
                      </TouchableOpacity>

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

                      {/* RIGHT: ? explanation button */}
                      <View style={styles.headerRight}>
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const next = !showDescription;
                            setShowDescription(next);
                            if (next) {
                              descAnim.setValue(0);
                              Animated.timing(descAnim, {
                                toValue: 1,
                                duration: 400,
                                easing: Easing.out(Easing.cubic),
                                useNativeDriver: false,
                              }).start();
                            } else {
                              Animated.timing(descAnim, {
                                toValue: 0,
                                duration: 350,
                                easing: Easing.out(Easing.cubic),
                                useNativeDriver: false,
                              }).start();
                            }
                          }}
                          style={[
                            styles.helpBtn,
                            {
                              backgroundColor: showDescription
                                ? isDark
                                  ? "#374151"
                                  : "#e7e5e4"
                                : "transparent",
                            },
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={{
                              fontSize: 17,
                              fontWeight: "700",
                              color: isDark ? "#9ca3af" : "#78716c",
                            }}
                          >
                            ?
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Animated.View
                      style={{
                        paddingHorizontal: 16,
                        maxHeight: descAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 200],
                        }),
                        opacity: descAnim,
                        overflow: "hidden",
                      }}
                    >
                      <View style={{ paddingTop: 8 }}>
                        <LayerDescription theme={theme} layer={layer} />
                      </View>
                    </Animated.View>

                    <ScrollView
                      ref={sheetScrollRef}
                      style={styles.sheetScroll}
                      contentContainerStyle={styles.sheetScrollContent}
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
                                      onSelect: (v) =>
                                        update({ chordDisplayMode: v as ChordDisplayMode }),
                                    }),
                                )}
                                {layer.chordDisplayMode !== "on-chord" &&
                                  renderNavRow(
                                    layer.chordDisplayMode === "diatonic"
                                      ? t("controls.degree")
                                      : t("controls.chord"),
                                    layer.chordDisplayMode === "diatonic"
                                      ? layer.diatonicDegree
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
                                        onSelect: (v) =>
                                          isDiatonic
                                            ? update({ diatonicKeyType: v })
                                            : update({ triadInversion: v }),
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
                                        onSelect: (v) => update({ diatonicChordSize: v }),
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
                                {renderNavRow(
                                  t("controls.chordType"),
                                  findLabel(
                                    progressionChordSizeOptions,
                                    layer.progressionChordSize ?? "seventh",
                                  ),
                                  () =>
                                    navigate("select", {
                                      title: t("controls.chordType"),
                                      options: progressionChordSizeOptions,
                                      currentValue: layer.progressionChordSize ?? "seventh",
                                      onSelect: (v) =>
                                        update({ progressionChordSize: v as "triad" | "seventh" }),
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

                        {/* Save button */}
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            onSave(layer);
                            close();
                          }}
                          style={[
                            styles.saveBtn,
                            { backgroundColor: isDark ? "#e5e7eb" : "#1c1917" },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "600",
                              color: isDark ? "#1c1917" : "#fff",
                            }}
                          >
                            {t("layers.confirm")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* Step: Color picker */}
                {step === "color" && (
                  <View style={{ flex: 1 }}>
                    {renderSubPageHeader(t("layerColors"), navigateBack)}
                    <ScrollView
                      ref={sheetScrollRef}
                      style={styles.sheetScroll}
                      contentContainerStyle={styles.sheetScrollContent}
                      showsVerticalScrollIndicator
                      indicatorStyle={isDark ? "white" : "black"}
                      persistentScrollbar
                      onLayout={flashSheetScrollIndicator}
                      onContentSizeChange={flashSheetScrollIndicator}
                    >
                      <View style={[styles.settingsBody, { paddingTop: 8 }]}>
                        {renderSection(
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
                          </View>,
                        )}
                        <TouchableOpacity
                          onPress={navigateBack}
                          style={[
                            styles.saveBtn,
                            { backgroundColor: isDark ? "#e5e7eb" : "#1c1917" },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "600",
                              color: isDark ? "#1c1917" : "#fff",
                            }}
                          >
                            {t("layers.confirm")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* Step: Chips (custom layer notes/degrees) */}
                {step === "chips" && (
                  <View style={{ flex: 1 }}>
                    {renderSubPageHeader(
                      layer.customMode === "note" ? t("noteFilter.title") : t("degreeFilter.title"),
                      navigateBack,
                    )}
                    <ScrollView
                      ref={sheetScrollRef}
                      style={styles.sheetScroll}
                      contentContainerStyle={styles.sheetScrollContent}
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
                          <TouchableOpacity
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
                            style={[
                              styles.customActionBtn,
                              {
                                flex: 1,
                                borderColor: isDark ? "#374151" : "#d6d3d1",
                                backgroundColor: isDark ? "#1f2937" : "#fafaf9",
                              },
                            ]}
                            activeOpacity={0.7}
                          >
                            <Text style={{ fontSize: 13, fontWeight: "500", color: labelColor }}>
                              {t("layers.extractFromChord")}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            disabled={
                              layer.selectedNotes.size === 0 && layer.selectedDegrees.size === 0
                            }
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              update({ selectedNotes: new Set(), selectedDegrees: new Set() });
                            }}
                            style={[
                              styles.customActionBtn,
                              {
                                borderColor: isDark
                                  ? "rgba(239,68,68,0.3)"
                                  : "rgba(239,68,68,0.25)",
                                backgroundColor: isDark
                                  ? "rgba(239,68,68,0.08)"
                                  : "rgba(254,226,226,0.7)",
                                opacity:
                                  layer.selectedNotes.size === 0 && layer.selectedDegrees.size === 0
                                    ? 0.35
                                    : 1,
                              },
                            ]}
                            activeOpacity={0.7}
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
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                          onPress={navigateBack}
                          style={[
                            styles.saveBtn,
                            { backgroundColor: isDark ? "#e5e7eb" : "#1c1917" },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "600",
                              color: isDark ? "#1c1917" : "#fff",
                            }}
                          >
                            {t("layers.confirm")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* Step: CAGED forms */}
                {step === "caged" && (
                  <View style={{ flex: 1 }}>
                    {renderSubPageHeader(t("mobileControls.cagedForms"), navigateBack)}
                    <ScrollView
                      ref={sheetScrollRef}
                      style={styles.sheetScroll}
                      contentContainerStyle={styles.sheetScrollContent}
                      showsVerticalScrollIndicator
                      indicatorStyle={isDark ? "white" : "black"}
                    >
                      <View style={[styles.settingsBody, { paddingTop: 8 }]}>
                        {renderSection(
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
                          </View>,
                        )}
                        <TouchableOpacity
                          onPress={navigateBack}
                          style={[
                            styles.saveBtn,
                            { backgroundColor: isDark ? "#e5e7eb" : "#1c1917" },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "600",
                              color: isDark ? "#1c1917" : "#fff",
                            }}
                          >
                            {t("layers.confirm")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* Step: Generic select list */}
                {step === "select" && selectContextRef.current && (
                  <View style={{ flex: 1 }}>
                    {selectContextRef.current.hideBack ? (
                      /* Type selection: ✕ on LEFT — centered title — spacer RIGHT */
                      <View
                        style={[
                          styles.pageHeader,
                          { borderBottomColor: borderColor, backgroundColor: bgColor },
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => navigate("settings")}
                          style={styles.headerLeft}
                          activeOpacity={0.7}
                          testID="sub-page-back"
                        >
                          <Text style={{ fontSize: 20, color: chevronColor, paddingLeft: 4 }}>
                            ✕
                          </Text>
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                          <Text style={[styles.headerTitle, { color: labelColor }]}>
                            {selectContextRef.current.title}
                          </Text>
                        </View>
                        <View style={styles.headerRight} />
                      </View>
                    ) : (
                      renderSubPageHeader(selectContextRef.current.title, navigateBack)
                    )}
                    <FlatList
                      data={selectContextRef.current.options}
                      keyExtractor={(item) => item.value}
                      style={styles.sheetScroll}
                      contentContainerStyle={[
                        styles.sheetScrollContent,
                        { paddingTop: 8, paddingHorizontal: 16 },
                      ]}
                      showsVerticalScrollIndicator
                      indicatorStyle={isDark ? "white" : "black"}
                      renderItem={({ item, index }) => {
                        const ctx = selectContextRef.current!;
                        const isSelected = item.value === ctx.currentValue;
                        const isLast = index === ctx.options.length - 1;
                        return (
                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              ctx.onSelect(item.value);
                              ctx.currentValue = item.value;
                              // type select is parent → going to settings is forward
                              if (ctx.hideBack) {
                                navigate("settings");
                              } else if (ctx.backStep) {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setStep(ctx.backStep);
                                slideAnim.setValue(-winWidth);
                                Animated.spring(slideAnim, {
                                  toValue: 0,
                                  tension: 120,
                                  friction: 20,
                                  useNativeDriver: true,
                                }).start();
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
                                  color: isSelected ? labelColor : labelColor,
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
  bottomSheetModal: {
    width: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    overflow: "hidden",
  },
  typeSelection: {
    alignItems: "center",
    gap: 16,
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
  pageHeader: {
    height: 48,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
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
    width: 28,
    height: 28,
    borderRadius: 14,
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
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 4,
  },
  slideToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
  },
  slideToggleThumb: {
    position: "absolute",
    top: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
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
    gap: 6,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  customChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  customActionRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
  },
  customActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
});
