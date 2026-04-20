import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { TouchableOpacity } from "react-native";
import LayerList from "../index";
import type { Theme, LayerConfig } from "../../../types";
import { createDefaultLayer } from "../../../types";

jest.useFakeTimers();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
jest.mock("../../../i18n", () => ({ changeLocale: jest.fn() }));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Warning: "warning" },
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
let capturedModalProps: any = null;
jest.mock("../../LayerEditModal", () => {
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
  onPreviewLayer: jest.fn(),
  onReorderLayer: jest.fn(),
  previewLayer: null as LayerConfig | null,
  overlayNotes: [] as string[],
  overlaySemitones: new Set<number>(),
  layerNoteLabels: new Map<string, string[]>(),
  presetModalVisible: false,
  onPresetModalClose: jest.fn(),
  presets: [],
  onSavePreset: jest.fn(),
  loadPreset: jest.fn(),
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
 * Per filled row: [0] checkbox, [1] summaryTouchable (tap=edit / longPress=context)
 * Empty slot rows: [0] addButton
 */
function getRowCheckbox(root: ReturnType<typeof render>["UNSAFE_root"], rowIndex: number) {
  const allTouchables = root.findAllByType(TouchableOpacity);
  return allTouchables[rowIndex * 2];
}

function getSummaryTouchable(root: ReturnType<typeof render>["UNSAFE_root"], rowIndex: number) {
  const allTouchables = root.findAllByType(TouchableOpacity);
  return allTouchables[rowIndex * 2 + 1];
}

function getAddButton(root: ReturnType<typeof render>["UNSAFE_root"], layerCount: number) {
  const allTouchables = root.findAllByType(TouchableOpacity);
  return allTouchables[layerCount * 2];
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
  it("shows add buttons for empty slots", () => {
    const layers = [makeLayer("scale", "l1")];
    const { UNSAFE_root } = renderList({ layers });
    act(() => {
      jest.runAllTimers();
    });
    const allTouchables = UNSAFE_root.findAllByType(TouchableOpacity);
    // 1 filled row (2 buttons) + 2 empty slots (1 button each) = 4
    expect(allTouchables.length).toBe(4);
  });

  it("hides add buttons when layers = MAX_LAYERS", () => {
    const layers = [makeLayer("scale", "l1"), makeLayer("chord", "l2"), makeLayer("custom", "l3")];
    const { UNSAFE_root } = renderList({ layers });
    const allTouchables = UNSAFE_root.findAllByType(TouchableOpacity);
    // 3 filled rows × 2 buttons = 6
    expect(allTouchables.length).toBe(6);
  });

  // ── Checkbox toggle ────────────────────────────────────────────────
  it("checkbox calls onToggleLayer", () => {
    const layers = [makeLayer("scale", "l1")];
    const onToggleLayer = jest.fn();
    const { UNSAFE_root } = renderList({ layers, onToggleLayer });
    const checkbox = getRowCheckbox(UNSAFE_root, 0);
    fireEvent.press(checkbox);
    act(() => {
      jest.runAllTimers();
    });
    expect(onToggleLayer).toHaveBeenCalledWith("l1");
  });

  // ── Tap summary → edit modal ───────────────────────────────────────
  it("tapping summary opens edit modal", () => {
    const layers = [makeLayer("scale", "l1")];
    const { UNSAFE_root, queryByTestId } = renderList({ layers });
    expect(queryByTestId("edit-modal")).toBeNull();
    const summaryBtn = getSummaryTouchable(UNSAFE_root, 0);
    fireEvent.press(summaryBtn);
    act(() => {
      jest.runAllTimers();
    });
    expect(queryByTestId("edit-modal")).toBeTruthy();
  });

  // ── Long press → context menu ──────────────────────────────────────
  it("long press on summary shows context menu with delete option", () => {
    const layers = [makeLayer("scale", "l1")];
    const { UNSAFE_root, getByText } = renderList({ layers });
    const summaryBtn = getSummaryTouchable(UNSAFE_root, 0);
    fireEvent(summaryBtn, "longPress");
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("layers.delete")).toBeTruthy();
    expect(getByText("layers.duplicate")).toBeTruthy();
    expect(getByText("layers.edit")).toBeTruthy();
  });

  it("context menu delete calls onRemoveLayer", () => {
    const layers = [makeLayer("scale", "l1")];
    const onRemoveLayer = jest.fn();
    const { UNSAFE_root, getByText } = renderList({ layers, onRemoveLayer });
    const summaryBtn = getSummaryTouchable(UNSAFE_root, 0);
    fireEvent(summaryBtn, "longPress");
    act(() => {
      jest.runAllTimers();
    });
    const deleteBtn = getByText("layers.delete");
    fireEvent.press(deleteBtn);
    act(() => {
      jest.runAllTimers();
    });
    expect(onRemoveLayer).toHaveBeenCalledWith("l1");
  });

  it("context menu edit opens edit modal", () => {
    const layers = [makeLayer("scale", "l1")];
    const { UNSAFE_root, getByText, queryByTestId } = renderList({ layers });
    const summaryBtn = getSummaryTouchable(UNSAFE_root, 0);
    fireEvent(summaryBtn, "longPress");
    act(() => {
      jest.runAllTimers();
    });
    const editBtn = getByText("layers.edit");
    fireEvent.press(editBtn);
    act(() => {
      jest.runAllTimers();
    });
    expect(queryByTestId("edit-modal")).toBeTruthy();
  });

  it("context menu duplicate calls onAddLayer", () => {
    const layers = [makeLayer("scale", "l1")];
    const onAddLayer = jest.fn();
    const { UNSAFE_root, getByText } = renderList({ layers, onAddLayer });
    const summaryBtn = getSummaryTouchable(UNSAFE_root, 0);
    fireEvent(summaryBtn, "longPress");
    act(() => {
      jest.runAllTimers();
    });
    const dupeBtn = getByText("layers.duplicate");
    fireEvent.press(dupeBtn);
    act(() => {
      jest.runAllTimers();
    });
    expect(onAddLayer).toHaveBeenCalledTimes(1);
    expect(onAddLayer.mock.calls[0][0]).toMatchObject({ type: "scale" });
  });

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
    const { UNSAFE_root, getByText } = renderList({ layers, onAddLayer });
    const summaryBtn = getSummaryTouchable(UNSAFE_root, 0);
    fireEvent(summaryBtn, "longPress");
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.duplicate"));
    act(() => {
      jest.runAllTimers();
    });
    expect(onAddLayer).toHaveBeenCalledTimes(1);
    const clone = onAddLayer.mock.calls[0][0];
    expect(clone.id).not.toBe("l1");
    expect(clone.selectedNotes).toEqual(new Set(["C", "E"]));
    expect(clone.cagedForms).toEqual(new Set(["C", "A"]));
    expect(clone.hiddenCells).toEqual(new Set(["0-1"]));
    expect(clone.chordFrames).toEqual([{ cells: ["0-1", "1-2"] }]);
    expect(clone.selectedNotes).not.toBe(layers[0].selectedNotes);
    expect(clone.chordFrames).not.toBe(layers[0].chordFrames);
    expect(clone.chordFrames[0].cells).not.toBe(layers[0].chordFrames[0].cells);
  });

  // ── getSummary tests ────────────────────────────────────────────────
  it("getSummary for scale layer returns i18n key", () => {
    const layers = [makeLayer("scale", "l1", { scaleType: "major" })];
    const { getByText } = renderList({ layers });
    expect(getByText("options.scale.major")).toBeTruthy();
  });

  it("getSummary for chord form layer", () => {
    const layers = [makeLayer("chord", "l1", { chordDisplayMode: "form", chordType: "Major" })];
    const { getByText } = renderList({ layers });
    expect(getByText("options.chordDisplayMode.form: Major")).toBeTruthy();
  });

  it("getSummary for chord form layer with 5 type", () => {
    const layers = [makeLayer("chord", "l1", { chordDisplayMode: "form", chordType: "5" })];
    const { getByText } = renderList({ layers });
    expect(getByText("options.chordDisplayMode.form: 5")).toBeTruthy();
  });

  it("getSummary for caged layer type", () => {
    const layers = [makeLayer("caged", "l1", { cagedForms: new Set(["C", "A"]) })];
    const { getByText } = renderList({ layers });
    expect(getByText("options.diatonicKey.major: C, A")).toBeTruthy();
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
    const layers = [makeLayer("chord", "l1", { chordDisplayMode: "on-chord", onChordName: "C/E" })];
    const { getByText } = renderList({ layers });
    expect(getByText("options.chordDisplayMode.on-chord: C/E")).toBeTruthy();
  });

  it("getSummary for custom note layer", () => {
    const layers = [
      makeLayer("custom", "l1", { customMode: "note", selectedNotes: new Set(["C", "E", "G"]) }),
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

  // ── handleSave: update existing layer ──────────────────────────────
  it("handleSave calls onUpdateLayer for existing layer", () => {
    const layers = [makeLayer("scale", "l1")];
    const onUpdateLayer = jest.fn();
    const { UNSAFE_root } = renderList({ layers, onUpdateLayer });
    const summaryBtn = getSummaryTouchable(UNSAFE_root, 0);
    fireEvent.press(summaryBtn);
    act(() => {
      jest.runAllTimers();
    });
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
    const addBtn = getAddButton(UNSAFE_root, layers.length);
    fireEvent.press(addBtn);
    act(() => {
      jest.runAllTimers();
    });
    const newLayer = makeLayer("chord", "new-layer");
    act(() => {
      capturedModalProps.onSave(newLayer);
    });
    expect(onAddLayer).toHaveBeenCalledWith(newLayer, 1);
  });

  // ── pickNextLayerColor ─────────────────────────────────────────────
  it("pickNextLayerColor falls back when all default colors are used", () => {
    const twoLayers = [
      makeLayer("scale", "l1", { color: "#ff69b6" }),
      makeLayer("chord", "l2", { color: "#40e0d0" }),
    ];
    renderList({ layers: twoLayers });
    expect(capturedModalProps.defaultColor).toBe("#ffd700");
  });

  it("pickNextLayerColor skips used colors and picks first available", () => {
    const twoLayers = [
      makeLayer("scale", "l1", { color: "#ff69b6" }),
      makeLayer("chord", "l2", { color: "#7c3aed" }),
    ];
    renderList({ layers: twoLayers });
    expect(capturedModalProps.defaultColor).toBe("#40e0d0");
  });

  // ── Layer count animations ─────────────────────────────────────────
  it("adding a layer triggers appear animation", () => {
    const layers1 = [makeLayer("scale", "l1")];
    const { rerender } = renderList({ layers: layers1 });
    act(() => {
      jest.runAllTimers();
    });
    const layers2 = [makeLayer("scale", "l1"), makeLayer("chord", "l2")];
    rerender(
      <LayerList {...defaultProps} layers={layers2} slots={[layers2[0], layers2[1], null]} />,
    );
    act(() => {
      jest.runAllTimers();
    });
  });

  it("removing a layer triggers delete animation", () => {
    const layers2 = [makeLayer("scale", "l1"), makeLayer("chord", "l2")];
    const { rerender } = renderList({ layers: layers2 });
    act(() => {
      jest.runAllTimers();
    });
    const layers1 = [makeLayer("chord", "l2")];
    rerender(<LayerList {...defaultProps} layers={layers1} slots={[null, layers1[0], null]} />);
    act(() => {
      jest.runAllTimers();
    });
  });

  // ── LayerCheckbox animation ────────────────────────────────────────
  it("LayerCheckbox triggers animation when enabled changes", () => {
    const layers = [makeLayer("scale", "l1", { enabled: true })];
    const { rerender } = renderList({ layers });
    const updatedLayers = [makeLayer("scale", "l1", { enabled: false })];
    rerender(
      <LayerList {...defaultProps} layers={updatedLayers} slots={[updatedLayers[0], null, null]} />,
    );
    act(() => {
      jest.runAllTimers();
    });
    const enabledLayers = [makeLayer("scale", "l1", { enabled: true })];
    rerender(
      <LayerList {...defaultProps} layers={enabledLayers} slots={[enabledLayers[0], null, null]} />,
    );
    act(() => {
      jest.runAllTimers();
    });
  });

  // ── Disabled layer opacity ─────────────────────────────────────────
  it("disabled layer uses reduced opacity via interpolation", () => {
    const layers = [makeLayer("scale", "l1", { enabled: false })];
    const { UNSAFE_root } = renderList({ layers });
    const allTouchables = UNSAFE_root.findAllByType(TouchableOpacity);
    expect(allTouchables.length).toBeGreaterThan(0);
  });

  // ── Modal onClose resets preview ───────────────────────────────────
  it("modal onClose clears editModalVisible and preview", () => {
    const layers = [makeLayer("scale", "l1")];
    const onPreviewLayer = jest.fn();
    const { UNSAFE_root, queryByTestId } = renderList({ layers, onPreviewLayer });
    const summaryBtn = getSummaryTouchable(UNSAFE_root, 0);
    fireEvent.press(summaryBtn);
    act(() => {
      jest.runAllTimers();
    });
    expect(queryByTestId("edit-modal")).toBeTruthy();
    act(() => {
      capturedModalProps.onClose();
    });
    act(() => {
      jest.runAllTimers();
    });
    expect(queryByTestId("edit-modal")).toBeNull();
    expect(onPreviewLayer).toHaveBeenCalledWith(null);
  });

  // ── Add button from MAX_LAYERS to < MAX ────────────────────────────
  it("add button appears when going from MAX_LAYERS to fewer", () => {
    const layers3 = [makeLayer("scale", "l1"), makeLayer("chord", "l2"), makeLayer("custom", "l3")];
    const { rerender, UNSAFE_root } = renderList({ layers: layers3 });
    act(() => {
      jest.runAllTimers();
    });
    const layers2 = [makeLayer("scale", "l1"), makeLayer("chord", "l2")];
    rerender(
      <LayerList {...defaultProps} layers={layers2} slots={[layers2[0], layers2[1], null]} />,
    );
    act(() => {
      jest.runAllTimers();
    });
    const allTouchables = UNSAFE_root.findAllByType(TouchableOpacity);
    // 2 layers × 2 buttons + 1 add button = 5
    expect(allTouchables.length).toBe(5);
  });
});
