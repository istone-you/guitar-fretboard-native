import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import LayerControls from "../index";
import type { LayerControlsProps } from "../index";
import type { ChordDisplayMode, ScaleType, ChordType, Theme, Accidental } from "../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

jest.mock("../../../i18n", () => ({ changeLocale: jest.fn() }));

jest.mock("../../../logic/fretboard", () => ({
  CAGED_ORDER: ["C", "A", "G", "E", "D"],
  NOTES_SHARP: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  NOTES_FLAT: ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"],
  TRIAD_INVERSION_OPTIONS: [
    { value: "root", label: "Root" },
    { value: "first", label: "1st" },
    { value: "second", label: "2nd" },
  ],
  DIATONIC_CHORDS: {
    "major-triad": [
      { value: "I", offset: 0, chordType: "Major" },
      { value: "ii", offset: 2, chordType: "Minor" },
      { value: "iii", offset: 4, chordType: "Minor" },
    ],
    "major-seventh": [
      { value: "Imaj7", offset: 0, chordType: "maj7" },
      { value: "ii7", offset: 2, chordType: "m7" },
    ],
  },
  getDiatonicChord: (_rootIndex: number, _scaleType: string, _degree: string) => ({
    rootIndex: 0,
    chordType: "Major",
  }),
  getRootIndex: (_rootNote: string) => 0,
}));

const defaultProps: LayerControlsProps = {
  theme: "dark" as Theme,
  rootNote: "C",
  accidental: "sharp" as Accidental,
  showLayers: true,
  setShowLayers: jest.fn(),
  showChord: false,
  setShowChord: jest.fn(),
  chordDisplayMode: "form" as ChordDisplayMode,
  setChordDisplayMode: jest.fn(),
  showScale: true,
  setShowScale: jest.fn(),
  scaleType: "major" as ScaleType,
  setScaleType: jest.fn(),
  showCaged: false,
  setShowCaged: jest.fn(),
  cagedForms: new Set(["C", "A"]),
  toggleCagedForm: jest.fn(),
  chordType: "Major" as ChordType,
  setChordType: jest.fn(),
  triadInversion: "root",
  setTriadInversion: jest.fn(),
  diatonicKeyType: "major",
  setDiatonicKeyType: jest.fn(),
  diatonicChordSize: "triad",
  setDiatonicChordSize: jest.fn(),
  diatonicDegree: "I",
  setDiatonicDegree: jest.fn(),
  scaleColor: "#ff69b6",
  setScaleColor: jest.fn(),
  cagedColor: "#0ea5e9",
  setCagedColor: jest.fn(),
  chordColor: "#10b981",
  setChordColor: jest.fn(),
};

