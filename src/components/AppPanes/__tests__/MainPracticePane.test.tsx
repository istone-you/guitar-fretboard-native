import React from "react";
import { render } from "@testing-library/react-native";
import MainPracticePane from "../MainPracticePane";
import type { Accidental, LayerConfig, Theme } from "../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
jest.mock("../../../i18n", () => ({ changeLocale: jest.fn() }));

jest.mock("../../LayerSystem/LayerList", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => <View testID="layer-list" {...props} />,
  };
});

const defaultProps = {
  showQuiz: false,
  theme: "dark" as Theme,
  rootNote: "C",
  accidental: "sharp" as Accidental,
  layers: [] as LayerConfig[],
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
  onReorderLayers: jest.fn(),
  onPreviewLayer: jest.fn(),
  onLoadPreset: jest.fn(),
};

function renderPane(overrides: Partial<typeof defaultProps> = {}) {
  return render(<MainPracticePane {...defaultProps} {...overrides} />);
}

describe("MainPracticePane", () => {
  it("renders LayerList when showQuiz is false", () => {
    const { getByTestId } = renderPane({ showQuiz: false });
    expect(getByTestId("layer-list")).toBeTruthy();
  });

  it("renders spacer and hides LayerList when showQuiz is true", () => {
    const { queryByTestId } = renderPane({ showQuiz: true });
    expect(queryByTestId("layer-list")).toBeNull();
  });
});
