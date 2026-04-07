import { Animated, StyleSheet, View } from "react-native";
import LayerList from "../LayerSystem/LayerList";
import BounceActionButton from "../ui/BounceActionButton";
import type { Accidental, LayerConfig, Theme } from "../../types";

interface MainPracticePaneProps {
  showQuiz: boolean;
  theme: Theme;
  rootNote: string;
  accidental: Accidental;
  layers: LayerConfig[];
  previewLayer: LayerConfig | null;
  overlayNotes: string[];
  overlaySemitones: Set<number>;
  layerNoteLabelsMap: Map<string, string[]>;
  reopenLayerId: string | null;
  isDark: boolean;
  t: (key: string) => string;
  cellEditUiVisible: boolean;
  cellEditAnim: Animated.Value;
  slots: (LayerConfig | null)[];
  onAddLayer: (layer: LayerConfig, slotIndex?: number) => void;
  onUpdateLayer: (id: string, layer: LayerConfig) => void;
  onRemoveLayer: (id: string) => void;
  onToggleLayer: (id: string) => void;
  onReorderLayers: (slots: (LayerConfig | null)[]) => void;
  onPreviewLayer: (layer: LayerConfig | null) => void;
  onStartCellEdit: (mode: "hide" | "frame", layerId: string, draftLayer?: LayerConfig) => void;
  onClearReopenLayerId: () => void;
  onLoadPreset: (layers: LayerConfig[]) => void;
  onCellEditCancel: () => void;
  onCellEditReset: () => void;
  onCellEditDone: () => void;
}

export default function MainPracticePane({
  showQuiz,
  theme,
  rootNote,
  accidental,
  layers,
  previewLayer,
  overlayNotes,
  overlaySemitones,
  layerNoteLabelsMap,
  reopenLayerId,
  isDark,
  t,
  cellEditUiVisible,
  cellEditAnim,
  onAddLayer,
  onUpdateLayer,
  onRemoveLayer,
  onToggleLayer,
  onReorderLayers,
  onPreviewLayer,
  onStartCellEdit,
  slots,
  onLoadPreset,
  onClearReopenLayerId,
  onCellEditCancel,
  onCellEditReset,
  onCellEditDone,
}: MainPracticePaneProps) {
  return (
    <>
      {showQuiz && <View style={{ height: 100 }} />}
      {!showQuiz && (
        <View>
          <LayerList
            theme={theme}
            rootNote={rootNote}
            accidental={accidental}
            layers={layers}
            slots={slots}
            onAddLayer={onAddLayer}
            onUpdateLayer={onUpdateLayer}
            onRemoveLayer={onRemoveLayer}
            onToggleLayer={onToggleLayer}
            onReorderLayers={onReorderLayers}
            onPreviewLayer={onPreviewLayer}
            previewLayer={previewLayer}
            overlayNotes={overlayNotes}
            overlaySemitones={overlaySemitones}
            layerNoteLabels={layerNoteLabelsMap}
            onStartCellEdit={onStartCellEdit}
            onLoadPreset={onLoadPreset}
            reopenLayerId={reopenLayerId}
            onClearReopenLayerId={onClearReopenLayerId}
          />
        </View>
      )}

      {cellEditUiVisible && (
        <Animated.View
          pointerEvents="auto"
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: "rgba(0,0,0,0.5)",
              opacity: cellEditAnim,
              zIndex: 5,
            },
          ]}
        />
      )}
      {cellEditUiVisible && (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            zIndex: 6,
            opacity: cellEditAnim,
            transform: [
              {
                translateY: cellEditAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
            ],
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 12,
              paddingVertical: 12,
              paddingHorizontal: 12,
            }}
          >
            <BounceActionButton
              label={t("layers.cancel")}
              onPress={onCellEditCancel}
              style={{
                minWidth: 104,
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isDark ? "#374151" : "#d6d3d1",
                backgroundColor: isDark ? "#111" : "#f5f5f4",
              }}
              textStyle={{
                fontSize: 15,
                fontWeight: "600",
                color: isDark ? "#e5e7eb" : "#1c1917",
              }}
            />
            <BounceActionButton
              label={t("layers.reset")}
              onPress={onCellEditReset}
              style={{
                minWidth: 104,
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isDark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.25)",
                backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "rgba(254,226,226,0.7)",
              }}
              textStyle={{
                fontSize: 15,
                fontWeight: "600",
                color: isDark ? "#f87171" : "#ef4444",
              }}
            />
            <BounceActionButton
              label={t("layers.confirm")}
              onPress={onCellEditDone}
              style={{
                minWidth: 104,
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: isDark ? "#e5e7eb" : "#1c1917",
              }}
              textStyle={{
                fontSize: 15,
                fontWeight: "600",
                color: isDark ? "#1c1917" : "#fff",
              }}
            />
          </View>
        </Animated.View>
      )}
    </>
  );
}
