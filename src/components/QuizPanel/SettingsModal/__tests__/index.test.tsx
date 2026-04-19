import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import { Animated } from "react-native";
import SettingsModal from "../index";
import type { Theme } from "../../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../../../../i18n", () => ({}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" },
}));

jest.mock("../../../ui/ChevronIcon", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View testID="chevron-icon" /> };
});

jest.mock("../../../ui/GlassIconButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({
      onPress,
      label,
      testID,
    }: {
      onPress: () => void;
      label: string;
      testID?: string;
    }) => (
      <TouchableOpacity onPress={onPress} testID={testID}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock("../../../ui/SheetProgressiveHeader", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({
      children,
      onLayout,
    }: {
      children: React.ReactNode;
      onLayout?: (h: number) => void;
    }) => <View onLayout={onLayout ? () => onLayout(96) : undefined}>{children}</View>,
  };
});

const toggle = jest.fn();

const defaultProps = {
  theme: "light" as Theme,
  visible: true,
  settingsRows: [
    { key: "keys", label: "Keys", summary: "All" },
    { key: "chords", label: "Chords", summary: "Major" },
  ],
  settingsSubPages: {
    keys: {
      title: "Select Keys",
      items: ["C", "D", "E"],
      selected: ["C"],
      labels: null,
      toggle,
    },
    chords: {
      title: "Select Chords",
      items: ["Major", "Minor"],
      selected: [],
      labels: { Major: "メジャー", Minor: "マイナー" },
      toggle,
    },
  },
  onClose: jest.fn(),
};

describe("QuizPanel SettingsModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing when visible", () => {
    expect(() => render(<SettingsModal {...defaultProps} />)).not.toThrow();
  });

  it("does not render content when not visible", () => {
    render(<SettingsModal {...defaultProps} visible={false} />);
    expect(screen.queryByText("settings")).toBeNull();
  });

  it("shows settings title when visible", () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByText("settings")).toBeTruthy();
  });

  it("renders all settings rows", () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByText("Keys")).toBeTruthy();
    expect(screen.getByText("Chords")).toBeTruthy();
  });

  it("renders row summaries", () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByText("All")).toBeTruthy();
    expect(screen.getByText("Major")).toBeTruthy();
  });

  it("navigates to sub-page when a row is pressed", () => {
    render(<SettingsModal {...defaultProps} />);
    fireEvent.press(screen.getByText("Keys"));
    expect(screen.getByText("Select Keys")).toBeTruthy();
  });

  it("shows sub-page items", () => {
    render(<SettingsModal {...defaultProps} />);
    fireEvent.press(screen.getByText("Keys"));
    expect(screen.getByText("C")).toBeTruthy();
    expect(screen.getByText("D")).toBeTruthy();
    expect(screen.getByText("E")).toBeTruthy();
  });

  it("uses labels map when provided in sub-page", () => {
    render(<SettingsModal {...defaultProps} />);
    fireEvent.press(screen.getByText("Chords"));
    expect(screen.getByText("メジャー")).toBeTruthy();
    expect(screen.getByText("マイナー")).toBeTruthy();
  });

  it("calls toggle when a chip is pressed", () => {
    render(<SettingsModal {...defaultProps} />);
    fireEvent.press(screen.getByText("Keys"));
    fireEvent.press(screen.getByText("D"));
    expect(toggle).toHaveBeenCalledWith("D");
  });

  it("returns to main page when back button is pressed", () => {
    render(<SettingsModal {...defaultProps} />);
    fireEvent.press(screen.getByText("Keys"));
    expect(screen.getByText("Select Keys")).toBeTruthy();
    fireEvent.press(screen.getByTestId("settings-back-btn"));
    expect(screen.getByText("settings")).toBeTruthy();
  });

  it("calls onClose when ✕ button is pressed on main page", () => {
    jest.spyOn(Animated, "parallel").mockReturnValue({
      start: (cb?: (result: { finished: boolean }) => void) => cb?.({ finished: true }),
    } as Animated.CompositeAnimation);

    const onClose = jest.fn();
    render(<SettingsModal {...defaultProps} onClose={onClose} />);
    fireEvent.press(screen.getByTestId("settings-close-btn"));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders in dark theme without crashing", () => {
    expect(() => render(<SettingsModal {...defaultProps} theme="dark" />)).not.toThrow();
  });

  it("renders correctly with a single settings row", () => {
    const props = {
      ...defaultProps,
      settingsRows: [{ key: "keys", label: "Keys", summary: "All" }],
    };
    render(<SettingsModal {...props} />);
    expect(screen.getByText("Keys")).toBeTruthy();
  });
});
