import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import "../../i18n";
import type { BaseLabelMode, Theme } from "../../types";

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
  onResetOrHighlightAll: () => void;
  onSetOverlayNoteHighlights: (notes: string[]) => void;
  onToggleOverlayNoteHighlight: (note: string) => void;
  onToggleDegree: (name: string) => void;
}

const DEGREE_CHIPS = [
  "P1", "m2", "M2", "m3", "M3", "P4", "b5", "P5", "m6", "M6", "m7", "M7",
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
  onResetOrHighlightAll,
  onSetOverlayNoteHighlights,
  onToggleOverlayNoteHighlight,
  onToggleDegree,
}: FretboardFooterProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const hasHighlightedNotes = highlightedOverlayNotes.size > 0;

  if (showQuiz) return <View style={{ height: 100 }} />;

  const renderChips = (items: string[], activeItems: Set<string>, onToggle: (v: string) => void) => (
    <View style={styles.chipsContainer}>
      {items.map((item) => {
        const active = activeItems.has(item);
        return (
          <TouchableOpacity
            key={item}
            onPress={() => onToggle(item)}
            style={[
              styles.chip,
              {
                borderColor: active
                  ? isDark ? "#0284c7" : "#0ea5e9"
                  : isDark ? "#374151" : "#d6d3d1",
                backgroundColor: active
                  ? isDark ? "#0284c7" : "#0ea5e9"
                  : isDark ? "#1f2937" : "#fafaf9",
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14, fontWeight: "500", color: active ? "#fff" : isDark ? "#e5e7eb" : "#44403c" }}>
              {item}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderActionButtons = (onFilter: () => void, onToggleAll: () => void, hasHighlights: boolean, autoFilterKey: string) => (
    <View style={styles.actionRow}>
      <TouchableOpacity
        onPress={onFilter}
        disabled={autoFilter}
        style={[styles.actionBtn, {
          borderColor: isDark ? "#4b5563" : "#d6d3d1",
          backgroundColor: isDark ? "#1f2937" : "#fff",
          opacity: autoFilter ? 0.4 : 1,
        }]}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 14, color: isDark ? "#d1d5db" : "#57534e" }}>
          {t(`${autoFilterKey}.filter`)}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onAutoFilterChange(!autoFilter)}
        style={[styles.actionBtn, {
          borderColor: autoFilter ? (isDark ? "#16a34a" : "#22c55e") : isDark ? "#4b5563" : "#d6d3d1",
          backgroundColor: autoFilter ? (isDark ? "rgba(22,163,74,0.15)" : "rgba(34,197,94,0.1)") : isDark ? "#1f2937" : "#fff",
        }]}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 14, color: autoFilter ? (isDark ? "#4ade80" : "#16a34a") : isDark ? "#d1d5db" : "#57534e" }}>
          {t(`${autoFilterKey}.autoFilter`)}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onToggleAll}
        style={[styles.actionBtn, { borderColor: isDark ? "#0284c7" : "#38bdf8", backgroundColor: isDark ? "#1f2937" : "#fff" }]}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 14, color: isDark ? "#38bdf8" : "#0284c7" }}>
          {hasHighlights ? t(`${autoFilterKey}.reset`) : t(`${autoFilterKey}.highlightAll`)}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {baseLabelMode === "note" && (
        <>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: isDark ? "#9ca3af" : "#78716c" }]}>
              {t("noteFilter.title")}
            </Text>
            {renderActionButtons(
              () => onSetOverlayNoteHighlights(overlayNotes),
              () => {
                if (hasHighlightedNotes) onAutoFilterChange(false);
                onSetOverlayNoteHighlights(hasHighlightedNotes ? [] : allNotes);
              },
              hasHighlightedNotes,
              "noteFilter",
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
            {renderActionButtons(
              onAutoFilter,
              onResetOrHighlightAll,
              highlightedDegrees.size > 0,
              "degreeFilter",
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
