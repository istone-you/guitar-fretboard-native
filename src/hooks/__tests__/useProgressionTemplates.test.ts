import { renderHook, act } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProgressionTemplates } from "../useProgressionTemplates";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

describe("useProgressionTemplates", () => {
  let mockTime: number;

  beforeEach(() => {
    mockTime = 1000;
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockImplementation(() => mockTime++);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("initializes with empty templates", () => {
    const { result } = renderHook(() => useProgressionTemplates());
    expect(result.current.customTemplates).toEqual([]);
  });

  it("saveTemplate adds a new template", () => {
    const { result } = renderHook(() => useProgressionTemplates());
    act(() => {
      result.current.saveTemplate("My Progression", [{ degree: "I", chordType: "Major" }]);
    });
    expect(result.current.customTemplates).toHaveLength(1);
    expect(result.current.customTemplates[0].name).toBe("My Progression");
    expect(result.current.customTemplates[0].chords).toEqual([{ degree: "I", chordType: "Major" }]);
  });

  it("saveTemplate stores description when provided", () => {
    const { result } = renderHook(() => useProgressionTemplates());
    act(() => {
      result.current.saveTemplate("My Progression", [], "A test description");
    });
    expect(result.current.customTemplates[0].description).toBe("A test description");
  });

  it("saveTemplate leaves description undefined when not provided", () => {
    const { result } = renderHook(() => useProgressionTemplates());
    act(() => {
      result.current.saveTemplate("My Progression", []);
    });
    expect(result.current.customTemplates[0].description).toBeUndefined();
  });

  it("updateTemplate updates description", () => {
    const { result } = renderHook(() => useProgressionTemplates());
    act(() => {
      result.current.saveTemplate("Original", []);
    });
    const id = result.current.customTemplates[0].id;
    act(() => {
      result.current.updateTemplate(id, "Updated", [], "New description");
    });
    expect(result.current.customTemplates[0].description).toBe("New description");
  });

  it("saveTemplate assigns an id with tpl- prefix and a createdAt timestamp", () => {
    const { result } = renderHook(() => useProgressionTemplates());
    act(() => {
      result.current.saveTemplate("Test", []);
    });
    expect(result.current.customTemplates[0].id).toMatch(/^tpl-/);
    expect(typeof result.current.customTemplates[0].createdAt).toBe("number");
  });

  it("saveTemplate persists to AsyncStorage", () => {
    const { result } = renderHook(() => useProgressionTemplates());
    act(() => {
      result.current.saveTemplate("Test", []);
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "guiter:progression-templates",
      expect.any(String),
    );
  });

  it("saveTemplate appends to existing templates", () => {
    const { result } = renderHook(() => useProgressionTemplates());
    act(() => {
      result.current.saveTemplate("First", []);
    });
    act(() => {
      result.current.saveTemplate("Second", []);
    });
    expect(result.current.customTemplates).toHaveLength(2);
    expect(result.current.customTemplates[0].name).toBe("First");
    expect(result.current.customTemplates[1].name).toBe("Second");
  });

  it("updateTemplate updates name and chords of matching template", () => {
    const { result } = renderHook(() => useProgressionTemplates());
    act(() => {
      result.current.saveTemplate("Original", [{ degree: "I", chordType: "Major" }]);
    });
    const id = result.current.customTemplates[0].id;
    act(() => {
      result.current.updateTemplate(id, "Updated", [{ degree: "IV", chordType: "Minor" }]);
    });
    expect(result.current.customTemplates[0].name).toBe("Updated");
    expect(result.current.customTemplates[0].chords).toEqual([
      { degree: "IV", chordType: "Minor" },
    ]);
  });

  it("updateTemplate does not affect other templates", () => {
    const { result } = renderHook(() => useProgressionTemplates());
    act(() => {
      result.current.saveTemplate("A", []);
    });
    act(() => {
      result.current.saveTemplate("B", []);
    });
    const [idA] = result.current.customTemplates.map((t) => t.id);
    act(() => {
      result.current.updateTemplate(idA, "A Updated", []);
    });
    expect(result.current.customTemplates.find((t) => t.id !== idA)?.name).toBe("B");
  });

  it("deleteTemplate removes the matching template", () => {
    const { result } = renderHook(() => useProgressionTemplates());
    act(() => {
      result.current.saveTemplate("To Delete", []);
    });
    const id = result.current.customTemplates[0].id;
    act(() => {
      result.current.deleteTemplate(id);
    });
    expect(result.current.customTemplates).toHaveLength(0);
  });

  it("deleteTemplate does not remove other templates", () => {
    const { result } = renderHook(() => useProgressionTemplates());
    act(() => {
      result.current.saveTemplate("Keep", []);
    });
    act(() => {
      result.current.saveTemplate("Delete", []);
    });
    const deleteId = result.current.customTemplates[1].id;
    act(() => {
      result.current.deleteTemplate(deleteId);
    });
    expect(result.current.customTemplates).toHaveLength(1);
    expect(result.current.customTemplates[0].name).toBe("Keep");
  });

  it("reorderTemplates reorders by id array", () => {
    const { result } = renderHook(() => useProgressionTemplates());
    act(() => {
      result.current.saveTemplate("A", []);
    });
    act(() => {
      result.current.saveTemplate("B", []);
    });
    const [idA, idB] = result.current.customTemplates.map((t) => t.id);
    act(() => {
      result.current.reorderTemplates([idB, idA]);
    });
    expect(result.current.customTemplates[0].id).toBe(idB);
    expect(result.current.customTemplates[1].id).toBe(idA);
  });

  it("reorderTemplates persists the new order", () => {
    const { result } = renderHook(() => useProgressionTemplates());
    act(() => {
      result.current.saveTemplate("A", []);
    });
    act(() => {
      result.current.saveTemplate("B", []);
    });
    (AsyncStorage.setItem as jest.Mock).mockClear();
    const [idA, idB] = result.current.customTemplates.map((t) => t.id);
    act(() => {
      result.current.reorderTemplates([idB, idA]);
    });
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it("loads templates from AsyncStorage on init", async () => {
    const stored = JSON.stringify([
      { id: "t1", name: "Loaded", chords: [{ degree: "I", chordType: "Major" }], createdAt: 1000 },
    ]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(stored);
    const { result } = renderHook(() => useProgressionTemplates());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.customTemplates[0].name).toBe("Loaded");
    expect(result.current.customTemplates[0].chords[0].degree).toBe("I");
  });

  it("migrates legacy templates with degrees array (uppercase → Major)", async () => {
    const stored = JSON.stringify([
      { id: "t1", name: "Legacy", degrees: ["I", "IV", "V"], createdAt: 1000 },
    ]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(stored);
    const { result } = renderHook(() => useProgressionTemplates());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.customTemplates[0].chords[0]).toEqual({
      degree: "I",
      chordType: "Major",
    });
  });

  it("migrates legacy templates with degrees array (lowercase → Minor)", async () => {
    const stored = JSON.stringify([
      { id: "t1", name: "Legacy", degrees: ["i", "iv"], createdAt: 1000 },
    ]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(stored);
    const { result } = renderHook(() => useProgressionTemplates());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.customTemplates[0].chords[0]).toEqual({
      degree: "i",
      chordType: "Minor",
    });
  });

  it("ignores invalid JSON in AsyncStorage", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("invalid{{{");
    const { result } = renderHook(() => useProgressionTemplates());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.customTemplates).toHaveLength(0);
  });

  it("ignores non-array stored value", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ foo: "bar" }));
    const { result } = renderHook(() => useProgressionTemplates());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.customTemplates).toHaveLength(0);
  });
});
