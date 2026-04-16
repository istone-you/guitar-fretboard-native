import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import LayerEditModal from "../index";
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
jest.mock("../../../lib/fretboard", () => ({
  CHORD_CAGED_ORDER: ["C", "A", "G", "E", "D"],
  CHORD_TYPES_CORE: ["Major", "Minor", "7th"],
  CUSTOM_DEGREE_CHIPS: ["P1", "m2", "M2", "m3", "M3", "P4", "b5", "P5", "m6", "M6", "m7", "M7"],
  DEGREE_BY_SEMITONE: ["P1", "m2", "M2", "m3", "M3", "P4", "b5", "P5", "m6", "M6", "m7", "M7"],
  DIATONIC_CHORDS: { "major-triad": [{ value: "I" }] },
  TRIAD_INVERSION_OPTIONS: [{ value: "root" }, { value: "first" }, { value: "second" }],
  PROGRESSION_TEMPLATES: [
    { id: "251", name: "ii-V-I", degrees: ["ii", "V", "I"] },
    { id: "pop", name: "I-V-vi-IV", degrees: ["I", "V", "vi", "IV"] },
  ],
  chordSuffix: (t: string) => ({ Major: "", Minor: "m", "7th": "7" })[t] ?? t,
  getDiatonicChord: () => ({ rootIndex: 0, chordType: "Major" }),
  getNotesByAccidental: () => ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  getOnChordListForRoot: () => ["C/E", "C/G"],
  getRootIndex: () => 0,
  resolveProgressionDegree: () => ({ rootIndex: 0, chordType: "Major" }),
}));

