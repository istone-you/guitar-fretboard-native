import React from "react";
import { render, screen } from "@testing-library/react-native";
import ModulationMeansFinder from "..";

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
jest.mock("../../../../components/ui/SegmentedToggle", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    SegmentedToggle: ({
      onChange,
      options,
    }: {
      value: string;
      onChange: (v: string) => void;
      options: { value: string; label: string }[];
    }) => (
      <>
        {options.map((o) => (
          <TouchableOpacity
            key={o.value}
            testID={`seg-${o.value}`}
            onPress={() => onChange(o.value)}
          >
            <Text>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </>
    ),
  };
});
jest.mock("../../../../components/ui/ChordDiagram", () => ({
  __esModule: true,
  default: () => null,
  getAllChordForms: () => [],
}));
jest.mock("../../../../components/ui/FinderDetailSheet", () => () => null);
jest.mock("../../../../components/LayerEditModal/LayerDescription", () => () => null);
jest.mock("../../../../components/ui/Icon", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View /> };
});

const baseProps = {
  theme: "dark" as const,
  accidental: "sharp" as const,
  layers: [],
  globalRootNote: "C",
  onAddLayerAndNavigate: jest.fn(),
  onEnablePerLayerRoot: jest.fn(),
};

describe("ModulationMeansFinder", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    render(<ModulationMeansFinder {...baseProps} />);
    expect(screen.getAllByTestId("note-picker").length).toBe(2);
  });

  it("shows all 4 section headers", () => {
    render(<ModulationMeansFinder {...baseProps} />);
    expect(screen.getByText("finder.modulation.sectionPivot")).toBeTruthy();
    expect(screen.getByText("finder.modulation.sectionEnharmonic")).toBeTruthy();
    expect(screen.getByText("finder.modulation.sectionChromatic")).toBeTruthy();
    expect(screen.getByText("finder.modulation.sectionModal")).toBeTruthy();
  });

  it("shows pivot chord rows for C major to G major", () => {
    render(<ModulationMeansFinder {...baseProps} />);
    expect(screen.getAllByTestId(/^pivot-chip-/).length).toBeGreaterThan(0);
  });
});
