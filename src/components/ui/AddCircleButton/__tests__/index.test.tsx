import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import AddCircleButton from "..";

jest.mock("../../Icon", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View testID="icon" /> };
});

describe("AddCircleButton", () => {
  it("renders without crashing", () => {
    render(<AddCircleButton isDark={false} onPress={jest.fn()} />);
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = render(<AddCircleButton isDark={false} onPress={onPress} />);
    const { TouchableOpacity } = require("react-native");
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("applies light color when isDark=false", () => {
    const { UNSAFE_getByType } = render(<AddCircleButton isDark={false} onPress={jest.fn()} />);
    const { TouchableOpacity } = require("react-native");
    const btn = UNSAFE_getByType(TouchableOpacity);
    expect(btn.props.style.borderColor).toBe("#6b7280");
  });

  it("applies dark color when isDark=true", () => {
    const { UNSAFE_getByType } = render(<AddCircleButton isDark={true} onPress={jest.fn()} />);
    const { TouchableOpacity } = require("react-native");
    const btn = UNSAFE_getByType(TouchableOpacity);
    expect(btn.props.style.borderColor).toBe("#9ca3af");
  });

  it("uses default size of 22", () => {
    const { UNSAFE_getByType } = render(<AddCircleButton isDark={false} onPress={jest.fn()} />);
    const { TouchableOpacity } = require("react-native");
    const btn = UNSAFE_getByType(TouchableOpacity);
    expect(btn.props.style.width).toBe(22);
    expect(btn.props.style.height).toBe(22);
  });

  it("uses custom size when provided", () => {
    const { UNSAFE_getByType } = render(
      <AddCircleButton isDark={false} onPress={jest.fn()} size={30} />,
    );
    const { TouchableOpacity } = require("react-native");
    const btn = UNSAFE_getByType(TouchableOpacity);
    expect(btn.props.style.width).toBe(30);
    expect(btn.props.style.height).toBe(30);
  });

  it("renders the plus Icon", () => {
    render(<AddCircleButton isDark={false} onPress={jest.fn()} />);
    expect(screen.getByTestId("icon")).toBeTruthy();
  });
});
