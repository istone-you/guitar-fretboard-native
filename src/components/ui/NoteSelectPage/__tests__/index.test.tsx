import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import NoteSelectPage from "../index";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light" },
}));
jest.mock("../../SheetProgressiveHeader", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});
jest.mock("../../GlassIconButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ onPress, testID }: { onPress: () => void; testID?: string }) => (
      <TouchableOpacity onPress={onPress} testID={testID ?? "glass-icon-btn"}>
        <Text>btn</Text>
      </TouchableOpacity>
    ),
  };
});
jest.mock("../../NotePill", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({
      label,
      onPress,
    }: {
      label: string;
      selected: boolean;
      activeBg: string;
      activeText: string;
      inactiveBg: string;
      inactiveText: string;
      onPress: () => void;
    }) => (
      <TouchableOpacity onPress={onPress} testID={`note-${label}`}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
  };
});

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const defaultProps = {
  theme: "dark" as const,
  bgColor: "#1a1a1a",
  title: "Root",
  notes: NOTES,
  selectedNote: "C",
  onSelect: jest.fn(),
  onBack: jest.fn(),
};

describe("NoteSelectPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the title", () => {
    render(<NoteSelectPage {...defaultProps} />);
    expect(screen.getByText("Root")).toBeTruthy();
  });

  it("renders all notes", () => {
    render(<NoteSelectPage {...defaultProps} />);
    NOTES.forEach((note) => {
      expect(screen.getByText(note)).toBeTruthy();
    });
  });

  it("calls onSelect and onBack when a note is pressed", () => {
    render(<NoteSelectPage {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-G"));
    expect(defaultProps.onSelect).toHaveBeenCalledWith("G");
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  it("calls onBack when back button is pressed", () => {
    render(<NoteSelectPage {...defaultProps} />);
    fireEvent.press(screen.getByTestId("glass-icon-btn"));
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSelect).not.toHaveBeenCalled();
  });
});
