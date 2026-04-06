import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Animated } from "react-native";
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

jest.mock("../../ui/BounceActionButton", () => {
  const { Text, Pressable } = require("react-native");
  return {
    __esModule: true,
    default: ({ label, onPress }: { label: string; onPress: () => void }) => (
      <Pressable testID={`bounce-btn-${label}`} onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    ),
  };
});

const defaultProps = {
  showQuiz: false,
  theme: "dark" as Theme,
  rootNote: "C",
  accidental: "sharp" as Accidental,
  layers: [] as LayerConfig[],
  previewLayer: null,
  overlayNotes: [] as string[],
  overlaySemitones: new Set<number>(),
  layerNoteLabelsMap: new Map<string, string[]>(),
  reopenLayerId: null as string | null,
  isDark: true,
  t: (key: string) => key,
  cellEditUiVisible: false,
  cellEditAnim: new Animated.Value(1),
  onAddLayer: jest.fn(),
  onUpdateLayer: jest.fn(),
  onRemoveLayer: jest.fn(),
  onToggleLayer: jest.fn(),
  onReorderLayers: jest.fn(),
  onPreviewLayer: jest.fn(),
  onStartCellEdit: jest.fn(),
  onClearReopenLayerId: jest.fn(),
  onCellEditCancel: jest.fn(),
  onCellEditReset: jest.fn(),
  onCellEditDone: jest.fn(),
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

  it("hides cell edit overlay when cellEditUiVisible is false", () => {
    const { queryByTestId } = renderPane({ cellEditUiVisible: false });
    expect(queryByTestId("bounce-btn-layers.cancel")).toBeNull();
    expect(queryByTestId("bounce-btn-layers.reset")).toBeNull();
    expect(queryByTestId("bounce-btn-layers.confirm")).toBeNull();
  });

  it("shows cell edit overlay with 3 buttons when cellEditUiVisible is true", () => {
    const { getByTestId } = renderPane({ cellEditUiVisible: true });
    expect(getByTestId("bounce-btn-layers.cancel")).toBeTruthy();
    expect(getByTestId("bounce-btn-layers.reset")).toBeTruthy();
    expect(getByTestId("bounce-btn-layers.confirm")).toBeTruthy();
  });

  it("calls onCellEditCancel when cancel button is pressed", () => {
    const onCellEditCancel = jest.fn();
    const { getByTestId } = renderPane({ cellEditUiVisible: true, onCellEditCancel });
    fireEvent.press(getByTestId("bounce-btn-layers.cancel"));
    expect(onCellEditCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCellEditReset when reset button is pressed", () => {
    const onCellEditReset = jest.fn();
    const { getByTestId } = renderPane({ cellEditUiVisible: true, onCellEditReset });
    fireEvent.press(getByTestId("bounce-btn-layers.reset"));
    expect(onCellEditReset).toHaveBeenCalledTimes(1);
  });

  it("calls onCellEditDone when confirm button is pressed", () => {
    const onCellEditDone = jest.fn();
    const { getByTestId } = renderPane({ cellEditUiVisible: true, onCellEditDone });
    fireEvent.press(getByTestId("bounce-btn-layers.confirm"));
    expect(onCellEditDone).toHaveBeenCalledTimes(1);
  });
});
