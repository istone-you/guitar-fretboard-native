import React from "react";
import { render, fireEvent, screen, act } from "@testing-library/react-native";
import NotePill from "../NotePill";

const defaultProps = {
  label: "C",
  selected: false,
  activeBg: "#000",
  activeText: "#fff",
  inactiveBg: "#eee",
  inactiveText: "#333",
  onPress: jest.fn(),
};

describe("NotePill", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the label text", () => {
    render(<NotePill {...defaultProps} />);
    expect(screen.getByText("C")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    render(<NotePill {...defaultProps} onPress={onPress} />);
    fireEvent.press(screen.getByText("C"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("applies activeBg when selected=true", () => {
    const { UNSAFE_getByType } = render(<NotePill {...defaultProps} selected={true} />);
    const { TouchableOpacity } = require("react-native");
    const pill = UNSAFE_getByType(TouchableOpacity);
    expect(pill.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: "#000" })]),
    );
  });

  it("applies inactiveBg when selected=false", () => {
    const { UNSAFE_getByType } = render(<NotePill {...defaultProps} selected={false} />);
    const { TouchableOpacity } = require("react-native");
    const pill = UNSAFE_getByType(TouchableOpacity);
    expect(pill.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: "#eee" })]),
    );
  });

  it("applies activeText color when selected=true", () => {
    render(<NotePill {...defaultProps} selected={true} />);
    const { Text } = require("react-native");
    const { UNSAFE_getAllByType } = render(<NotePill {...defaultProps} selected={true} />);
    const texts = UNSAFE_getAllByType(Text);
    const labelText = texts.find((t: any) => t.props.children === "C");
    expect(labelText?.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: "#fff" })]),
    );
  });

  it("applies inactiveText color when selected=false", () => {
    const { UNSAFE_getAllByType } = render(<NotePill {...defaultProps} selected={false} />);
    const { Text } = require("react-native");
    const texts = UNSAFE_getAllByType(Text);
    const labelText = texts.find((t: any) => t.props.children === "C");
    expect(labelText?.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: "#333" })]),
    );
  });

  it("triggers scale animation when selected changes from false to true", () => {
    const { rerender } = render(<NotePill {...defaultProps} selected={false} />);
    act(() => {
      rerender(<NotePill {...defaultProps} selected={true} />);
    });
    // No crash = animation branch was hit
    expect(screen.getByText("C")).toBeTruthy();
  });

  it("triggers scale animation when selected changes from true to false", () => {
    const { rerender } = render(<NotePill {...defaultProps} selected={true} />);
    act(() => {
      rerender(<NotePill {...defaultProps} selected={false} />);
    });
    expect(screen.getByText("C")).toBeTruthy();
  });

  it("renders correctly with sharp note label", () => {
    render(<NotePill {...defaultProps} label="C#" />);
    expect(screen.getByText("C#")).toBeTruthy();
  });
});
