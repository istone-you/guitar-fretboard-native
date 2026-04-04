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
import { createDefaultLayer } from "../../types";
import { DropdownSelect } from "../ui/DropdownSelect";
import { buildScaleOptions } from "../ui/scaleOptions";
import {
  CHORD_CAGED_ORDER,
  DIATONIC_CHORDS,
  NOTES_FLAT,
  NOTES_SHARP,
  TRIAD_INVERSION_OPTIONS,
  getDiatonicChord,
  getRootIndex,
} from "../../logic/fretboard";

const COLOR_PRESETS = [
  "#ff4d4d",
  "#ff8c00",
  "#ffd700",
  "#84cc16",
  "#10b981",
  "#40e0d0",
  "#00bfff",
  "#0ea5e9",
  "#7c3aed",
  "#ff69b6",
];

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

  const [step, setStep] = useState<"type" | "settings">(initialLayer ? "settings" : "type");
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

  const handleTypeSelect = (type: LayerType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLayer = createDefaultLayer(type, layer.id, layer.color);
    setLayer(newLayer);
    onPreview?.(newLayer);
    setStep("settings");
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

  const fadeOut = (callback: () => void) => {
    Animated.timing(modalOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(
      () => {
        callback();
      },
    );
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
    { value: "caged", label: t("options.chordDisplayMode.caged") },
    { value: "triad", label: t("options.chordDisplayMode.triad") },
    { value: "diatonic", label: t("options.chordDisplayMode.diatonic") },
  ];
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
                    style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#fff" : "#1c1917" }}
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
                    style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#fff" : "#1c1917" }}
                  >
                    {t("layers.chord")}
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
                    const nextLayer = { ...createDefaultLayer(newType, layer.id, layer.color) };
                    setLayer(nextLayer);
                    onPreview?.(nextLayer);
                  }
                }}
                options={[
                  { value: "scale", label: t("layers.scale") },
                  { value: "chord", label: t("layers.chord") },
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
                  {layer.chordDisplayMode !== "power" && layer.chordDisplayMode !== "caged" && (
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

              {/* Color picker */}
              <View style={styles.settingRow}>
                <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#78716c" }]}>
                  {t("layerColors")}
                </Text>
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

              {/* Save button */}
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveBtn, { backgroundColor: isDark ? "#e5e7eb" : "#1c1917" }]}
                activeOpacity={0.8}
              >
                <Text
                  style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#1c1917" : "#fff" }}
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
});
