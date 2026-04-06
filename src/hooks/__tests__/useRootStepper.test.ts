import { renderHook, act } from "@testing-library/react-native";
import { useRootStepper } from "../useRootStepper";
import type { Accidental } from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setup(overrides: Partial<Parameters<typeof useRootStepper>[0]> = {}) {
  const onRootNoteChange = jest.fn();
  const defaultParams = {
    accidental: "sharp" as Accidental,
    rootNote: "C",
    rootChangeDisabled: false,
    onRootNoteChange,
  };
  const hook = renderHook(() => useRootStepper({ ...defaultParams, ...overrides }));
  return { hook, onRootNoteChange: overrides.onRootNoteChange ?? onRootNoteChange };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useRootStepper", () => {
  it("stepNote(1) from C goes to C♯ with sharp accidental", () => {
    const { hook, onRootNoteChange } = setup({ rootNote: "C", accidental: "sharp" });
    act(() => {
      hook.result.current.stepNote(1);
    });
    expect(onRootNoteChange).toHaveBeenCalledWith("C♯");
  });

  it("stepNote(1) from C goes to D♭ with flat accidental", () => {
    const { hook, onRootNoteChange } = setup({ rootNote: "C", accidental: "flat" });
    act(() => {
      hook.result.current.stepNote(1);
    });
    expect(onRootNoteChange).toHaveBeenCalledWith("D♭");
  });

  it("stepNote(-1) from C wraps to B", () => {
    const { hook, onRootNoteChange } = setup({ rootNote: "C", accidental: "sharp" });
    act(() => {
      hook.result.current.stepNote(-1);
    });
    expect(onRootNoteChange).toHaveBeenCalledWith("B");
  });

  it("stepNote(1) from B wraps to C", () => {
    const { hook, onRootNoteChange } = setup({ rootNote: "B", accidental: "sharp" });
    act(() => {
      hook.result.current.stepNote(1);
    });
    expect(onRootNoteChange).toHaveBeenCalledWith("C");
  });

  it("does not step when rootChangeDisabled is true", () => {
    const { hook, onRootNoteChange } = setup({
      rootNote: "C",
      rootChangeDisabled: true,
    });
    act(() => {
      hook.result.current.stepNote(1);
    });
    expect(onRootNoteChange).not.toHaveBeenCalled();
  });

  it("does not step when rootNote is not in the notes array", () => {
    const { hook, onRootNoteChange } = setup({
      rootNote: "X",
      accidental: "sharp",
    });
    act(() => {
      hook.result.current.stepNote(1);
    });
    expect(onRootNoteChange).not.toHaveBeenCalled();
  });

  it("invokes the callback with the correct note on each step", () => {
    const onRootNoteChange = jest.fn();
    // Start from E (index 4 in sharp), step forward twice
    const { rerender } = renderHook(
      ({ rootNote }: { rootNote: string }) =>
        useRootStepper({
          accidental: "sharp",
          rootNote,
          onRootNoteChange,
        }),
      { initialProps: { rootNote: "E" } },
    );

    // First call: get hook result and step
    const hook1 = renderHook(() =>
      useRootStepper({ accidental: "sharp", rootNote: "E", onRootNoteChange }),
    );
    act(() => {
      hook1.result.current.stepNote(1);
    });
    expect(onRootNoteChange).toHaveBeenCalledWith("F");

    onRootNoteChange.mockClear();

    // Step backward from E
    act(() => {
      hook1.result.current.stepNote(-1);
    });
    expect(onRootNoteChange).toHaveBeenCalledWith("D♯");

    rerender({ rootNote: "E" });
  });
});
