import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../../i18n";
import type { Accidental, Theme, LayerConfig, ChordType } from "../../../types";
import { createDefaultLayer, MAX_LAYERS } from "../../../types";
import {
  getColors,
  DIATONIC_FUNCTION_COLORS,
  pickNextLayerColor,
  BLACK,
} from "../../../themes/design";
import { getRootIndex, getNotesByAccidental } from "../../../lib/fretboard";
import {
  getSecondaryDominants,
  chordDisplayName,
  type KeyType,
  type SecondaryDominantEntry,
} from "../../../lib/harmonyUtils";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import FinderDetailSheet from "../../../components/ui/FinderDetailSheet";
import LayerDescription from "../../../components/LayerEditModal/LayerDescription";
import PillButton from "../../../components/ui/PillButton";
import Icon from "../../../components/ui/Icon";
interface SecondaryDominantFinderProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
  onOpenCircle: (rootSemitone: number, keyType: "major" | "minor") => void;
}

export default function SecondaryDominantFinder({
  theme,
  accidental,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
  onOpenCircle,
}: SecondaryDominantFinderProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  type TappedRole = "secDom" | "target";
  const [keyRoot, setKeyRoot] = useState("C");
  const [keyType, setKeyType] = useState<KeyType>("major");
  const [pending, setPending] = useState<{
    entry: SecondaryDominantEntry;
    role: TappedRole;
  } | null>(null);

  const notes = getNotesByAccidental(accidental);
  const borderColor = isDark ? colors.border : colors.border2;
  const formWidth = Math.floor((screenWidth - 32 - 8) / 2);

  const keyTypeOptions: { value: KeyType; label: string }[] = [
    { value: "major", label: "Major" },
    { value: "minor", label: "Minor" },
  ];

  // タップされたコードの情報（ルート, chordType, 役割ラベル, 度数）
  const detail = useMemo(() => {
    if (!pending) return null;
    const { entry, role } = pending;
    if (role === "secDom") {
      return {
        rootIndex: entry.secDomRootIndex,
        chordType: "7th" as ChordType,
        roleLabel: t("finder.secondaryDominant.secDom"),
        degree: `V/${entry.targetDegree}`,
        roleColor: DIATONIC_FUNCTION_COLORS.D,
      };
    }
    return {
      rootIndex: entry.targetRootIndex,
      chordType: entry.targetChordType,
      roleLabel: t("finder.secondaryDominant.target"),
      degree: entry.targetDegree,
      roleColor: colors.textSubtle,
    };
  }, [pending, t, colors.textSubtle]);

  const tmpLayer = useMemo(() => {
    const layer = createDefaultLayer("chord", "sd-tmp", BLACK);
    layer.chordDisplayMode = "form";
    layer.chordType = detail?.chordType ?? "7th";
    return layer;
  }, [detail?.chordType]);

  const keyRootIndex = getRootIndex(keyRoot);
  const isFull = layers.length >= MAX_LAYERS;

  const handleAdd = useCallback(() => {
    if (!detail || isFull) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const color = pickNextLayerColor(layers);
    const layer = createDefaultLayer("chord", `layer-${Date.now()}`, color);
    layer.chordDisplayMode = "form";
    layer.chordType = detail.chordType;
    if (notes[detail.rootIndex] !== globalRootNote) {
      layer.layerRoot = notes[detail.rootIndex];
      onEnablePerLayerRoot?.();
    }
    onAddLayerAndNavigate(layer);
    setPending(null);
  }, [detail, isFull, layers, notes, globalRootNote, onAddLayerAndNavigate, onEnablePerLayerRoot]);

  const entries = useMemo(
    () => getSecondaryDominants(keyRootIndex, keyType),
    [keyRootIndex, keyType],
  );

  const handleOpenCircle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpenCircle(keyRootIndex, keyType);
  }, [keyRootIndex, keyType, onOpenCircle]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      {/* Key picker row */}
      <View style={[styles.keyRow, { borderBottomColor: borderColor }]}>
        <Text style={[styles.keyLabel, { color: colors.textSubtle }]}>{t("templates.key")}</Text>
        <View style={styles.keyControls}>
          <NotePickerButton
            theme={theme}
            accidental={accidental}
            value={keyRoot}
            onChange={(note) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setKeyRoot(note);
            }}
            label={t("header.key")}
            sheetTitle={t("header.key")}
          />
          <SegmentedToggle
            theme={theme}
            value={keyType}
            onChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setKeyType(v as KeyType);
            }}
            options={keyTypeOptions}
            size="compact"
            segmentWidth={60}
          />
        </View>
      </View>

      <View
        style={[
          styles.reflectRow,
          { borderBottomColor: borderColor, borderBottomWidth: StyleSheet.hairlineWidth },
        ]}
      >
        <PillButton isDark={isDark} onPress={handleOpenCircle}>
          <Text style={[styles.reflectLabel, { color: colors.textStrong }]}>
            {t("finder.viewOnCircle")}
          </Text>
        </PillButton>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
            {t("finder.pivotChord.none")}
          </Text>
        ) : (
          <>
            {/* Column headers */}
            <View style={styles.headerRow}>
              <Text style={[styles.headerLabel, { color: colors.textSubtle }]}>
                {t("finder.secondaryDominant.target")}
              </Text>
              <Text style={[styles.headerLabel, { color: DIATONIC_FUNCTION_COLORS.D }]}>
                {t("finder.secondaryDominant.secDom")}
              </Text>
            </View>

            {entries.map((entry) => {
              const targetName = chordDisplayName(
                entry.targetRootIndex,
                entry.targetChordType,
                notes,
              );
              const secDomName = chordDisplayName(entry.secDomRootIndex, "7th", notes);
              const openDetail = (role: TappedRole) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPending({ entry, role });
              };

              return (
                <View
                  key={`${entry.targetDegree}`}
                  testID={`sec-dom-row-${entry.targetDegree}`}
                  style={styles.row}
                >
                  {/* Target chord card */}
                  <TouchableOpacity
                    style={[styles.card, { borderColor, backgroundColor: colors.surface }]}
                    activeOpacity={0.7}
                    onPress={() => openDetail("target")}
                    testID={`sec-dom-cell-target-${entry.targetDegree}`}
                  >
                    <Text style={[styles.chordName, { color: colors.textStrong }]}>
                      {targetName}
                    </Text>
                    <Text style={[styles.degreeLabel, { color: colors.textSubtle }]}>
                      {entry.targetDegree}
                    </Text>
                  </TouchableOpacity>

                  <Icon name="chevron-right" size={14} color={colors.textSubtle} />

                  {/* Secondary dominant card */}
                  <TouchableOpacity
                    style={[styles.card, { borderColor, backgroundColor: colors.surface }]}
                    activeOpacity={0.7}
                    onPress={() => openDetail("secDom")}
                    testID={`sec-dom-cell-secDom-${entry.targetDegree}`}
                  >
                    <Text style={[styles.chordName, { color: colors.textStrong }]}>
                      {secDomName}
                    </Text>
                    <Text style={[styles.degreeLabel, { color: DIATONIC_FUNCTION_COLORS.D }]}>
                      {`V/${entry.targetDegree}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <FinderDetailSheet
        visible={pending !== null}
        onClose={() => setPending(null)}
        theme={theme}
        title={detail ? chordDisplayName(detail.rootIndex, detail.chordType, notes) : ""}
        subtitle={detail ? `${detail.roleLabel} (${detail.degree})` : ""}
        mediaContent={
          detail ? (
            <View style={styles.formsRow}>
              {getAllChordForms(detail.rootIndex, detail.chordType)
                .slice(0, 3)
                .map((cells, fi) => (
                  <ChordDiagram
                    key={fi}
                    cells={cells}
                    rootIndex={detail.rootIndex}
                    theme={theme}
                    width={formWidth}
                  />
                ))}
            </View>
          ) : null
        }
        description={
          detail ? (
            <>
              {pending && pending.role !== "target" ? (
                <>
                  <Text style={[styles.functionLabel, { color: colors.textStrong }]}>
                    {detail.roleLabel}
                  </Text>
                  <Text style={[styles.functionDesc, { color: colors.textSubtle }]}>
                    {t("finder.secondaryDominant.secDomDesc")}
                  </Text>
                </>
              ) : null}
              <LayerDescription theme={theme} layer={tmpLayer} itemOnly />
            </>
          ) : null
        }
        isFull={isFull}
        onAddLayer={handleAdd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  keyRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  keyLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  keyControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  reflectLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  reflectRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  scrollContent: {
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  headerLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  card: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  chordName: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  degreeLabel: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
  formsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  functionLabel: {
    fontSize: 13,
    fontWeight: "600",
    paddingTop: 12,
  },
  functionDesc: {
    fontSize: 13,
    lineHeight: 20,
    paddingTop: 4,
  },
});
