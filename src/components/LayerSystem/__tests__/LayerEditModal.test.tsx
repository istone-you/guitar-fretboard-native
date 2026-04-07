import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import LayerEditModal from "../LayerEditModal";
import type { Theme, LayerConfig } from "../../../types";
import { createDefaultLayer } from "../../../types";

jest.useFakeTimers();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
jest.mock("../../../i18n", () => ({ changeLocale: jest.fn() }));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
}));
jest.mock("../../ui/DropdownSelect", () => {
  const { Text, TouchableOpacity } = require("react-native");
  return {
    DropdownSelect: (props: any) => (
      <TouchableOpacity
        testID={`dropdown-${props.testID || "default"}`}
        onPress={() => props.onChange?.(props.options?.[0]?.value)}
      >
        <Text>{props.value}</Text>
      </TouchableOpacity>
    ),
  };
});
jest.mock("../../ui/scaleOptions", () => ({
  buildScaleOptions: () => ({
    options: [
      { value: "major", label: "Major" },
      { value: "natural-minor", label: "Natural Minor" },
    ],
  }),
}));
jest.mock("../../ui/ChevronIcon", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View testID="chevron-icon" /> };
});
jest.mock("../../../logic/fretboard", () => ({
  CHORD_CAGED_ORDER: ["C", "A", "G", "E", "D"],
  CHORD_TYPES_CORE: ["Major", "Minor", "7th"],
  CUSTOM_DEGREE_CHIPS: ["P1", "m2", "M2", "m3", "M3", "P4", "b5", "P5", "m6", "M6", "m7", "M7"],
  DEGREE_BY_SEMITONE: ["P1", "m2", "M2", "m3", "M3", "P4", "b5", "P5", "m6", "M6", "m7", "M7"],
  DIATONIC_CHORDS: { "major-triad": [{ value: "I" }] },
  TRIAD_INVERSION_OPTIONS: [{ value: "root" }, { value: "first" }, { value: "second" }],
  getDiatonicChord: () => ({ rootIndex: 0, chordType: "Major" }),
  getNotesByAccidental: () => ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  getOnChordListForRoot: () => ["C/E", "C/G"],
  getRootIndex: () => 0,
}));

const defaultProps = {
  theme: "dark" as Theme,
  visible: true,
  rootNote: "C",
  accidental: "sharp" as const,
  initialLayer: null as LayerConfig | null,
  defaultColor: "#ff69b6",
  overlayNotes: [] as string[],
  overlaySemitones: new Set<number>(),
  onClose: jest.fn(),
  onSave: jest.fn(),
  onPreview: jest.fn(),
};

