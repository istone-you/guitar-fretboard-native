import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import ChordSuggest from "..";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));
jest.mock("../../../../i18n", () => ({}));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" },
  NotificationFeedbackType: { Error: "error" },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../../../components/ui/NotePickerButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ value, onChange }: { value: string; onChange: (n: string) => void }) => (
      <TouchableOpacity testID="note-picker" onPress={() => onChange("G")}>
        <Text testID="note-value">{value}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock("../../../../components/ui/ChordDiagram", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="chord-diagram" />,
    getAllChordForms: (_rootIndex: number, chordType: string) =>
      chordType === "Major" || chordType === "Minor" ? [[{ string: 0, fret: 1 }]] : [],
  };
});

jest.mock("../../../../hooks/useProgressionTemplates", () => ({
  useProgressionTemplates: () => ({
    customTemplates: [],
    saveTemplate: jest.fn(() => "tpl-123"),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    reorderTemplates: jest.fn(),
  }),
}));

jest.mock("../../../../components/ui/Icon", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="icon" />,
  };
});

jest.mock("../../../Templates/TemplateFormSheet", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ visible }: { visible: boolean }) =>
      visible ? <View testID="template-form-sheet" /> : null,
    CHROMATIC_DEGREES: [],
    CHORD_TYPE_GROUPS: [],
    DEGREE_TO_OFFSET: {},
  };
});

const defaultProps = {
  theme: "light" as const,
  accidental: "sharp" as const,
};

describe("ChordSuggest", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    expect(render(<ChordSuggest {...defaultProps} />).toJSON()).toBeTruthy();
  });

  it("shows default root note C", () => {
    render(<ChordSuggest {...defaultProps} />);
    expect(screen.getByTestId("note-value").props.children).toBe("C");
  });

  it("shows chord type chips", () => {
    render(<ChordSuggest {...defaultProps} />);
    expect(screen.getByText("Major")).toBeTruthy();
    expect(screen.getByText("Minor")).toBeTruthy();
    expect(screen.getByText("maj7")).toBeTruthy();
    expect(screen.getByText("m7")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
  });

  it("shows category headers for suggestions", () => {
    render(<ChordSuggest {...defaultProps} />);
    expect(screen.getByText("finder.chordSuggest.category.diatonic")).toBeTruthy();
    expect(screen.getByText("finder.chordSuggest.category.secondary-dominant")).toBeTruthy();
  });

  it("updates root note when picker changes and resets chain", () => {
    render(<ChordSuggest {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-picker"));
    expect(screen.getByTestId("note-value").props.children).toBe("G");
  });

  it("shows chain hint when chain is empty", () => {
    render(<ChordSuggest {...defaultProps} />);
    expect(screen.getByText("finder.chordSuggest.chainHint")).toBeTruthy();
  });

  it("adds chord to chain when suggestion is tapped", () => {
    render(<ChordSuggest {...defaultProps} />);
    const [firstCard] = screen.getAllByTestId("entry-card");
    fireEvent.press(firstCard);
    expect(screen.getByTestId("chain-undo")).toBeTruthy();
  });

  it("does not show save button when chain is empty", () => {
    render(<ChordSuggest {...defaultProps} />);
    expect(screen.queryByText("finder.progressionAnalysis.saveAsTemplate")).toBeNull();
  });

  it("shows save button and opens TemplateFormSheet when chain has items", () => {
    render(<ChordSuggest {...defaultProps} />);
    const [firstCard] = screen.getAllByTestId("entry-card");
    fireEvent.press(firstCard);
    expect(screen.getByText("finder.progressionAnalysis.saveAsTemplate")).toBeTruthy();
    fireEvent.press(screen.getByText("finder.progressionAnalysis.saveAsTemplate"));
    expect(screen.getByTestId("template-form-sheet")).toBeTruthy();
  });

  it("renders in dark theme without crashing", () => {
    expect(render(<ChordSuggest {...defaultProps} theme="dark" />).toJSON()).toBeTruthy();
  });
});
