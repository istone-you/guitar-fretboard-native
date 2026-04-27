import { View, StyleSheet, Animated, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { useRef, useCallback } from "react";
import "../../i18n";
import type { Accidental, BaseLabelMode, Theme } from "../../types";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { getColors, TOOLTIP_COLORS, fontSize, radius } from "../../themes/design";
import PillButton from "../ui/PillButton";
import Icon from "../ui/Icon";
import NotePickerButton from "../ui/NotePickerButton";

interface FretboardControlsProps {
  theme: Theme;
  rootNote: string;
  accidental: Accidental;
  baseLabelMode: BaseLabelMode;
  onRootNoteChange: (note: string) => void;
  onBaseLabelModeChange: (mode: BaseLabelMode) => void;
  onPresetPress?: () => void;
  perLayerRoot?: boolean;
  onPerLayerRootChange?: (value: boolean) => void;
}

export default function FretboardControls({
  theme,
  rootNote,
  accidental,
  baseLabelMode,
  onRootNoteChange,
  onBaseLabelModeChange,
  onPresetPress,
  perLayerRoot,
  onPerLayerRootChange,
}: FretboardControlsProps) {
  const { t, i18n } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);

  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = useCallback(() => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    Animated.timing(tooltipOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
    tooltipTimer.current = setTimeout(() => {
      Animated.timing(tooltipOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 2500);
  }, [tooltipOpacity]);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View>
          <SegmentedToggle
            theme={theme}
            value={baseLabelMode}
            onChange={onBaseLabelModeChange}
            options={[
              { value: "note" as BaseLabelMode, label: t("header.note") },
              { value: "degree" as BaseLabelMode, label: t("header.degree") },
            ]}
            size="compact"
            segmentWidth={i18n.language === "en" ? 72 : 56}
            enabled={!perLayerRoot}
          />
          {perLayerRoot && (
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                showTooltip();
              }}
              activeOpacity={1}
            />
          )}
          <Animated.View style={[styles.tooltip, { opacity: tooltipOpacity }]} pointerEvents="none">
            <Text style={styles.tooltipText}>{t("header.degreeUnavailable")}</Text>
          </Animated.View>
        </View>
      </View>

      <View style={styles.right}>
        <NotePickerButton
          theme={theme}
          accidental={accidental}
          value={rootNote}
          onChange={onRootNoteChange}
          label={t("header.root")}
          sheetTitle={t("header.root")}
          perLayerRoot={perLayerRoot}
          onPerLayerRootChange={onPerLayerRootChange}
          disabled={perLayerRoot}
        />

        {onPresetPress && (
          <PillButton
            isDark={isDark}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPresetPress();
            }}
          >
            <Icon name="bookmark" size={16} color={colors.textSubtle} />
          </PillButton>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tooltip: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: 6,
    backgroundColor: TOOLTIP_COLORS.bg,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 100,
  },
  tooltipText: {
    color: TOOLTIP_COLORS.text,
    fontSize: fontSize.xs,
  },
});
