import { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
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
  DIATONIC_CHORDS,
  NOTES_FLAT,
  NOTES_SHARP,
  TRIAD_INVERSION_OPTIONS,
  getOnChordListForRoot,
  getDiatonicChord,
  getRootIndex,
} from "../../logic/fretboard";

const CHORD_TYPES: ChordType[] = [
  "Major",
  "Minor",
  "7th",
  "maj7",
  "m7",
  "m7(b5)",
  "dim7",
  "m(maj7)",
  "sus2",
  "sus4",
  "6",
  "m6",
  "dim",
  "aug",
];

const DEGREE_CHIPS = [
  "P1",
  "m2",
  "M2",
  "m3",
  "M3",
  "P4",
  "b5",
  "P5",
  "m6",
  "M6",
  "m7",
  "M7",
  "♭9",
  "9",
  "♯9",
  "11",
  "♯11",
  "♭13",
  "13",
] as const;

const DEGREE_BY_SEMITONE = ["P1", "m2", "M2", "m3", "M3", "P4", "b5", "P5", "m6", "M6", "m7", "M7"];

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
  overlayNotes: string[];
  overlaySemitones: Set<number>;
  onClose: () => void;
  onSave: (layer: LayerConfig) => void;
  onPreview?: (layer: LayerConfig) => void;
  onStartCellEdit?: (mode: "hide" | "frame", layerId: string) => void;
}

