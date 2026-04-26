import { useRef, useState } from "react";
import {
  View,
  Animated,
  PanResponder,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import "../../i18n";
import SceneHeader from "../../components/AppHeader/SceneHeader";
import { getColors } from "../../themes/design";
import type { Theme, Accidental, BaseLabelMode, LayerConfig, ProgressionChord } from "../../types";
import type { CustomProgressionTemplate } from "../../hooks/useProgressionTemplates";
import FinderSelection from "./Selection";
import IdentifyPane from "./IdentifyPane";
import ChordBrowser from "./ChordBrowser";
import DiatonicBrowser from "./DiatonicBrowser";
import SubstitutionFinder from "./SubstitutionFinder";
import ChordSuggest from "./ChordSuggest";
import DominantMotion from "./DominantMotion";
import CapoFinder from "./CapoFinder";
import CommonNotesFinder from "./CommonNotesFinder";
import ModulationTargetBrowser from "./ModulationTargetBrowser";
import ModulationMeansFinder from "./ModulationMeansFinder";
import ModeBrowser from "./ModeBrowser";
import ProgressionAnalyzer from "./ProgressionAnalyzer";
import ScaleCompatibility from "./ScaleCompatibility";
import TensionAvoidFinder from "./TensionAvoidFinder";
import OnChordFinder from "./OnChordFinder";
import FinderCirclePage from "./CirclePage";
import DiatonicCirclePage from "./DiatonicBrowser/CirclePage";
import DominantMotionCirclePage from "./DominantMotion/CirclePage";
import type { FinderMode } from "./types";

type CircleSubPageType = "diatonic" | "dominant-motion";

interface CircleSubPage {
  type: CircleSubPageType;
  rootSemitone: number;
  keyType: "major" | "minor";
}

export interface FinderPaneProps {
  theme: Theme;
  accidental: Accidental;
  baseLabelMode: BaseLabelMode;
  fretRange: [number, number];
  rootNote: string;
  leftHanded?: boolean;
  layers: LayerConfig[];
  onAddLayerAndNavigate: (layer: LayerConfig) => void;
  onBaseLabelModeChange: (mode: BaseLabelMode) => void;
  onEnablePerLayerRoot?: () => void;
  onThemeChange: (theme: Theme) => void;
  onFretRangeChange: (range: [number, number]) => void;
  onAccidentalChange: (accidental: Accidental) => void;
  onLeftHandedChange: (value: boolean) => void;
  customTemplates: CustomProgressionTemplate[];
  onSaveTemplate: (name: string, chords: ProgressionChord[]) => string;
}

export default function FinderPane({
  theme,
  accidental,
  baseLabelMode,
  fretRange,
  rootNote,
  leftHanded,
  layers,
  onAddLayerAndNavigate,
  onBaseLabelModeChange,
  onEnablePerLayerRoot,
  onThemeChange,
  onFretRangeChange,
  onAccidentalChange,
  onLeftHandedChange,
  customTemplates,
  onSaveTemplate,
}: FinderPaneProps) {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const isDark = theme === "dark";
  const bgColor = getColors(isDark).pageBg;

  // ── ツールページのスライドナビ ──────────────────────────
  const [selectedMode, setSelectedMode] = useState<FinderMode | null>(null);
  // contentMode はコンテンツ描画専用。SVGが重い "circle" のみアニメーション完了後に更新してかくつきを防止
  const [contentMode, setContentMode] = useState<FinderMode | null>(null);
  const slideAnim = useRef(new Animated.Value(Dimensions.get("window").width)).current;
  const selectedModeRef = useRef(selectedMode);
  selectedModeRef.current = selectedMode;
  const handleBackRef = useRef(() => {});
  const selectionResetRef = useRef<(() => void) | null>(null);

  const handleNavigateTo = (mode: FinderMode, chords?: ProgressionChord[], noteKey?: string) => {
    if (mode === "progression-analysis") {
      handleOpenProgSub(chords, noteKey);
      return;
    }
    handleSelect(mode);
  };

  const handleSelect = (mode: FinderMode) => {
    setSelectedMode(mode);
    if (mode === "circle") {
      // SVG マウントをアニメーション完了後に遅らせてかくつきを防止
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setContentMode(mode);
        selectionResetRef.current?.();
      });
    } else {
      setContentMode(mode);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        selectionResetRef.current?.();
      });
    }
  };

  const handleBack = () => {
    Animated.timing(slideAnim, {
      toValue: screenWidth,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setSelectedMode(null);
      setContentMode(null);
    });
  };
  handleBackRef.current = handleBack;

  const swipePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        selectedModeRef.current !== null &&
        !circleSubActiveRef.current &&
        !progSubActiveRef.current &&
        g.dx > 10 &&
        Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (g.dx > 0) slideAnim.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > 80 || (g.dx > 30 && g.vx > 0.5)) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          handleBackRef.current();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 9,
            tension: 160,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 9,
          tension: 160,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  // ── コード進行分析サブページ（ツール内から開く）──────────────
  const [progSubActive, setProgSubActive] = useState(false);
  const [progSubContent, setProgSubContent] = useState<{
    chords?: ProgressionChord[];
    noteKey?: string;
  } | null>(null);
  const progSubAnim = useRef(new Animated.Value(Dimensions.get("window").width)).current;
  const progSubActiveRef = useRef(false);
  const progSubBackRef = useRef(() => {});

  const handleOpenProgSub = (chords?: ProgressionChord[], noteKey?: string) => {
    setProgSubContent({ chords, noteKey });
    setProgSubActive(true);
    progSubActiveRef.current = true;
    Animated.timing(progSubAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const handleProgSubBack = () => {
    Animated.timing(progSubAnim, {
      toValue: screenWidth,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setProgSubActive(false);
      progSubActiveRef.current = false;
      setProgSubContent(null);
    });
  };
  progSubBackRef.current = handleProgSubBack;

  const progSubPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        progSubActiveRef.current && g.dx > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (g.dx > 0) progSubAnim.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > 80 || (g.dx > 30 && g.vx > 0.5)) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          progSubBackRef.current();
        } else {
          Animated.spring(progSubAnim, {
            toValue: 0,
            friction: 9,
            tension: 160,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(progSubAnim, {
          toValue: 0,
          friction: 9,
          tension: 160,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  // ── 円グラフサブページ（ツール内から開く）──────────────────
  // circleSubActive: レイヤー表示制御（アニメーション中も true）
  // circleSubPage: コンテンツ制御（SVG マウントをアニメーション完了後に遅らせてかくつきを防止）
  const [circleSubActive, setCircleSubActive] = useState(false);
  const [circleSubPage, setCircleSubPage] = useState<CircleSubPage | null>(null);
  const circleSubAnim = useRef(new Animated.Value(Dimensions.get("window").width)).current;
  const circleSubActiveRef = useRef(false);
  const circleSubBackRef = useRef(() => {});

  const handleOpenCircle = (
    type: CircleSubPageType,
    rootSemitone: number,
    keyType: "major" | "minor",
  ) => {
    setCircleSubActive(true);
    circleSubActiveRef.current = true;
    Animated.timing(circleSubAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setCircleSubPage({ type, rootSemitone, keyType });
    });
  };

  const handleCircleSubBack = () => {
    Animated.timing(circleSubAnim, {
      toValue: screenWidth,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setCircleSubActive(false);
      circleSubActiveRef.current = false;
      setCircleSubPage(null);
    });
  };
  circleSubBackRef.current = handleCircleSubBack;

  const circleSubPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        circleSubActiveRef.current && g.dx > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (g.dx > 0) circleSubAnim.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > 80 || (g.dx > 30 && g.vx > 0.5)) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          circleSubBackRef.current();
        } else {
          Animated.spring(circleSubAnim, {
            toValue: 0,
            friction: 9,
            tension: 160,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(circleSubAnim, {
          toValue: 0,
          friction: 9,
          tension: 160,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  // SceneHeader の onBack: 進行分析サブページ → 元ツールへ戻る / 円サブページ → 元ツールへ戻る / ツール中 → ホームへ戻る
  const headerOnBack = progSubActive
    ? handleProgSubBack
    : circleSubActive
      ? handleCircleSubBack
      : selectedMode
        ? handleBack
        : undefined;

  return (
    <View style={styles.root}>
      <SceneHeader
        theme={theme}
        title={selectedMode ? undefined : t("tabs.finder")}
        accidental={accidental}
        fretRange={fretRange}
        leftHanded={leftHanded}
        onBack={headerOnBack}
        onThemeChange={onThemeChange}
        onFretRangeChange={onFretRangeChange}
        onAccidentalChange={onAccidentalChange}
        onLeftHandedChange={onLeftHandedChange}
      />
      <View style={styles.content}>
        <FinderSelection theme={theme} onSelect={handleSelect} resetDescRef={selectionResetRef} />
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: bgColor,
              transform: [{ translateX: slideAnim }],
              borderTopLeftRadius: 28,
              borderBottomLeftRadius: 28,
              overflow: "hidden",
              zIndex: 20,
            },
          ]}
          pointerEvents={selectedMode !== null ? "auto" : "none"}
          {...swipePanResponder.panHandlers}
        >
          {contentMode === "identify" ? (
            <IdentifyPane
              theme={theme}
              accidental={accidental}
              baseLabelMode={baseLabelMode}
              fretRange={fretRange}
              rootNote={rootNote}
              leftHanded={leftHanded}
              layers={layers}
              onAddLayerAndNavigate={onAddLayerAndNavigate}
              onBaseLabelModeChange={onBaseLabelModeChange}
            />
          ) : contentMode === "chord-list" ? (
            <ChordBrowser
              theme={theme}
              accidental={accidental}
              layers={layers}
              globalRootNote={rootNote}
              onAddLayerAndNavigate={onAddLayerAndNavigate}
              onEnablePerLayerRoot={onEnablePerLayerRoot}
            />
          ) : contentMode === "diatonic" ? (
            <DiatonicBrowser
              theme={theme}
              accidental={accidental}
              layers={layers}
              globalRootNote={rootNote}
              onAddLayerAndNavigate={onAddLayerAndNavigate}
              onEnablePerLayerRoot={onEnablePerLayerRoot}
              onOpenCircle={(r, k) => handleOpenCircle("diatonic", r, k)}
            />
          ) : contentMode === "substitution" ? (
            <SubstitutionFinder
              theme={theme}
              accidental={accidental}
              layers={layers}
              globalRootNote={rootNote}
              onAddLayerAndNavigate={onAddLayerAndNavigate}
              onEnablePerLayerRoot={onEnablePerLayerRoot}
            />
          ) : contentMode === "modes" ? (
            <ModeBrowser
              theme={theme}
              accidental={accidental}
              layers={layers}
              globalRootNote={rootNote}
              onAddLayerAndNavigate={onAddLayerAndNavigate}
              onEnablePerLayerRoot={onEnablePerLayerRoot}
            />
          ) : contentMode === "progression-analysis" ? (
            <ProgressionAnalyzer
              theme={theme}
              accidental={accidental}
              customTemplates={customTemplates}
              onSaveTemplate={onSaveTemplate}
            />
          ) : contentMode === "scale-compat" ? (
            <ScaleCompatibility
              theme={theme}
              accidental={accidental}
              layers={layers}
              globalRootNote={rootNote}
              onAddLayerAndNavigate={onAddLayerAndNavigate}
              onEnablePerLayerRoot={onEnablePerLayerRoot}
            />
          ) : contentMode === "tension-avoid" ? (
            <TensionAvoidFinder
              theme={theme}
              accidental={accidental}
              layers={layers}
              globalRootNote={rootNote}
              onAddLayerAndNavigate={onAddLayerAndNavigate}
              onEnablePerLayerRoot={onEnablePerLayerRoot}
            />
          ) : contentMode === "circle" ? (
            <FinderCirclePage
              theme={theme}
              accidental={accidental}
              layers={layers}
              globalRootNote={rootNote}
              onAddLayerAndNavigate={onAddLayerAndNavigate}
              onEnablePerLayerRoot={onEnablePerLayerRoot}
            />
          ) : contentMode === "chord-suggest" ? (
            <ChordSuggest theme={theme} accidental={accidental} />
          ) : contentMode === "dominant-motion" ? (
            <DominantMotion
              theme={theme}
              accidental={accidental}
              globalRootNote={rootNote}
              onNavigateTo={handleNavigateTo}
              onOpenCircle={(r, k) => handleOpenCircle("dominant-motion", r, k)}
            />
          ) : contentMode === "capo" ? (
            <CapoFinder
              theme={theme}
              accidental={accidental}
              layers={layers}
              onAddLayerAndNavigate={onAddLayerAndNavigate}
              onEnablePerLayerRoot={onEnablePerLayerRoot}
            />
          ) : contentMode === "common" ? (
            <CommonNotesFinder
              theme={theme}
              accidental={accidental}
              layers={layers}
              globalRootNote={rootNote}
              onAddLayerAndNavigate={onAddLayerAndNavigate}
              onEnablePerLayerRoot={onEnablePerLayerRoot}
            />
          ) : contentMode === "modulation-target" ? (
            <ModulationTargetBrowser
              theme={theme}
              accidental={accidental}
              layers={layers}
              globalRootNote={rootNote}
              onAddLayerAndNavigate={onAddLayerAndNavigate}
              onEnablePerLayerRoot={onEnablePerLayerRoot}
            />
          ) : contentMode === "modulation-means" ? (
            <ModulationMeansFinder
              theme={theme}
              accidental={accidental}
              layers={layers}
              globalRootNote={rootNote}
              onAddLayerAndNavigate={onAddLayerAndNavigate}
              onEnablePerLayerRoot={onEnablePerLayerRoot}
            />
          ) : contentMode === "on-chord" ? (
            <OnChordFinder
              theme={theme}
              accidental={accidental}
              layers={layers}
              globalRootNote={rootNote}
              onAddLayerAndNavigate={onAddLayerAndNavigate}
              onEnablePerLayerRoot={onEnablePerLayerRoot}
            />
          ) : null}
        </Animated.View>

        {/* ツール内から開く円グラフサブページ（コンテンツエリア全体を覆う） */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: bgColor,
              transform: [{ translateX: circleSubAnim }],
              borderTopLeftRadius: 28,
              borderBottomLeftRadius: 28,
              overflow: "hidden",
              zIndex: 30,
            },
          ]}
          pointerEvents={circleSubActive ? "auto" : "none"}
          {...circleSubPanResponder.panHandlers}
        >
          {circleSubPage?.type === "diatonic" ? (
            <DiatonicCirclePage
              theme={theme}
              accidental={accidental}
              layers={layers}
              globalRootNote={rootNote}
              onAddLayerAndNavigate={onAddLayerAndNavigate}
              onEnablePerLayerRoot={onEnablePerLayerRoot}
              rootSemitone={circleSubPage.rootSemitone}
              initialKeyType={circleSubPage.keyType}
            />
          ) : circleSubPage?.type === "dominant-motion" ? (
            <DominantMotionCirclePage
              theme={theme}
              accidental={accidental}
              layers={layers}
              globalRootNote={rootNote}
              onAddLayerAndNavigate={onAddLayerAndNavigate}
              onEnablePerLayerRoot={onEnablePerLayerRoot}
              rootSemitone={circleSubPage.rootSemitone}
              initialKeyType={circleSubPage.keyType}
            />
          ) : null}
        </Animated.View>

        {/* コード進行分析サブページ（circleSubPage の上に重ねる） */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: bgColor,
              transform: [{ translateX: progSubAnim }],
              borderTopLeftRadius: 28,
              borderBottomLeftRadius: 28,
              overflow: "hidden",
              zIndex: 35,
            },
          ]}
          pointerEvents={progSubActive ? "auto" : "none"}
          {...progSubPanResponder.panHandlers}
        >
          {progSubContent !== null && (
            <ProgressionAnalyzer
              theme={theme}
              accidental={accidental}
              initialChords={progSubContent.chords}
              initialNoteKey={progSubContent.noteKey}
              customTemplates={customTemplates}
              onSaveTemplate={onSaveTemplate}
            />
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
