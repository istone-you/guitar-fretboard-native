import { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder } from "react-native";
import { useTranslation } from "react-i18next";
import "../../i18n";
import type { BaseLabelMode, Theme } from "../../types";

// Chip with bounce animation on active change
function AnimatedChip({
  item,
  active,
  disabled,
  isDark,
  onPress,
  onLayout,
}: {
  item: string;
  active: boolean;
  disabled: boolean;
  isDark: boolean;
  onPress: () => void;
  onLayout?: (x: number, y: number, w: number, h: number) => void;
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
    <Animated.View
      style={{ transform: [{ scale }], opacity: disabled ? 0.6 : 1 }}
      onLayout={
        onLayout
          ? (e) => {
              const { x, y, width, height } = e.nativeEvent.layout;
              onLayout(x, y, width, height);
            }
          : undefined
      }
    >
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.chip,
          {
            borderColor: active ? (isDark ? "#0284c7" : "#0ea5e9") : isDark ? "#374151" : "#d6d3d1",
            backgroundColor: active
              ? isDark
                ? "#0284c7"
                : "#0ea5e9"
              : isDark
                ? "#1f2937"
                : "#fafaf9",
          },
        ]}
        activeOpacity={0.7}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: active ? "#fff" : isDark ? "#e5e7eb" : "#44403c",
          }}
        >
          {item}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Swipeable chip container
function SwipeableChips({
  items,
  activeItems,
  disabled,
  isDark,
  onToggle,
}: {
  items: string[];
  activeItems: Set<string>;
  disabled: boolean;
  isDark: boolean;
  onToggle: (item: string) => void;
}) {
  const chipLayouts = useRef<Record<string, { x: number; y: number; w: number; h: number }>>({});
  const containerOffset = useRef({ x: 0, y: 0 });
  const toggledDuringSwipe = useRef(new Set<string>());

  const findChipAt = (pageX: number, pageY: number): string | null => {
    const cx = pageX - containerOffset.current.x;
    const cy = pageY - containerOffset.current.y;
    for (const [item, rect] of Object.entries(chipLayouts.current)) {
      if (cx >= rect.x && cx <= rect.x + rect.w && cy >= rect.y && cy <= rect.y + rect.h) {
        return item;
      }
    }
    return null;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: (_, gs) => !disabled && Math.abs(gs.dx) > 5,
      onMoveShouldSetPanResponderCapture: (_, gs) => !disabled && Math.abs(gs.dx) > 10,
      onPanResponderGrant: (e) => {
        toggledDuringSwipe.current = new Set();
        const item = findChipAt(e.nativeEvent.pageX, e.nativeEvent.pageY);
        if (item && !toggledDuringSwipe.current.has(item)) {
          toggledDuringSwipe.current.add(item);
          onToggle(item);
        }
      },
      onPanResponderMove: (e) => {
        const item = findChipAt(e.nativeEvent.pageX, e.nativeEvent.pageY);
        if (item && !toggledDuringSwipe.current.has(item)) {
          toggledDuringSwipe.current.add(item);
          onToggle(item);
        }
      },
      onPanResponderRelease: () => {
        toggledDuringSwipe.current = new Set();
      },
    }),
  ).current;

  return (
    <View
      style={styles.chipsContainer}
      onLayout={(e) => {
        e.target.measureInWindow((x, y) => {
          containerOffset.current = { x, y };
        });
      }}
      {...panResponder.panHandlers}
    >
      {items.map((item) => (
        <AnimatedChip
          key={item}
          item={item}
          active={activeItems.has(item)}
          disabled={disabled}
          isDark={isDark}
          onPress={() => {
            if (!disabled) onToggle(item);
          }}
          onLayout={(x, y, w, h) => {
            chipLayouts.current[item] = { x, y, w, h };
          }}
        />
      ))}
    </View>
  );
}

