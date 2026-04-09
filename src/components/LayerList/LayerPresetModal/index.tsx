import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import type { Theme, LayerConfig } from "../../../types";
import type { LayerPreset } from "../../../hooks/useLayerPresets";

interface LayerPresetModalProps {
  theme: Theme;
  visible: boolean;
  layers: LayerConfig[];
  presets: LayerPreset[];
  onSave: (name: string, layers: LayerConfig[]) => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  t: (key: string) => string;
}

export default function LayerPresetModal({
  theme,
  visible,
  layers,
  presets,
  onSave,
  onLoad,
  onDelete,
  onClose,
  t,
}: LayerPresetModalProps) {
  const isDark = theme === "dark";
  const [name, setName] = useState("");
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;

  const handleShow = () => {
    modalOpacity.setValue(0);
    modalScale.setValue(0.9);
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(modalScale, {
        toValue: 1,
        friction: 8,
        tension: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fadeOut = (cb: () => void) => {
    Animated.timing(modalOpacity, {
      toValue: 0,
      duration: 120,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(cb);
  };

  const handleClose = () => fadeOut(onClose);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed || layers.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(trimmed, layers);
    setName("");
  };

  const handleLoad = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fadeOut(() => {
      onClose();
      requestAnimationFrame(() => onLoad(id));
    });
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDelete(id);
  };

  const bg = isDark ? "#1f2937" : "#fff";
  const border = isDark ? "#374151" : "#e7e5e4";
  const textPrimary = isDark ? "#e5e7eb" : "#1c1917";
  const textSecondary = isDark ? "#9ca3af" : "#78716c";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onShow={handleShow}
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />
        <Animated.View
          style={[
            styles.modal,
            {
              backgroundColor: bg,
              borderColor: border,
              opacity: modalOpacity,
              transform: [{ scale: modalScale }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: textPrimary }]}>{t("layers.presets")}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6l12 12"
                  stroke={textSecondary}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Save section */}
          <View style={[styles.saveRow, { borderColor: border }]}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#111827" : "#f5f5f4",
                  color: textPrimary,
                  borderColor: border,
                },
              ]}
              placeholder={t("layers.presetName")}
              placeholderTextColor={textSecondary}
              value={name}
              onChangeText={setName}
              maxLength={30}
            />
            <TouchableOpacity
              onPress={handleSave}
              disabled={!name.trim() || layers.length === 0}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: isDark ? "#e5e7eb" : "#1c1917",
                  opacity: !name.trim() || layers.length === 0 ? 0.35 : 1,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.saveBtnText, { color: isDark ? "#1c1917" : "#fff" }]}>
                {t("layers.savePreset")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Preset list */}
          {presets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                {t("layers.noPresets")}
              </Text>
            </View>
          ) : (
            <FlatList
              data={presets}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => (
                <View style={[styles.presetRow, { borderColor: border }]}>
                  <TouchableOpacity
                    style={styles.presetInfo}
                    onPress={() => handleLoad(item.id)}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.presetName, { color: textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.presetMeta, { color: textSecondary }]}>
                      {item.layers.length} {t("layers.layerCount")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={styles.deleteBtn}
                    activeOpacity={0.7}
                    hitSlop={8}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M18 6L6 18M6 6l12 12"
                        stroke={isDark ? "#6b7280" : "#a8a29e"}
                        strokeWidth={2.2}
                        strokeLinecap="round"
                      />
                    </Svg>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modal: {
    width: "100%",
    maxWidth: 360,
    maxHeight: "70%",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  input: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  saveBtn: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    flexGrow: 0,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  presetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  presetInfo: {
    flex: 1,
    gap: 2,
  },
  presetName: {
    fontSize: 15,
    fontWeight: "500",
  },
  presetMeta: {
    fontSize: 12,
  },
  deleteBtn: {
    padding: 8,
  },
});
