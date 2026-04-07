import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Animated } from "react-native";
import HeaderBar from "../index";
import type { Accidental, BaseLabelMode, Theme } from "../../../types";

jest.useFakeTimers();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

jest.mock("../../../i18n", () => ({ changeLocale: jest.fn() }));

const defaultProps = {
  theme: "dark" as Theme,
  rootNote: "C",
  accidental: "sharp" as Accidental,
  baseLabelMode: "note" as BaseLabelMode,
  showQuiz: false,
  rootChangeDisabled: false,
  onBaseLabelModeChange: jest.fn(),
  onRootNoteChange: jest.fn(),
  quizKindValue: undefined as string | undefined,
  quizKindOptions: undefined as { value: string; label: string }[] | undefined,
  onQuizKindChange: undefined as ((value: string) => void) | undefined,
  fretRange: [0, 14] as [number, number],
  onThemeChange: jest.fn(),
  onFretRangeChange: jest.fn(),
  onAccidentalChange: jest.fn(),
};

function renderHeader(overrides: Partial<typeof defaultProps> = {}) {
  return render(<HeaderBar {...defaultProps} {...overrides} />);
}

/** Open settings modal via testID and flush timers */
function openSettings(result: ReturnType<typeof renderHeader>) {
  fireEvent.press(result.getByTestId("settings-button"));
  act(() => {
    jest.runAllTimers();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("HeaderBar", () => {
  // ── Root stepper ──────────────────────────────────────────────────
  it("renders root note", () => {
    const { getByText } = renderHeader();
    expect(getByText("C")).toBeTruthy();
  });

  it("renders label toggle when not in quiz mode", () => {
    const { getByText } = renderHeader();
    expect(getByText("header.note")).toBeTruthy();
    expect(getByText("header.degree")).toBeTruthy();
  });

  it("hides label toggle in quiz mode", () => {
    const { queryByText } = renderHeader({ showQuiz: true });
    expect(queryByText("header.note")).toBeNull();
  });

  // ── Settings modal open/close ──────────────────────────────────────
  it("opens settings modal when settings icon is pressed", () => {
    const result = renderHeader();
    expect(result.queryByText("settings")).toBeNull();
    openSettings(result);
    expect(result.getByText("settings")).toBeTruthy();
  });

  it("opens and closes settings modal with animation", async () => {
    const result = renderHeader();
    openSettings(result);
    expect(result.getByText("settings")).toBeTruthy();

    fireEvent.press(result.getByText("\u2715"));
    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.queryByText("settings")).toBeNull();
    });
  });

  it("closes settings modal by pressing close button", async () => {
    const result = renderHeader();
    openSettings(result);
    expect(result.getByText("settings")).toBeTruthy();

    fireEvent.press(result.getByText("✕"));
    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.queryByText("settings")).toBeNull();
    });
  });

  // ── Theme toggle ──────────────────────────────────────────────────
  it("renders theme toggle with dark/light options", () => {
    const result = renderHeader();
    openSettings(result);
    expect(result.getByText("dark")).toBeTruthy();
    expect(result.getByText("light")).toBeTruthy();
  });

  it("calls onThemeChange when theme option is pressed", () => {
    const onThemeChange = jest.fn();
    const result = renderHeader({ onThemeChange });
    openSettings(result);
    fireEvent.press(result.getByText("light"));
    expect(onThemeChange).toHaveBeenCalledWith("light");
  });

  // ── Accidental toggle ─────────────────────────────────────────────
  it("renders accidental toggle with sharp/flat options", () => {
    const result = renderHeader();
    openSettings(result);
    expect(result.getByText("\u266F")).toBeTruthy();
    expect(result.getByText("\u266D")).toBeTruthy();
  });

  it("calls onAccidentalChange when accidental option is pressed", () => {
    const onAccidentalChange = jest.fn();
    const result = renderHeader({ onAccidentalChange });
    openSettings(result);
    fireEvent.press(result.getByText("\u266D"));
    expect(onAccidentalChange).toHaveBeenCalledWith("flat");
  });

  // ── Language toggle ───────────────────────────────────────────────
  it("renders language toggle with JA/EN options", () => {
    const result = renderHeader();
    openSettings(result);
    expect(result.getByText("JA")).toBeTruthy();
    expect(result.getByText("EN")).toBeTruthy();
  });

  it("calls changeLocale when language option is pressed", () => {
    const { changeLocale } = require("../../../i18n");
    const result = renderHeader();
    openSettings(result);
    fireEvent.press(result.getByText("JA"));
    expect(changeLocale).toHaveBeenCalledWith("ja");
  });

  // ── Fret range slider ─────────────────────────────────────────────
  it("displays fret range label", () => {
    const result = renderHeader();
    openSettings(result);
    expect(result.getByText("settingsPanel.fretRange")).toBeTruthy();
  });

  it("renders range slider thumbs with min/max values", () => {
    const result = renderHeader({ fretRange: [2, 10] });
    openSettings(result);
    expect(result.getByText("2")).toBeTruthy();
    expect(result.getByText("10")).toBeTruthy();
  });

  // ── Light theme rendering ─────────────────────────────────────────
  it("renders correctly with light theme", () => {
    const { getByText } = renderHeader({ theme: "light" });
    expect(getByText("C")).toBeTruthy();
  });

  // ── RangeSlider PanResponder interactions ──────────────────────────
  it("triggers min thumb pan responder grant and move", () => {
    const onFretRangeChange = jest.fn();
    const result = renderHeader({ fretRange: [3, 12], onFretRangeChange });
    openSettings(result);

    const minThumbText = result.getByText("3");
    const minThumb = minThumbText.parent!;
    fireEvent(minThumb, "responderGrant", {
      nativeEvent: { pageX: 100 },
      touchHistory: { touchBank: [] },
    });
    fireEvent(minThumb, "responderMove", {
      nativeEvent: { pageX: 150 },
      touchHistory: { touchBank: [] },
    });
  });

  it("triggers max thumb pan responder grant and move", () => {
    const onFretRangeChange = jest.fn();
    const result = renderHeader({ fretRange: [3, 12], onFretRangeChange });
    openSettings(result);

    const maxThumbText = result.getByText("12");
    const maxThumb = maxThumbText.parent!;
    fireEvent(maxThumb, "responderGrant", {
      nativeEvent: { pageX: 200 },
      touchHistory: { touchBank: [] },
    });
    fireEvent(maxThumb, "responderMove", {
      nativeEvent: { pageX: 250 },
      touchHistory: { touchBank: [] },
    });
  });

  it("calls onFretRangeChange when min thumb is dragged with valid track width", () => {
    const onFretRangeChange = jest.fn();
    const result = renderHeader({ fretRange: [3, 12], onFretRangeChange });
    openSettings(result);

    const RNView = require("react-native").View;
    const allViews = result.UNSAFE_root.findAllByType(RNView);
    const sliderContainer = allViews.find(
      (v: any) => v.props.onLayout && v.props.style?.paddingVertical === 16,
    );
    if (sliderContainer) {
      fireEvent(sliderContainer, "layout", {
        nativeEvent: { layout: { width: 300, height: 40, x: 0, y: 0 } },
      });
    }

    const minThumbText = result.getByText("3");
    const minThumb = minThumbText.parent!;
    fireEvent(minThumb, "responderGrant", {
      nativeEvent: { pageX: 100 },
      touchHistory: { touchBank: [] },
    });
    fireEvent(minThumb, "responderMove", {
      nativeEvent: { pageX: 130 },
      touchHistory: { touchBank: [] },
    });

    expect(onFretRangeChange).toHaveBeenCalled();
    const call = onFretRangeChange.mock.calls[0][0];
    expect(call[0]).toBeGreaterThanOrEqual(0);
    expect(call[0]).toBeLessThan(12);
    expect(call[1]).toBe(12);
  });

  it("calls onFretRangeChange when max thumb is dragged with valid track width", () => {
    const onFretRangeChange = jest.fn();
    const result = renderHeader({ fretRange: [3, 12], onFretRangeChange });
    openSettings(result);

    const RNView = require("react-native").View;
    const allViews = result.UNSAFE_root.findAllByType(RNView);
    const sliderContainer = allViews.find(
      (v: any) => v.props.onLayout && v.props.style?.paddingVertical === 16,
    );
    if (sliderContainer) {
      fireEvent(sliderContainer, "layout", {
        nativeEvent: { layout: { width: 300, height: 40, x: 0, y: 0 } },
      });
    }

    const maxThumbText = result.getByText("12");
    const maxThumb = maxThumbText.parent!;
    fireEvent(maxThumb, "responderGrant", {
      nativeEvent: { pageX: 250 },
      touchHistory: { touchBank: [] },
    });
    fireEvent(maxThumb, "responderMove", {
      nativeEvent: { pageX: 220 },
      touchHistory: { touchBank: [] },
    });

    expect(onFretRangeChange).toHaveBeenCalled();
    const call = onFretRangeChange.mock.calls[0][0];
    expect(call[0]).toBe(3);
    expect(call[1]).toBeGreaterThan(3);
    expect(call[1]).toBeLessThanOrEqual(14);
  });

  // ── Settings panel content rows ───────────────────────────────────
  it("renders all settings rows (theme, accidental, language, fret range)", () => {
    const result = renderHeader();
    openSettings(result);
    expect(result.getByText("theme")).toBeTruthy();
    expect(result.getByText("accidental")).toBeTruthy();
    expect(result.getByText("language")).toBeTruthy();
    expect(result.getByText("settingsPanel.fretRange")).toBeTruthy();
  });

  // ── handleLocaleChange covers EN selection ────────────────────────
  it("calls changeLocale with 'en' when EN is pressed", () => {
    const { changeLocale } = require("../../../i18n");
    const result = renderHeader();
    openSettings(result);
    fireEvent.press(result.getByText("EN"));
    expect(changeLocale).toHaveBeenCalledWith("en");
  });

  // ── Animation values ──────────────────────────────────────────────
  it("uses Animated.timing for open/close animations", () => {
    const timingSpy = jest.spyOn(Animated, "timing");
    const parallelSpy = jest.spyOn(Animated, "parallel");

    const result = renderHeader();
    fireEvent.press(result.getByTestId("settings-button"));

    expect(parallelSpy).toHaveBeenCalled();
    expect(timingSpy).toHaveBeenCalled();

    timingSpy.mockRestore();
    parallelSpy.mockRestore();
  });

  // ── baseLabelMode underline animation ─────────────────────────────
  it("enters underline animation branch when baseLabelMode changes", () => {
    const result = renderHeader({ baseLabelMode: "note" });

    // Trigger layout events to populate labelLayouts ref
    const noteBtn = result.getByText("header.note").parent!;
    fireEvent(noteBtn, "layout", {
      nativeEvent: { layout: { x: 0, width: 40, height: 20, y: 0 } },
    });
    const degreeBtn = result.getByText("header.degree").parent!;
    fireEvent(degreeBtn, "layout", {
      nativeEvent: { layout: { x: 56, width: 60, height: 20, y: 0 } },
    });

    const timingSpy = jest.spyOn(Animated, "timing");

    // Rerender with different baseLabelMode to trigger the animation branch
    result.rerender(<HeaderBar {...defaultProps} baseLabelMode="degree" />);
    act(() => {
      jest.runAllTimers();
    });

    expect(timingSpy).toHaveBeenCalled();
    timingSpy.mockRestore();
  });

  // ── rootNote bounce animation ─────────────────────────────────────
  it("triggers bounce animation when rootNote changes", () => {
    const springSpy = jest.spyOn(Animated, "spring");
    const result = renderHeader({ rootNote: "C" });

    result.rerender(<HeaderBar {...defaultProps} rootNote="D" />);
    act(() => {
      jest.runAllTimers();
    });

    expect(springSpy).toHaveBeenCalled();
    springSpy.mockRestore();
  });

  // ── Root stepper buttons ──────────────────────────────────────────
  it("renders stepper ‹ and › buttons", () => {
    const { getByText } = renderHeader();
    expect(getByText("‹")).toBeTruthy();
    expect(getByText("›")).toBeTruthy();
  });

  it("calls onRootNoteChange when ‹ stepper is pressed", () => {
    const onRootNoteChange = jest.fn();
    const { getByText } = renderHeader({ rootNote: "C", onRootNoteChange });
    fireEvent.press(getByText("‹"));
    expect(onRootNoteChange).toHaveBeenCalledWith("B");
  });

  it("calls onRootNoteChange when › stepper is pressed", () => {
    const onRootNoteChange = jest.fn();
    const { getByText } = renderHeader({ rootNote: "C", onRootNoteChange });
    fireEvent.press(getByText("›"));
    expect(onRootNoteChange).toHaveBeenCalledWith("C♯");
  });

  // ── rootChangeDisabled disables stepper buttons ───────────────────
  it("hides stepper buttons when rootChangeDisabled is true", () => {
    const { queryByText } = renderHeader({ rootChangeDisabled: true });
    expect(queryByText("‹")).toBeNull();
    expect(queryByText("›")).toBeNull();
  });

  // ── Note/Degree toggle callbacks ──────────────────────────────────
  it("calls onBaseLabelModeChange with 'note' when note toggle is pressed", () => {
    const onBaseLabelModeChange = jest.fn();
    const { getByText } = renderHeader({ baseLabelMode: "degree", onBaseLabelModeChange });
    fireEvent.press(getByText("header.note"));
    expect(onBaseLabelModeChange).toHaveBeenCalledWith("note");
  });

  it("calls onBaseLabelModeChange with 'degree' when degree toggle is pressed", () => {
    const onBaseLabelModeChange = jest.fn();
    const { getByText } = renderHeader({ baseLabelMode: "note", onBaseLabelModeChange });
    fireEvent.press(getByText("header.degree"));
    expect(onBaseLabelModeChange).toHaveBeenCalledWith("degree");
  });

  // ── Degree button initial layout when baseLabelMode is degree ─────
  it("sets initial underline position when baseLabelMode is degree on mount", () => {
    const result = renderHeader({ baseLabelMode: "degree" });
    // Trigger layout event on the degree button to cover the initial underline branch
    const degreeBtn = result.getByText("header.degree").parent!;
    fireEvent(degreeBtn, "layout", {
      nativeEvent: { layout: { x: 56, width: 60, height: 20, y: 0 } },
    });
    // The degree text should be rendered with active styling
    expect(result.getByText("header.degree")).toBeTruthy();
  });

  // ── Quiz kind dropdown in quiz mode ───────────────────────────────
  it("renders quiz kind dropdown when in quiz mode with quiz props", () => {
    const onQuizKindChange = jest.fn();
    const { getByText } = renderHeader({
      showQuiz: true,
      quizKindValue: "note",
      quizKindOptions: [
        { value: "note", label: "Note" },
        { value: "chord", label: "Chord" },
      ],
      onQuizKindChange,
    });
    // The DropdownSelect renders the current value label as text
    expect(getByText("Note")).toBeTruthy();
  });

  it("does not render quiz kind dropdown when not in quiz mode", () => {
    const { queryByText } = renderHeader({
      showQuiz: false,
      quizKindValue: "note",
      quizKindOptions: [
        { value: "note", label: "Note" },
        { value: "chord", label: "Chord" },
      ],
      onQuizKindChange: jest.fn(),
    });
    // DropdownSelect should not be visible; note/degree toggle should be shown instead
    expect(queryByText("header.note")).toBeTruthy();
  });
});
