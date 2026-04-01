import { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder } from "react-native";
import Svg, { Path } from "react-native-svg";
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

  const topRow = items.slice(0, 6);
  const bottomRow = items.slice(6);

  return (
    <View
      style={styles.chipsWrapper}
      onLayout={(e) => {
        e.target.measureInWindow((x, y) => {
          containerOffset.current = { x, y };
        });
      }}
      {...panResponder.panHandlers}
    >
      <View style={styles.chipsRow}>
        {topRow.map((item) => (
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
      <View style={styles.chipsRow}>
        {bottomRow.map((item) => (
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
  filterBtnRef?: React.RefObject<View | null>;
  chipAreaRef?: React.RefObject<View | null>;
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
  filterBtnRef,
  chipAreaRef,
}: FretboardFooterProps) {
  const isDark = theme === "dark";
  const hasHighlightedNotes = highlightedOverlayNotes.size > 0;

  if (showQuiz) return <View style={{ height: 100 }} />;

  const renderChips = (
    items: string[],
    activeItems: Set<string>,
    onToggle: (v: string) => void,
  ) => (
    <View ref={chipAreaRef as any}>
      <SwipeableChips
        items={items}
        activeItems={activeItems}
        disabled={autoFilter}
        isDark={isDark}
        onToggle={onToggle}
      />
    </View>
  );

  const filterBtnEl = (onFilter: () => void) => (
    <TouchableOpacity
      testID="filter-btn"
      ref={filterBtnRef as any}
      onPress={() => {
        if (autoFilter) onAutoFilterChange(false);
        else onFilter();
      }}
      onLongPress={() => onAutoFilterChange(!autoFilter)}
      style={[
        styles.iconBtn,
        autoFilter
          ? {
              borderColor: isDark ? "#0284c7" : "#0ea5e9",
              backgroundColor: isDark ? "#0284c7" : "#0ea5e9",
            }
          : {
              borderColor: isDark ? "rgba(255,255,255,0.10)" : "#e7e5e4",
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(250,250,249,0.95)",
            },
      ]}
      activeOpacity={0.7}
    >
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 4h18l-7 8.5V18l-4 2V12.5L3 4Z"
          stroke={autoFilter ? "#fff" : isDark ? "#9ca3af" : "#78716c"}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </Svg>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {baseLabelMode === "note" && (
        <>
          <View style={styles.titleRow}>
            {filterBtnEl(() => onSetOverlayNoteHighlights(overlayNotes))}
            <TouchableOpacity
              testID="reset-btn"
              onPress={() => {
                onAutoFilterChange(false);
                onSetOverlayNoteHighlights([]);
              }}
              disabled={!hasHighlightedNotes}
              style={[
                styles.iconBtn,
                hasHighlightedNotes
                  ? {
                      borderColor: isDark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.25)",
                      backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "rgba(254,226,226,0.7)",
                    }
                  : {
                      borderColor: isDark ? "rgba(255,255,255,0.10)" : "#e7e5e4",
                      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(250,250,249,0.95)",
                      opacity: 0.35,
                    },
              ]}
              activeOpacity={0.7}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6l12 12"
                  stroke={
                    hasHighlightedNotes
                      ? isDark
                        ? "#f87171"
                        : "#ef4444"
                      : isDark
                        ? "#9ca3af"
                        : "#78716c"
                  }
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>
          {renderChips(allNotes, highlightedOverlayNotes, onToggleOverlayNoteHighlight)}
        </>
      )}

      {baseLabelMode === "degree" && (
        <>
          <View style={styles.titleRow}>
            {filterBtnEl(onAutoFilter)}
            <TouchableOpacity
              testID="reset-btn"
              onPress={onReset}
              disabled={highlightedDegrees.size === 0}
              style={[
                styles.iconBtn,
                highlightedDegrees.size > 0
                  ? {
                      borderColor: isDark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.25)",
                      backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "rgba(254,226,226,0.7)",
                    }
                  : {
                      borderColor: isDark ? "rgba(255,255,255,0.10)" : "#e7e5e4",
                      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(250,250,249,0.95)",
                      opacity: 0.35,
                    },
              ]}
              activeOpacity={0.7}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6l12 12"
                  stroke={
                    highlightedDegrees.size > 0
                      ? isDark
                        ? "#f87171"
                        : "#ef4444"
                      : isDark
                        ? "#9ca3af"
                        : "#78716c"
                  }
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>
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
  iconBtn: {
    borderWidth: 1,
    borderRadius: 999,
    width: 34,
    height: 34,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  chipsWrapper: {
    gap: 8,
  },
  chipsRow: {
    flexDirection: "row",
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
