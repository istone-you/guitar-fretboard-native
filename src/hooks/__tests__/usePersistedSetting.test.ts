import { renderHook, act, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePersistedSetting } from "../usePersistedSetting";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockedGetItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;
const mockedSetItem = AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>;

describe("usePersistedSetting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetItem.mockResolvedValue(null);
    mockedSetItem.mockResolvedValue(undefined);
  });

  // --- initial state ---

  it("returns default value initially", () => {
    const { result } = renderHook(() => usePersistedSetting("guiter:test", "default"));

    expect(result.current[0]).toBe("default");
  });

  it("returns default value for numeric type", () => {
    const { result } = renderHook(() => usePersistedSetting("guiter:num", 42, String, Number));

    expect(result.current[0]).toBe(42);
  });

  it("returns default value for boolean type", () => {
    const { result } = renderHook(() =>
      usePersistedSetting(
        "guiter:bool",
        false,
        (v) => String(v),
        (v) => v === "true",
      ),
    );

    expect(result.current[0]).toBe(false);
  });

  // --- async loading from storage ---

  it("loads stored value from AsyncStorage", async () => {
    mockedGetItem.mockResolvedValue("stored-value");

    const { result } = renderHook(() => usePersistedSetting("guiter:key", "default"));

    expect(result.current[0]).toBe("default");

    await waitFor(() => {
      expect(result.current[0]).toBe("stored-value");
    });
  });

  it("loads and deserializes stored numeric value", async () => {
    mockedGetItem.mockResolvedValue("99");

    const { result } = renderHook(() => usePersistedSetting("guiter:num", 0, String, Number));

    await waitFor(() => {
      expect(result.current[0]).toBe(99);
    });
  });

  it("loads and deserializes stored boolean value", async () => {
    mockedGetItem.mockResolvedValue("true");

    const { result } = renderHook(() =>
      usePersistedSetting(
        "guiter:bool",
        false,
        (v) => String(v),
        (v) => v === "true",
      ),
    );

    await waitFor(() => {
      expect(result.current[0]).toBe(true);
    });
  });

  it("keeps default value when storage returns null", async () => {
    mockedGetItem.mockResolvedValue(null);

    const { result } = renderHook(() => usePersistedSetting("guiter:empty", "default"));

    // Wait for async load to complete
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current[0]).toBe("default");
  });

  it("calls getItem with the correct storage key", () => {
    renderHook(() => usePersistedSetting("guiter:mykey", "val"));

    expect(mockedGetItem).toHaveBeenCalledWith("guiter:mykey");
  });

  it("ignores deserialization errors and keeps default", async () => {
    mockedGetItem.mockResolvedValue("invalid-json");

    const { result } = renderHook(() =>
      usePersistedSetting(
        "guiter:json",
        { x: 1 },
        JSON.stringify,
        JSON.parse, // will throw on "invalid-json"
      ),
    );

    // Wait for async load to complete
    await act(async () => {
      await Promise.resolve();
    });

    // Should still have default because JSON.parse throws
    expect(result.current[0]).toEqual({ x: 1 });
  });

  // --- setting values ---

  it("updates value with direct value", () => {
    const { result } = renderHook(() => usePersistedSetting("guiter:test", "initial"));

    act(() => {
      result.current[1]("updated");
    });

    expect(result.current[0]).toBe("updated");
  });

  it("persists value to AsyncStorage on set", () => {
    const { result } = renderHook(() => usePersistedSetting("guiter:test", "initial"));

    act(() => {
      result.current[1]("persisted");
    });

    expect(mockedSetItem).toHaveBeenCalledWith("guiter:test", "persisted");
  });

  it("uses custom serialize when persisting", () => {
    const { result } = renderHook(() => usePersistedSetting("guiter:num", 10, String, Number));

    act(() => {
      result.current[1](42);
    });

    expect(mockedSetItem).toHaveBeenCalledWith("guiter:num", "42");
    expect(result.current[0]).toBe(42);
  });

  it("supports updater function", () => {
    const { result } = renderHook(() => usePersistedSetting("guiter:count", 5, String, Number));

    act(() => {
      result.current[1]((current) => current + 10);
    });

    expect(result.current[0]).toBe(15);
    expect(mockedSetItem).toHaveBeenCalledWith("guiter:count", "15");
  });

  it("updater function receives current value", () => {
    const { result } = renderHook(() => usePersistedSetting("guiter:str", "hello"));

    act(() => {
      result.current[1]((current) => current + " world");
    });

    expect(result.current[0]).toBe("hello world");
  });

  it("handles multiple sequential updates correctly", () => {
    const { result } = renderHook(() => usePersistedSetting("guiter:seq", 0, String, Number));

    act(() => {
      result.current[1](1);
    });
    act(() => {
      result.current[1](2);
    });
    act(() => {
      result.current[1](3);
    });

    expect(result.current[0]).toBe(3);
    expect(mockedSetItem).toHaveBeenCalledTimes(3);
    expect(mockedSetItem).toHaveBeenLastCalledWith("guiter:seq", "3");
  });

  it("handles updater after async load", async () => {
    mockedGetItem.mockResolvedValue("100");

    const { result } = renderHook(() => usePersistedSetting("guiter:loaded", 0, String, Number));

    await waitFor(() => {
      expect(result.current[0]).toBe(100);
    });

    act(() => {
      result.current[1]((current) => current + 50);
    });

    expect(result.current[0]).toBe(150);
    expect(mockedSetItem).toHaveBeenCalledWith("guiter:loaded", "150");
  });

  // --- default serialize/deserialize ---

  it("uses String() as default serialize", () => {
    const { result } = renderHook(() => usePersistedSetting("guiter:def", "value"));

    act(() => {
      result.current[1]("new-value");
    });

    expect(mockedSetItem).toHaveBeenCalledWith("guiter:def", "new-value");
  });

  it("uses identity cast as default deserialize", async () => {
    mockedGetItem.mockResolvedValue("from-storage");

    const { result } = renderHook(() => usePersistedSetting("guiter:def", "default"));

    await waitFor(() => {
      expect(result.current[0]).toBe("from-storage");
    });
  });

  // --- JSON serialize/deserialize ---

  it("works with JSON serialize/deserialize for objects", async () => {
    mockedGetItem.mockResolvedValue(JSON.stringify({ theme: "dark" }));

    const { result } = renderHook(() =>
      usePersistedSetting("guiter:obj", { theme: "light" }, JSON.stringify, JSON.parse),
    );

    await waitFor(() => {
      expect(result.current[0]).toEqual({ theme: "dark" });
    });

    act(() => {
      result.current[1]({ theme: "light" });
    });

    expect(mockedSetItem).toHaveBeenCalledWith("guiter:obj", JSON.stringify({ theme: "light" }));
  });

  // --- return type ---

  it("returns a tuple of [value, setter]", () => {
    const { result } = renderHook(() => usePersistedSetting("guiter:tuple", "val"));

    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current).toHaveLength(2);
    expect(typeof result.current[1]).toBe("function");
  });
});
