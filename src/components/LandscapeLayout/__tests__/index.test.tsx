import React from "react";
import { render, screen } from "@testing-library/react-native";
import LandscapeLayout from "../index";
import type { LayerConfig } from "../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../../screens/Layer", () => ({
  __esModule: true,
  default: () => {
    const { View } = require("react-native");
    return <View testID="main-practice-pane" />;
  },
}));

function makeLayer(overrides: Partial<LayerConfig> = {}): LayerConfig {
  return {
    id: "l1",
    type: "scale",
    scaleType: "major",
    color: "#ff0000",
    enabled: true,
    chordDisplayMode: "form",
    chordType: "Major",
    diatonicKeyType: "major",
    diatonicDegree: "I",
    diatonicChordSize: "triad",
    triadInversion: "root",
    cagedForms: new Set(),
    cagedChordType: "major",
    onChordName: "C/E",
    customMode: "note",
    selectedNotes: new Set(),
    selectedDegrees: new Set(),
    hiddenCells: new Set(),
    chordFrames: [],
    ...overrides,
  };
}

const defaultProps = {
  winHeight: 390,
  theme: "light" as const,
  rootNote: "C",
  accidental: "sharp" as const,
  baseLabelMode: "note" as const,
  fretRange: [0, 12] as [number, number],
  layers: [],
  leftHanded: false,
  onFretboardDoubleTap: jest.fn(),
  previewLayer: null,
  overlayNotes: [],
  overlaySemitones: new Set<number>(),
  layerNoteLabelsMap: new Map<string, string[]>(),
  isDark: false,
  slots: [null, null, null] as (LayerConfig | null)[],
  onAddLayer: jest.fn(),
  onUpdateLayer: jest.fn(),
  onRemoveLayer: jest.fn(),
  onToggleLayer: jest.fn(),
  onPreviewLayer: jest.fn(),
  onReorderLayer: jest.fn(),
  onLoadPreset: jest.fn(),
  onRootNoteChange: jest.fn(),
  onBaseLabelModeChange: jest.fn(),
};

describe("LandscapeLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    expect(() => render(<LandscapeLayout {...defaultProps} />)).not.toThrow();
  });

  it("renders MainPracticePane", () => {
    render(<LandscapeLayout {...defaultProps} />);
    expect(screen.getByTestId("main-practice-pane")).toBeTruthy();
  });

  it("displays the root note", () => {
    render(<LandscapeLayout {...defaultProps} rootNote="G" />);
    expect(screen.getByText(/G/)).toBeTruthy();
  });

  it("does not show layer pills when no layers are enabled", () => {
    const layers = [makeLayer({ enabled: false })];
    render(<LandscapeLayout {...defaultProps} layers={layers} />);
    expect(screen.queryByText("options.scale.major")).toBeNull();
  });

  it("shows a scale layer pill for an enabled scale layer", () => {
    const layers = [makeLayer({ enabled: true, type: "scale", scaleType: "major" })];
    render(<LandscapeLayout {...defaultProps} layers={layers} />);
    expect(screen.getByText("options.scale.major")).toBeTruthy();
  });

  it("renders in dark mode without crashing", () => {
    expect(() => render(<LandscapeLayout {...defaultProps} theme="dark" />)).not.toThrow();
  });
});
