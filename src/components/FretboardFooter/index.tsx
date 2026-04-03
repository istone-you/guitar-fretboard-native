import { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder } from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import type { BaseLabelMode, Theme } from "../../types";

// Chip with bounce animation on active change
function AnimatedChip({
  item,
  active,
  disabled,
  isDark,
  onPress,
  chipRef,
  groupKey,
}: {
  item: string;
  active: boolean;
  disabled: boolean;
  isDark: boolean;
  onPress: () => void;
  chipRef?: (ref: View | null) => void;
  groupKey?: string;
}) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const mounted = useRef(false);
  const prevActive = useRef(active);
  const prevGroupKey = useRef(groupKey);

  if (!mounted.current) {
    mounted.current = true;
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  } else if (prevActive.current !== active || prevGroupKey.current !== groupKey) {
    prevActive.current = active;
    prevGroupKey.current = groupKey;
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
    <Animated.View ref={chipRef} style={{ transform: [{ scale }], opacity: disabled ? 0.6 : 1 }}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.chip,
          {
            borderColor: active ? (isDark ? "#e5e7eb" : "#1c1917") : isDark ? "#374151" : "#d6d3d1",
            backgroundColor: active
              ? isDark
                ? "#e5e7eb"
                : "#1c1917"
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
            color: active ? (isDark ? "#1c1917" : "#fff") : isDark ? "#e5e7eb" : "#44403c",
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
  groupKey,
}: {
  items: string[];
  activeItems: Set<string>;
  disabled: boolean;
  isDark: boolean;
  onToggle: (item: string) => void;
  groupKey?: string;
}) {
  const chipRefs = useRef<Record<string, View | null>>({});
  const toggledDuringSwipe = useRef(new Set<string>());

  const findChipAt = (pageX: number, pageY: number): Promise<string | null> => {
    const entries = Object.entries(chipRefs.current).filter(([, ref]) => ref != null);
    return new Promise((resolve) => {
      let remaining = entries.length;
      if (remaining === 0) {
        resolve(null);
        return;
      }
      let found: string | null = null;
      for (const [item, ref] of entries) {
        ref!.measureInWindow((x, y, w, h) => {
          if (!found && pageX >= x && pageX <= x + w && pageY >= y && pageY <= y + h) {
            found = item;
          }
          remaining--;
          if (remaining === 0) resolve(found);
        });
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        !disabled && (Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5),
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        !disabled && (Math.abs(gs.dx) > 10 || Math.abs(gs.dy) > 10),
      onPanResponderGrant: (e) => {
        toggledDuringSwipe.current = new Set();
        findChipAt(e.nativeEvent.pageX, e.nativeEvent.pageY).then((item) => {
          if (item && !toggledDuringSwipe.current.has(item)) {
            toggledDuringSwipe.current.add(item);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle(item);
          }
        });
      },
      onPanResponderMove: (e) => {
        findChipAt(e.nativeEvent.pageX, e.nativeEvent.pageY).then((item) => {
          if (item && !toggledDuringSwipe.current.has(item)) {
            toggledDuringSwipe.current.add(item);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle(item);
          }
        });
      },
      onPanResponderRelease: () => {
        toggledDuringSwipe.current = new Set();
      },
    }),
  ).current;

  const topRow = items.slice(0, 6);
  const bottomRow = items.slice(6);

  return (
    <View style={styles.chipsWrapper} {...panResponder.panHandlers}>
      <View style={styles.chipsRow}>
        {topRow.map((item) => (
          <AnimatedChip
            key={item}
            item={item}
            active={activeItems.has(item)}
            disabled={disabled}
            isDark={isDark}
            groupKey={groupKey}
            onPress={() => {
              if (!disabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(item);
              }
            }}
            chipRef={(ref) => {
              chipRefs.current[item] = ref;
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
            groupKey={groupKey}
            onPress={() => {
              if (!disabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(item);
              }
            }}
            chipRef={(ref) => {
              chipRefs.current[item] = ref;
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
    groupKey?: string,
  ) => (
    <View ref={chipAreaRef as any}>
      <SwipeableChips
        items={items}
        activeItems={activeItems}
        disabled={autoFilter}
        isDark={isDark}
        groupKey={groupKey}
        onToggle={onToggle}
      />
    </View>
  );

  const filterBtnEl = (onFilter: () => void) => (
    <TouchableOpacity
      testID="filter-btn"
      ref={filterBtnRef as any}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (autoFilter) onAutoFilterChange(false);
        else onFilter();
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onAutoFilterChange(!autoFilter);
      }}
      style={[
        styles.iconBtn,
        autoFilter
          ? {
              borderColor: isDark ? "#e5e7eb" : "#1c1917",
              backgroundColor: isDark ? "#e5e7eb" : "#1c1917",
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
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
          {renderChips(
            allNotes,
            highlightedOverlayNotes,
            onToggleOverlayNoteHighlight,
            allNotes[0],
          )}
        </>
      )}

      {baseLabelMode === "degree" && (
        <>
          <View style={styles.titleRow}>
            {filterBtnEl(onAutoFilter)}
            <TouchableOpacity
              testID="reset-btn"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onReset();
              }}
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
