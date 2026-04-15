import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import type { Theme, LayerConfig } from "../../../types";
import type { LayerPreset } from "../../../hooks/useLayerPresets";
import BottomSheetModal, { SHEET_HANDLE_CLEARANCE } from "../../ui/BottomSheetModal";
import SheetProgressiveHeader from "../../ui/SheetProgressiveHeader";
import GlassIconButton from "../../ui/GlassIconButton";

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
  const { height: winHeight } = useWindowDimensions();
  const sheetHeight = Math.max(360, Math.min(520, Math.round(winHeight * 0.62)));
  const [name, setName] = useState("");

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed || layers.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(trimmed, layers);
    setName("");
  };

  const bg = isDark ? "#1f2937" : "#fff";
  const border = isDark ? "#374151" : "#e7e5e4";
  const textPrimary = isDark ? "#e5e7eb" : "#1c1917";
  const textSecondary = isDark ? "#9ca3af" : "#78716c";

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      {({ close, dragHandlers }) => (
        <View
          style={[styles.sheet, { height: sheetHeight, backgroundColor: bg, borderColor: border }]}
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
                label="✕"
                size={36}
                style={styles.headerLeft}
              />
              <View style={styles.headerCenter}>
                <Text style={[styles.title, { color: textPrimary }]}>{t("layers.presets")}</Text>
              </View>
              <View style={styles.headerRight} />
            </View>
          </SheetProgressiveHeader>

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
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      close();
                      requestAnimationFrame(() => onLoad(item.id));
                    }}
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
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onDelete(item.id);
                    }}
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
        </View>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingBottom: 32,
    overflow: "hidden",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  headerLeft: {
    width: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 4,
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
    maxHeight: 300,
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
