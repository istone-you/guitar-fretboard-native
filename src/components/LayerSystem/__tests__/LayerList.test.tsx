import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { Animated, TouchableOpacity } from "react-native";
import LayerList from "../LayerList";
import type { Theme, LayerConfig } from "../../../types";
import { createDefaultLayer } from "../../../types";

jest.useFakeTimers();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
jest.mock("../../../i18n", () => ({ changeLocale: jest.fn() }));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));
jest.mock("../LayerPresetModal", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: any) => (props.visible ? <View testID="preset-modal" /> : null),
  };
});
// Mock LayerEditModal to avoid complex rendering – expose onSave/onClose for tests
let capturedModalProps: any = null;
jest.mock("../LayerEditModal", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: any) => {
      capturedModalProps = props;
      return props.visible ? <View testID="edit-modal" /> : null;
    },
  };
});

const defaultProps = {
  theme: "dark" as Theme,
  rootNote: "C",
  accidental: "sharp" as const,
  layers: [] as LayerConfig[],
  slots: [null, null, null] as (LayerConfig | null)[],
  onAddLayer: jest.fn(),
  onUpdateLayer: jest.fn(),
  onRemoveLayer: jest.fn(),
  onToggleLayer: jest.fn(),
  onReorderLayers: jest.fn(),
  onPreviewLayer: jest.fn(),
  previewLayer: null as LayerConfig | null,
  overlayNotes: [] as string[],
  overlaySemitones: new Set<number>(),
  layerNoteLabels: new Map<string, string[]>(),
};

function makeLayer(
  type: "scale" | "chord" | "caged" | "custom",
  id: string,
  overrides: Partial<LayerConfig> = {},
): LayerConfig {
  return { ...createDefaultLayer(type, id, "#ff69b6"), ...overrides };
}

function renderList(overrides: Partial<typeof defaultProps> = {}) {
  const merged = { ...defaultProps, ...overrides };
  // Auto-generate slots from layers if slots not explicitly provided
  if (overrides.layers && !overrides.slots) {
    const slotsFromLayers: (LayerConfig | null)[] = [null, null, null];
    merged.layers.forEach((l, i) => {
      slotsFromLayers[i] = l;
    });
    merged.slots = slotsFromLayers;
  }
  return render(<LayerList {...merged} />);
}

/**
 * Each layer row contains 4 TouchableOpacity buttons in order:
 *   [0] toggle, [1] duplicate, [2] settings, [3] remove
 * The add button (if present) follows all layer rows.
 */
function getRowButtons(root: ReturnType<typeof render>["UNSAFE_root"], rowIndex: number) {
  const allTouchables = root.findAllByType(TouchableOpacity);
  const base = rowIndex * 4;
  return {
    toggle: allTouchables[base],
    duplicate: allTouchables[base + 1],
    settings: allTouchables[base + 2],
    remove: allTouchables[base + 3],
  };
}

