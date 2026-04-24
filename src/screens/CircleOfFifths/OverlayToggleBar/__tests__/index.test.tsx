import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import OverlayToggleBar from "..";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light" },
}));

describe("OverlayToggleBar", () => {
  it("renders a pill for each overlay key", () => {
    const { getByTestId } = render(
      <OverlayToggleBar theme="light" activeOverlay={null} onChange={jest.fn()} />,
    );

    expect(getByTestId("circle-overlay-toggle-relatedKeys")).toBeTruthy();
    expect(getByTestId("circle-overlay-toggle-diatonic")).toBeTruthy();
    expect(getByTestId("circle-overlay-toggle-dominants")).toBeTruthy();
  });

  it("fires onChange with the tapped key when none is active", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <OverlayToggleBar theme="light" activeOverlay={null} onChange={onChange} />,
    );

    fireEvent.press(getByTestId("circle-overlay-toggle-diatonic"));
    expect(onChange).toHaveBeenCalledWith("diatonic");
  });

  it("fires onChange with null when tapping the active overlay", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <OverlayToggleBar theme="light" activeOverlay="diatonic" onChange={onChange} />,
    );

    fireEvent.press(getByTestId("circle-overlay-toggle-diatonic"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("switches from one active overlay to another", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <OverlayToggleBar theme="light" activeOverlay="diatonic" onChange={onChange} />,
    );

    fireEvent.press(getByTestId("circle-overlay-toggle-relatedKeys"));
    expect(onChange).toHaveBeenCalledWith("relatedKeys");
  });

  it("reflects selected state via accessibility state", () => {
    const { getByTestId } = render(
      <OverlayToggleBar theme="light" activeOverlay="diatonic" onChange={jest.fn()} />,
    );

    expect(getByTestId("circle-overlay-toggle-diatonic").props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(getByTestId("circle-overlay-toggle-relatedKeys").props.accessibilityState).toMatchObject(
      { selected: false },
    );
  });
});
