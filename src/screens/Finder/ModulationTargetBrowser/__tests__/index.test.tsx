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
jest.mock("../../../../components/ui/Icon", () => () => null);
jest.mock("../../../../components/ui/PillButton", () => {
  const { TouchableOpacity } = require("react-native");
  return ({ onPress, children }: { onPress: () => void; children: React.ReactNode }) => (
    <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>
  );
});

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

  it("shows 7 diatonic chords per section", () => {
    render(<ModulationTargetBrowser {...baseProps} />);
    const relativeChords = screen.getAllByTestId(/^related-chord-relative-/);
    expect(relativeChords).toHaveLength(7);
  });

  it("shows related keys summary at top", () => {
    render(<ModulationTargetBrowser {...baseProps} />);
    expect(screen.getByTestId("related-keys-summary")).toBeTruthy();
  });
});