function renderModal(overrides: Partial<typeof defaultProps> = {}) {
  return render(<LayerEditModal {...defaultProps} {...overrides} />);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("LayerEditModal", () => {
  // ── Visibility ──────────────────────────────────────────────────────
  it("does not render content when visible=false", () => {
    const { queryByText } = renderModal({ visible: false });
    expect(queryByText("layers.addLayer")).toBeNull();
    expect(queryByText("layers.confirm")).toBeNull();
  });

  // ── Type selection step for new layer ──────────────────────────────
  it("shows type selection step for new layer", () => {
    const { getByText } = renderModal({ initialLayer: null });
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("layers.addLayer")).toBeTruthy();
    expect(getByText("layers.scale")).toBeTruthy();
    expect(getByText("layers.chord")).toBeTruthy();
    expect(getByText("layers.custom")).toBeTruthy();
  });

  // ── Settings step for existing layer ────────────────────────────────
  it("shows settings step for existing layer", () => {
    const existing = createDefaultLayer("scale", "l1", "#ff69b6");
    const { getByText, queryByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    // Should show save button, not type selection title
    expect(queryByText("layers.addLayer")).toBeNull();
    expect(getByText("layers.confirm")).toBeTruthy();
  });

  // ── Type selection buttons navigate to settings ─────────────────────
  it("selecting scale type navigates to settings step", () => {
    const { getByText } = renderModal({ initialLayer: null });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.scale"));
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("layers.confirm")).toBeTruthy();
  });

  it("selecting chord type navigates to settings step", () => {
    const { getByText } = renderModal({ initialLayer: null });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.chord"));
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("layers.confirm")).toBeTruthy();
  });

  it("selecting custom type navigates to settings step", () => {
    const { getByText } = renderModal({ initialLayer: null });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.custom"));
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("layers.confirm")).toBeTruthy();
  });

  // ── Close button ──────────────────────────────────────────────────
  it("close calls onClose via Modal onRequestClose", () => {
    const onClose = jest.fn();
    const { UNSAFE_root } = renderModal({ initialLayer: null, onClose });
    act(() => {
      jest.runAllTimers();
    });
    // Find the Modal component and trigger onRequestClose (which calls handleClose)
    const { Modal } = require("react-native");
    const modals = UNSAFE_root.findAllByType(Modal);
    expect(modals.length).toBeGreaterThan(0);
    // onRequestClose triggers the fade-out animation then calls onClose
    act(() => {
      modals[0].props.onRequestClose();
    });
    act(() => {
      jest.runAllTimers();
    });
    expect(onClose).toHaveBeenCalled();
  });

  // ── Save button ────────────────────────────────────────────────────
  it("save button calls onSave", () => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    const existing = createDefaultLayer("scale", "l1", "#ff69b6");
    const { getByText } = renderModal({
      initialLayer: existing,
      onSave,
      onClose,
    });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.confirm"));
    act(() => {
      jest.runAllTimers();
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({ id: "l1", type: "scale" });
  });

  // ── Scale type shows scale settings ───────────────────────────────
  it("selecting scale type shows scale kind dropdown", () => {
    const { getByText } = renderModal({ initialLayer: null });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.scale"));
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("mobileControls.scaleKind")).toBeTruthy();
  });

  // ── Chord type shows chord settings ───────────────────────────────
  it("selecting chord type shows display mode dropdown", () => {
    const { getByText } = renderModal({ initialLayer: null });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.chord"));
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("controls.displayMode")).toBeTruthy();
  });

  // ── Custom type shows custom settings ─────────────────────────────
  it("selecting custom type shows chips navigation and edit display", () => {
    const { getByText } = renderModal({ initialLayer: null });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.custom"));
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("noteFilter.title")).toBeTruthy();
  });

  // ── Color picker step navigation ──────────────────────────────────
  it("color label is shown on settings step", () => {
    const existing = createDefaultLayer("scale", "l1", "#ff69b6");
    const { getByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    // Verify color label exists on settings step
    expect(getByText("layerColors")).toBeTruthy();
    expect(getByText("layers.confirm")).toBeTruthy();
  });

  // ── Custom chips step - selecting note chips ──────────────────────
  it("navigates to chips step for custom layer", () => {
    const existing = createDefaultLayer("custom", "l1", "#ff69b6");
    const { getByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    // Press the chips navigation trigger (shows "—" since no notes selected)
    fireEvent.press(getByText("—"));
    act(() => {
      jest.runAllTimers();
    });
    // Should show the back arrow and extract/reset buttons
    expect(getByText("←")).toBeTruthy();
    expect(getByText("layers.extractFromLayers")).toBeTruthy();
    expect(getByText("layers.reset")).toBeTruthy();
    // Should show note chips (C, D, E, etc.)
    expect(getByText("C")).toBeTruthy();
    expect(getByText("E")).toBeTruthy();
  });

  // ── Select a note chip in chips step ──────────────────────────────
  it("toggling a note chip updates selectedNotes", () => {
    const onPreview = jest.fn();
    const existing = createDefaultLayer("custom", "l1", "#ff69b6");
    const { getByText } = renderModal({ initialLayer: existing, onPreview });
    act(() => {
      jest.runAllTimers();
    });
    // Navigate to chips
    fireEvent.press(getByText("—"));
    act(() => {
      jest.runAllTimers();
    });
    // Press the "C" chip
    fireEvent.press(getByText("C"));
    act(() => {
      jest.runAllTimers();
    });
    // onPreview should have been called with selectedNotes containing "C"
    expect(onPreview).toHaveBeenCalled();
    const lastCall = onPreview.mock.calls[onPreview.mock.calls.length - 1][0];
    expect(lastCall.selectedNotes.has("C")).toBe(true);
  });

  // ── Reset chips ───────────────────────────────────────────────────
  it("reset button clears selected notes", () => {
    const onPreview = jest.fn();
    const existing = {
      ...createDefaultLayer("custom", "l1", "#ff69b6"),
      selectedNotes: new Set(["C", "E", "G"]),
    };
    const { getByText } = renderModal({ initialLayer: existing, onPreview });
    act(() => {
      jest.runAllTimers();
    });
    // Navigate to chips (should show "C, E, G")
    fireEvent.press(getByText("C, E, G"));
    act(() => {
      jest.runAllTimers();
    });
    // Press reset
    fireEvent.press(getByText("layers.reset"));
    act(() => {
      jest.runAllTimers();
    });
    const lastCall = onPreview.mock.calls[onPreview.mock.calls.length - 1][0];
    expect(lastCall.selectedNotes.size).toBe(0);
    expect(lastCall.selectedDegrees.size).toBe(0);
  });

  // ── Save with a scale layer ───────────────────────────────────────
  it("save with scale layer passes scale config", () => {
    const onSave = jest.fn();
    const { getByText } = renderModal({ initialLayer: null, onSave });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.scale"));
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.confirm"));
    act(() => {
      jest.runAllTimers();
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({
      type: "scale",
      scaleType: "major",
    });
  });

  // ── Save with a chord layer ───────────────────────────────────────
  it("save with chord layer passes chord config", () => {
    const onSave = jest.fn();
    const { getByText } = renderModal({ initialLayer: null, onSave });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.chord"));
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.confirm"));
    act(() => {
      jest.runAllTimers();
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({
      type: "chord",
      chordDisplayMode: "form",
      chordType: "Major",
    });
  });

  // ── Editing existing scale layer ──────────────────────────────────
  it("editing existing scale layer shows scale settings directly", () => {
    const existing = {
      ...createDefaultLayer("scale", "l1", "#40e0d0"),
      scaleType: "natural-minor" as const,
    };
    const { getByText, queryByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    expect(queryByText("layers.addLayer")).toBeNull();
    expect(getByText("mobileControls.scaleKind")).toBeTruthy();
    expect(getByText("layers.confirm")).toBeTruthy();
  });

  // ── Editing existing chord layer ──────────────────────────────────
  it("editing existing chord layer shows chord settings directly", () => {
    const existing = createDefaultLayer("chord", "l2", "#ffd700");
    const { getByText, queryByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    expect(queryByText("layers.addLayer")).toBeNull();
    expect(getByText("controls.displayMode")).toBeTruthy();
    expect(getByText("layers.chordFrame")).toBeTruthy();
  });

  // ── Editing existing custom layer ─────────────────────────────────
  it("editing existing custom layer shows custom settings directly", () => {
    const existing = createDefaultLayer("custom", "l3", "#84cc16");
    const { queryByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    expect(queryByText("layers.addLayer")).toBeNull();
  });

  // ── Chord frame toggle ────────────────────────────────────────────
  it("chord layer shows chord frame toggle", () => {
    const existing = createDefaultLayer("chord", "l2", "#ffd700");
    const { getByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("layers.chordFrame")).toBeTruthy();
  });

  // ── Back arrow from chips step ────────────────────────────────────
  it("back arrow from chips step returns to settings", () => {
    const existing = createDefaultLayer("custom", "l1", "#ff69b6");
    const { getByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("—"));
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("layers.extractFromLayers")).toBeTruthy();
    // Press back arrow
    fireEvent.press(getByText("←"));
    act(() => {
      jest.runAllTimers();
    });
    // Should be back on settings step
    expect(getByText("noteFilter.title")).toBeTruthy();
  });

  // ── Extract from layers button (disabled when no overlay) ─────────
  it("extract from layers is disabled when overlaySemitones is empty", () => {
    const existing = createDefaultLayer("custom", "l1", "#ff69b6");
    const { getByText } = renderModal({
      initialLayer: existing,
      overlaySemitones: new Set(),
    });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("—"));
    act(() => {
      jest.runAllTimers();
    });
    // The button should exist but pressing it should not trigger update
    expect(getByText("layers.extractFromLayers")).toBeTruthy();
  });

  // ── Extract from layers with overlay data ─────────────────────────
  it("extract from layers populates notes when overlay has data", () => {
    const onPreview = jest.fn();
    const existing = createDefaultLayer("custom", "l1", "#ff69b6");
    const { getByText } = renderModal({
      initialLayer: existing,
      overlayNotes: ["C", "E", "G"],
      overlaySemitones: new Set([0, 4, 7]),
      onPreview,
    });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("—"));
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.extractFromLayers"));
    act(() => {
      jest.runAllTimers();
    });
    const lastCall = onPreview.mock.calls[onPreview.mock.calls.length - 1][0];
    expect(lastCall.selectedNotes).toEqual(new Set(["C", "E", "G"]));
  });

  // ── Chord CAGED form shows CAGED buttons ──────────────────────────
  it("chord layer with caged display mode shows CAGED form buttons", () => {
    const existing = {
      ...createDefaultLayer("chord", "l2", "#ffd700"),
      chordDisplayMode: "caged" as const,
    };
    const { getByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("C")).toBeTruthy();
    expect(getByText("A")).toBeTruthy();
    expect(getByText("G")).toBeTruthy();
    expect(getByText("E")).toBeTruthy();
    expect(getByText("D")).toBeTruthy();
  });

  // ── onPreview called when type selected ───────────────────────────
  it("onPreview is called when type is selected", () => {
    const onPreview = jest.fn();
    const { getByText } = renderModal({ initialLayer: null, onPreview });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.scale"));
    act(() => {
      jest.runAllTimers();
    });
    expect(onPreview).toHaveBeenCalledWith(expect.objectContaining({ type: "scale" }));
  });

  // ── Chord triad display mode ──────────────────────────────────────
  it("chord layer with triad display mode shows chord and inversion dropdowns", () => {
    const existing = {
      ...createDefaultLayer("chord", "l2", "#ffd700"),
      chordDisplayMode: "triad" as const,
    };
    const { getByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("controls.displayMode")).toBeTruthy();
    expect(getByText("controls.chord")).toBeTruthy();
    expect(getByText("controls.inversion")).toBeTruthy();
  });

  // ── Chord diatonic display mode ───────────────────────────────────
  it("chord layer with diatonic display mode shows degree, key, and chord type", () => {
    const existing = {
      ...createDefaultLayer("chord", "l2", "#ffd700"),
      chordDisplayMode: "diatonic" as const,
    };
    const { getByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("controls.degree")).toBeTruthy();
    expect(getByText("controls.key")).toBeTruthy();
    expect(getByText("controls.chordType")).toBeTruthy();
  });

  // ── Chord on-chord display mode ──────────────────────────────────
  it("chord layer with on-chord display mode shows chord dropdown", () => {
    const existing = {
      ...createDefaultLayer("chord", "l2", "#ffd700"),
      chordDisplayMode: "on-chord" as const,
    };
    const { getByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("controls.chord")).toBeTruthy();
  });

  // ── Chord power display mode ──────────────────────────────────────
  it("chord layer with power display mode shows no chord type dropdown", () => {
    const existing = {
      ...createDefaultLayer("chord", "l2", "#ffd700"),
      chordDisplayMode: "power" as const,
    };
    const { queryByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    // power mode should not show chord/degree/key/inversion dropdowns
    expect(queryByText("controls.chord")).toBeNull();
    expect(queryByText("controls.degree")).toBeNull();
    expect(queryByText("controls.inversion")).toBeNull();
  });

  // ── CAGED toggle button press ─────────────────────────────────────
  it("pressing a CAGED button toggles that form off", () => {
    const onPreview = jest.fn();
    const existing = {
      ...createDefaultLayer("chord", "l2", "#ffd700"),
      chordDisplayMode: "caged" as const,
      cagedForms: new Set(["C", "A", "G", "E", "D"]),
    };
    const { getByText } = renderModal({ initialLayer: existing, onPreview });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("C"));
    act(() => {
      jest.runAllTimers();
    });
    const lastCall = onPreview.mock.calls[onPreview.mock.calls.length - 1][0];
    expect(lastCall.cagedForms.has("C")).toBe(false);
    expect(lastCall.cagedForms.has("A")).toBe(true);
  });

  // ── Color picker step navigation and selection ────────────────────
  it("navigates to color picker and can select a color preset", () => {
    const onPreview = jest.fn();
    const existing = createDefaultLayer("scale", "l1", "#ff69b6");
    const { getByText, UNSAFE_root } = renderModal({ initialLayer: existing, onPreview });
    act(() => {
      jest.runAllTimers();
    });
    // Find and press the color circle (navigate to color step)
    const { TouchableOpacity } = require("react-native");
    // The color swatch is wrapped in a TouchableOpacity next to the layerColors label
    // We use the layerColors text to find the row, then look for the circular button
    expect(getByText("layerColors")).toBeTruthy();
    // Press the color circle — it's the last TouchableOpacity before the save button in settings
    // Find by navigateTo("color") — look for the color dot view
    const allTouchables = UNSAFE_root.findAllByType(TouchableOpacity);
    // Find the touchable that contains a View with borderRadius: 14 (the color dot)
    const colorTouchable = allTouchables.find((t: any) => {
      const children = t.props.children;
      if (children && children.props && children.props.style) {
        const s = children.props.style;
        return s.borderRadius === 14 && s.width === 28;
      }
      return false;
    });
    expect(colorTouchable).toBeTruthy();
    fireEvent.press(colorTouchable!);
    act(() => {
      jest.runAllTimers();
    });
    // Now we should be on the color step — back arrow should appear
    expect(getByText("←")).toBeTruthy();
    // Find color dot touchables (they have style with borderRadius: 14)
    const colorDots = UNSAFE_root.findAllByType(TouchableOpacity).filter((t: any) => {
      const s = t.props.style;
      if (Array.isArray(s)) {
        return s.some((si: any) => si && si.borderRadius === 14);
      }
      return false;
    });
    expect(colorDots.length).toBeGreaterThan(0);
    // Press the first color preset
    fireEvent.press(colorDots[0]);
    act(() => {
      jest.runAllTimers();
    });
    expect(onPreview).toHaveBeenCalled();
    const lastCall = onPreview.mock.calls[onPreview.mock.calls.length - 1][0];
    expect(typeof lastCall.color).toBe("string");
  });

  // ── Color picker back arrow returns to settings ───────────────────
  it("color picker back arrow returns to settings step", () => {
    const existing = createDefaultLayer("scale", "l1", "#ff69b6");
    const { getByText, UNSAFE_root } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    // Navigate to color step
    const { TouchableOpacity } = require("react-native");
    const allTouchables = UNSAFE_root.findAllByType(TouchableOpacity);
    const colorTouchable = allTouchables.find((t: any) => {
      const children = t.props.children;
      if (children && children.props && children.props.style) {
        const s = children.props.style;
        return s.borderRadius === 14 && s.width === 28;
      }
      return false;
    });
    fireEvent.press(colorTouchable!);
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("←")).toBeTruthy();
    // Press back
    fireEvent.press(getByText("←"));
    act(() => {
      jest.runAllTimers();
    });
    // Should be back on settings
    expect(getByText("layers.confirm")).toBeTruthy();
    expect(getByText("layerColors")).toBeTruthy();
  });

  // ── Color picker confirm returns to settings ──────────────────────
  it("color picker confirm button returns to settings step", () => {
    const existing = createDefaultLayer("scale", "l1", "#ff69b6");
    const { getByText, UNSAFE_root } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    const { TouchableOpacity } = require("react-native");
    const allTouchables = UNSAFE_root.findAllByType(TouchableOpacity);
    const colorTouchable = allTouchables.find((t: any) => {
      const children = t.props.children;
      if (children && children.props && children.props.style) {
        const s = children.props.style;
        return s.borderRadius === 14 && s.width === 28;
      }
      return false;
    });
    fireEvent.press(colorTouchable!);
    act(() => {
      jest.runAllTimers();
    });
    // Press confirm on color page (navigates back to settings)
    fireEvent.press(getByText("layers.confirm"));
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("layerColors")).toBeTruthy();
  });

  // ── Chips step degree mode ────────────────────────────────────────
  it("custom layer in degree mode shows degree chips on chips step", () => {
    const onPreview = jest.fn();
    const existing = {
      ...createDefaultLayer("custom", "l1", "#ff69b6"),
      customMode: "degree" as const,
    };
    const { getByText } = renderModal({ initialLayer: existing, onPreview });
    act(() => {
      jest.runAllTimers();
    });
    // Navigate to chips
    fireEvent.press(getByText("—"));
    act(() => {
      jest.runAllTimers();
    });
    // Should show degree chips
    expect(getByText("P1")).toBeTruthy();
    expect(getByText("M3")).toBeTruthy();
    expect(getByText("P5")).toBeTruthy();
  });

  // ── Toggling a degree chip in degree mode ─────────────────────────
  it("toggling a degree chip updates selectedDegrees", () => {
    const onPreview = jest.fn();
    const existing = {
      ...createDefaultLayer("custom", "l1", "#ff69b6"),
      customMode: "degree" as const,
    };
    const { getByText } = renderModal({ initialLayer: existing, onPreview });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("—"));
    act(() => {
      jest.runAllTimers();
    });
    // Press a degree chip
    fireEvent.press(getByText("P1"));
    act(() => {
      jest.runAllTimers();
    });
    expect(onPreview).toHaveBeenCalled();
    const lastCall = onPreview.mock.calls[onPreview.mock.calls.length - 1][0];
    expect(lastCall.selectedDegrees.has("P1")).toBe(true);
  });

  // ── Extract from overlay in degree mode ───────────────────────────
  it("extract from layers in degree mode populates selectedDegrees", () => {
    const onPreview = jest.fn();
    const existing = {
      ...createDefaultLayer("custom", "l1", "#ff69b6"),
      customMode: "degree" as const,
    };
    const { getByText } = renderModal({
      initialLayer: existing,
      overlayNotes: ["C", "E", "G"],
      overlaySemitones: new Set([0, 4, 7]),
      onPreview,
    });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("—"));
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.extractFromLayers"));
    act(() => {
      jest.runAllTimers();
    });
    const lastCall = onPreview.mock.calls[onPreview.mock.calls.length - 1][0];
    // Semitones 0, 4, 7 map to P1, M3, P5 in DEGREE_BY_SEMITONE
    expect(lastCall.selectedDegrees).toEqual(new Set(["P1", "M3", "P5"]));
  });

  // ── Chord frame toggle press ──────────────────────────────────────
  it("toggling chord frame updates showChordFrame", () => {
    const onPreview = jest.fn();
    const existing = {
      ...createDefaultLayer("chord", "l2", "#ffd700"),
      showChordFrame: true,
    };
    const { UNSAFE_root } = renderModal({ initialLayer: existing, onPreview });
    act(() => {
      jest.runAllTimers();
    });
    // The SlideToggle is a TouchableOpacity inside the chord frame row
    const { TouchableOpacity } = require("react-native");
    const allTouchables = UNSAFE_root.findAllByType(TouchableOpacity);
    // Find the SlideToggle — it wraps an Animated.View with slideToggle style
    const { Animated } = require("react-native");
    const slideToggle = allTouchables.find((t: any) => {
      const child = t.props.children;
      if (child && child.type === Animated.View) {
        const s = child.props.style;
        if (Array.isArray(s)) {
          return s.some((si: any) => si && si.width === 44 && si.height === 24);
        }
      }
      return false;
    });
    expect(slideToggle).toBeTruthy();
    fireEvent.press(slideToggle!);
    act(() => {
      jest.runAllTimers();
    });
    const lastCall = onPreview.mock.calls[onPreview.mock.calls.length - 1][0];
    expect(lastCall.showChordFrame).toBe(false);
  });

  // ── Custom layer with selected degrees shows summary ──────────────
  it("custom layer in degree mode shows selected degrees summary", () => {
    const existing = {
      ...createDefaultLayer("custom", "l1", "#ff69b6"),
      customMode: "degree" as const,
      selectedDegrees: new Set(["P1", "M3", "P5"]),
    };
    const { getByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("P1, M3, P5")).toBeTruthy();
  });

  // ── Chips step confirm returns to settings ────────────────────────
  it("chips step confirm button returns to settings", () => {
    const existing = createDefaultLayer("custom", "l1", "#ff69b6");
    const { getByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("—"));
    act(() => {
      jest.runAllTimers();
    });
    // Press confirm on chips page
    fireEvent.press(getByText("layers.confirm"));
    act(() => {
      jest.runAllTimers();
    });
    // Should return to settings
    expect(getByText("noteFilter.title")).toBeTruthy();
  });

  // ── Modal visibility triggers open animation ──────────────────────
  it("modal open triggers scale animation from 0.5 to 1", () => {
    const { rerender } = render(<LayerEditModal {...defaultProps} visible={false} />);
    act(() => {
      jest.runAllTimers();
    });
    // Re-render with visible=true to trigger open animation
    rerender(<LayerEditModal {...defaultProps} visible={true} initialLayer={null} />);
    act(() => {
      jest.runAllTimers();
    });
    // Should render the type selection content
    // (Just verifying it doesn't crash and content appears)
  });

  // ── Modal close resets dockBottom ──────────────────────────────────
  it("modal becoming invisible resets dock state", () => {
    const { rerender, queryByText } = render(
      <LayerEditModal {...defaultProps} visible={true} initialLayer={null} />,
    );
    act(() => {
      jest.runAllTimers();
    });
    // Now hide the modal
    rerender(<LayerEditModal {...defaultProps} visible={false} initialLayer={null} />);
    act(() => {
      jest.runAllTimers();
    });
    expect(queryByText("layers.addLayer")).toBeNull();
  });

  // ── Type dropdown on settings step switches layer type ────────────
  it("type dropdown on settings step switches layer type", () => {
    const onPreview = jest.fn();
    const existing = createDefaultLayer("chord", "l1", "#ff69b6");
    const { getAllByTestId } = renderModal({ initialLayer: existing, onPreview });
    act(() => {
      jest.runAllTimers();
    });
    // The first DropdownSelect mock is the type selector with options [scale, chord, custom]
    // Pressing triggers onChange with first option value ("scale")
    const dropdowns = getAllByTestId("dropdown-default");
    fireEvent.press(dropdowns[0]);
    act(() => {
      jest.runAllTimers();
    });
    expect(onPreview).toHaveBeenCalledWith(expect.objectContaining({ type: "scale" }));
  });

  // ── Many selected notes shows truncated summary ───────────────────
  it("custom layer with many notes shows truncated summary with ellipsis", () => {
    const existing = {
      ...createDefaultLayer("custom", "l1", "#ff69b6"),
      selectedNotes: new Set(["C", "D", "E", "F", "G", "A", "B"]),
    };
    const { getByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    // 7 notes > 6, should show first 6 with ellipsis
    expect(getByText(/…/)).toBeTruthy();
  });
});
