import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import ModulationFinder from "..";

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

const baseProps = {
  theme: "dark" as const,
  accidental: "sharp" as const,
  layers: [],
  globalRootNote: "C",
  onAddLayerAndNavigate: jest.fn(),
  onEnablePerLayerRoot: jest.fn(),
};

describe("ModulationFinder", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders explore mode without crashing", () => {
    render(<ModulationFinder {...baseProps} />);
    expect(screen.getByTestId("note-picker")).toBeTruthy();
    expect(screen.getByText("finder.modulation.sectionChromatic")).toBeTruthy();
    expect(screen.getByText("finder.modulation.sectionEnharmonic")).toBeTruthy();
    expect(screen.getByText("finder.modulation.sectionModal")).toBeTruthy();
  });

  it("shows 8 chromatic mediant rows in explore mode", () => {
    render(<ModulationFinder {...baseProps} />);
    expect(screen.getAllByTestId(/^chromatic-/).length).toBe(8);
  });

  it("shows 3 enharmonic rows in explore mode", () => {
    render(<ModulationFinder {...baseProps} />);
    expect(screen.getAllByTestId(/^enharmonic-/).length).toBe(3);
  });

  it("shows 6 modal rows in explore mode for major key", () => {
    render(<ModulationFinder {...baseProps} />);
    expect(screen.getAllByTestId(/^modal-/).length).toBe(6);
  });

  it("switches to means mode and shows all 4 sections", () => {
    render(<ModulationFinder {...baseProps} />);
    fireEvent.press(screen.getByTestId("seg-means"));
    expect(screen.getByText("finder.modulation.sectionPivot")).toBeTruthy();
    expect(screen.getByText("finder.modulation.sectionEnharmonic")).toBeTruthy();
    expect(screen.getByText("finder.modulation.sectionChromatic")).toBeTruthy();
    expect(screen.getByText("finder.modulation.sectionModal")).toBeTruthy();
  });
});
