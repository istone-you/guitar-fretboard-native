import React from "react";
import { render } from "@testing-library/react-native";
import RelatedKeysCirclePage from "../CirclePage";

jest.mock("../../../../i18n", () => ({}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));
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
jest.mock("../../../../components/ui/FinderDetailSheet", () => () => null);
jest.mock("../../../../components/ui/BottomSheetModal", () => ({
  __esModule: true,
  default: () => null,
  SHEET_HANDLE_CLEARANCE: 32,
  useSheetHeight: () => 400,
}));

const baseProps = {
  theme: "dark" as const,
  accidental: "sharp" as const,
  rootSemitone: 0,
  initialKeyType: "major" as const,
};

describe("RelatedKeysCirclePage", () => {
  it("renders without crashing", () => {
    render(<RelatedKeysCirclePage {...baseProps} />);
  });
});
