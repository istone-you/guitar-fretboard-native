import { renderHook, act, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuizRecords } from "../useQuizRecords";
import type { QuizRecord } from "../../types";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const mockedGetItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;
const mockedSetItem = AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>;
const mockedRemoveItem = AsyncStorage.removeItem as jest.MockedFunction<
  typeof AsyncStorage.removeItem
>;

const makeRecord = (overrides: Partial<QuizRecord> = {}): QuizRecord => ({
  mode: "note",
  correct: true,
  noteName: "C",
  stringIdx: 0,
  fret: 3,
  ...overrides,
});

describe("useQuizRecords", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetItem.mockResolvedValue(null);
    mockedSetItem.mockResolvedValue(undefined);
    mockedRemoveItem.mockResolvedValue(undefined);
  });

  it("returns empty records initially", () => {
    const { result } = renderHook(() => useQuizRecords());
    expect(result.current.records).toEqual([]);
  });

  it("loads stored records from AsyncStorage on init", async () => {
    const stored = [makeRecord({ noteName: "A" }), makeRecord({ noteName: "B" })];
    mockedGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useQuizRecords());

    await waitFor(() => {
      expect(result.current.records).toHaveLength(2);
    });
    expect(result.current.records[0].noteName).toBe("A");
    expect(result.current.records[1].noteName).toBe("B");
  });

  it("uses storage key 'guiter:quiz-records'", () => {
    renderHook(() => useQuizRecords());
    expect(mockedGetItem).toHaveBeenCalledWith("guiter:quiz-records");
  });

  it("ignores invalid JSON in storage and keeps empty records", async () => {
    mockedGetItem.mockResolvedValue("not-valid-json");

    const { result } = renderHook(() => useQuizRecords());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.records).toEqual([]);
  });

  it("addRecord appends a record", () => {
    const { result } = renderHook(() => useQuizRecords());
    const record = makeRecord();

    act(() => {
      result.current.addRecord(record);
    });

    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0]).toEqual(record);
  });

  it("addRecord persists to AsyncStorage", () => {
    const { result } = renderHook(() => useQuizRecords());
    const record = makeRecord();

    act(() => {
      result.current.addRecord(record);
    });

    expect(mockedSetItem).toHaveBeenCalledWith("guiter:quiz-records", JSON.stringify([record]));
  });

  it("addRecord appends multiple records in order", () => {
    const { result } = renderHook(() => useQuizRecords());

    act(() => {
      result.current.addRecord(makeRecord({ noteName: "C" }));
      result.current.addRecord(makeRecord({ noteName: "D" }));
      result.current.addRecord(makeRecord({ noteName: "E" }));
    });

    expect(result.current.records).toHaveLength(3);
    expect(result.current.records.map((r) => r.noteName)).toEqual(["C", "D", "E"]);
  });

  it("addRecord slices to MAX_RECORDS (1000)", () => {
    const { result } = renderHook(() => useQuizRecords());

    act(() => {
      for (let i = 0; i < 1001; i++) {
        result.current.addRecord(makeRecord({ fret: i % 15 }));
      }
    });

    expect(result.current.records).toHaveLength(1000);
  });

  it("clearRecords empties the records", () => {
    const { result } = renderHook(() => useQuizRecords());

    act(() => {
      result.current.addRecord(makeRecord());
      result.current.addRecord(makeRecord());
    });
    expect(result.current.records).toHaveLength(2);

    act(() => {
      result.current.clearRecords();
    });

    expect(result.current.records).toEqual([]);
  });

  it("clearRecords calls AsyncStorage.removeItem", () => {
    const { result } = renderHook(() => useQuizRecords());

    act(() => {
      result.current.clearRecords();
    });

    expect(mockedRemoveItem).toHaveBeenCalledWith("guiter:quiz-records");
  });
});
