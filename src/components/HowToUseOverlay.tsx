import { useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useTranslation } from "react-i18next";
import "../i18n";
import type { Theme } from "../types";

export interface ElementPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HowToUsePositions {
  rootStepper?: ElementPosition;
  labelToggle?: ElementPosition;
  fretboard?: ElementPosition;
  chipArea?: ElementPosition;
  filterBtn?: ElementPosition;
  colorPicker?: ElementPosition;
  layerToggle?: ElementPosition;
  layerTabRow?: ElementPosition;
  layerCard?: ElementPosition;
}

interface HowToUseOverlayProps {
  theme: Theme;
  positions: HowToUsePositions;
  onClose: () => void;
}

function cx(el: ElementPosition): number {
  return el.x + el.w / 2;
}

// Label that measures itself and centers on the given left position
function CenteredLabel({
  text,
  left,
  top,
  arrow,
  arrowAlign,
  arrowCount = 1,
}: {
  text: string;
  left: number;
  top: number;
  arrow?: "up" | "down";
  arrowAlign?: "left" | "center";
  arrowCount?: number;
}) {
  const [width, setWidth] = useState(0);
  const align = arrowAlign ?? "center";

  const arrows = Array.from({ length: arrowCount }, (_, i) => (
    <Text key={i} style={styles.arrow}>
      {arrow === "up" ? "↑" : "↓"}
    </Text>
  ));

  return (
    <View
      style={[styles.label, { left: Math.max(8, left - width / 2), top }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {arrow === "up" && (
        <View style={{ alignSelf: align === "left" ? "flex-start" : "center" }}>{arrows}</View>
      )}
      <Text style={styles.labelText}>{text}</Text>
      {arrow === "down" && (
        <View style={{ alignSelf: align === "left" ? "flex-start" : "center" }}>{arrows}</View>
      )}
    </View>
  );
}

export default function HowToUseOverlay({ theme, positions, onClose }: HowToUseOverlayProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const p = positions;

  return (
    <TouchableOpacity
      style={[styles.overlay, { backgroundColor: isDark ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.6)" }]}
      activeOpacity={1}
      onPress={onClose}
    >
      {p.rootStepper &&
        p.labelToggle &&
        (() => {
          const topY =
            Math.max(p.rootStepper.y + p.rootStepper.h, p.labelToggle.y + p.labelToggle.h) + 4;
          return (
            <>
              <CenteredLabel
                text={t("howToUseItems.changeRoot")}
                left={cx(p.rootStepper)}
                top={topY}
                arrow="up"
              />
              <CenteredLabel
                text={t("howToUseItems.switchLabels")}
                left={cx(p.labelToggle)}
                top={topY}
                arrow="up"
              />
            </>
          );
        })()}

      {p.fretboard && (
        <CenteredLabel
          text={t("howToUseItems.doubleTap")}
          left={cx(p.fretboard)}
          top={p.fretboard.y + p.fretboard.h / 2 - 12}
        />
      )}

      {/* Highlight toggle — centered on chip area */}
      {p.chipArea && (
        <CenteredLabel
          text={t("howToUseItems.highlightToggle")}
          left={cx(p.chipArea)}
          top={p.chipArea.y + p.chipArea.h / 2 - 12}
        />
      )}

      {/* Filter — above filter button */}
      {p.filterBtn && (
        <CenteredLabel
          text={t("howToUseItems.filterNotes")}
          left={cx(p.filterBtn)}
          top={p.filterBtn.y - 50}
          arrow="down"
        />
      )}

      {/* Layer card switch — below tab row */}
      {p.layerTabRow && (
        <CenteredLabel
          text={t("howToUseItems.layerCardSwitch")}
          left={cx(p.layerTabRow)}
          top={p.layerTabRow.y + p.layerTabRow.h}
        />
      )}

      {/* Toggle — centered on card */}
      {p.layerCard && (
        <CenteredLabel
          text={t("howToUseItems.togglePanel")}
          left={cx(p.layerCard)}
          top={p.layerCard.y + p.layerCard.h / 2 - 12}
        />
      )}

      <View style={styles.closeHint}>
        <Text style={styles.closeText}>{t("howToUseItems.tapToClose")}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  label: {
    position: "absolute",
    alignItems: "center",
  },
  headerLabelsRow: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  labelInline: {
    alignItems: "center",
  },
  labelText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    backgroundColor: "rgba(28,25,23,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: "hidden",
    textAlign: "center",
  },
  arrow: {
    color: "#9ca3af",
    fontSize: 18,
  },
  closeHint: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  closeText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
});
