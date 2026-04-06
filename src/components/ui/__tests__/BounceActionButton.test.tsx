import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import { Animated } from "react-native";
import BounceActionButton from "../BounceActionButton";

jest.useFakeTimers();

describe("BounceActionButton", () => {
  const defaultProps = {
    label: "Tap me",
    onPress: jest.fn(),
    style: { backgroundColor: "blue", padding: 10 },
    textStyle: { color: "white", fontSize: 16 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the label text", () => {
    render(<BounceActionButton {...defaultProps} />);
    expect(screen.getByText("Tap me")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    render(<BounceActionButton {...defaultProps} />);
    fireEvent.press(screen.getByText("Tap me"));
    expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
  });

  it("applies style and textStyle", () => {
    render(<BounceActionButton {...defaultProps} />);
    const textElement = screen.getByText("Tap me");
    expect(textElement.props.style).toEqual(
      expect.objectContaining({ color: "white", fontSize: 16 }),
    );
  });

  it("triggers bounce animation on press without crashing", () => {
    const springSpy = jest.spyOn(Animated, "spring");
    render(<BounceActionButton {...defaultProps} />);
    fireEvent.press(screen.getByText("Tap me"));
    expect(springSpy).toHaveBeenCalledWith(
      expect.any(Animated.Value),
      expect.objectContaining({
        toValue: 1,
        friction: 5,
        tension: 180,
        useNativeDriver: true,
      }),
    );
    springSpy.mockRestore();
  });
});
