import React from "react";
import { render, screen } from "@testing-library/react-native";
import ModulationTargetBrowser from "..";

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

describe("ModulationTargetBrowser", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    render(<ModulationTargetBrowser {...baseProps} />);
    expect(screen.getByTestId("note-picker")).toBeTruthy();
  });

  it("shows 4 related key sections", () => {
    render(<ModulationTargetBrowser {...baseProps} />);
    expect(screen.getAllByTestId(/^related-section-/)).toHaveLength(4);
  });

  it("shows relative, parallel, dominant, subdominant sections", () => {
    render(<ModulationTargetBrowser {...baseProps} />);
    expect(screen.getByTestId("related-section-relative")).toBeTruthy();
    expect(screen.getByTestId("related-section-parallel")).toBeTruthy();
    expect(screen.getByTestId("related-section-dominant")).toBeTruthy();
    expect(screen.getByTestId("related-section-subdominant")).toBeTruthy();
  });

  it("shows near and far section headers", () => {
    render(<ModulationTargetBrowser {...baseProps} />);
    expect(screen.getByText("finder.modulationTarget.sectionNear")).toBeTruthy();
    expect(screen.getByText("finder.modulationTarget.sectionFar")).toBeTruthy();
  });

  it("shows chromatic mediant section header", () => {
    render(<ModulationTargetBrowser {...baseProps} />);
    expect(screen.getByText("finder.modulation.sectionChromatic")).toBeTruthy();
  });

  it("shows enharmonic section header", () => {
    render(<ModulationTargetBrowser {...baseProps} />);
    expect(screen.getByText("finder.modulation.sectionEnharmonic")).toBeTruthy();
  });

  it("shows modal section header", () => {
    render(<ModulationTargetBrowser {...baseProps} />);
    expect(screen.getByText("finder.modulation.sectionModal")).toBeTruthy();
  });

  it("shows 8 chromatic mediant rows", () => {
    render(<ModulationTargetBrowser {...baseProps} />);
    expect(screen.getAllByTestId(/^chromatic-/).length).toBe(8);
  });

  it("shows 3 enharmonic rows", () => {
    render(<ModulationTargetBrowser {...baseProps} />);
    expect(screen.getAllByTestId(/^enharmonic-/).length).toBe(3);
  });
});
