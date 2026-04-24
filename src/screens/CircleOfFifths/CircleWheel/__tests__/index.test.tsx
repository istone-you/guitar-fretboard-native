import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CircleWheel from "..";

describe("CircleWheel", () => {
  it("renders 12 major, 12 minor and 12 m(b5) segments", () => {
    const { getByTestId } = render(
      <CircleWheel
        theme="light"
        keyType="major"
        selectedIndex={0}
        activeOverlay={null}
        onSelect={jest.fn()}
      />,
    );

    for (let i = 0; i < 12; i += 1) {
      expect(getByTestId(`major-segment-${i}`)).toBeTruthy();
      expect(getByTestId(`minor-segment-${i}`)).toBeTruthy();
      expect(getByTestId(`flat5-segment-${i}`)).toBeTruthy();
    }
  });

  it("highlights the selected segment", () => {
    const { getByTestId } = render(
      <CircleWheel
        theme="light"
        keyType="major"
        selectedIndex={0}
        activeOverlay={null}
        onSelect={jest.fn()}
      />,
    );

    expect(getByTestId("major-segment-0").props.fill).not.toEqual(
      getByTestId("major-segment-1").props.fill,
    );
  });

  it("calls onSelect with 'major' keyType when a major segment is pressed", () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <CircleWheel
        theme="light"
        keyType="major"
        selectedIndex={0}
        activeOverlay={null}
        onSelect={onSelect}
      />,
    );

    fireEvent.press(getByTestId("major-segment-3"));
    expect(onSelect).toHaveBeenCalledWith(3, "major");
  });

  it("calls onSelect with 'minor' keyType when a minor segment is pressed", () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <CircleWheel
        theme="light"
        keyType="major"
        selectedIndex={0}
        activeOverlay={null}
        onSelect={onSelect}
      />,
    );

    fireEvent.press(getByTestId("minor-segment-5"));
    expect(onSelect).toHaveBeenCalledWith(5, "minor");
  });

  it("calls onSelect without keyType when a flat5 segment is pressed", () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <CircleWheel
        theme="light"
        keyType="minor"
        selectedIndex={0}
        activeOverlay={null}
        onSelect={onSelect}
      />,
    );

    fireEvent.press(getByTestId("flat5-segment-2"));
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("dims non-active rings in major mode", () => {
    const { getByTestId } = render(
      <CircleWheel
        theme="light"
        keyType="major"
        selectedIndex={0}
        activeOverlay={null}
        onSelect={jest.fn()}
      />,
    );

    expect(getByTestId("major-segment-1").props.opacity).toBe(1);
    expect(getByTestId("minor-segment-1").props.opacity).toBeLessThan(1);
    expect(getByTestId("flat5-segment-1").props.opacity).toBeLessThan(1);
  });

  it("dims non-active rings in minor mode", () => {
    const { getByTestId } = render(
      <CircleWheel
        theme="light"
        keyType="minor"
        selectedIndex={0}
        activeOverlay={null}
        onSelect={jest.fn()}
      />,
    );

    expect(getByTestId("minor-segment-1").props.opacity).toBe(1);
    expect(getByTestId("major-segment-1").props.opacity).toBeLessThan(1);
    expect(getByTestId("flat5-segment-1").props.opacity).toBeLessThan(1);
  });

  it("renders only the related-keys overlay when it is active", () => {
    const { getByTestId, queryByTestId } = render(
      <CircleWheel
        theme="light"
        keyType="major"
        selectedIndex={0}
        activeOverlay="relatedKeys"
        onSelect={jest.fn()}
      />,
    );

    expect(getByTestId("overlay-related-keys")).toBeTruthy();
    expect(queryByTestId("overlay-diatonic")).toBeNull();
    expect(queryByTestId("overlay-dominants")).toBeNull();
  });

  it("renders only the diatonic overlay when it is active", () => {
    const { getByTestId, queryByTestId } = render(
      <CircleWheel
        theme="light"
        keyType="major"
        selectedIndex={0}
        activeOverlay="diatonic"
        onSelect={jest.fn()}
      />,
    );

    expect(getByTestId("overlay-diatonic")).toBeTruthy();
    expect(queryByTestId("overlay-related-keys")).toBeNull();
  });

  it("renders the dominants overlay (secdom + tritone) when it is active", () => {
    const { getByTestId } = render(
      <CircleWheel
        theme="light"
        keyType="major"
        selectedIndex={0}
        activeOverlay="dominants"
        onSelect={jest.fn()}
      />,
    );

    expect(getByTestId("overlay-dominants")).toBeTruthy();
    expect(getByTestId("overlay-secdom-I")).toBeTruthy();
    expect(getByTestId("overlay-tritone-I")).toBeTruthy();
  });

  it("renders no overlay when activeOverlay is null", () => {
    const { queryByTestId } = render(
      <CircleWheel
        theme="light"
        keyType="major"
        selectedIndex={0}
        activeOverlay={null}
        onSelect={jest.fn()}
      />,
    );

    expect(queryByTestId("overlay-related-keys")).toBeNull();
    expect(queryByTestId("overlay-diatonic")).toBeNull();
    expect(queryByTestId("overlay-dominants")).toBeNull();
  });
});
