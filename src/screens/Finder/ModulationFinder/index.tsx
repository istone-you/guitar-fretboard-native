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
import { getColors, BLACK, pickNextLayerColor } from "../../../themes/design";
import { getRootIndex, getNotesByAccidental } from "../../../lib/fretboard";
import {
  chordDisplayName,
  getChromaticMediants,
  getEnharmonicModulations,
  getModalModulations,
  getModulationMeans,
  type KeyType,
  type ChromaticMediantRelation,
} from "../../../lib/harmonyUtils";
import ChordDiagram, { getAllChordForms } from "../../../components/ui/ChordDiagram";
import NotePickerButton from "../../../components/ui/NotePickerButton";
import { SegmentedToggle } from "../../../components/ui/SegmentedToggle";
import FinderDetailSheet from "../../../components/ui/FinderDetailSheet";
import LayerDescription from "../../../components/LayerEditModal/LayerDescription";
import Icon from "../../../components/ui/Icon";

const RELATION_I18N: Record<ChromaticMediantRelation, string> = {
  M3up: "finder.modulation.relation.M3up",
  m3up: "finder.modulation.relation.m3up",
  M3down: "finder.modulation.relation.M3down",
  m3down: "finder.modulation.relation.m3down",
};

const MODE_I18N: Record<string, string> = {
  ionian: "options.scale.ionian",
  dorian: "options.scale.dorian",
  phrygian: "options.scale.phrygian",
  lydian: "options.scale.lydian",
  mixolydian: "options.scale.mixolydian",
  aeolian: "options.scale.aeolian",
  locrian: "options.scale.locrian",
};

interface ModulationFinderProps {
  theme: Theme;
  accidental: Accidental;
  layers: LayerConfig[];
  globalRootNote: string;
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onEnablePerLayerRoot?: () => void;
}

