import React, { createRef } from "react";
import { render, fireEvent, screen, act } from "@testing-library/react-native";
import { Animated } from "react-native";
import SettingsModal, { type SettingsModalRef } from "../index";
import type { Accidental, Theme } from "../../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "ja" },
  }),
}));

jest.mock("../../../../i18n", () => ({
  changeLocale: jest.fn(),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("../RangeSlider", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View testID="range-slider" /> };
});

jest.mock("../../../ui/SegmentedToggle", () => ({
  SegmentedToggle: ({ onChange, options }: any) => {
    const { View, TouchableOpacity, Text } = require("react-native");
    return (
      <View>
        {options.map((o: any) => (
          <TouchableOpacity key={String(o.value)} onPress={() => onChange(o.value)}>
            <Text>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
}));

const defaultProps = {
  theme: "light" as Theme,
  accidental: "sharp" as Accidental,
  fretRange: [0, 12] as [number, number],
  leftHanded: false,
  onThemeChange: jest.fn(),
  onAccidentalChange: jest.fn(),
  onFretRangeChange: jest.fn(),
  onLeftHandedChange: jest.fn(),
};

function openModal(ref: React.RefObject<SettingsModalRef | null>) {
  // Mock animations to run synchronously
  jest.spyOn(Animated, "timing").mockReturnValue({
    start: (cb?: Animated.EndCallback) => cb?.({ finished: true }),
  } as Animated.CompositeAnimation);
  jest.spyOn(Animated, "parallel").mockReturnValue({
    start: (cb?: Animated.EndCallback) => cb?.({ finished: true }),
  } as Animated.CompositeAnimation);
  act(() => {
    ref.current?.open();
  });
}

describe("SettingsModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("renders without crashing", () => {
    const ref = createRef<SettingsModalRef>();
    expect(() => render(<SettingsModal ref={ref} {...defaultProps} />)).not.toThrow();
  });

  it("modal is not visible initially", () => {
    const ref = createRef<SettingsModalRef>();
    render(<SettingsModal ref={ref} {...defaultProps} />);
    expect(screen.queryByText("settings")).toBeNull();
  });

  it("modal becomes visible after ref.open()", () => {
    const ref = createRef<SettingsModalRef>();
    render(<SettingsModal ref={ref} {...defaultProps} />);
    openModal(ref);
    expect(screen.getByText("settings")).toBeTruthy();
  });

  it("renders theme, accidental, language settings after open", () => {
    const ref = createRef<SettingsModalRef>();
    render(<SettingsModal ref={ref} {...defaultProps} />);
    openModal(ref);
    expect(screen.getByText("theme")).toBeTruthy();
    expect(screen.getByText("accidental")).toBeTruthy();
    expect(screen.getByText("language")).toBeTruthy();
  });

  it("renders RangeSlider for fret range", () => {
    const ref = createRef<SettingsModalRef>();
    render(<SettingsModal ref={ref} {...defaultProps} />);
    openModal(ref);
    expect(screen.getByTestId("range-slider")).toBeTruthy();
  });

  it("calls onThemeChange when dark option is pressed", () => {
    const onThemeChange = jest.fn();
    const ref = createRef<SettingsModalRef>();
    render(<SettingsModal ref={ref} {...defaultProps} onThemeChange={onThemeChange} />);
    openModal(ref);
    fireEvent.press(screen.getByText("🌙"));
    expect(onThemeChange).toHaveBeenCalledWith("dark");
  });

  it("calls onAccidentalChange when ♭ is pressed", () => {
    const onAccidentalChange = jest.fn();
    const ref = createRef<SettingsModalRef>();
    render(<SettingsModal ref={ref} {...defaultProps} onAccidentalChange={onAccidentalChange} />);
    openModal(ref);
    fireEvent.press(screen.getByText("♭"));
    expect(onAccidentalChange).toHaveBeenCalledWith("flat");
  });

  it("renders leftHanded toggle when onLeftHandedChange is provided", () => {
    const ref = createRef<SettingsModalRef>();
    render(<SettingsModal ref={ref} {...defaultProps} />);
    openModal(ref);
    expect(screen.getByText("leftHanded")).toBeTruthy();
  });

  it("does not render leftHanded toggle when onLeftHandedChange is undefined", () => {
    const ref = createRef<SettingsModalRef>();
    render(<SettingsModal ref={ref} {...defaultProps} onLeftHandedChange={undefined} />);
    openModal(ref);
    expect(screen.queryByText("leftHanded")).toBeNull();
  });

  it("calls onLeftHandedChange when switch is toggled", () => {
    const onLeftHandedChange = jest.fn();
    const ref = createRef<SettingsModalRef>();
    render(<SettingsModal ref={ref} {...defaultProps} onLeftHandedChange={onLeftHandedChange} />);
    openModal(ref);
    fireEvent(screen.UNSAFE_getByType(require("react-native").Switch), "valueChange", true);
    expect(onLeftHandedChange).toHaveBeenCalledWith(true);
  });

  it("closes modal when ✕ button is pressed", () => {
    const ref = createRef<SettingsModalRef>();
    render(<SettingsModal ref={ref} {...defaultProps} />);
    openModal(ref);
    expect(screen.getByText("settings")).toBeTruthy();
    fireEvent.press(screen.getByTestId("settings-close-btn"));
    expect(screen.queryByText("settings")).toBeNull();
  });
});
