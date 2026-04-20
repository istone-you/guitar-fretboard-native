import { renderHook, act } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLayerPresets } from "../useLayerPresets";
import type { LayerConfig } from "../../types";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

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
    cagedForms: new Set(["C"]),
    cagedChordType: "major",
    onChordName: "C/E",
    customMode: "note",
    selectedNotes: new Set(["C", "E"]),
    selectedDegrees: new Set(["1"]),
    hiddenCells: new Set(),
    chordFrames: [],
    ...overrides,
  };
}

describe("useLayerPresets", () => {
  let mockTime: number;

  beforeEach(() => {
    mockTime = 1000;
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockImplementation(() => mockTime++);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("starts with empty presets", () => {
    const { result } = renderHook(() => useLayerPresets());
    expect(result.current.presets).toEqual([]);
  });

  it("savePreset adds a preset to the list", () => {
    const { result } = renderHook(() => useLayerPresets());

    act(() => {
      result.current.savePreset("My Preset", [makeLayer()]);
    });

    expect(result.current.presets).toHaveLength(1);
    expect(result.current.presets[0].name).toBe("My Preset");
  });

  it("savePreset assigns an id and createdAt", () => {
    const { result } = renderHook(() => useLayerPresets());

    act(() => {
      result.current.savePreset("Test", [makeLayer()]);
    });

    expect(result.current.presets[0].id).toMatch(/^preset-/);
    expect(typeof result.current.presets[0].createdAt).toBe("number");
  });

  it("savePreset calls AsyncStorage.setItem with the key", () => {
    const { result } = renderHook(() => useLayerPresets());

    act(() => {
      result.current.savePreset("Test", [makeLayer()]);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith("guiter:layer-presets", expect.any(String));
  });

  it("savePreset serializes Set fields to arrays", () => {
    const { result } = renderHook(() => useLayerPresets());
    const layer = makeLayer({ cagedForms: new Set(["C", "A"]), selectedNotes: new Set(["C"]) });

    act(() => {
      result.current.savePreset("Test", [layer]);
    });

    const stored = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
    expect(Array.isArray(stored[0].layers[0].cagedForms)).toBe(true);
    expect(Array.isArray(stored[0].layers[0].selectedNotes)).toBe(true);
    expect(Array.isArray(stored[0].layers[0].selectedDegrees)).toBe(true);
    expect(Array.isArray(stored[0].layers[0].hiddenCells)).toBe(true);
  });

  it("savePreset prepends the newest preset", () => {
    const { result } = renderHook(() => useLayerPresets());

    act(() => {
      result.current.savePreset("First", [makeLayer()]);
    });
    act(() => {
      result.current.savePreset("Second", [makeLayer()]);
    });

    expect(result.current.presets[0].name).toBe("Second");
    expect(result.current.presets[1].name).toBe("First");
  });

  it("loadPreset returns null for unknown id", () => {
    const { result } = renderHook(() => useLayerPresets());
    expect(result.current.loadPreset("nonexistent")).toBeNull();
  });

  it("loadPreset returns deserialized layers for a saved preset", () => {
    const { result } = renderHook(() => useLayerPresets());
    const layer = makeLayer({ cagedForms: new Set(["G"]), selectedNotes: new Set(["G", "B"]) });

    act(() => {
      result.current.savePreset("Test", [layer]);
    });

    const id = result.current.presets[0].id;
    const loaded = result.current.loadPreset(id);

    expect(loaded).not.toBeNull();
    expect(loaded![0].cagedForms).toBeInstanceOf(Set);
    expect(loaded![0].selectedNotes).toBeInstanceOf(Set);
    expect(loaded![0].selectedNotes.has("G")).toBe(true);
    expect(loaded![0].selectedNotes.has("B")).toBe(true);
  });

  it("loadPreset assigns a new id to each layer", () => {
    const { result } = renderHook(() => useLayerPresets());

    act(() => {
      result.current.savePreset("Test", [makeLayer({ id: "original" })]);
    });

    const id = result.current.presets[0].id;
    const loaded = result.current.loadPreset(id);

    expect(loaded![0].id).not.toBe("original");
    expect(loaded![0].id).toMatch(/^layer-/);
  });

  it("loadPreset restores cagedChordType defaulting to major", () => {
    const { result } = renderHook(() => useLayerPresets());

    act(() => {
      result.current.savePreset("Test", [makeLayer()]);
    });

    const id = result.current.presets[0].id;
    const loaded = result.current.loadPreset(id);
    expect(loaded![0].cagedChordType).toBe("major");
  });

  it("deletePreset removes the matching preset", () => {
    const { result } = renderHook(() => useLayerPresets());

    act(() => {
      result.current.savePreset("ToDelete", [makeLayer()]);
    });
    const id = result.current.presets[0].id;

    act(() => {
      result.current.deletePreset(id);
    });

    expect(result.current.presets).toHaveLength(0);
  });

  it("deletePreset does not remove other presets", () => {
    const { result } = renderHook(() => useLayerPresets());

    act(() => {
      result.current.savePreset("Keep", [makeLayer()]);
    });
    act(() => {
      result.current.savePreset("Delete", [makeLayer()]);
    });
    const deleteId = result.current.presets[0].id; // newest = "Delete"

    act(() => {
      result.current.deletePreset(deleteId);
    });

    expect(result.current.presets).toHaveLength(1);
    expect(result.current.presets[0].name).toBe("Keep");
  });

  it("deletePreset calls AsyncStorage.setItem", () => {
    const { result } = renderHook(() => useLayerPresets());

    act(() => {
      result.current.savePreset("ToDelete", [makeLayer()]);
    });
    (AsyncStorage.setItem as jest.Mock).mockClear();
    const id = result.current.presets[0].id;

    act(() => {
      result.current.deletePreset(id);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it("renamePreset updates the name of the matching preset", () => {
    const { result } = renderHook(() => useLayerPresets());

    act(() => {
      result.current.savePreset("Old Name", [makeLayer()]);
    });
    const id = result.current.presets[0].id;

    act(() => {
      result.current.renamePreset(id, "New Name");
    });

    expect(result.current.presets[0].name).toBe("New Name");
  });

  it("renamePreset does not affect other presets", () => {
    const { result } = renderHook(() => useLayerPresets());

    act(() => {
      result.current.savePreset("A", [makeLayer()]);
    });
    const idA = result.current.presets[0].id;

    act(() => {
      result.current.savePreset("B", [makeLayer()]);
    });

    act(() => {
      result.current.renamePreset(idA, "A Renamed");
    });

    expect(result.current.presets[0].name).toBe("B");
    expect(result.current.presets[1].name).toBe("A Renamed");
  });

  it("renamePreset calls AsyncStorage.setItem", () => {
    const { result } = renderHook(() => useLayerPresets());

    act(() => {
      result.current.savePreset("Name", [makeLayer()]);
    });
    (AsyncStorage.setItem as jest.Mock).mockClear();
    const id = result.current.presets[0].id;

    act(() => {
      result.current.renamePreset(id, "Renamed");
    });

    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it("loads presets from AsyncStorage on mount", async () => {
    const storedPresets = [
      {
        id: "preset-stored",
        name: "Stored",
        layers: [],
        createdAt: 1000,
      },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedPresets));

    const { result } = renderHook(() => useLayerPresets());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.presets).toHaveLength(1);
    expect(result.current.presets[0].name).toBe("Stored");
  });

  it("ignores invalid JSON in AsyncStorage", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("invalid-json{{{");

    const { result } = renderHook(() => useLayerPresets());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.presets).toHaveLength(0);
  });

  it("does not load from AsyncStorage when stored value is null", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useLayerPresets());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.presets).toHaveLength(0);
  });

  it("updatePreset updates name and layers for matching preset", () => {
    const { result } = renderHook(() => useLayerPresets());

    act(() => {
      result.current.savePreset("Original", [makeLayer()]);
    });
    const id = result.current.presets[0].id;

    act(() => {
      result.current.updatePreset(id, "Updated", [makeLayer({ id: "new-layer" })]);
    });

    expect(result.current.presets[0].name).toBe("Updated");
    expect(result.current.presets[0].layers).toHaveLength(1);
  });

  it("updatePreset calls AsyncStorage.setItem", () => {
    const { result } = renderHook(() => useLayerPresets());

    act(() => {
      result.current.savePreset("Test", [makeLayer()]);
    });
    (AsyncStorage.setItem as jest.Mock).mockClear();
    const id = result.current.presets[0].id;

    act(() => {
      result.current.updatePreset(id, "Updated", [makeLayer()]);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it("updatePreset does not affect other presets", () => {
    const { result } = renderHook(() => useLayerPresets());

    act(() => {
      result.current.savePreset("A", [makeLayer()]);
    });
    act(() => {
      result.current.savePreset("B", [makeLayer()]);
    });
    const idA = result.current.presets[1].id; // older preset (presets are prepended)

    act(() => {
      result.current.updatePreset(idA, "A Updated", []);
    });

    expect(result.current.presets[0].name).toBe("B");
    expect(result.current.presets[1].name).toBe("A Updated");
  });

  it("reorderPresets reorders by id array", () => {
    const { result } = renderHook(() => useLayerPresets());

    act(() => {
      result.current.savePreset("First", [makeLayer()]);
    });
    act(() => {
      result.current.savePreset("Second", [makeLayer()]);
    });
    // savePreset prepends, so presets = [Second, First]
    const [idSecond, idFirst] = result.current.presets.map((p) => p.id);

    act(() => {
      result.current.reorderPresets([idFirst, idSecond]);
    });

    expect(result.current.presets[0].id).toBe(idFirst);
    expect(result.current.presets[1].id).toBe(idSecond);
  });

  it("reorderPresets calls AsyncStorage.setItem", () => {
    const { result } = renderHook(() => useLayerPresets());

    act(() => {
      result.current.savePreset("A", [makeLayer()]);
    });
    act(() => {
      result.current.savePreset("B", [makeLayer()]);
    });
    (AsyncStorage.setItem as jest.Mock).mockClear();
    const ids = result.current.presets.map((p) => p.id);

    act(() => {
      result.current.reorderPresets(ids.reverse());
    });

    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