export default function ModulationFinder({
  theme,
  accidental,
  layers,
  globalRootNote,
  onAddLayerAndNavigate,
  onEnablePerLayerRoot,
}: ModulationFinderProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [mode, setMode] = useState<"explore" | "means">("explore");

  // Explore mode state
  const [rootNoteE, setRootNoteE] = useState("C");
  const [keyTypeE, setKeyTypeE] = useState<KeyType>("major");

  // Means mode state
  const [rootNoteA, setRootNoteA] = useState("C");
  const [keyTypeA, setKeyTypeA] = useState<KeyType>("major");
  const [rootNoteB, setRootNoteB] = useState("G");
  const [keyTypeB, setKeyTypeB] = useState<KeyType>("major");

  // Detail sheet for pivot chords
  const [pendingChord, setPendingChord] = useState<{
    rootIndex: number;
    chordType: ChordType;
    degreeA?: string;
    degreeB?: string;
  } | null>(null);

  const notes = getNotesByAccidental(accidental);
  const isFull = layers.length >= MAX_LAYERS;
  const borderColor = isDark ? colors.border : colors.border2;
  const formWidth = Math.floor((screenWidth - 32 - 8 * 2) / 3);

  const keyTypeOptions: { value: KeyType; label: string }[] = [
    { value: "major", label: "Major" },
    { value: "minor", label: "Minor" },
  ];

  const modeOptions = [
    { value: "explore" as const, label: t("finder.modulation.modeExplore") },
    { value: "means" as const, label: t("finder.modulation.modeMeans") },
  ];

  // Explore computations
  const rootIndexE = getRootIndex(rootNoteE);
  const chromaticMediants = useMemo(
    () => getChromaticMediants(rootIndexE, keyTypeE),
    [rootIndexE, keyTypeE],
  );
  const enharmonicMods = useMemo(
    () => getEnharmonicModulations(rootIndexE, keyTypeE),
    [rootIndexE, keyTypeE],
  );
  const modalMods = useMemo(
    () => getModalModulations(rootIndexE, keyTypeE),
    [rootIndexE, keyTypeE],
  );

  // Means computations
  const rootIndexA = getRootIndex(rootNoteA);
  const rootIndexB = getRootIndex(rootNoteB);
  const modulationMeans = useMemo(
    () => getModulationMeans(rootIndexA, keyTypeA, rootIndexB, keyTypeB),
    [rootIndexA, keyTypeA, rootIndexB, keyTypeB],
  );

  const pendingTmpLayer = useMemo(() => {
    if (!pendingChord) return null;
    const layer = createDefaultLayer("chord", "modulation-tmp", BLACK);
    layer.chordDisplayMode = "form";
    layer.chordType = pendingChord.chordType;
    return layer;
  }, [pendingChord]);

  const handleAdd = useCallback(
    (rootIndex: number, chordType: ChordType) => {
      if (isFull) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const color = pickNextLayerColor(layers);
      const layer = createDefaultLayer("chord", `layer-${Date.now()}`, color);
      layer.chordDisplayMode = "form";
      layer.chordType = chordType;
      const rootName = notes[rootIndex];
      if (rootName !== globalRootNote) {
        layer.layerRoot = rootName;
        onEnablePerLayerRoot?.();
      }
      onAddLayerAndNavigate(layer);
    },
    [isFull, layers, notes, globalRootNote, onAddLayerAndNavigate, onEnablePerLayerRoot],
  );

  const keyLabel = (root: string, kt: KeyType) => `${root} ${kt === "major" ? "Major" : "Minor"}`;
  const keyName = (rootIndex: number, kt: KeyType) =>
    `${notes[rootIndex]} ${kt === "major" ? "Major" : "Minor"}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      {/* Mode toggle */}
      <View style={[styles.keyRow, { borderBottomColor: borderColor }]}>
        <View style={styles.keyControls}>
          <SegmentedToggle
            theme={theme}
            value={mode}
            onChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode(v as "explore" | "means");
            }}
            options={modeOptions}
            size="compact"
            segmentWidth={80}
          />
        </View>
      </View>

      {mode === "explore" ? (
        <>
          {/* Key selector */}
          <View style={[styles.keyRow, { borderBottomColor: borderColor }]}>
            <View style={styles.keyControls}>
              <NotePickerButton
                theme={theme}
                accidental={accidental}
                value={rootNoteE}
                onChange={(note) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRootNoteE(note);
                }}
                label={t("header.key")}
                sheetTitle={t("header.key")}
              />
              <SegmentedToggle
                theme={theme}
                value={keyTypeE}
                onChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setKeyTypeE(v as KeyType);
                }}
                options={keyTypeOptions}
                size="compact"
                segmentWidth={60}
              />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Chromatic mediant section */}
            <View style={styles.sectionGroup}>
              <Text style={[styles.sectionHeader, { color: colors.textSubtle }]}>
                {t("finder.modulation.sectionChromatic")}
              </Text>
              {chromaticMediants.map((c, i) => (
                <View
                  key={i}
                  testID={`chromatic-${c.rootIndex}-${c.keyType}`}
                  style={[styles.chordRow, { borderColor, backgroundColor: colors.surface }]}
                >
                  <View style={styles.chordLeft}>
                    <Text style={[styles.chordName, { color: colors.textStrong }]}>
                      {keyName(c.rootIndex, c.keyType)}
                    </Text>
                    <Text style={[styles.chordDegree, { color: colors.textSubtle }]}>
                      {t(RELATION_I18N[c.relation])}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Enharmonic section */}
            <View style={styles.sectionGroup}>
              <Text style={[styles.sectionHeader, { color: colors.textSubtle }]}>
                {t("finder.modulation.sectionEnharmonic")}
              </Text>
              {enharmonicMods.map((e, i) => (
                <View
                  key={i}
                  testID={`enharmonic-${e.destRootIndex}`}
                  style={[styles.chordRow, { borderColor, backgroundColor: colors.surface }]}
                >
                  <View style={styles.chordLeft}>
                    <Text style={[styles.chordName, { color: colors.textStrong }]}>
                      {keyName(e.destRootIndex, e.destKeyType)}
                    </Text>
                    <Text style={[styles.chordDegree, { color: colors.textSubtle }]}>
                      {t("finder.modulation.viaChord", {
                        chord: `${notes[e.pivotRootIndex]}dim7`,
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Modal section */}
            <View style={styles.sectionGroup}>
              <Text style={[styles.sectionHeader, { color: colors.textSubtle }]}>
                {t("finder.modulation.sectionModal")}
              </Text>
              {modalMods.map((m, i) => (
                <View
                  key={i}
                  testID={`modal-${m.modeName}`}
                  style={[styles.chordRow, { borderColor, backgroundColor: colors.surface }]}
                >
                  <View style={styles.chordLeft}>
                    <Text style={[styles.chordName, { color: colors.textStrong }]}>
                      {`${notes[m.rootIndex]} ${t(MODE_I18N[m.modeName] ?? m.modeName)}`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      ) : (
        <>
          {/* Key A */}
          <View style={[styles.keyRow, { borderBottomColor: borderColor }]}>
            <Text style={[styles.keyLabel, { color: colors.textSubtle }]}>
              {t("finder.pivotChord.keyA")}
            </Text>
            <View style={styles.keyControls}>
              <NotePickerButton
                theme={theme}
                accidental={accidental}
                value={rootNoteA}
                onChange={(note) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRootNoteA(note);
                }}
                label={t("header.key")}
                sheetTitle={t("header.key")}
              />
              <SegmentedToggle
                theme={theme}
                value={keyTypeA}
                onChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setKeyTypeA(v as KeyType);
                }}
                options={keyTypeOptions}
                size="compact"
                segmentWidth={60}
              />
            </View>
          </View>

          {/* Key B */}
          <View style={[styles.keyRow, { borderBottomColor: borderColor }]}>
            <Text style={[styles.keyLabel, { color: colors.textSubtle }]}>
              {t("finder.pivotChord.keyB")}
            </Text>
            <View style={styles.keyControls}>
              <NotePickerButton
                theme={theme}
                accidental={accidental}
                value={rootNoteB}
                onChange={(note) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRootNoteB(note);
                }}
                label={t("header.key")}
                sheetTitle={t("header.key")}
              />
              <SegmentedToggle
                theme={theme}
                value={keyTypeB}
                onChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setKeyTypeB(v as KeyType);
                }}
                options={keyTypeOptions}
                size="compact"
                segmentWidth={60}
              />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Pivot chords section */}
            <View style={styles.sectionGroup}>
              <Text style={[styles.sectionHeader, { color: colors.textSubtle }]}>
                {t("finder.modulation.sectionPivot")}
              </Text>
              {modulationMeans.pivots.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
                  {t("finder.modulation.none")}
                </Text>
              ) : (
                modulationMeans.pivots.map((p) => (
                  <TouchableOpacity
                    key={`${p.rootIndex}-${p.chordType}`}
                    testID={`pivot-chip-${p.rootIndex}-${p.chordType}`}
                    style={[styles.chordRow, { borderColor, backgroundColor: colors.surface }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPendingChord({
                        rootIndex: p.rootIndex,
                        chordType: p.chordType,
                        degreeA: p.degreeLabelInA,
                        degreeB: p.degreeLabelInB,
                      });
                    }}
                  >
                    <View style={styles.chordLeft}>
                      <Text style={[styles.chordName, { color: colors.textStrong }]}>
                        {chordDisplayName(p.rootIndex, p.chordType, notes)}
                      </Text>
                      <Text style={[styles.chordDegree, { color: colors.textSubtle }]}>
                        {keyLabel(rootNoteA, keyTypeA)}: {p.degreeLabelInA} ·{" "}
                        {keyLabel(rootNoteB, keyTypeB)}: {p.degreeLabelInB}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={14} color={colors.textSubtle} />
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Enharmonic section */}
            <View style={styles.sectionGroup}>
              <Text style={[styles.sectionHeader, { color: colors.textSubtle }]}>
                {t("finder.modulation.sectionEnharmonic")}
              </Text>
              {modulationMeans.enharmonic.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
                  {t("finder.modulation.none")}
                </Text>
              ) : (
                modulationMeans.enharmonic.map((e, i) => (
                  <View
                    key={i}
                    style={[styles.chordRow, { borderColor, backgroundColor: colors.surface }]}
                  >
                    <View style={styles.chordLeft}>
                      <Text style={[styles.chordName, { color: colors.textStrong }]}>
                        {keyName(e.destRootIndex, e.destKeyType)}
                      </Text>
                      <Text style={[styles.chordDegree, { color: colors.textSubtle }]}>
                        {t("finder.modulation.viaChord", {
                          chord: `${notes[e.pivotRootIndex]}dim7`,
                        })}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Chromatic section */}
            <View style={styles.sectionGroup}>
              <Text style={[styles.sectionHeader, { color: colors.textSubtle }]}>
                {t("finder.modulation.sectionChromatic")}
              </Text>
              {modulationMeans.chromatic === null ? (
                <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
                  {t("finder.modulation.none")}
                </Text>
              ) : (
                <View style={[styles.chordRow, { borderColor, backgroundColor: colors.surface }]}>
                  <View style={styles.chordLeft}>
                    <Text style={[styles.chordName, { color: colors.textStrong }]}>
                      {t(RELATION_I18N[modulationMeans.chromatic.relation])}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Modal section */}
            <View style={styles.sectionGroup}>
              <Text style={[styles.sectionHeader, { color: colors.textSubtle }]}>
                {t("finder.modulation.sectionModal")}
              </Text>
              {modulationMeans.modal === null ? (
                <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
                  {t("finder.modulation.none")}
                </Text>
              ) : (
                <View style={[styles.chordRow, { borderColor, backgroundColor: colors.surface }]}>
                  <View style={styles.chordLeft}>
                    <Text style={[styles.chordName, { color: colors.textStrong }]}>
                      {t(
                        MODE_I18N[modulationMeans.modal.modeName] ?? modulationMeans.modal.modeName,
                      )}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          <FinderDetailSheet
            visible={pendingChord !== null}
            onClose={() => setPendingChord(null)}
            theme={theme}
            title={
              pendingChord
                ? chordDisplayName(pendingChord.rootIndex, pendingChord.chordType, notes)
                : ""
            }
            topContent={
              pendingChord ? (
                <View style={styles.badgeRow}>
                  {pendingChord.degreeA && (
                    <View style={[styles.badge, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.badgeLabel, { color: colors.textSubtle }]}>
                        {keyLabel(rootNoteA, keyTypeA)}: {pendingChord.degreeA}
                      </Text>
                    </View>
                  )}
                  {pendingChord.degreeB && (
                    <View style={[styles.badge, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.badgeLabel, { color: colors.textSubtle }]}>
                        {keyLabel(rootNoteB, keyTypeB)}: {pendingChord.degreeB}
                      </Text>
                    </View>
                  )}
                </View>
              ) : null
            }
            mediaContent={
              pendingChord &&
              getAllChordForms(pendingChord.rootIndex, pendingChord.chordType).length > 0 ? (
                <View style={styles.formsRow}>
                  {getAllChordForms(pendingChord.rootIndex, pendingChord.chordType).map(
                    (cells, fi) => (
                      <ChordDiagram
                        key={fi}
                        cells={cells}
                        rootIndex={pendingChord.rootIndex}
                        theme={theme}
                        width={formWidth}
                      />
                    ),
                  )}
                </View>
              ) : null
            }
            description={
              pendingTmpLayer ? (
                <LayerDescription theme={theme} layer={pendingTmpLayer} itemOnly />
              ) : null
            }
            isFull={isFull}
            onAddLayer={
              pendingChord
                ? () => handleAdd(pendingChord.rootIndex, pendingChord.chordType)
                : undefined
            }
          />
        </>
      )}
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  sectionGroup: {
    gap: 8,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  chordLeft: {
    flex: 1,
    gap: 2,
  },
  chordName: {
    fontSize: 14,
    fontWeight: "700",
  },
  chordDegree: {
    fontSize: 11,
    fontWeight: "500",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  formsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 16,
  },
});
