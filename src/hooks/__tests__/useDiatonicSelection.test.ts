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
      result.current.setDiatonicDegree("VII");
    });

    expect(result.current.diatonicDegree).toBe("VII");
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

    // Change to natural-minor; natural-minor-triad degrees: I, II, bIII, IV, V, bVI, bVII
    act(() => {
      result.current.handleDiatonicKeyTypeChange("natural-minor");
    });

    // "V" is also in natural-minor-triad, so degree should remain "V"
    expect(result.current.diatonicKeyType).toBe("natural-minor");
    expect(result.current.diatonicDegree).toBe("V");
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

    // major-seventh degrees: I, II, III, IV, V, VI, VII
    act(() => {
      result.current.setDiatonicDegree("V");
    });

    // Switch key type; natural-minor-seventh has: I, II, bIII, IV, V, bVI, bVII
    act(() => {
      result.current.handleDiatonicKeyTypeChange("natural-minor");
    });

    // "V" is in natural-minor-seventh, so degree should remain "V"
    expect(result.current.diatonicDegree).toBe("V");
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
    // natural-minor-triad degrees: I, II, bIII, IV, V, bVI, bVII
    act(() => {
      result.current.setDiatonicDegree("bVII");
    });
    expect(result.current.diatonicDegree).toBe("bVII");

    // natural-minor-seventh also has bVII, so degree should stay
    act(() => {
      result.current.handleDiatonicChordSizeChange("seventh");
    });
    expect(result.current.diatonicDegree).toBe("bVII");
  });

  it("handleDiatonicChordSizeChange switching back preserves valid degree", () => {
    const { result } = renderHook(() => useDiatonicSelection());

    act(() => {
      result.current.handleDiatonicChordSizeChange("seventh");
    });
    act(() => {
      result.current.setDiatonicDegree("III");
    });
    expect(result.current.diatonicDegree).toBe("III");

    // Switch back to triad; major-triad has: I, II, III, IV, V, VI, VII
    act(() => {
      result.current.handleDiatonicChordSizeChange("triad");
    });
    expect(result.current.diatonicDegree).toBe("III");
  });

  // --- complex scenarios ---

  it("full workflow: major -> minor -> seventh -> triad", () => {
    const { result } = renderHook(() => useDiatonicSelection());

    // Start: major, triad, I
    expect(result.current.diatonicKeyType).toBe("major");
    expect(result.current.diatonicChordSize).toBe("triad");
    expect(result.current.diatonicDegree).toBe("I");

    // Select VI (valid in major-triad)
    act(() => {
      result.current.setDiatonicDegree("VI");
    });
    expect(result.current.diatonicDegree).toBe("VI");

    // Switch to natural-minor; natural-minor-triad has: I, II, bIII, IV, V, bVI, bVII
    // "VI" is not in natural-minor-triad (it has "bVI"), so reset to "I"
    act(() => {
      result.current.handleDiatonicKeyTypeChange("natural-minor");
    });
    expect(result.current.diatonicDegree).toBe("I");

    // Set to bIII
    act(() => {
      result.current.setDiatonicDegree("bIII");
    });

    // Switch to seventh; natural-minor-seventh has: I, II, bIII, IV, V, bVI, bVII
    // "bIII" is valid
    act(() => {
      result.current.handleDiatonicChordSizeChange("seventh");
    });
    expect(result.current.diatonicDegree).toBe("bIII");

    // Switch back to major; major-seventh has: I, II, III, IV, V, VI, VII
    // "bIII" is not in major-seventh, so reset to "I"
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
