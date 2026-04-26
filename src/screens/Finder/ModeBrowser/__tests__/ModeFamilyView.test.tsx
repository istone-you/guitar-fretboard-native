import React from "react";
import { render } from "@testing-library/react-native";
import ModeFamilyView from "../ModeFamilyView";

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
jest.mock("../../../../components/ui/FinderDetailSheet", () => () => null);

const baseProps = {
  theme: "dark" as const,
  accidental: "sharp" as const,
  layers: [],
  globalRootNote: "C",
  rootNote: "C",
  onRootNoteChange: jest.fn(),
  onAddLayerAndNavigate: jest.fn(),
  onEnablePerLayerRoot: jest.fn(),
};

describe("ModeFamilyView", () => {
  it("renders without crashing", () => {
    const { getByTestId } = render(<ModeFamilyView {...baseProps} />);
    expect(getByTestId("note-picker")).toBeTruthy();
  });

  it("shows 7 mode rows", () => {
    const { getAllByTestId } = render(<ModeFamilyView {...baseProps} />);
    expect(getAllByTestId(/^mode-row-/)).toHaveLength(7);
  });

  it("renders all 7 church modes", () => {
    const { getByTestId } = render(<ModeFamilyView {...baseProps} />);
    ["ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"].forEach((mode) =>
      expect(getByTestId(`mode-row-${mode}`)).toBeTruthy(),
    );
  });
});