interface FretboardFooterProps {
  theme: Theme;
  baseLabelMode: BaseLabelMode;
  showQuiz: boolean;
  allNotes: string[];
  overlayNotes: string[];
  highlightedOverlayNotes: Set<string>;
  highlightedDegrees: Set<string>;
  autoFilter: boolean;
  onAutoFilterChange: (value: boolean) => void;
  onAutoFilter: () => void;
  onReset: () => void;
  onSetOverlayNoteHighlights: (notes: string[]) => void;
  onToggleOverlayNoteHighlight: (note: string) => void;
  onToggleDegree: (name: string) => void;
}

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
] as const;

export default function FretboardFooter({
  theme,
  baseLabelMode,
  showQuiz,
  allNotes,
  overlayNotes,
  highlightedOverlayNotes,
  highlightedDegrees,
  autoFilter,
  onAutoFilterChange,
  onAutoFilter,
  onReset,
  onSetOverlayNoteHighlights,
  onToggleOverlayNoteHighlight,
  onToggleDegree,
}: FretboardFooterProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const hasHighlightedNotes = highlightedOverlayNotes.size > 0;

  if (showQuiz) return <View style={{ height: 100 }} />;

  const renderChips = (
    items: string[],
    activeItems: Set<string>,
    onToggle: (v: string) => void,
  ) => (
    <SwipeableChips
      items={items}
      activeItems={activeItems}
      disabled={autoFilter}
      isDark={isDark}
      onToggle={onToggle}
    />
  );

  const filterBtn = (onFilter: () => void, autoFilterKey: string) => (
    <TouchableOpacity
      onPress={() => {
        if (autoFilter) onAutoFilterChange(false);
        else onFilter();
      }}
      onLongPress={() => onAutoFilterChange(!autoFilter)}
      style={[
        styles.actionBtn,
        {
          borderColor: isDark ? "rgba(147,197,253,0.3)" : "rgba(59,130,246,0.25)",
          backgroundColor: isDark ? "rgba(59,130,246,0.08)" : "rgba(219,234,254,0.7)",
        },
        autoFilter && {
          backgroundColor: isDark ? "#0284c7" : "#0ea5e9",
          borderColor: isDark ? "#0284c7" : "#0ea5e9",
        },
      ]}
      activeOpacity={0.7}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: autoFilter ? "#fff" : isDark ? "#93c5fd" : "#3b82f6",
        }}
      >
        {t(`${autoFilterKey}.filter`)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {baseLabelMode === "note" && (
        <>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: isDark ? "#9ca3af" : "#78716c" }]}>
              {t("noteFilter.title")}
            </Text>
            {filterBtn(() => onSetOverlayNoteHighlights(overlayNotes), "noteFilter")}
            {hasHighlightedNotes && (
              <TouchableOpacity
                testID="reset-btn"
                onPress={() => {
                  onAutoFilterChange(false);
                  onSetOverlayNoteHighlights([]);
                }}
                style={[
                  styles.actionBtn,
                  {
                    borderColor: isDark ? "rgba(251,146,60,0.3)" : "rgba(249,115,22,0.25)",
                    backgroundColor: isDark ? "rgba(249,115,22,0.08)" : "rgba(255,237,213,0.7)",
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#fb923c" : "#ea580c" }}
                >
                  {t("noteFilter.reset")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {renderChips(allNotes, highlightedOverlayNotes, onToggleOverlayNoteHighlight)}
        </>
      )}

      {baseLabelMode === "degree" && (
        <>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: isDark ? "#9ca3af" : "#78716c" }]}>
              {t("degreeFilter.title")}
            </Text>
            {filterBtn(onAutoFilter, "degreeFilter")}
            {highlightedDegrees.size > 0 && (
              <TouchableOpacity
                testID="reset-btn"
                onPress={onReset}
                style={[
                  styles.actionBtn,
                  {
                    borderColor: isDark ? "rgba(251,146,60,0.3)" : "rgba(249,115,22,0.25)",
                    backgroundColor: isDark ? "rgba(249,115,22,0.08)" : "rgba(255,237,213,0.7)",
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#fb923c" : "#ea580c" }}
                >
                  {t("degreeFilter.reset")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {renderChips([...DEGREE_CHIPS], highlightedDegrees, onToggleDegree)}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 100,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  title: {
    fontSize: 15,
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
});
