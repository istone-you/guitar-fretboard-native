import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import * as ReactNative from "react-native";
import ModeBrowser from "..";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));
jest.mock("../../../../i18n", () => ({}));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../../../components/ui/NotePickerButton", () => {
  const { Text } = require("react-native");
  return ({ value }: { value: string }) => <Text testID="note-picker">{value}</Text>;
});
jest.mock("../../../../components/ui/BottomSheetModal", () => ({
  __esModule: true,
  default: () => null,
  SHEET_HANDLE_CLEARANCE: 32,
  useSheetHeight: () => 400,
}));
jest.mock("../../../../components/ui/SegmentedToggle", () => ({
  SegmentedToggle: ({
    _value,
    onChange,
    options,
  }: {
    _value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => {
    const { View, TouchableOpacity, Text } = require("react-native");
    return (
      <View testID="segmented-toggle">
        {options.map((opt: { value: string; label: string }) => (
          <TouchableOpacity
            key={opt.value}
            testID={`toggle-${opt.value}`}
            onPress={() => onChange(opt.value)}
          >
            <Text>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
}));
jest.mock("../../../../components/ui/FinderDetailSheet", () => () => null);
jest.mock("../../../../components/ui/ChordDiagram", () => ({
  __esModule: true,
  default: () => null,
  getAllChordForms: () => [],
}));
jest.mock("../../../../components/LayerEditModal/LayerDescription", () => () => null);

const baseProps = {
  theme: "dark" as const,
  accidental: "sharp" as const,
  layers: [],
  globalRootNote: "C",
  onAddLayerAndNavigate: jest.fn(),
  onEnablePerLayerRoot: jest.fn(),
};

describe("ModeBrowser (shell)", () => {
  beforeEach(() => {
    jest
      .spyOn(ReactNative, "useWindowDimensions")
      .mockReturnValue({ width: 390, height: 844, scale: 1, fontScale: 1 });
  });
  it("renders without crashing", () => {
    const { getByTestId } = render(<ModeBrowser {...baseProps} />);
    expect(getByTestId("segmented-toggle")).toBeTruthy();
  });

  it("shows mode family view by default with 7 mode rows", () => {
    const { getAllByTestId } = render(<ModeBrowser {...baseProps} />);
    expect(getAllByTestId(/^mode-row-/)).toHaveLength(7);
  });

  it("switches to modal interchange view on toggle", () => {
    const { getByTestId, queryAllByTestId } = render(<ModeBrowser {...baseProps} />);
    fireEvent.press(getByTestId("toggle-modal-interchange"));
    expect(queryAllByTestId(/^mode-row-/).length).toBe(0);
  });

  it("switches back to family view", () => {
    const { getByTestId, getAllByTestId } = render(<ModeBrowser {...baseProps} />);
    fireEvent.press(getByTestId("toggle-modal-interchange"));
    fireEvent.press(getByTestId("toggle-family"));
    expect(getAllByTestId(/^mode-row-/)).toHaveLength(7);
  });
});
