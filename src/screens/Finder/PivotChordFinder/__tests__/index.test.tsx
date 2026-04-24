import React from "react";
import { render } from "@testing-library/react-native";
import PivotChordFinder from "..";

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
jest.mock("../../../../components/ui/ChordDiagram", () => ({
  __esModule: true,
  default: () => null,
  getAllChordForms: () => [],
}));
jest.mock("../../../../components/ui/BottomSheetModal", () => ({
  __esModule: true,
  default: () => null,
  SHEET_HANDLE_CLEARANCE: 32,
  useSheetHeight: () => 400,
}));

const baseProps = {
  theme: "dark" as const,
  accidental: "sharp" as const,
  layers: [],
  globalRootNote: "C",
  onAddLayerAndNavigate: jest.fn(),
  onEnablePerLayerRoot: jest.fn(),
};

describe("PivotChordFinder", () => {
  it("renders without crashing", () => {
    const { getAllByTestId } = render(<PivotChordFinder {...baseProps} />);
    expect(getAllByTestId("note-picker").length).toBeGreaterThan(0);
  });

  it("shows 7 diatonic chips for each key (14 total)", () => {
    const { getAllByTestId } = render(<PivotChordFinder {...baseProps} />);
    const chipsA = getAllByTestId(/^diatonic-chip-a-/);
    const chipsB = getAllByTestId(/^diatonic-chip-b-/);
    expect(chipsA).toHaveLength(7);
    expect(chipsB).toHaveLength(7);
  });
});
