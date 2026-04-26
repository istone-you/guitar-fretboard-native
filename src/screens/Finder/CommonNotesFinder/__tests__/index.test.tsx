import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import CommonNotesFinder from "..";

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
jest.mock("../../../Templates/TemplateFormSheet", () => ({
  CHORD_TYPE_GROUPS: [
    {
      labelKey: "triad",
      types: [
        ["major", "M"],
        ["minor", "m"],
      ],
    },
    { labelKey: "seventh", types: [["maj7", "maj7"]] },
    { labelKey: "tension", types: [] },
  ],
}));

const baseProps = {
  theme: "dark" as const,
  accidental: "sharp" as const,
  layers: [],
  globalRootNote: "C",
  onAddLayerAndNavigate: jest.fn(),
  onEnablePerLayerRoot: jest.fn(),
};

describe("CommonNotesFinder", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    render(<CommonNotesFinder {...baseProps} />);
    expect(screen.getAllByTestId(/^note-chip-/).length).toBe(12);
  });

  it("does not show mode toggle", () => {
    render(<CommonNotesFinder {...baseProps} />);
    expect(screen.queryByTestId("seg-notes")).toBeNull();
    expect(screen.queryByTestId("seg-chords")).toBeNull();
  });

  it("shows chord chip and needMoreChords message with 1 chord added", () => {
    render(<CommonNotesFinder {...baseProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-major"));
    expect(screen.getByTestId("chord-chip-0")).toBeTruthy();
    expect(screen.getByText("finder.common.needMoreChords")).toBeTruthy();
  });

  it("shows common notes section when 2 chords are added", () => {
    render(<CommonNotesFinder {...baseProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-major"));
    fireEvent.press(screen.getByTestId("note-chip-A"));
    fireEvent.press(screen.getByTestId("chord-type-minor"));
    expect(screen.getAllByText("finder.common.modeNotes").length).toBeGreaterThanOrEqual(1);
  });
});
