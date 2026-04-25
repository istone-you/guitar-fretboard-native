import React from "react";
import { render } from "@testing-library/react-native";
import RelatedKeysBrowser from "..";

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
  onOpenCircle: jest.fn(),
};

describe("RelatedKeysBrowser", () => {
  it("renders without crashing", () => {
    const { getByTestId } = render(<RelatedKeysBrowser {...baseProps} />);
    expect(getByTestId("note-picker")).toBeTruthy();
  });

  it("shows 4 relation sections", () => {
    const { getAllByTestId } = render(<RelatedKeysBrowser {...baseProps} />);
    expect(getAllByTestId(/^related-section-/)).toHaveLength(4);
  });

  it("shows relative, parallel, dominant, subdominant sections", () => {
    const { getByTestId } = render(<RelatedKeysBrowser {...baseProps} />);
    expect(getByTestId("related-section-relative")).toBeTruthy();
    expect(getByTestId("related-section-parallel")).toBeTruthy();
    expect(getByTestId("related-section-dominant")).toBeTruthy();
    expect(getByTestId("related-section-subdominant")).toBeTruthy();
  });

  it("shows 7 diatonic chips per section", () => {
    const { getAllByTestId } = render(<RelatedKeysBrowser {...baseProps} />);
    const relativeChips = getAllByTestId(/^related-chip-relative-/);
    expect(relativeChips).toHaveLength(7);
  });
});