export default function LayerEditModal({
  theme,
  visible,
  rootNote,
  accidental,
  initialLayer,
  defaultColor,
  overlayNotes,
  overlaySemitones,
  onClose,
  onSave,
  onPreview,
  onStartCellEdit,
}: LayerEditModalProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const [step, setStep] = useState<"type" | "settings" | "color" | "chips">(
    initialLayer ? "settings" : "type",
  );
  const [layer, setLayer] = useState<LayerConfig>(
    initialLayer ?? createDefaultLayer("scale", `layer-${Date.now()}`, defaultColor),
  );

  // Animation
  const modalScale = useRef(new Animated.Value(0.5)).current;
  const modalOpacity = useRef(new Animated.Value(1)).current;

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
  }

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
    bounceModal();
  };

  const handleTypeSelect = (type: LayerType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLayer = createDefaultLayer(type, layer.id, layer.color);
    setLayer(newLayer);
    onPreview?.(newLayer);
    setStep("settings");
    bounceModal();
  };

  const fadeOut = (callback: () => void) => {
    Animated.timing(modalOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      callback();
    });
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(layer);
    fadeOut(() => {
      onClose();
    });
  };

  const handleClose = () => {
    fadeOut(() => {
      onClose();
    });
  };

  const { options: scaleOptions } = buildScaleOptions(t);
  const notes = accidental === "sharp" ? NOTES_SHARP : NOTES_FLAT;
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
    { value: "caged", label: t("options.chordDisplayMode.caged") },
  ];
  const onChordOptions = getOnChordListForRoot(rootNote).map((v) => ({ value: v, label: v }));
  const triadInversionOptions = TRIAD_INVERSION_OPTIONS.map(({ value }) => ({
    value,
    label: t(`options.triadInversions.${value}`),
  }));

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
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <Animated.View
          style={[
            styles.modal,
            {
              backgroundColor: isDark ? "rgba(17,24,39,0.97)" : "rgba(250,250,249,0.97)",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4",
              transform: [{ scale: modalScale }],
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
            <View style={styles.settings}>
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
                  { value: "custom", label: t("layers.custom") },
                ]}
                variant="plain"
              />

              {/* Scale settings */}
              {layer.type === "scale" && (
                <View style={styles.settingRow}>
                  <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                    {t("mobileControls.scaleKind")}
                  </Text>
                  <DropdownSelect
                    theme={theme}
                    value={layer.scaleType}
                    onChange={(v) => update({ scaleType: v as ScaleType })}
                    options={scaleOptions}
                    fullWidth
                  />
                </View>
              )}

              {/* Chord settings */}
              {layer.type === "chord" && (
                <>
                  <View style={styles.settingRow}>
                    <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                      {t("controls.displayMode")}
                    </Text>
                    <DropdownSelect
                      theme={theme}
                      value={layer.chordDisplayMode}
                      onChange={(v) => update({ chordDisplayMode: v as ChordDisplayMode })}
                      options={chordDisplayOptions}
                      fullWidth
                    />
                  </View>
                  {layer.chordDisplayMode !== "power" &&
                    layer.chordDisplayMode !== "caged" &&
                    layer.chordDisplayMode !== "on-chord" && (
                      <View style={styles.settingRow}>
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
                          fullWidth
                        />
                      </View>
                    )}
                  {layer.chordDisplayMode === "on-chord" && (
                    <View style={styles.settingRow}>
                      <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                        {t("controls.chord")}
                      </Text>
                      <DropdownSelect
                        theme={theme}
                        value={layer.onChordName}
                        onChange={(v) => update({ onChordName: v })}
                        options={onChordOptions}
                        fullWidth
                      />
                    </View>
                  )}
                  {(layer.chordDisplayMode === "diatonic" ||
                    layer.chordDisplayMode === "triad") && (
                    <View style={styles.settingRow}>
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
                        fullWidth
                      />
                    </View>
                  )}
                  {layer.chordDisplayMode === "diatonic" && (
                    <View style={styles.settingRow}>
                      <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                        {t("controls.chordType")}
                      </Text>
                      <DropdownSelect
                        theme={theme}
                        value={layer.diatonicChordSize}
                        onChange={(v) => update({ diatonicChordSize: v })}
                        options={diatonicChordSizeOptions}
                        fullWidth
                      />
                    </View>
                  )}
                  {layer.chordDisplayMode === "caged" && (
                    <View style={styles.settingRow}>
                      <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                        {t("options.chordDisplayMode.caged")}
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
                                    ? isDark
                                      ? "#e5e7eb"
                                      : "#1c1917"
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
                                  fontSize: 14,
                                  fontWeight: "bold",
                                  color: active
                                    ? isDark
                                      ? "#1c1917"
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
                  )}
                </>
              )}

              {layer.type === "chord" && (
                <View style={[styles.settingRow, { flexDirection: "row", alignItems: "center" }]}>
                  <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c", flex: 1 }]}>
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
                <View style={styles.settingRow}>
                  <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                    {layer.customMode === "note" ? t("noteFilter.title") : t("degreeFilter.title")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigateTo("chips")}
                    style={[
                      styles.navTrigger,
                      {
                        borderColor: isDark ? "#374151" : "#d6d3d1",
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(250,250,249,0.95)",
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 13,
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

              {/* Edit display (hide cells) - custom only */}
              {layer.type === "custom" && (
                <View style={styles.settingRow}>
                  <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                    {t("layers.editDisplay")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      onSave(layer);
                      onStartCellEdit?.("hide", layer.id);
                    }}
                    style={[
                      styles.navTrigger,
                      {
                        borderColor: isDark ? "#374151" : "#d6d3d1",
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(250,250,249,0.95)",
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "500",
                        color: isDark ? "#fff" : "#1c1917",
                      }}
                    >
                      {layer.hiddenCells.size === 0
                        ? t("layers.allVisible")
                        : t("layers.hiddenCount", { count: layer.hiddenCells.size })}
                    </Text>
                    <ChevronIcon size={10} color={isDark ? "#6b7280" : "#a8a29e"} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Create chord frame - custom only */}
              {layer.type === "custom" && (
                <View style={styles.settingRow}>
                  <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                    {t("layers.createFrame")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      onSave(layer);
                      onStartCellEdit?.("frame", layer.id);
                    }}
                    style={[
                      styles.navTrigger,
                      {
                        borderColor: isDark ? "#374151" : "#d6d3d1",
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(250,250,249,0.95)",
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "500",
                        color: isDark ? "#fff" : "#1c1917",
                      }}
                    >
                      {layer.chordFrames.length === 0
                        ? t("layers.noFrame")
                        : t("layers.frameCount", { count: layer.chordFrames.length })}
                    </Text>
                    <ChevronIcon size={10} color={isDark ? "#6b7280" : "#a8a29e"} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Navigate to color page */}
              <View style={[styles.settingRow, { flexDirection: "row", alignItems: "center" }]}>
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
          )}

          {/* Step: Color picker */}
          {step === "color" && (
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
          )}

          {/* Step: Chips (custom layer notes/degrees) */}
          {step === "chips" && (
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
                fullWidth
              />
              <View style={styles.customChipsGrid}>
                {(layer.customMode === "note" ? notes : [...DEGREE_CHIPS]).map((item) => {
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
                <TouchableOpacity
                  disabled={overlaySemitones.size === 0}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (layer.customMode === "note") {
                      update({ selectedNotes: new Set(overlayNotes) });
                    } else {
                      update({
                        selectedDegrees: new Set(
                          DEGREE_BY_SEMITONE.filter((_, i) => overlaySemitones.has(i)),
                        ),
                      });
                    }
                  }}
                  style={[
                    styles.customActionBtn,
                    {
                      borderColor: isDark ? "#374151" : "#d6d3d1",
                      backgroundColor: isDark ? "#1f2937" : "#fafaf9",
                      opacity: overlaySemitones.size === 0 ? 0.35 : 1,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: isDark ? "#e5e7eb" : "#44403c",
                    }}
                  >
                    {t("layers.extractFromLayers")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
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
    borderRadius: 20,
    width: 300,
    padding: 20,
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
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  settings: {
    gap: 16,
  },
  settingRow: {
    gap: 6,
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
    justifyContent: "center",
  },
  cagedBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
