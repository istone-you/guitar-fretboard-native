import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SegmentedToggle } from "../index";

const stringOptions = [
  { value: "one", label: "One" },
  { value: "two", label: "Two" },
  { value: "three", label: "Three" },
];

const booleanOptions: { value: boolean; label: string }[] = [
  { value: true, label: "On" },
  { value: false, label: "Off" },
];

describe("SegmentedToggle", () => {
  const defaultProps = {
    theme: "dark" as const,
    value: "one" as string,
    onChange: jest.fn(),
    options: stringOptions,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { UNSAFE_getByType } = render(<SegmentedToggle {...defaultProps} />);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SC = require("@react-native-segmented-control/segmented-control").default;
    expect(UNSAFE_getByType(SC)).toBeTruthy();
  });

  it("passes labels to native component", () => {
    const { UNSAFE_getByType } = render(<SegmentedToggle {...defaultProps} />);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SC = require("@react-native-segmented-control/segmented-control").default;
    expect(UNSAFE_getByType(SC).props.values).toEqual(["One", "Two", "Three"]);
  });

  it("uses String(value) as label when label prop is omitted", () => {
    const { UNSAFE_getByType } = render(
      <SegmentedToggle
        theme="dark"
        value="alpha"
        onChange={jest.fn()}
        options={[{ value: "alpha" }, { value: "beta" }]}
      />,
    );
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SC = require("@react-native-segmented-control/segmented-control").default;
    expect(UNSAFE_getByType(SC).props.values).toEqual(["alpha", "beta"]);
  });

  it("uses String(boolean) as fallback label", () => {
    const { UNSAFE_getByType } = render(
      <SegmentedToggle
        theme="dark"
        value={true}
        onChange={jest.fn()}
        options={[{ value: true }, { value: false }]}
      />,
    );
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SC = require("@react-native-segmented-control/segmented-control").default;
    expect(UNSAFE_getByType(SC).props.values).toEqual(["true", "false"]);
  });

  it("passes selectedIndex matching current value", () => {
    const { UNSAFE_getByType } = render(<SegmentedToggle {...defaultProps} value="two" />);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SC = require("@react-native-segmented-control/segmented-control").default;
    expect(UNSAFE_getByType(SC).props.selectedIndex).toBe(1);
  });

  it("calls onChange with string value when a segment is selected", () => {
    const onChange = jest.fn();
    const { UNSAFE_getByType } = render(<SegmentedToggle {...defaultProps} onChange={onChange} />);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SC = require("@react-native-segmented-control/segmented-control").default;
    fireEvent(UNSAFE_getByType(SC), "change", {
      nativeEvent: { selectedSegmentIndex: 1 },
    });
    expect(onChange).toHaveBeenCalledWith("two");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("calls onChange with boolean value when segment is selected", () => {
    const onChange = jest.fn();
    const { UNSAFE_getByType } = render(
      <SegmentedToggle theme="dark" value={true} onChange={onChange} options={booleanOptions} />,
    );
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SC = require("@react-native-segmented-control/segmented-control").default;
    fireEvent(UNSAFE_getByType(SC), "change", {
      nativeEvent: { selectedSegmentIndex: 1 },
    });
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("renders with a single option", () => {
    const { UNSAFE_getByType } = render(
      <SegmentedToggle
        theme="dark"
        value="only"
        onChange={jest.fn()}
        options={[{ value: "only", label: "Only" }]}
      />,
    );
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SC = require("@react-native-segmented-control/segmented-control").default;
    expect(UNSAFE_getByType(SC).props.values).toEqual(["Only"]);
  });

  it("renders with many options", () => {
    const manyOptions = Array.from({ length: 10 }, (_, i) => ({
      value: `v${i}`,
      label: `Label ${i}`,
    }));
    const { UNSAFE_getByType } = render(
      <SegmentedToggle theme="dark" value="v0" onChange={jest.fn()} options={manyOptions} />,
    );
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SC = require("@react-native-segmented-control/segmented-control").default;
    expect(UNSAFE_getByType(SC).props.values).toHaveLength(10);
  });
});
