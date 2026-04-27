import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import FinderChordPicker from "..";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("../../../../i18n", () => ({}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("../../NotePickerButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({
      value,
      onChange,
      label,
    }: {
      value: string;
      onChange: (note: string) => void;
      label: string;
    }) => (
      <TouchableOpacity testID={`note-picker-${label}`} onPress={() => onChange("G")}>
        <Text testID={`note-picker-value-${label}`}>{value}</Text>
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
      selected,
      onPress,
    }: {
      label: string;
      selected: boolean;
      onPress: () => void;
    }) => (
      <TouchableOpacity
        testID={`note-pill-${label}`}
        onPress={onPress}
        accessibilityState={{ selected }}
      >
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
  };
});

const defaultProps = {
  theme: "light" as const,
  accidental: "sharp" as const,
  rootNote: "C",
  onRootChange: jest.fn(),
  chordTypes: [
    { value: "Major", label: "M" },
    { value: "Minor", label: "m" },
    { value: "7th", label: "7" },
  ],
  selectedChordType: "Minor",
  onChordTypeChange: jest.fn(),
  borderColor: "#ddd",
};

describe("FinderChordPicker", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the root note picker", () => {
    render(<FinderChordPicker {...defaultProps} />);
    expect(screen.getByTestId("note-picker-header.root")).toBeTruthy();
    expect(screen.getByTestId("note-picker-value-header.root").props.children).toBe("C");
  });

  it("renders the chord type pills", () => {
    render(<FinderChordPicker {...defaultProps} />);
    expect(screen.getByTestId("note-pill-M")).toBeTruthy();
    expect(screen.getByTestId("note-pill-m")).toBeTruthy();
    expect(screen.getByTestId("note-pill-7")).toBeTruthy();
  });

  it("calls onRootChange and haptics when the root picker changes", () => {
    const Haptics = require("expo-haptics");
    const onRootChange = jest.fn();
    render(<FinderChordPicker {...defaultProps} onRootChange={onRootChange} />);

    fireEvent.press(screen.getByTestId("note-picker-header.root"));

    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    expect(onRootChange).toHaveBeenCalledWith("G");
  });

  it("calls onChordTypeChange and haptics when a chord type is pressed", () => {
    const Haptics = require("expo-haptics");
    const onChordTypeChange = jest.fn();
    render(<FinderChordPicker {...defaultProps} onChordTypeChange={onChordTypeChange} />);

    fireEvent.press(screen.getByTestId("note-pill-M"));

    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    expect(onChordTypeChange).toHaveBeenCalledWith("Major");
  });

  it("reflects the selected chord type", () => {
    render(<FinderChordPicker {...defaultProps} selectedChordType="Minor" />);
    const flat = (s: unknown) =>
      (Array.isArray(s) ? Object.assign({}, ...s) : s) as Record<string, unknown>;
    const selectedBorder = flat(screen.getByTestId("note-pill-m").props.style).borderColor;
    const unselectedBorder = flat(screen.getByTestId("note-pill-M").props.style).borderColor;
    expect(selectedBorder).not.toBe(unselectedBorder);
  });
});
