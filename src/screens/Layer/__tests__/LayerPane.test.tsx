import React from "react";
import { render } from "@testing-library/react-native";
import LayerPane from "..";
import type { Accidental, BaseLabelMode, LayerConfig, Theme } from "../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
jest.mock("../../../i18n", () => ({ changeLocale: jest.fn() }));

jest.mock("../../../components/NormalFretboard", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => <View testID="main-fretboard-pane" {...props} />,
  };
});

jest.mock("../../../components/LayerList", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => <View testID="layer-list" {...props} />,
  };
});

const defaultProps = {
  isLandscape: false,
  theme: "dark" as Theme,
  accidental: "sharp" as Accidental,
  baseLabelMode: "note" as BaseLabelMode,
  fretRange: [0, 12] as [number, number],
  rootNote: "C",
  layers: [] as LayerConfig[],
  disableAnimation: false,
  leftHanded: false,
  onFretboardDoubleTap: jest.fn(),
  previewLayer: null,
  slots: [null, null, null] as any[],
  overlayNotes: [] as string[],
  overlaySemitones: new Set<number>(),
  layerNoteLabelsMap: new Map<string, string[]>(),
  isDark: true,
  onAddLayer: jest.fn(),
  onUpdateLayer: jest.fn(),
  onRemoveLayer: jest.fn(),
  onToggleLayer: jest.fn(),
  onPreviewLayer: jest.fn(),
  onReorderLayer: jest.fn(),
  onLoadPreset: jest.fn(),
  onRootNoteChange: jest.fn(),
  onBaseLabelModeChange: jest.fn(),
  presets: [],
  onSavePreset: jest.fn(),
  loadPreset: jest.fn(),
};

function renderPane(overrides: Partial<typeof defaultProps> = {}) {
  return render(<LayerPane {...defaultProps} {...overrides} />);
}

describe("LayerPane", () => {
  it("renders MainFretboardPane", () => {
    const { getByTestId } = renderPane();
    expect(getByTestId("main-fretboard-pane")).toBeTruthy();
  });

  it("renders LayerList", () => {
    const { getByTestId } = renderPane();
    expect(getByTestId("layer-list")).toBeTruthy();
  });
});