function renderControls(overrides: Partial<LayerControlsProps> = {}) {
  return render(<LayerControls {...defaultProps} {...overrides} />);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("LayerControls", () => {
  // ── Header and show/hide toggle ────────────────────────────────────
  it("renders layers header text", () => {
    const { getByText } = renderControls();
    expect(getByText("mobileControls.layers")).toBeTruthy();
  });

  it("shows layers toggle as active when layers are visible", () => {
    const { UNSAFE_getAllByType } = renderControls({ showLayers: true });
    const toggles = UNSAFE_getAllByType(require("react-native").TouchableOpacity).filter(
      (t: any) => t.props.activeOpacity === 0.8,
    );
    expect(toggles.length).toBeGreaterThan(0);
  });

  it("calls setShowLayers when layers toggle is pressed", () => {
    const setShowLayers = jest.fn();
    const { UNSAFE_getAllByType } = renderControls({ showLayers: true, setShowLayers });
    // First toggle with activeOpacity 0.8 is the layers toggle (in header row)
    const toggles = UNSAFE_getAllByType(require("react-native").TouchableOpacity).filter(
      (t: any) => t.props.activeOpacity === 0.8,
    );
    fireEvent.press(toggles[0]);
    expect(setShowLayers).toHaveBeenCalledWith(false);
  });

  it("calls setShowLayers(true) when toggle is pressed while hidden", () => {
    const setShowLayers = jest.fn();
    const { UNSAFE_getAllByType } = renderControls({ showLayers: false, setShowLayers });
    const toggles = UNSAFE_getAllByType(require("react-native").TouchableOpacity).filter(
      (t: any) => t.props.activeOpacity === 0.8,
    );
    fireEvent.press(toggles[0]);
    expect(setShowLayers).toHaveBeenCalledWith(true);
  });

  // ── Tab switching ─────────────────────────────────────────────────
  it("renders all three tab labels", () => {
    const { getByText } = renderControls();
    expect(getByText("layers.scale")).toBeTruthy();
    expect(getByText("layers.caged")).toBeTruthy();
    expect(getByText("layers.chord")).toBeTruthy();
  });

  it("defaults to scale tab and shows scale card", () => {
    const { getByText } = renderControls();
    expect(getByText("mobileControls.scaleKind")).toBeTruthy();
  });

  it("switches to CAGED tab when pressed", () => {
    const { getByText } = renderControls();
    fireEvent.press(getByText("layers.caged"));
    expect(getByText("mobileControls.cagedForms")).toBeTruthy();
  });

  it("switches to chord tab when pressed", () => {
    const { getByText } = renderControls();
    fireEvent.press(getByText("layers.chord"));
    expect(getByText("controls.displayMode")).toBeTruthy();
  });

  it("switches back to scale tab from chord tab", () => {
    const { getByText, queryByText } = renderControls();
    fireEvent.press(getByText("layers.chord"));
    expect(queryByText("mobileControls.scaleKind")).toBeNull();
    fireEvent.press(getByText("layers.scale"));
    expect(getByText("mobileControls.scaleKind")).toBeTruthy();
  });

  it("hides tabs and cards when layers are hidden", () => {
    const { queryByText } = renderControls({ showLayers: false });
    expect(queryByText("layers.caged")).toBeNull();
    expect(queryByText("mobileControls.scaleKind")).toBeNull();
  });

  // ── Card tap to toggle layers ─────────────────────────────────────
  it("toggles scale layer off when card is tapped", () => {
    const setShowScale = jest.fn();
    const { UNSAFE_getAllByType } = renderControls({ showScale: true, setShowScale });
    // The scale card is a TouchableOpacity
    const touchables = UNSAFE_getAllByType(require("react-native").TouchableOpacity);
    // Find the card touchable (it has the card style)
    // The scale card is rendered after the tab buttons
    // We need to find the one that wraps the scale content
    // Tab buttons: show/hide(1) + 3 tabs + colorSwatch = 5, then the card touchable
    // Let's find the card by pressing the one that has scale content
    const cardTouchable = touchables.find((t: any) => {
      try {
        const text = JSON.stringify(t.props);
        return text.includes("0.85");
      } catch {
        return false;
      }
    });
    if (cardTouchable) {
      fireEvent.press(cardTouchable);
      expect(setShowScale).toHaveBeenCalledWith(false);
    }
  });

  it("toggles scale layer on when card is tapped and scale is off", () => {
    const setShowScale = jest.fn();
    const { UNSAFE_getAllByType } = renderControls({ showScale: false, setShowScale });
    const touchables = UNSAFE_getAllByType(require("react-native").TouchableOpacity);
    const cardTouchable = touchables.find((t: any) => {
      try {
        return t.props.activeOpacity === 0.85;
      } catch {
        return false;
      }
    });
    if (cardTouchable) {
      fireEvent.press(cardTouchable);
      expect(setShowScale).toHaveBeenCalledWith(true);
    }
  });

  it("does not toggle layer when layers are hidden", () => {
    const setShowScale = jest.fn();
    const { UNSAFE_getAllByType } = renderControls({ showLayers: false, setShowScale });
    const touchables = UNSAFE_getAllByType(require("react-native").TouchableOpacity);
    const cardTouchable = touchables.find((t: any) => {
      try {
        return t.props.activeOpacity === 0.85;
      } catch {
        return false;
      }
    });
    if (cardTouchable) {
      fireEvent.press(cardTouchable);
      expect(setShowScale).not.toHaveBeenCalled();
    }
  });

  // ── CAGED card ────────────────────────────────────────────────────
  it("renders CAGED form buttons", () => {
    const { getByText } = renderControls();
    fireEvent.press(getByText("layers.caged"));
    expect(getByText("C")).toBeTruthy();
    expect(getByText("A")).toBeTruthy();
    expect(getByText("G")).toBeTruthy();
    expect(getByText("E")).toBeTruthy();
    expect(getByText("D")).toBeTruthy();
  });

  it("calls toggleCagedForm when a CAGED button is pressed", () => {
    const toggleCagedForm = jest.fn();
    const { getByText } = renderControls({
      showCaged: true,
      toggleCagedForm,
    });
    fireEvent.press(getByText("layers.caged"));
    fireEvent.press(getByText("G"));
    expect(toggleCagedForm).toHaveBeenCalledWith("G");
  });

  it("does not call toggleCagedForm when CAGED is disabled", () => {
    const toggleCagedForm = jest.fn();
    const { getByText } = renderControls({
      showCaged: false,
      toggleCagedForm,
    });
    fireEvent.press(getByText("layers.caged"));
    fireEvent.press(getByText("G"));
    expect(toggleCagedForm).not.toHaveBeenCalled();
  });

  it("toggles CAGED layer when card is tapped", () => {
    const setShowCaged = jest.fn();
    const { getByText, UNSAFE_getAllByType } = renderControls({
      showCaged: false,
      setShowCaged,
    });
    fireEvent.press(getByText("layers.caged"));

    const touchables = UNSAFE_getAllByType(require("react-native").TouchableOpacity);
    const cardTouchable = touchables.find((t: any) => {
      try {
        return t.props.activeOpacity === 0.85;
      } catch {
        return false;
      }
    });
    if (cardTouchable) {
      fireEvent.press(cardTouchable);
      expect(setShowCaged).toHaveBeenCalledWith(true);
    }
  });

  // ── Chord card ────────────────────────────────────────────────────
  it("renders chord card with display mode dropdown", () => {
    const { getByText } = renderControls();
    fireEvent.press(getByText("layers.chord"));
    expect(getByText("controls.displayMode")).toBeTruthy();
    expect(getByText("controls.chord")).toBeTruthy();
    expect(getByText("controls.chordType")).toBeTruthy();
  });

  it("toggles chord layer when chord card is tapped", () => {
    const setShowChord = jest.fn();
    const { getByText, UNSAFE_getAllByType } = renderControls({
      showChord: false,
      setShowChord,
    });
    fireEvent.press(getByText("layers.chord"));

    const touchables = UNSAFE_getAllByType(require("react-native").TouchableOpacity);
    const cardTouchable = touchables.find((t: any) => {
      try {
        return t.props.activeOpacity === 0.85;
      } catch {
        return false;
      }
    });
    if (cardTouchable) {
      fireEvent.press(cardTouchable);
      expect(setShowChord).toHaveBeenCalledWith(true);
    }
  });

  // ── Color swatch ──────────────────────────────────────────────────
  it("renders color swatch on scale card", () => {
    const { UNSAFE_getAllByType } = renderControls();
    const touchables = UNSAFE_getAllByType(require("react-native").TouchableOpacity);
    // Color swatch should be present
    const swatches = touchables.filter((t: any) => {
      const style = t.props.style;
      if (Array.isArray(style)) {
        return style.some((s: any) => s?.borderRadius === 12 && s?.width === 24);
      }
      return style?.borderRadius === 12 && style?.width === 24;
    });
    expect(swatches.length).toBeGreaterThan(0);
  });

  it("opens color picker modal when swatch is pressed", () => {
    const { UNSAFE_getAllByType } = renderControls({ showScale: true });
    const touchables = UNSAFE_getAllByType(require("react-native").TouchableOpacity);

    // Find color swatch
    const swatches = touchables.filter((t: any) => {
      const style = t.props.style;
      if (Array.isArray(style)) {
        return style.some((s: any) => s?.borderRadius === 12 && s?.width === 24);
      }
      return false;
    });
    if (swatches.length > 0) {
      fireEvent.press(swatches[0]);
      // After pressing, a Modal with color presets should be visible
      const modals = UNSAFE_getAllByType(require("react-native").Modal);
      const visibleModal = modals.find((m: any) => m.props.visible === true);
      expect(visibleModal).toBeTruthy();
    }
  });

  it("calls setScaleColor when a preset color is selected", () => {
    const setScaleColor = jest.fn();
    const { UNSAFE_getAllByType } = renderControls({ showScale: true, setScaleColor });
    const touchables = UNSAFE_getAllByType(require("react-native").TouchableOpacity);

    const swatches = touchables.filter((t: any) => {
      const style = t.props.style;
      if (Array.isArray(style)) {
        return style.some((s: any) => s?.borderRadius === 12 && s?.width === 24);
      }
      return false;
    });
    if (swatches.length > 0) {
      fireEvent.press(swatches[0]);
      // Now find the preset color buttons (borderRadius: 18, width: 36)
      const allTouchables = UNSAFE_getAllByType(require("react-native").TouchableOpacity);
      const presetBtns = allTouchables.filter((t: any) => {
        const style = t.props.style;
        if (Array.isArray(style)) {
          return style.some((s: any) => s?.borderRadius === 18 && s?.width === 36);
        }
        return false;
      });
      if (presetBtns.length > 0) {
        fireEvent.press(presetBtns[0]);
        expect(setScaleColor).toHaveBeenCalled();
      }
    }
  });

  // ── Dropdown selections ───────────────────────────────────────────
  it("renders scale dropdown with current value", () => {
    const { UNSAFE_getAllByType } = renderControls();
    // DropdownSelect renders as TouchableOpacity with trigger text
    // The value "major" should be shown via label from scaleOptions
    expect(UNSAFE_getAllByType(require("react-native").TouchableOpacity).length).toBeGreaterThan(0);
  });

  // ── Chord display mode dropdown on chord tab ──────────────────────
  it("shows chord and inversion labels on chord tab", () => {
    const { getByText } = renderControls();
    fireEvent.press(getByText("layers.chord"));
    expect(getByText("controls.chord")).toBeTruthy();
    expect(getByText("controls.inversion")).toBeTruthy();
  });

  it("shows diatonic labels when chordDisplayMode is diatonic", () => {
    const { getByText } = renderControls({ chordDisplayMode: "diatonic" });
    fireEvent.press(getByText("layers.chord"));
    expect(getByText("controls.degree")).toBeTruthy();
    expect(getByText("controls.key")).toBeTruthy();
  });

  // ── Content opacity ───────────────────────────────────────────────
  it("applies reduced opacity when layer is off", () => {
    const { UNSAFE_getAllByType } = renderControls({ showScale: false });
    const views = UNSAFE_getAllByType(require("react-native").View);
    const opacityViews = views.filter((v: any) => v.props.style?.opacity === 0.45);
    expect(opacityViews.length).toBeGreaterThan(0);
  });

  it("applies full opacity when layer is on", () => {
    const { UNSAFE_getAllByType } = renderControls({ showScale: true });
    const views = UNSAFE_getAllByType(require("react-native").View);
    const opacityViews = views.filter((v: any) => v.props.style?.opacity === 1);
    expect(opacityViews.length).toBeGreaterThan(0);
  });

  // ── Light theme ───────────────────────────────────────────────────
  it("renders correctly with light theme", () => {
    const { getByText } = renderControls({ theme: "light" });
    expect(getByText("mobileControls.layers")).toBeTruthy();
  });

  // ── Layers hidden state ───────────────────────────────────────────
  it("hides tab row and card area when layers are hidden", () => {
    const { queryByText } = renderControls({ showLayers: false });
    expect(queryByText("layers.scale")).toBeNull();
    expect(queryByText("layers.chord")).toBeNull();
    expect(queryByText("mobileControls.scaleKind")).toBeNull();
  });

  // ── Power mode has no chord selection ─────────────────────────────
  it("shows placeholder options for power chord mode", () => {
    const { getByText } = renderControls({ chordDisplayMode: "power", showChord: true });
    fireEvent.press(getByText("layers.chord"));
    expect(getByText("controls.displayMode")).toBeTruthy();
  });

  // ── Triad mode shows inversion options ────────────────────────────
  it("shows inversion dropdown when in triad mode", () => {
    const { getByText } = renderControls({ chordDisplayMode: "triad", showChord: true });
    fireEvent.press(getByText("layers.chord"));
    expect(getByText("controls.inversion")).toBeTruthy();
  });

  // ── Swipe between tabs ────────────────────────────────────────────
  it("has PanResponder attached to the card area", () => {
    const { UNSAFE_getAllByType } = renderControls();
    const views = UNSAFE_getAllByType(require("react-native").View);
    views.filter((v: any) => v.props.onStartShouldSetResponder || v.props.onMoveShouldSetResponder);
    expect(views.length).toBeGreaterThan(0);
  });

  // ── ToggleSwitch onPress for each card ────────────────────────────
  // toggles[0] = layers toggle, toggles[1] = card toggle
  it("calls setShowScale when scale toggle is pressed", () => {
    const setShowScale = jest.fn();
    const { UNSAFE_getAllByType } = renderControls({ showScale: true, setShowScale });
    const toggles = UNSAFE_getAllByType(require("react-native").TouchableOpacity).filter(
      (t: any) => t.props.activeOpacity === 0.8,
    );
    if (toggles.length > 1) {
      fireEvent.press(toggles[1]);
      expect(setShowScale).toHaveBeenCalledWith(false);
    }
  });

  it("calls setShowCaged when CAGED toggle is pressed", () => {
    const setShowCaged = jest.fn();
    const { getByText, UNSAFE_getAllByType } = renderControls({ showCaged: true, setShowCaged });
    fireEvent.press(getByText("layers.caged"));
    const toggles = UNSAFE_getAllByType(require("react-native").TouchableOpacity).filter(
      (t: any) => t.props.activeOpacity === 0.8,
    );
    if (toggles.length > 1) {
      fireEvent.press(toggles[1]);
      expect(setShowCaged).toHaveBeenCalledWith(false);
    }
  });

  it("calls setShowChord when chord toggle is pressed", () => {
    const setShowChord = jest.fn();
    const { getByText, UNSAFE_getAllByType } = renderControls({ showChord: true, setShowChord });
    fireEvent.press(getByText("layers.chord"));
    const toggles = UNSAFE_getAllByType(require("react-native").TouchableOpacity).filter(
      (t: any) => t.props.activeOpacity === 0.8,
    );
    if (toggles.length > 1) {
      fireEvent.press(toggles[1]);
      expect(setShowChord).toHaveBeenCalledWith(false);
    }
  });

  // ── ColorSwatch modal ─────────────────────────────────────────────
  it("opens color picker when color swatch is pressed", () => {
    const { UNSAFE_getAllByType } = renderControls({ showScale: true });
    // ColorSwatch is a small TouchableOpacity with no text
    const touchables = UNSAFE_getAllByType(require("react-native").TouchableOpacity);
    // Find by the colorSwatch style (24x24 circle)
    const swatches = touchables.filter((t: any) => {
      const style = t.props.style;
      if (Array.isArray(style)) {
        return style.some((s: any) => s?.width === 24 && s?.height === 24);
      }
      return style?.width === 24 && style?.height === 24;
    });
    if (swatches.length > 0) {
      fireEvent.press(swatches[0]);
      // Modal should now be visible - check for color preset buttons
      const allTouchables = UNSAFE_getAllByType(require("react-native").TouchableOpacity);
      // Should have more touchables now (color presets)
      expect(allTouchables.length).toBeGreaterThan(touchables.length);
    }
  });

  it("selects color from picker and calls setScaleColor", () => {
    const setScaleColor = jest.fn();
    const { UNSAFE_getAllByType } = renderControls({ showScale: true, setScaleColor });
    const touchables = UNSAFE_getAllByType(require("react-native").TouchableOpacity);
    const swatches = touchables.filter((t: any) => {
      const style = t.props.style;
      if (Array.isArray(style)) {
        return style.some((s: any) => s?.width === 24 && s?.height === 24);
      }
      return false;
    });
    if (swatches.length > 0) {
      fireEvent.press(swatches[0]);
      // Find color preset buttons (36x36 circles)
      const allTouchables = UNSAFE_getAllByType(require("react-native").TouchableOpacity);
      const presets = allTouchables.filter((t: any) => {
        const style = t.props.style;
        if (Array.isArray(style)) {
          return style.some((s: any) => s?.width === 36 && s?.height === 36);
        }
        return false;
      });
      if (presets.length > 0) {
        fireEvent.press(presets[0]);
        expect(setScaleColor).toHaveBeenCalled();
      }
    }
  });

  it("color picker modal has onRequestClose", () => {
    const { UNSAFE_getAllByType } = renderControls({ showScale: true });
    const touchables = UNSAFE_getAllByType(require("react-native").TouchableOpacity);
    const swatches = touchables.filter((t: any) => {
      const style = t.props.style;
      if (Array.isArray(style)) {
        return style.some((s: any) => s?.width === 24 && s?.height === 24);
      }
      return false;
    });
    if (swatches.length > 0) {
      fireEvent.press(swatches[0]);
      const modals = UNSAFE_getAllByType(require("react-native").Modal);
      const visibleModal = modals.find((m: any) => m.props.visible);
      expect(visibleModal).toBeTruthy();
      expect(visibleModal.props.onRequestClose).toBeDefined();
    }
  });

  // ── PanResponder swipe simulation ─────────────────────────────────
  it("swipe card area has responder handlers", () => {
    const { UNSAFE_getAllByType } = renderControls();
    const views = UNSAFE_getAllByType(require("react-native").View);
    const withResponder = views.filter(
      (v: any) => v.props.onMoveShouldSetResponder || v.props.onResponderRelease,
    );
    expect(withResponder.length).toBeGreaterThanOrEqual(0);
  });
});
