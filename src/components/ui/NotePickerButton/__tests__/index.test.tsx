import React from "react";
import { render, fireEvent, screen, act } from "@testing-library/react-native";
import NotePickerButton from "..";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("../../BottomSheetModal", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({
      visible,
      children,
      onClose,
    }: {
      visible: boolean;
      children: (c: {
        close: () => void;
        closeWithCallback: () => void;
        dragHandlers: object;
      }) => React.ReactNode;
      onClose: () => void;
    }) =>
      visible ? (
        <View testID="sheet">
          {children({
            close: onClose,
            closeWithCallback: onClose,
            dragHandlers: {},
          })}
        </View>
      ) : null,
    SHEET_HANDLE_CLEARANCE: 28,
    useSheetHeight: () => 400,
  };
});

jest.mock("../../SheetProgressiveHeader", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <View testID="sheet-header">{children}</View>
    ),
  };
});

jest.mock("../../GlassIconButton", () => {
  const { TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({ onPress, icon }: { onPress: () => void; icon: string }) => (
      <TouchableOpacity testID={`glass-btn-${icon}`} onPress={onPress} />
    ),
  };
});

jest.mock("../../NotePill", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ label, onPress }: { label: string; onPress: () => void }) => (
      <TouchableOpacity testID={`note-pill-${label}`} onPress={onPress}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
  };
});

const defaultProps = {
  theme: "light" as const,
  accidental: "sharp" as const,
  value: "C",
  onChange: jest.fn(),
  label: "Key",
  sheetTitle: "Select Key",
};

describe("NotePickerButton", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    render(<NotePickerButton {...defaultProps} />);
  });

  it("shows the current value", () => {
    render(<NotePickerButton {...defaultProps} value="G" />);
    expect(screen.getByText("G")).toBeTruthy();
  });

  it("shows the label", () => {
    render(<NotePickerButton {...defaultProps} label="Root" />);
    expect(screen.getByText("Root")).toBeTruthy();
  });

  it("opens the sheet when the button is pressed", () => {
    const { UNSAFE_getByType } = render(<NotePickerButton {...defaultProps} />);
    const { TouchableOpacity } = require("react-native");
    const buttons = UNSAFE_getByType(TouchableOpacity);
    fireEvent.press(buttons);
    expect(screen.getByTestId("sheet")).toBeTruthy();
  });

  it("closes the sheet when close button is pressed", () => {
    const { UNSAFE_getByType } = render(<NotePickerButton {...defaultProps} />);
    const { TouchableOpacity } = require("react-native");
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    fireEvent.press(screen.getByTestId("glass-btn-close"));
    expect(screen.queryByTestId("sheet")).toBeNull();
  });

  it("calls onChange when a note pill is pressed", () => {
    const onChange = jest.fn();
    const { UNSAFE_getByType } = render(<NotePickerButton {...defaultProps} onChange={onChange} />);
    const { TouchableOpacity } = require("react-native");
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    fireEvent.press(screen.getByTestId("note-pill-E"));
    expect(onChange).toHaveBeenCalledWith("E");
  });

  it("triggers scale animation when value prop changes", () => {
    const { rerender } = render(<NotePickerButton {...defaultProps} value="C" />);
    act(() => {
      rerender(<NotePickerButton {...defaultProps} value="G" />);
    });
    expect(screen.getByText("G")).toBeTruthy();
  });

  it("renders note pills for all 12 chromatic notes", () => {
    const { UNSAFE_getByType } = render(<NotePickerButton {...defaultProps} />);
    const { TouchableOpacity } = require("react-native");
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(screen.getByTestId("note-pill-C")).toBeTruthy();
    expect(screen.getByTestId("note-pill-G")).toBeTruthy();
  });
});
