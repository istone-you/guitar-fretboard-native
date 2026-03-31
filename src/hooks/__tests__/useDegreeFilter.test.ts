import { renderHook, act } from "@testing-library/react-native";
import { useDegreeFilter } from "../useDegreeFilter";
import { getActiveOverlaySemitones } from "../../logic/fretboard";

jest.mock("../../logic/fretboard", () => ({
  getActiveOverlaySemitones: jest.fn(),
}));

const mockedGetActive = getActiveOverlaySemitones as jest.MockedFunction<
  typeof getActiveOverlaySemitones
>;

const ALL_DEGREES = ["P1", "m2", "M2", "m3", "M3", "P4", "b5", "P5", "m6", "M6", "m7", "M7"];

const makeAutoFilterParams = (overrides = {}) => ({
  rootNote: "C",
  showScale: false,
  scaleType: "major" as const,
  showCaged: false,
  showChord: false,
  chordDisplayMode: "form" as const,
  diatonicScaleType: "major-triad",
  diatonicDegree: "I",
  chordType: "Major" as const,
  ...overrides,
});

describe("useDegreeFilter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns initial state with empty highlighted degrees", () => {
    const { result } = renderHook(() => useDegreeFilter());

    expect(result.current.highlightedDegrees).toEqual(new Set());
    expect(result.current.degreeNames).toEqual(ALL_DEGREES);
  });

  it("exposes all 12 degree names", () => {
    const { result } = renderHook(() => useDegreeFilter());

    expect(result.current.degreeNames).toHaveLength(12);
    expect(result.current.degreeNames[0]).toBe("P1");
    expect(result.current.degreeNames[11]).toBe("M7");
  });

  // --- toggleDegree ---

  it("toggleDegree adds a degree when not present", () => {
    const { result } = renderHook(() => useDegreeFilter());

    act(() => {
      result.current.toggleDegree("P1");
    });

    expect(result.current.highlightedDegrees.has("P1")).toBe(true);
    expect(result.current.highlightedDegrees.size).toBe(1);
  });

  it("toggleDegree removes a degree when already present", () => {
    const { result } = renderHook(() => useDegreeFilter());

    act(() => {
      result.current.toggleDegree("P1");
    });
    act(() => {
      result.current.toggleDegree("P1");
    });

    expect(result.current.highlightedDegrees.has("P1")).toBe(false);
    expect(result.current.highlightedDegrees.size).toBe(0);
  });

  it("toggleDegree can toggle multiple degrees independently", () => {
    const { result } = renderHook(() => useDegreeFilter());

    act(() => {
      result.current.toggleDegree("P1");
    });
    act(() => {
      result.current.toggleDegree("P5");
    });
    act(() => {
      result.current.toggleDegree("M3");
    });

    expect(result.current.highlightedDegrees).toEqual(new Set(["P1", "P5", "M3"]));

    // Remove one
    act(() => {
      result.current.toggleDegree("P5");
    });

    expect(result.current.highlightedDegrees).toEqual(new Set(["P1", "M3"]));
  });

  // --- highlightAllDegrees ---

  it("highlightAllDegrees sets all 12 degrees", () => {
    const { result } = renderHook(() => useDegreeFilter());

    act(() => {
      result.current.highlightAllDegrees();
    });

    expect(result.current.highlightedDegrees).toEqual(new Set(ALL_DEGREES));
    expect(result.current.highlightedDegrees.size).toBe(12);
  });

  // --- resetHighlightedDegrees ---

  it("resetHighlightedDegrees clears all degrees", () => {
    const { result } = renderHook(() => useDegreeFilter());

    act(() => {
      result.current.highlightAllDegrees();
    });
    act(() => {
      result.current.resetHighlightedDegrees();
    });

    expect(result.current.highlightedDegrees).toEqual(new Set());
  });

  it("resetHighlightedDegrees is a no-op when already empty", () => {
    const { result } = renderHook(() => useDegreeFilter());

    act(() => {
      result.current.resetHighlightedDegrees();
    });

    expect(result.current.highlightedDegrees).toEqual(new Set());
  });

  // --- setHighlightedDegrees ---

  it("setHighlightedDegrees allows direct set manipulation", () => {
    const { result } = renderHook(() => useDegreeFilter());

    act(() => {
      result.current.setHighlightedDegrees(new Set(["m3", "P5", "m7"]));
    });

    expect(result.current.highlightedDegrees).toEqual(new Set(["m3", "P5", "m7"]));
  });

  // --- handleAutoFilter ---

  it("handleAutoFilter sets degrees based on active overlay semitones", () => {
    // Major triad: semitones 0, 4, 7 => P1, M3, P5
    mockedGetActive.mockReturnValue(new Set([0, 4, 7]));

    const { result } = renderHook(() => useDegreeFilter());

    act(() => {
      result.current.handleAutoFilter(makeAutoFilterParams({ showChord: true }));
    });

    expect(result.current.highlightedDegrees).toEqual(new Set(["P1", "M3", "P5"]));
  });

  it("handleAutoFilter clears degrees when overlay returns empty set", () => {
    mockedGetActive.mockReturnValue(new Set());

    const { result } = renderHook(() => useDegreeFilter());

    // First set some degrees
    act(() => {
      result.current.highlightAllDegrees();
    });
    expect(result.current.highlightedDegrees.size).toBe(12);

    act(() => {
      result.current.handleAutoFilter(makeAutoFilterParams());
    });

    expect(result.current.highlightedDegrees).toEqual(new Set());
  });

  it("handleAutoFilter passes all params to getActiveOverlaySemitones", () => {
    mockedGetActive.mockReturnValue(new Set());

    const { result } = renderHook(() => useDegreeFilter());
    const params = makeAutoFilterParams({
      rootNote: "G",
      showScale: true,
      scaleType: "minor-penta",
      showCaged: true,
      showChord: true,
      chordDisplayMode: "diatonic",
      diatonicScaleType: "natural-minor-triad",
      diatonicDegree: "iv",
      chordType: "Minor",
    });

    act(() => {
      result.current.handleAutoFilter(params);
    });

    expect(mockedGetActive).toHaveBeenCalledWith(params);
  });

  it("handleAutoFilter maps all 12 semitones correctly", () => {
    mockedGetActive.mockReturnValue(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]));

    const { result } = renderHook(() => useDegreeFilter());

    act(() => {
      result.current.handleAutoFilter(makeAutoFilterParams());
    });

    expect(result.current.highlightedDegrees).toEqual(new Set(ALL_DEGREES));
  });

  it("handleAutoFilter with single semitone maps correctly", () => {
    // Semitone 6 => b5
    mockedGetActive.mockReturnValue(new Set([6]));

    const { result } = renderHook(() => useDegreeFilter());

    act(() => {
      result.current.handleAutoFilter(makeAutoFilterParams());
    });

    expect(result.current.highlightedDegrees).toEqual(new Set(["b5"]));
  });

  // --- combined operations ---

  it("handleAutoFilter overrides previously toggled degrees", () => {
    mockedGetActive.mockReturnValue(new Set([0, 7]));

    const { result } = renderHook(() => useDegreeFilter());

    act(() => {
      result.current.toggleDegree("m3");
      result.current.toggleDegree("m7");
    });

    act(() => {
      result.current.handleAutoFilter(makeAutoFilterParams());
    });

    expect(result.current.highlightedDegrees).toEqual(new Set(["P1", "P5"]));
  });
});