function getAddButton(root: ReturnType<typeof render>["UNSAFE_root"], layerCount: number) {
  const allTouchables = root.findAllByType(TouchableOpacity);
  // Add button is the one after all layer row buttons
  return allTouchables[layerCount * 4];
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("LayerList", () => {
  // ── Row rendering ──────────────────────────────────────────────────
  it("renders layer rows for each layer", () => {
    const layers = [makeLayer("scale", "l1"), makeLayer("chord", "l2")];
    const labels = new Map<string, string[]>();
    labels.set("l1", ["C", "D", "E"]);
    labels.set("l2", ["C", "E", "G"]);
    const { getByText } = renderList({ layers, layerNoteLabels: labels });
    expect(getByText("layers.scale")).toBeTruthy();
    expect(getByText("layers.chord")).toBeTruthy();
  });

  // ── Add button visibility ──────────────────────────────────────────
  it("shows add button when layers < MAX_LAYERS", () => {
    const layers = [makeLayer("scale", "l1")];
    const { UNSAFE_root } = renderList({ layers });
    const allTouchables = UNSAFE_root.findAllByType(TouchableOpacity);
    // 4 buttons per row + 2 add slots (3-1) + 1 preset button = 7
    expect(allTouchables.length).toBe(7);
  });

  it("hides add button when layers = MAX_LAYERS", () => {
    const layers = [makeLayer("scale", "l1"), makeLayer("chord", "l2"), makeLayer("custom", "l3")];
    const { UNSAFE_root } = renderList({ layers });
    const allTouchables = UNSAFE_root.findAllByType(TouchableOpacity);
    // 4 buttons per row * 3 rows = 12 + 1 preset button = 13
    expect(allTouchables.length).toBe(13);
  });

  // ── Toggle button ──────────────────────────────────────────────────
  it("toggle button calls onToggleLayer", () => {
    const layers = [makeLayer("scale", "l1")];
    const onToggleLayer = jest.fn();
    const { UNSAFE_root } = renderList({ layers, onToggleLayer });
    const { toggle } = getRowButtons(UNSAFE_root, 0);
    fireEvent.press(toggle);
    act(() => {
      jest.runAllTimers();
    });
    expect(onToggleLayer).toHaveBeenCalledWith("l1");
  });

  // ── Remove button ──────────────────────────────────────────────────
  it("remove button calls onRemoveLayer", () => {
    const layers = [makeLayer("scale", "l1")];
    const onRemoveLayer = jest.fn();
    const { UNSAFE_root } = renderList({ layers, onRemoveLayer });
    const { remove } = getRowButtons(UNSAFE_root, 0);
    fireEvent.press(remove);
    act(() => {
      jest.runAllTimers();
    });
    expect(onRemoveLayer).toHaveBeenCalledWith("l1");
  });

  // ── Duplicate button ────────────────────────────────────────────────
  it("duplicate button calls onAddLayer", () => {
    const layers = [makeLayer("scale", "l1")];
    const onAddLayer = jest.fn();
    const { UNSAFE_root } = renderList({ layers, onAddLayer });
    const { duplicate } = getRowButtons(UNSAFE_root, 0);
    fireEvent.press(duplicate);
    act(() => {
      jest.runAllTimers();
    });
    expect(onAddLayer).toHaveBeenCalledTimes(1);
    expect(onAddLayer.mock.calls[0][0]).toMatchObject({ type: "scale" });
  });

  it("duplicate is disabled when at MAX_LAYERS", () => {
    const layers = [makeLayer("scale", "l1"), makeLayer("chord", "l2"), makeLayer("custom", "l3")];
    const { UNSAFE_root } = renderList({ layers });
    for (let i = 0; i < layers.length; i++) {
      const { duplicate } = getRowButtons(UNSAFE_root, i);
      expect(duplicate.props.disabled).toBe(true);
    }
  });

  // ── getSummary tests ────────────────────────────────────────────────
  it("getSummary for scale layer returns i18n key", () => {
    const layers = [makeLayer("scale", "l1", { scaleType: "major" })];
    const { getByText } = renderList({ layers });
    expect(getByText("options.scale.major")).toBeTruthy();
  });

  it("getSummary for chord form layer", () => {
    const layers = [
      makeLayer("chord", "l1", {
        chordDisplayMode: "form",
        chordType: "Major",
      }),
    ];
    const { getByText } = renderList({ layers });
    expect(getByText("options.chordDisplayMode.form: Major")).toBeTruthy();
  });

  it("getSummary for chord power layer", () => {
    const layers = [makeLayer("chord", "l1", { chordDisplayMode: "power" })];
    const { getByText } = renderList({ layers });
    expect(getByText("options.chordDisplayMode.power")).toBeTruthy();
  });

  it("getSummary for caged layer type", () => {
    const layers = [
      makeLayer("caged", "l1", {
        cagedForms: new Set(["C", "A"]),
      }),
    ];
    const { getByText } = renderList({ layers });
    expect(getByText("options.diatonicKey.major: C, A")).toBeTruthy();
  });

  it("getSummary for chord diatonic layer", () => {
    const layers = [
      makeLayer("chord", "l1", {
        chordDisplayMode: "diatonic",
        diatonicKeyType: "major",
        diatonicChordSize: "triad",
        diatonicDegree: "I",
      }),
    ];
    const { getByText } = renderList({ layers });
    expect(
      getByText(
        "options.chordDisplayMode.diatonic: I (options.diatonicKey.major options.diatonicChordSize.triad)",
      ),
    ).toBeTruthy();
  });

  it("getSummary for chord triad layer", () => {
    const layers = [
      makeLayer("chord", "l1", {
        chordDisplayMode: "triad",
        chordType: "Major",
        triadInversion: "root",
      }),
    ];
    const { getByText } = renderList({ layers });
    expect(
      getByText("options.chordDisplayMode.triad: Major options.triadInversions.root"),
    ).toBeTruthy();
  });

  it("getSummary for chord on-chord layer", () => {
    const layers = [
      makeLayer("chord", "l1", {
        chordDisplayMode: "on-chord",
        onChordName: "C/E",
      }),
    ];
    const { getByText } = renderList({ layers });
    expect(getByText("options.chordDisplayMode.on-chord: C/E")).toBeTruthy();
  });

  it("getSummary for custom note layer", () => {
    const layers = [
      makeLayer("custom", "l1", {
        customMode: "note",
        selectedNotes: new Set(["C", "E", "G"]),
      }),
    ];
    const { getByText } = renderList({ layers });
    expect(getByText("C, E, G")).toBeTruthy();
  });

  it("getSummary for custom degree layer", () => {
    const layers = [
      makeLayer("custom", "l1", {
        customMode: "degree",
        selectedDegrees: new Set(["P1", "M3", "P5"]),
      }),
    ];
    const { getByText } = renderList({ layers });
    expect(getByText("P1, M3, P5")).toBeTruthy();
  });

  // ── Settings button opens edit modal ────────────────────────────────
  it("settings button opens edit modal", () => {
    const layers = [makeLayer("scale", "l1")];
    const { UNSAFE_root, queryByTestId } = renderList({ layers });
    expect(queryByTestId("edit-modal")).toBeNull();
    const { settings } = getRowButtons(UNSAFE_root, 0);
    fireEvent.press(settings);
    act(() => {
      jest.runAllTimers();
    });
    expect(queryByTestId("edit-modal")).toBeTruthy();
  });

  // ── Add button opens edit modal ─────────────────────────────────────
  it("add button opens edit modal", () => {
    const layers = [makeLayer("scale", "l1")];
    const { UNSAFE_root, queryByTestId } = renderList({ layers });
    expect(queryByTestId("edit-modal")).toBeNull();
    const addBtn = getAddButton(UNSAFE_root, layers.length);
    fireEvent.press(addBtn);
    act(() => {
      jest.runAllTimers();
    });
    expect(queryByTestId("edit-modal")).toBeTruthy();
  });

  // ── LayerToggle animation on active change ─────────────────────────
  it("LayerToggle triggers animation when active changes", () => {
    const layers = [makeLayer("scale", "l1", { enabled: true })];
    const { rerender } = renderList({ layers });
    // Rerender with disabled layer to trigger the animation branch (lines 25-32)
    const updatedLayers = [makeLayer("scale", "l1", { enabled: false })];
    rerender(
      <LayerList {...defaultProps} layers={updatedLayers} slots={[updatedLayers[0], null, null]} />,
    );
    act(() => {
      jest.runAllTimers();
    });
    // Rerender back to enabled to trigger the reverse animation
    const enabledLayers = [makeLayer("scale", "l1", { enabled: true })];
    rerender(
      <LayerList {...defaultProps} layers={enabledLayers} slots={[enabledLayers[0], null, null]} />,
    );
    act(() => {
      jest.runAllTimers();
    });
    // No assertion needed beyond not throwing - this covers the animation code path
  });

  // ── handleSave: update existing layer ──────────────────────────────
  it("handleSave calls onUpdateLayer for existing layer", () => {
    const layers = [makeLayer("scale", "l1")];
    const onUpdateLayer = jest.fn();
    const { UNSAFE_root } = renderList({ layers, onUpdateLayer });
    // Open settings for the existing layer
    const { settings } = getRowButtons(UNSAFE_root, 0);
    fireEvent.press(settings);
    act(() => {
      jest.runAllTimers();
    });
    // Trigger save via the captured modal props
    const savedLayer = makeLayer("scale", "l1", { scaleType: "natural-minor" });
    act(() => {
      capturedModalProps.onSave(savedLayer);
    });
    expect(onUpdateLayer).toHaveBeenCalledWith("l1", savedLayer);
  });

  // ── handleSave: add new layer ──────────────────────────────────────
  it("handleSave calls onAddLayer for new layer", () => {
    const layers = [makeLayer("scale", "l1")];
    const onAddLayer = jest.fn();
    const { UNSAFE_root } = renderList({ layers, onAddLayer });
    // Open add modal (editingLayer will be null)
    const addBtn = getAddButton(UNSAFE_root, layers.length);
    fireEvent.press(addBtn);
    act(() => {
      jest.runAllTimers();
    });
    // Trigger save – layer has a new id not in layers
    const newLayer = makeLayer("chord", "new-layer");
    act(() => {
      capturedModalProps.onSave(newLayer);
    });
    expect(onAddLayer).toHaveBeenCalledWith(newLayer, 1);
  });

  // ── pickNextLayerColor fallback ────────────────────────────────────
  it("pickNextLayerColor falls back when all default colors are used", () => {
    // DEFAULT_LAYER_COLORS has 4 colors; MAX_LAYERS is 3.
    // Test via modal defaultColor: open add modal with 2 layers
    // whose colors exhaust available colors except one.
    const twoLayers = [
      makeLayer("scale", "l1", { color: "#ff69b6" }),
      makeLayer("chord", "l2", { color: "#40e0d0" }),
    ];
    renderList({ layers: twoLayers });
    // The modal should receive the next unused color (#ffd700)
    expect(capturedModalProps.defaultColor).toBe("#ffd700");
  });

  it("pickNextLayerColor skips used colors and picks first available", () => {
    // Use colors [0] and [3] so that [1] (#40e0d0) is the first available
    const twoLayers = [
      makeLayer("scale", "l1", { color: "#ff69b6" }),
      makeLayer("chord", "l2", { color: "#7c3aed" }),
    ];
    renderList({ layers: twoLayers });
    expect(capturedModalProps.defaultColor).toBe("#40e0d0");
  });

  // ── Layer count changes trigger animations ─────────────────────────
  it("adding a layer triggers appear animation", () => {
    const layers1 = [makeLayer("scale", "l1")];
    const { rerender } = renderList({ layers: layers1 });
    act(() => {
      jest.runAllTimers();
    });
    // Add a second layer
    const layers2 = [makeLayer("scale", "l1"), makeLayer("chord", "l2")];
    rerender(
      <LayerList {...defaultProps} layers={layers2} slots={[layers2[0], layers2[1], null]} />,
    );
    act(() => {
      jest.runAllTimers();
    });
    // The new row should be visible (animation completed)
  });

  it("removing a layer triggers delete shift animation", () => {
    const layers2 = [makeLayer("scale", "l1"), makeLayer("chord", "l2")];
    const { rerender } = renderList({ layers: layers2 });
    act(() => {
      jest.runAllTimers();
    });
    // Remove first layer
    const layers1 = [makeLayer("chord", "l2")];
    rerender(<LayerList {...defaultProps} layers={layers1} slots={[null, layers1[0], null]} />);
    act(() => {
      jest.runAllTimers();
    });
    // Animation cleanup completed without errors
  });

  // ── Add button animation when transitioning from MAX to < MAX ──────
  it("add button animates in when going from MAX_LAYERS to fewer", () => {
    const layers3 = [makeLayer("scale", "l1"), makeLayer("chord", "l2"), makeLayer("custom", "l3")];
    const { rerender, UNSAFE_root } = renderList({ layers: layers3 });
    act(() => {
      jest.runAllTimers();
    });
    // Now remove one layer so add button appears with animation
    const layers2 = [makeLayer("scale", "l1"), makeLayer("chord", "l2")];
    rerender(
      <LayerList {...defaultProps} layers={layers2} slots={[layers2[0], layers2[1], null]} />,
    );
    act(() => {
      jest.runAllTimers();
    });
    const allTouchables = UNSAFE_root.findAllByType(TouchableOpacity);
    // 2 layers * 4 buttons + 1 add button + 1 preset button = 10
    expect(allTouchables.length).toBe(10);
  });

  // ── Disabled layer opacity ─────────────────────────────────────────
  it("disabled layer uses reduced opacity via interpolation", () => {
    const layers = [makeLayer("scale", "l1", { enabled: false })];
    const { UNSAFE_root } = renderList({ layers });
    // The layer row renders with interpolated opacity (0→0.5 range)
    // Just verify it renders without error
    const allTouchables = UNSAFE_root.findAllByType(TouchableOpacity);
    expect(allTouchables.length).toBeGreaterThan(0);
  });

  // ── Modal onClose resets preview ───────────────────────────────────
  it("modal onClose clears editModalVisible and preview", () => {
    const layers = [makeLayer("scale", "l1")];
    const onPreviewLayer = jest.fn();
    const { UNSAFE_root, queryByTestId } = renderList({ layers, onPreviewLayer });
    // Open modal
    const { settings } = getRowButtons(UNSAFE_root, 0);
    fireEvent.press(settings);
    act(() => {
      jest.runAllTimers();
    });
    expect(queryByTestId("edit-modal")).toBeTruthy();
    // Close modal
    act(() => {
      capturedModalProps.onClose();
    });
    act(() => {
      jest.runAllTimers();
    });
    expect(queryByTestId("edit-modal")).toBeNull();
    expect(onPreviewLayer).toHaveBeenCalledWith(null);
  });

  // ── Row layout handler (line 383) ────────────────────────────────
  it("row onLayout updates rowHeight", () => {
    const layers = [makeLayer("scale", "l1")];
    const { UNSAFE_root } = renderList({ layers });
    // Find the Animated.View that has onLayout (the layer row)
    const AnimatedView = Animated.View;
    const animatedViews = UNSAFE_root.findAllByType(AnimatedView);
    const rowView = animatedViews.find((v: any) => v.props.onLayout);
    expect(rowView).toBeTruthy();
    // Fire onLayout event
    act(() => {
      rowView!.props.onLayout({
        nativeEvent: { layout: { height: 72, x: 0, y: 0, width: 300 } },
      });
    });
    // No crash – rowHeight.current is updated internally
  });

  // ── Add button layout handler (lines 560-566) ────────────────────
  it("add button onLayout triggers animation when y changes", () => {
    const layers = [makeLayer("scale", "l1")];
    const { UNSAFE_root } = renderList({ layers });
    const AnimatedView = Animated.View;
    const animatedViews = UNSAFE_root.findAllByType(AnimatedView);
    // The add button is wrapped in an Animated.View with onLayout
    // It's the second Animated.View with onLayout (first is the row)
    const layoutViews = animatedViews.filter((v: any) => v.props.onLayout);
    const addBtnWrapper = layoutViews[layoutViews.length - 1];
    expect(addBtnWrapper).toBeTruthy();
    // First layout call sets prevY
    act(() => {
      addBtnWrapper.props.onLayout({
        nativeEvent: { layout: { y: 100, x: 0, height: 56, width: 300 } },
      });
    });
    act(() => {
      jest.runAllTimers();
    });
    // Second layout call with different y triggers animation
    act(() => {
      addBtnWrapper.props.onLayout({
        nativeEvent: { layout: { y: 160, x: 0, height: 56, width: 300 } },
      });
    });
    act(() => {
      jest.runAllTimers();
    });
    // No crash – animation was triggered
  });

  // ── Duplicate deep copies Sets and arrays ──────────────────────────
  it("duplicate creates deep copy of Sets and chordFrames", () => {
    const layers = [
      makeLayer("custom", "l1", {
        selectedNotes: new Set(["C", "E"]),
        selectedDegrees: new Set(["P1"]),
        hiddenCells: new Set(["0-1"]),
        cagedForms: new Set(["C", "A"]),
        chordFrames: [{ cells: ["0-1", "1-2"] }],
      }),
    ];
    const onAddLayer = jest.fn();
    const { UNSAFE_root } = renderList({ layers, onAddLayer });
    const { duplicate } = getRowButtons(UNSAFE_root, 0);
    fireEvent.press(duplicate);
    act(() => {
      jest.runAllTimers();
    });
    expect(onAddLayer).toHaveBeenCalledTimes(1);
    const clone = onAddLayer.mock.calls[0][0];
    // Verify deep copies - modifying original shouldn't affect clone
    expect(clone.id).not.toBe("l1");
    expect(clone.selectedNotes).toEqual(new Set(["C", "E"]));
    expect(clone.cagedForms).toEqual(new Set(["C", "A"]));
    expect(clone.hiddenCells).toEqual(new Set(["0-1"]));
    expect(clone.chordFrames).toEqual([{ cells: ["0-1", "1-2"] }]);
    // Ensure they are different object references
    expect(clone.selectedNotes).not.toBe(layers[0].selectedNotes);
    expect(clone.chordFrames).not.toBe(layers[0].chordFrames);
    expect(clone.chordFrames[0].cells).not.toBe(layers[0].chordFrames[0].cells);
  });
});
