import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
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
import { createDefaultLayer, COLOR_PRESETS } from "../../types";
import { DropdownSelect } from "../ui/DropdownSelect";
import ChevronIcon from "../ui/ChevronIcon";
import { buildScaleOptions } from "../ui/scaleOptions";
import {
  CHORD_CAGED_ORDER,
  CHORD_SEMITONES,
  CHORD_TYPES_CORE,
  CUSTOM_DEGREE_CHIPS,
  DEGREE_BY_SEMITONE,
  DIATONIC_CHORDS,
  TRIAD_INVERSION_OPTIONS,
  getDiatonicChord,
  getNotesByAccidental,
  getOnChordListForRoot,
  getRootIndex,
} from "../../logic/fretboard";

const CHORD_TYPES = CHORD_TYPES_CORE;

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
  const { height: winHeight } = useWindowDimensions();

  const [step, setStep] = useState<"type" | "settings" | "color" | "chips">(
    initialLayer ? "settings" : "type",
  );
  const [layer, setLayer] = useState<LayerConfig>(
    initialLayer ?? createDefaultLayer("scale", `layer-${Date.now()}`, defaultColor),
  );
  const [extractChordType, setExtractChordType] = useState("Major");

  // Animation
  const modalScale = useRef(new Animated.Value(0.5)).current;
  const modalOpacity = useRef(new Animated.Value(1)).current;
  const bottomSheetY = useRef(new Animated.Value(0)).current;
  const sheetScrollRef = useRef<ScrollView>(null);
  const flashSheetScrollIndicator = () => {
    requestAnimationFrame(() => {
      sheetScrollRef.current?.flashScrollIndicators();
    });
  };

  // Reset state when modal opens with different layer
  const prevVisible = useRef(visible);
  const prevInitialId = useRef(initialLayer?.id);
  if (visible && (!prevVisible.current || prevInitialId.current !== initialLayer?.id)) {
    prevVisible.current = visible;
    prevInitialId.current = initialLayer?.id;
    modalScale.setValue(0.5);
    modalOpacity.setValue(1);
    Animated.spring(modalScale, {
      toValue: 1,
      friction: 8,
      tension: 150,
      useNativeDriver: true,
    }).start();
    if (initialLayer) {
      setLayer(initialLayer);
      setStep("settings");
    } else {
      setLayer(createDefaultLayer("scale", `layer-${Date.now()}`, defaultColor));
      setStep("type");
    }
  }
  if (!visible && prevVisible.current) {
    prevVisible.current = false;
    bottomSheetY.setValue(0);
  }

  const isTypeStep = step === "type";

  useEffect(() => {
    if (!visible || isTypeStep) return;
    bottomSheetY.setValue(56);
    Animated.spring(bottomSheetY, {
      toValue: 0,
      friction: 9,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [visible, isTypeStep, step, layer.type, layer.chordDisplayMode, bottomSheetY]);

  const update = (partial: Partial<LayerConfig>) => {
    setLayer((prev) => {
      const next = { ...prev, ...partial };
      onPreview?.(next);
      return next;
    });
  };

  const bounceModal = () => {
    modalScale.stopAnimation();
    modalScale.setValue(1);
    Animated.sequence([
      Animated.timing(modalScale, {
        toValue: 1.06,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(modalScale, {
        toValue: 1,
        friction: 8,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const navigateTo = (target: "settings" | "color" | "chips") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(target);
  };

  const handleTypeSelect = (type: LayerType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLayer = createDefaultLayer(type, layer.id, layer.color);
    setLayer(newLayer);
    onPreview?.(newLayer);
    setStep("settings");
    bounceModal();
  };

  const closeWithExitAnimation = (callback: () => void) => {
    if (isTypeStep) {
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        callback();
      });
      return;
    }

    Animated.parallel([
      Animated.timing(bottomSheetY, {
        toValue: 84,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
    });
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(layer);
    closeWithExitAnimation(() => {
      onClose();
    });
  };

  const handleClose = () => {
    closeWithExitAnimation(() => {
      onClose();
    });
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
    { value: "power", label: t("options.chordDisplayMode.power") },
    { value: "triad", label: t("options.chordDisplayMode.triad") },
    { value: "diatonic", label: t("options.chordDisplayMode.diatonic") },
    { value: "on-chord", label: t("options.chordDisplayMode.on-chord") },
  ];
  const onChordOptions = getOnChordListForRoot(rootNote).map((v) => ({ value: v, label: v }));
  const triadInversionOptions = TRIAD_INVERSION_OPTIONS.map(({ value }) => ({
    value,
    label: t(`options.triadInversions.${value}`),
  }));
  const plainSmallText = { fontSize: 14, fontWeight: "500" } as const;
  const sheetHeight = Math.max(360, Math.min(520, Math.round(winHeight * 0.62)));

  const diatonicScaleType = `${layer.diatonicKeyType}-${layer.diatonicChordSize}`;
  const suffixMap: Record<string, string> = {
    Major: "",
    Minor: "m",
    "7th": "7",
    maj7: "maj7",
    m7: "m7",
    "m7(b5)": "m7(b5)",
    dim7: "dim",
    "m(maj7)": "m(maj7)",
  };
  const diatonicCodeOptions = (DIATONIC_CHORDS[diatonicScaleType] ?? []).map(({ value }) => {
    const chord = getDiatonicChord(rootIndex, diatonicScaleType, value);
    return {
      value,
      label: `${value} (${notes[chord.rootIndex]}${suffixMap[chord.chordType] ?? chord.chordType})`,
    };
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={[styles.overlay, { justifyContent: isTypeStep ? "center" : "flex-end" }]}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <Animated.View
          style={[
            styles.modal,
            isTypeStep ? styles.centerModal : styles.bottomSheetModal,
            !isTypeStep ? { height: sheetHeight } : null,
            {
              backgroundColor: isDark ? "#111827" : "#fafaf9",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4",
              transform: isTypeStep ? [{ scale: modalScale }] : [{ translateY: bottomSheetY }],
              opacity: modalOpacity,
            },
          ]}
        >
          {/* Step 1: Type selection */}
          {step === "type" && (
            <View style={styles.typeSelection}>
              <Text style={[styles.title, { color: isDark ? "#fff" : "#1c1917" }]}>
                {t("layers.addLayer")}
              </Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  onPress={() => handleTypeSelect("scale")}
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
                    {t("layers.scale")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleTypeSelect("chord")}
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
                    {t("layers.chord")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleTypeSelect("caged")}
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
                    {t("layers.caged")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleTypeSelect("custom")}
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
                    {t("layers.custom")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 2: Settings */}
          {step === "settings" && (
            <ScrollView
              ref={sheetScrollRef}
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              showsVerticalScrollIndicator
              indicatorStyle={isDark ? "white" : "black"}
              persistentScrollbar
              onLayout={flashSheetScrollIndicator}
              onContentSizeChange={flashSheetScrollIndicator}
              stickyHeaderIndices={[0]}
            >
              <View
                style={[
                  styles.settingsStickyHeader,
                  {
                    backgroundColor: isDark ? "#111827" : "#fafaf9",
                    borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4",
                  },
                ]}
              >
                <DropdownSelect
                  theme={theme}
                  value={layer.type}
                  onChange={(v) => {
                    const newType = v as LayerType;
                    if (newType !== layer.type) {
                      const nextLayer = {
                        ...createDefaultLayer(newType, layer.id, layer.color),
                      };
                      setLayer(nextLayer);
                      onPreview?.(nextLayer);
                    }
                  }}
                  options={[
                    { value: "scale", label: t("layers.scale") },
                    { value: "chord", label: t("layers.chord") },
                    { value: "caged", label: t("layers.caged") },
                    { value: "custom", label: t("layers.custom") },
                  ]}
                  variant="plain"
                />
              </View>

              <View style={styles.settings}>
                {/* Scale settings */}
                {layer.type === "scale" && (
                  <View style={styles.settingRowInline}>
                    <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                      {t("mobileControls.scaleKind")}
                    </Text>
                    <DropdownSelect
                      theme={theme}
                      value={layer.scaleType}
                      onChange={(v) => update({ scaleType: v as ScaleType })}
                      options={scaleOptions}
                      variant="plain"
                      textStyle={plainSmallText}
                    />
                  </View>
                )}

                {/* Chord settings */}
                {layer.type === "chord" && (
                  <>
                    <View style={styles.settingRowInline}>
                      <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                        {t("controls.displayMode")}
                      </Text>
                      <DropdownSelect
                        theme={theme}
                        value={layer.chordDisplayMode}
                        onChange={(v) => update({ chordDisplayMode: v as ChordDisplayMode })}
                        options={chordDisplayOptions}
                        variant="plain"
                        textStyle={plainSmallText}
                      />
                    </View>
                    {layer.chordDisplayMode !== "power" &&
                      layer.chordDisplayMode !== "on-chord" && (
                        <View style={styles.settingRowInline}>
                          <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                            {layer.chordDisplayMode === "diatonic"
                              ? t("controls.degree")
                              : t("controls.chord")}
                          </Text>
                          <DropdownSelect
                            theme={theme}
                            value={
                              layer.chordDisplayMode === "diatonic"
                                ? layer.diatonicDegree
                                : layer.chordType
                            }
                            onChange={(v) =>
                              layer.chordDisplayMode === "diatonic"
                                ? update({ diatonicDegree: v })
                                : update({ chordType: v as ChordType })
                            }
                            options={
                              layer.chordDisplayMode === "form"
                                ? CHORD_TYPES.map((v) => ({ value: v, label: v }))
                                : layer.chordDisplayMode === "triad"
                                  ? ["Major", "Minor", "Diminished", "Augmented"].map((v) => ({
                                      value: v,
                                      label: v,
                                    }))
                                  : diatonicCodeOptions
                            }
                            variant="plain"
                            textStyle={plainSmallText}
                          />
                        </View>
                      )}
                    {layer.chordDisplayMode === "on-chord" && (
                      <View style={styles.settingRowInline}>
                        <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                          {t("controls.chord")}
                        </Text>
                        <DropdownSelect
                          theme={theme}
                          value={layer.onChordName}
                          onChange={(v) => update({ onChordName: v })}
                          options={onChordOptions}
                          variant="plain"
                          textStyle={plainSmallText}
                        />
                      </View>
                    )}
                    {(layer.chordDisplayMode === "diatonic" ||
                      layer.chordDisplayMode === "triad") && (
                      <View style={styles.settingRowInline}>
                        <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                          {layer.chordDisplayMode === "diatonic"
                            ? t("controls.key")
                            : t("controls.inversion")}
                        </Text>
                        <DropdownSelect
                          theme={theme}
                          value={
                            layer.chordDisplayMode === "diatonic"
                              ? layer.diatonicKeyType
                              : layer.triadInversion
                          }
                          onChange={(v) =>
                            layer.chordDisplayMode === "diatonic"
                              ? update({ diatonicKeyType: v })
                              : update({ triadInversion: v })
                          }
                          options={
                            layer.chordDisplayMode === "diatonic"
                              ? diatonicKeyOptions
                              : triadInversionOptions
                          }
                          variant="plain"
                          textStyle={plainSmallText}
                        />
                      </View>
                    )}
                    {layer.chordDisplayMode === "diatonic" && (
                      <View style={styles.settingRowInline}>
                        <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                          {t("controls.chordType")}
                        </Text>
                        <DropdownSelect
                          theme={theme}
                          value={layer.diatonicChordSize}
                          onChange={(v) => update({ diatonicChordSize: v })}
                          options={diatonicChordSizeOptions}
                          variant="plain"
                          textStyle={plainSmallText}
                        />
                      </View>
                    )}
                  </>
                )}

                {/* CAGED settings */}
                {layer.type === "caged" && (
                  <>
                    <View style={styles.settingRowInline}>
                      <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                        {t("controls.chord")}
                      </Text>
                      <DropdownSelect
                        theme={theme}
                        value={layer.cagedChordType}
                        onChange={(v) => update({ cagedChordType: v as "major" | "minor" })}
                        options={[
                          { value: "major", label: t("options.diatonicKey.major") },
                          { value: "minor", label: t("options.diatonicKey.naturalMinor") },
                        ]}
                        variant="plain"
                        textStyle={plainSmallText}
                      />
                    </View>
                    <View style={styles.settingRowInline}>
                      <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                        {t("mobileControls.cagedForms")}
                      </Text>
                      <View style={styles.cagedRow}>
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
                                    ? layer.color
                                    : isDark
                                      ? "#1f2937"
                                      : "#fafaf9",
                                  borderColor: active
                                    ? "transparent"
                                    : isDark
                                      ? "#374151"
                                      : "#d6d3d1",
                                },
                              ]}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "bold",
                                  color: active ? "#fff" : isDark ? "#f3f4f6" : "#44403c",
                                }}
                              >
                                {key}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </>
                )}

                {(layer.type === "chord" || layer.type === "caged") && (
                  <View style={styles.settingRowInline}>
                    <Text
                      style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c", flex: 1 }]}
                    >
                      {t("layers.chordFrame")}
                    </Text>
                    <SlideToggle
                      active={layer.showChordFrame ?? true}
                      color={layer.color}
                      isDark={isDark}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        update({
                          showChordFrame: !(layer.showChordFrame ?? true),
                        });
                      }}
                    />
                  </View>
                )}

                {/* Navigate to chips page (custom type only) */}
                {layer.type === "custom" && (
                  <View style={styles.settingRowInline}>
                    <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                      {layer.customMode === "note"
                        ? t("noteFilter.title")
                        : t("degreeFilter.title")}
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigateTo("chips")}
                      style={[
                        styles.navTrigger,
                        {
                          borderColor: "transparent",
                          backgroundColor: "transparent",
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "500",
                          color: isDark ? "#fff" : "#1c1917",
                        }}
                      >
                        {(() => {
                          const items =
                            layer.customMode === "note"
                              ? [...layer.selectedNotes]
                              : [...layer.selectedDegrees];
                          if (items.length === 0) return "—";
                          if (items.length <= 6) return items.join(", ");
                          return `${items.slice(0, 6).join(", ")}…`;
                        })()}
                      </Text>
                      <ChevronIcon size={10} color={isDark ? "#6b7280" : "#a8a29e"} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Navigate to color page */}
                <View style={styles.settingRowInline}>
                  <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c", flex: 1 }]}>
                    {t("layerColors")}
                  </Text>
                  <TouchableOpacity onPress={() => navigateTo("color")} activeOpacity={0.7}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: layer.color,
                      }}
                    />
                  </TouchableOpacity>
                </View>

                {/* Save button */}
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.saveBtn, { backgroundColor: isDark ? "#e5e7eb" : "#1c1917" }]}
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
          )}

          {/* Step: Color picker */}
          {step === "color" && (
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
              <View style={styles.settings}>
                <TouchableOpacity
                  onPress={() => navigateTo("settings")}
                  style={{ padding: 10, alignSelf: "flex-start" }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      color: isDark ? "#e5e7eb" : "#1c1917",
                    }}
                  >
                    ←
                  </Text>
                </TouchableOpacity>
                <View style={styles.settingRow}>
                  <View style={styles.colorRow}>
                    {COLOR_PRESETS.map((preset) => (
                      <TouchableOpacity
                        key={preset}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          update({ color: preset });
                        }}
                        style={[
                          styles.colorDot,
                          {
                            backgroundColor: preset,
                            borderWidth: layer.color === preset ? 3 : 0,
                            borderColor: isDark ? "#fff" : "#1c1917",
                          },
                        ]}
                        activeOpacity={0.7}
                      />
                    ))}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => navigateTo("settings")}
                  style={[styles.saveBtn, { backgroundColor: isDark ? "#e5e7eb" : "#1c1917" }]}
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
          )}

          {/* Step: Chips (custom layer notes/degrees) */}
          {step === "chips" && (
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
              <View style={styles.settings}>
                <TouchableOpacity
                  onPress={() => navigateTo("settings")}
                  style={{ padding: 10, alignSelf: "flex-start" }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      color: isDark ? "#e5e7eb" : "#1c1917",
                    }}
                  >
                    ←
                  </Text>
                </TouchableOpacity>
                <DropdownSelect
                  theme={theme}
                  value={layer.customMode}
                  onChange={(v) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    update({ customMode: v as "note" | "degree" });
                  }}
                  options={[
                    { value: "note", label: t("noteFilter.title") },
                    { value: "degree", label: t("degreeFilter.title") },
                  ]}
                  variant="plain"
                  textStyle={plainSmallText}
                />
                <View style={styles.customChipsGrid}>
                  {(layer.customMode === "note" ? notes : [...CUSTOM_DEGREE_CHIPS]).map((item) => {
                    const active =
                      layer.customMode === "note"
                        ? layer.selectedNotes.has(item)
                        : layer.selectedDegrees.has(item);
                    return (
                      <BounceChip
                        key={item}
                        label={item}
                        active={active}
                        color={layer.color}
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
                  })}
                </View>
                <View style={styles.customActionRow}>
                  <View
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderRadius: 10,
                      borderColor: isDark ? "#374151" : "#d6d3d1",
                      backgroundColor: isDark ? "#1f2937" : "#fafaf9",
                      alignItems: "center",
                    }}
                  >
                    <DropdownSelect
                      theme={theme}
                      value={extractChordType}
                      onChange={(v) => {
                        setExtractChordType(v);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const semitones = CHORD_SEMITONES[v];
                        if (!semitones) return;
                        if (layer.customMode === "note") {
                          const rootIdx = getRootIndex(rootNote);
                          const chordNotes = new Set(
                            [...semitones].map((s) => notes[(rootIdx + s) % 12]),
                          );
                          update({ selectedNotes: chordNotes });
                        } else {
                          update({
                            selectedDegrees: new Set(
                              DEGREE_BY_SEMITONE.filter((_, i) => semitones.has(i)),
                            ),
                          });
                        }
                      }}
                      options={CHORD_TYPES.map((v) => ({ value: v, label: v }))}
                      label={t("layers.extractFromChord")}
                      variant="plain"
                      textStyle={plainSmallText}
                    />
                  </View>
                  <TouchableOpacity
                    disabled={layer.selectedNotes.size === 0 && layer.selectedDegrees.size === 0}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      update({
                        selectedNotes: new Set(),
                        selectedDegrees: new Set(),
                      });
                    }}
                    style={[
                      styles.customActionBtn,
                      {
                        borderColor: isDark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.25)",
                        backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "rgba(254,226,226,0.7)",
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
                  onPress={() => navigateTo("settings")}
                  style={[styles.saveBtn, { backgroundColor: isDark ? "#e5e7eb" : "#1c1917" }]}
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
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
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
  settings: {
    gap: 16,
  },
  settingsStickyHeader: {
    paddingBottom: 10,
    marginBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 1,
  },
  sheetScroll: {
    width: "100%",
  },
  sheetScrollContent: {
    paddingBottom: 6,
  },
  settingRow: {
    gap: 6,
  },
  settingRowInline: {
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 38,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  cagedRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
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
    marginTop: 8,
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
  customModeRow: {
    flexDirection: "row",
    gap: 8,
  },
  customModeBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  customChipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
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
  },
  customActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  navTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "stretch",
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  navBtnDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});
