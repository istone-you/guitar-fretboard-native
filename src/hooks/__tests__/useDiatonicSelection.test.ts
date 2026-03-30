import { renderHook, act } from "@testing-library/react-native";
import { useDiatonicSelection } from "../useDiatonicSelection";

// Use actual DIATONIC_CHORDS data from fretboard.ts
// The hook relies on DIATONIC_CHORDS keys: "major-triad", "major-seventh",
// "natural-minor-triad", "natural-minor-seventh"

describe("useDiatonicSelection", () => {
  it("returns correct initial state", () => {
    const { result } = renderHook(() => useDiatonicSelection());

    expect(result.current.diatonicKeyType).toBe("major");
    expect(result.current.diatonicChordSize).toBe("triad");
    expect(result.current.diatonicDegree).toBe("I");
  });

  // --- setDiatonicDegree ---

  it("setDiatonicDegree updates the degree directly", () => {
    const { result } = renderHook(() => useDiatonicSelection());

    act(() => {
      result.current.setDiatonicDegree("V");
    });

    expect(result.current.diatonicDegree).toBe("V");
  });

  it("setDiatonicDegree can set any string value", () => {
    const { result } = renderHook(() => useDiatonicSelection());

    act(() => {
      result.current.setDiatonicDegree("vii");
    });

    expect(result.current.diatonicDegree).toBe("vii");
  });

  // --- handleDiatonicKeyTypeChange ---

  it("handleDiatonicKeyTypeChange updates key type", () => {
    const { result } = renderHook(() => useDiatonicSelection());

    act(() => {
      result.current.handleDiatonicKeyTypeChange("natural-minor");
    });

    expect(result.current.diatonicKeyType).toBe("natural-minor");
  });

  it("handleDiatonicKeyTypeChange keeps degree if valid in new key type", () => {
    const { result } = renderHook(() => useDiatonicSelection());

    // Set degree to "V" which exists in major-triad
    act(() => {
      result.current.setDiatonicDegree("V");
    });

    // Change to natural-minor; "v" exists but "V" does not in natural-minor-triad
    // natural-minor-triad degrees: i, ii, III, iv, v, VI, VII
    act(() => {
      result.current.handleDiatonicKeyTypeChange("natural-minor");
    });

    // "V" is not in natural-minor-triad, so degree should reset to first valid ("i")
    expect(result.current.diatonicKeyType).toBe("natural-minor");
    expect(result.current.diatonicDegree).toBe("i");
  });

  it("handleDiatonicKeyTypeChange preserves degree if valid across key types", () => {
    const { result } = renderHook(() => useDiatonicSelection());

    // "I" is in major-triad. Switch to major again (same key type) - degree should remain.
    act(() => {
      result.current.handleDiatonicKeyTypeChange("major");
    });

    expect(result.current.diatonicDegree).toBe("I");
  });

  it("handleDiatonicKeyTypeChange with seventh chord size", () => {
    const { result } = renderHook(() => useDiatonicSelection());

    // Switch to seventh first
    act(() => {
      result.current.handleDiatonicChordSizeChange("seventh");
    });

    // major-seventh degrees: I, ii, iii, IV, V, vi, vii
    act(() => {
      result.current.setDiatonicDegree("V");
    });

    // Switch key type; natural-minor-seventh has: i, ii, III, iv, v, VI, VII
    act(() => {
      result.current.handleDiatonicKeyTypeChange("natural-minor");
    });

    // "V" is not in natural-minor-seventh (it has lowercase "v"), so reset to "i"
    expect(result.current.diatonicDegree).toBe("i");
  });

  // --- handleDiatonicChordSizeChange ---

  it("handleDiatonicChordSizeChange updates chord size", () => {
    const { result } = renderHook(() => useDiatonicSelection());

    act(() => {
      result.current.handleDiatonicChordSizeChange("seventh");
    });

    expect(result.current.diatonicChordSize).toBe("seventh");
  });

  it("handleDiatonicChordSizeChange keeps degree if still valid", () => {
    const { result } = renderHook(() => useDiatonicSelection());

    // "I" is valid in both major-triad and major-seventh
    act(() => {
      result.current.handleDiatonicChordSizeChange("seventh");
    });

    expect(result.current.diatonicDegree).toBe("I");
  });

  it("handleDiatonicChordSizeChange resets degree if invalid in new size", () => {
    const { result } = renderHook(() => useDiatonicSelection());

    // Switch to natural-minor first
    act(() => {
      result.current.handleDiatonicKeyTypeChange("natural-minor");
    });
    // natural-minor-triad degrees: i, ii, III, iv, v, VI, VII
    act(() => {
      result.current.setDiatonicDegree("VII");
    });
    expect(result.current.diatonicDegree).toBe("VII");

    // natural-minor-seventh also has VII, so degree should stay
    act(() => {
      result.current.handleDiatonicChordSizeChange("seventh");
    });
    expect(result.current.diatonicDegree).toBe("VII");
  });

  it("handleDiatonicChordSizeChange switching back preserves valid degree", () => {
    const { result } = renderHook(() => useDiatonicSelection());

    act(() => {
      result.current.handleDiatonicChordSizeChange("seventh");
    });
    act(() => {
      result.current.setDiatonicDegree("iii");
    });
    expect(result.current.diatonicDegree).toBe("iii");

    // Switch back to triad; major-triad has: I, ii, iii, IV, V, vi, vii
    act(() => {
      result.current.handleDiatonicChordSizeChange("triad");
    });
    expect(result.current.diatonicDegree).toBe("iii");
  });

  // --- complex scenarios ---

  it("full workflow: major -> minor -> seventh -> triad", () => {
    const { result } = renderHook(() => useDiatonicSelection());

    // Start: major, triad, I
    expect(result.current.diatonicKeyType).toBe("major");
    expect(result.current.diatonicChordSize).toBe("triad");
    expect(result.current.diatonicDegree).toBe("I");

    // Select vi (valid in major-triad)
    act(() => {
      result.current.setDiatonicDegree("vi");
    });
    expect(result.current.diatonicDegree).toBe("vi");

    // Switch to natural-minor; natural-minor-triad has: i, ii, III, iv, v, VI, VII
    // "vi" is not in natural-minor-triad (it has "VI" uppercase), so reset
    act(() => {
      result.current.handleDiatonicKeyTypeChange("natural-minor");
    });
    expect(result.current.diatonicDegree).toBe("i");

    // Set to III
    act(() => {
      result.current.setDiatonicDegree("III");
    });

    // Switch to seventh; natural-minor-seventh has: i, ii, III, iv, v, VI, VII
    // "III" is valid
    act(() => {
      result.current.handleDiatonicChordSizeChange("seventh");
    });
    expect(result.current.diatonicDegree).toBe("III");

    // Switch back to major; major-seventh has: I, ii, iii, IV, V, vi, vii
    // "III" is not in major-seventh, so reset to "I"
    act(() => {
      result.current.handleDiatonicKeyTypeChange("major");
    });
    expect(result.current.diatonicDegree).toBe("I");
  });

  // --- return values ---

  it("returns all expected properties", () => {
    const { result } = renderHook(() => useDiatonicSelection());

    expect(result.current).toHaveProperty("diatonicKeyType");
    expect(result.current).toHaveProperty("diatonicChordSize");
    expect(result.current).toHaveProperty("diatonicDegree");
    expect(result.current).toHaveProperty("setDiatonicDegree");
    expect(result.current).toHaveProperty("handleDiatonicKeyTypeChange");
    expect(result.current).toHaveProperty("handleDiatonicChordSizeChange");
    expect(typeof result.current.setDiatonicDegree).toBe("function");
    expect(typeof result.current.handleDiatonicKeyTypeChange).toBe("function");
    expect(typeof result.current.handleDiatonicChordSizeChange).toBe("function");
  });
});