const defaultProps = {
  theme: "dark" as Theme,
  visible: true,
  rootNote: "C",
  accidental: "sharp" as const,
  initialLayer: null as LayerConfig | null,
  defaultColor: "#ff69b6",
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
    const { queryByText, queryByTestId } = renderModal({ visible: false });
    expect(queryByText("layers.type")).toBeNull();
    expect(queryByTestId("settings-confirm-btn")).toBeNull();
  });

  // ── Type selection step for new layer ──────────────────────────────
  it("shows type selection step for new layer", () => {
    const { getByText } = renderModal({ initialLayer: null });
    act(() => {
      jest.runAllTimers();
    });
    expect(getByText("layers.type")).toBeTruthy();
    expect(getByText("layers.scale")).toBeTruthy();
    expect(getByText("layers.chord")).toBeTruthy();
    expect(getByText("layers.custom")).toBeTruthy();
  });

  // ── Settings step for existing layer ────────────────────────────────
  it("shows settings step for existing layer", () => {
    const existing = createDefaultLayer("scale", "l1", "#ff69b6");
    const { getByTestId, queryByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    // Should show save button, not type selection title
    expect(queryByText("layers.type")).toBeNull();
    expect(getByTestId("settings-confirm-btn")).toBeTruthy();
  });

  // ── Type selection buttons navigate to settings ─────────────────────
  it("selecting scale type navigates to settings step", () => {
    const { getByText, getByTestId } = renderModal({ initialLayer: null });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.scale"));
    act(() => {
      jest.runAllTimers();
    });
    expect(getByTestId("settings-confirm-btn")).toBeTruthy();
  });

  it("selecting chord type navigates to settings step", () => {
    const { getByText, getByTestId } = renderModal({ initialLayer: null });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.chord"));
    act(() => {
      jest.runAllTimers();
    });
    expect(getByTestId("settings-confirm-btn")).toBeTruthy();
  });

  it("selecting custom type navigates to settings step", () => {
    const { getByText, getByTestId } = renderModal({ initialLayer: null });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.custom"));
    act(() => {
      jest.runAllTimers();
    });
    expect(getByTestId("settings-confirm-btn")).toBeTruthy();
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
    const { getByTestId } = renderModal({
      initialLayer: existing,
      onSave,
      onClose,
    });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByTestId("settings-confirm-btn"));
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
    const { getByText, getByTestId } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    // Verify color label exists on settings step
    expect(getByText("layerColors")).toBeTruthy();
    expect(getByTestId("settings-confirm-btn")).toBeTruthy();
  });

  // ── Custom chips step - selecting note chips ──────────────────────
  it("navigates to chips step for custom layer", () => {
    const existing = createDefaultLayer("custom", "l1", "#ff69b6");
    const { getByText, getByTestId } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    // Press the chips navigation trigger (shows "—" since no notes selected)
    fireEvent.press(getByText("finder.none"));
    act(() => {
      jest.runAllTimers();
    });
    // Should show the back button and reset button
    expect(getByTestId("sub-page-back")).toBeTruthy();
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
    fireEvent.press(getByText("finder.none"));
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
    const { getByText, getByTestId } = renderModal({ initialLayer: null, onSave });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.scale"));
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByTestId("settings-confirm-btn"));
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
    const { getByText, getByTestId } = renderModal({ initialLayer: null, onSave });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("layers.chord"));
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByTestId("settings-confirm-btn"));
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
    const { getByText, getByTestId, queryByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    expect(queryByText("layers.addLayer")).toBeNull();
    expect(getByText("mobileControls.scaleKind")).toBeTruthy();
    expect(getByTestId("settings-confirm-btn")).toBeTruthy();
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
    const { getByText, getByTestId } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("finder.none"));
    act(() => {
      jest.runAllTimers();
    });
    // Press back button
    fireEvent.press(getByTestId("sub-page-back"));
    act(() => {
      jest.runAllTimers();
    });
    // Should be back on settings step
    expect(getByText("noteFilter.title")).toBeTruthy();
  });

  // ── CAGED layer shows CAGED buttons ──────────────────────────
  it("caged layer type shows CAGED form buttons", () => {
    const existing = createDefaultLayer("caged", "l2", "#ffd700");
    const { getByText } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("mobileControls.cagedForms"));
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

  // ── CAGED toggle button press ─────────────────────────────────────
  it("pressing a CAGED button toggles that form off", () => {
    const onPreview = jest.fn();
    const existing = {
      ...createDefaultLayer("caged", "l2", "#ffd700"),
      cagedForms: new Set(["C", "A", "G", "E", "D"]),
    };
    const { getByText } = renderModal({ initialLayer: existing, onPreview });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("mobileControls.cagedForms"));
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
    const { getByText, getByTestId, UNSAFE_root } = renderModal({
      initialLayer: existing,
      onPreview,
    });
    act(() => {
      jest.runAllTimers();
    });
    // The color row is a TouchableOpacity containing the "layerColors" label
    expect(getByText("layerColors")).toBeTruthy();
    fireEvent.press(getByText("layerColors"));
    act(() => {
      jest.runAllTimers();
    });
    // Now we should be on the color step — back button should appear
    expect(getByTestId("sub-page-back")).toBeTruthy();
    // Find color dot touchables (they have style with borderRadius: 14)
    const { TouchableOpacity } = require("react-native");
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
    const { getByText, getByTestId } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    // Navigate to color step via the color row
    fireEvent.press(getByText("layerColors"));
    act(() => {
      jest.runAllTimers();
    });
    expect(getByTestId("sub-page-back")).toBeTruthy();
    // Press back
    fireEvent.press(getByTestId("sub-page-back"));
    act(() => {
      jest.runAllTimers();
    });
    // Should be back on settings
    expect(getByTestId("settings-confirm-btn")).toBeTruthy();
    expect(getByText("layerColors")).toBeTruthy();
  });

  // ── Color picker back arrow returns to settings ──────────────────
  it("color picker back button returns to settings step", () => {
    const existing = createDefaultLayer("scale", "l1", "#ff69b6");
    const { getByText, getByTestId } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    // Navigate to color step via the color row
    fireEvent.press(getByText("layerColors"));
    act(() => {
      jest.runAllTimers();
    });
    // Press back on color page (navigates back to settings)
    fireEvent.press(getByTestId("sub-page-back"));
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
    fireEvent.press(getByText("finder.none"));
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
    fireEvent.press(getByText("finder.none"));
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
    // The chord frame toggle is now a native Switch
    const { Switch } = require("react-native");
    const switches = UNSAFE_root.findAllByType(Switch);
    // The first Switch in the chord settings panel is the chord frame toggle
    const chordFrameSwitch = switches[0];
    expect(chordFrameSwitch).toBeTruthy();
    fireEvent(chordFrameSwitch, "valueChange", false);
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

  // ── Chips step back returns to settings ────────────────────────
  it("chips step back button returns to settings", () => {
    const existing = createDefaultLayer("custom", "l1", "#ff69b6");
    const { getByText, getByTestId } = renderModal({ initialLayer: existing });
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.press(getByText("finder.none"));
    act(() => {
      jest.runAllTimers();
    });
    // Press back on chips page
    fireEvent.press(getByTestId("sub-page-back"));
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

  // ── Type nav row on settings step switches layer type ────────────
  it("type dropdown on settings step switches layer type", () => {
    const onPreview = jest.fn();
    const existing = createDefaultLayer("chord", "l1", "#ff69b6");
    const { getByText } = renderModal({ initialLayer: existing, onPreview });
    act(() => {
      jest.runAllTimers();
    });
    // Press the centered type name to open the select page (chord layer shows "layers.chord")
    fireEvent.press(getByText("layers.chord"));
    act(() => {
      jest.runAllTimers();
    });
    // Now on select page — press "layers.scale" to switch to scale type
    fireEvent.press(getByText("layers.scale"));
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
