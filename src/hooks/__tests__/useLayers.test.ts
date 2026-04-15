import { renderHook, act } from "@testing-library/react-native";
import { useLayers } from "../useLayers";
import type { LayerConfig } from "../../types";

function makeLayer(overrides: Partial<LayerConfig> = {}): LayerConfig {
  return {
    id: "layer-1",
    type: "scale",
    scaleType: "major",
    color: "#ff0000",
    enabled: true,
    chordDisplayMode: "form",
    chordType: "Major",
    diatonicKeyType: "major",
    diatonicDegree: "I",
    diatonicChordSize: "triad",
    triadInversion: "root",
    cagedForms: new Set(),
    cagedChordType: "major",
    onChordName: "C/E",
    customMode: "note",
    selectedNotes: new Set(),
    selectedDegrees: new Set(),
    hiddenCells: new Set(),
    chordFrames: [],
    ...overrides,
  };
}

describe("useLayers", () => {
  it("initializes with 3 null slots and no layers", () => {
    const { result } = renderHook(() => useLayers());
    expect(result.current.slots).toEqual([null, null, null]);
    expect(result.current.layers).toEqual([]);
  });

  it("initializes with null previewLayer", () => {
    const { result } = renderHook(() => useLayers());
    expect(result.current.previewLayer).toBeNull();
  });

  it("handleAddLayer fills the first empty slot", () => {
    const { result } = renderHook(() => useLayers());
    const layer = makeLayer({ id: "a" });

    act(() => {
      result.current.handleAddLayer(layer);
    });

    expect(result.current.slots[0]).toEqual(layer);
    expect(result.current.slots[1]).toBeNull();
    expect(result.current.slots[2]).toBeNull();
    expect(result.current.layers).toHaveLength(1);
  });

  it("handleAddLayer with slotIndex places layer in the specified slot", () => {
    const { result } = renderHook(() => useLayers());
    const layer = makeLayer({ id: "b" });

    act(() => {
      result.current.handleAddLayer(layer, 2);
    });

    expect(result.current.slots[0]).toBeNull();
    expect(result.current.slots[1]).toBeNull();
    expect(result.current.slots[2]).toEqual(layer);
  });

  it("handleAddLayer does not overflow beyond 3 slots", () => {
    const { result } = renderHook(() => useLayers());

    act(() => {
      result.current.handleAddLayer(makeLayer({ id: "1" }));
      result.current.handleAddLayer(makeLayer({ id: "2" }));
      result.current.handleAddLayer(makeLayer({ id: "3" }));
      result.current.handleAddLayer(makeLayer({ id: "4" })); // should be no-op
    });

    expect(result.current.layers).toHaveLength(3);
  });

  it("handleUpdateLayer replaces matching layer by id", () => {
    const { result } = renderHook(() => useLayers());
    const original = makeLayer({ id: "x", color: "#aaa" });

    act(() => {
      result.current.handleAddLayer(original);
    });
    act(() => {
      result.current.handleUpdateLayer("x", makeLayer({ id: "x", color: "#bbb" }));
    });

    expect(result.current.slots[0]?.color).toBe("#bbb");
  });

  it("handleRemoveLayer sets matching slot to null", () => {
    const { result } = renderHook(() => useLayers());

    act(() => {
      result.current.handleAddLayer(makeLayer({ id: "del" }));
    });
    expect(result.current.layers).toHaveLength(1);

    act(() => {
      result.current.handleRemoveLayer("del");
    });
    expect(result.current.layers).toHaveLength(0);
    expect(result.current.slots[0]).toBeNull();
  });

  it("handleToggleLayer flips the enabled flag", () => {
    const { result } = renderHook(() => useLayers());

    act(() => {
      result.current.handleAddLayer(makeLayer({ id: "t", enabled: true }));
    });
    act(() => {
      result.current.handleToggleLayer("t");
    });
    expect(result.current.slots[0]?.enabled).toBe(false);

    act(() => {
      result.current.handleToggleLayer("t");
    });
    expect(result.current.slots[0]?.enabled).toBe(true);
  });

  it("handleLoadPreset fills slots from preset array", () => {
    const { result } = renderHook(() => useLayers());
    const preset = [makeLayer({ id: "p1" }), makeLayer({ id: "p2" })];

    act(() => {
      result.current.handleLoadPreset(preset);
    });

    expect(result.current.slots[0]?.id).toBe("p1");
    expect(result.current.slots[1]?.id).toBe("p2");
    expect(result.current.slots[2]).toBeNull();
  });

  it("handleLoadPreset clears previous layers", () => {
    const { result } = renderHook(() => useLayers());

    act(() => {
      result.current.handleAddLayer(makeLayer({ id: "old" }));
    });
    act(() => {
      result.current.handleLoadPreset([makeLayer({ id: "new" })]);
    });

    expect(result.current.layers.map((l) => l.id)).toEqual(["new"]);
  });

  it("setPreviewLayer updates the previewLayer", () => {
    const { result } = renderHook(() => useLayers());
    const layer = makeLayer({ id: "preview" });

    act(() => {
      result.current.setPreviewLayer(layer);
    });
    expect(result.current.previewLayer?.id).toBe("preview");

    act(() => {
      result.current.setPreviewLayer(null);
    });
    expect(result.current.previewLayer).toBeNull();
  });

  it("layers array contains only non-null slots", () => {
    const { result } = renderHook(() => useLayers());

    act(() => {
      result.current.handleAddLayer(makeLayer({ id: "x" }), 0);
      result.current.handleAddLayer(makeLayer({ id: "y" }), 2);
    });

    expect(result.current.layers).toHaveLength(2);
    expect(result.current.layers.map((l) => l.id)).toEqual(["x", "y"]);
  });
});
