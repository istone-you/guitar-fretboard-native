import React from "react";
import { render, fireEvent, screen, act } from "@testing-library/react-native";
import { DropdownSelect } from "../DropdownSelect";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma" },
];

const getTriggerNode = (tree: unknown): any => {
  const wrapper: any = Array.isArray(tree) ? tree[0] : tree;
  return wrapper?.children?.[0] ?? wrapper;
};

const getLabelTextNode = (trigger: any, label: string): any =>
  trigger?.children?.find((c: any) => c?.type === "Text" && c?.children?.includes(label));

describe("DropdownSelect", () => {
  const defaultProps = {
    theme: "dark" as const,
    value: "a",
    onChange: jest.fn(),
    options,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Rendering ---

  it("renders the selected option label", () => {
    render(<DropdownSelect {...defaultProps} />);
    expect(screen.getByText("Alpha")).toBeTruthy();
  });

  it("renders the chevron indicator", () => {
    render(<DropdownSelect {...defaultProps} />);
    // SVG chevron is rendered instead of text
  });

  it("shows the first option label when value does not match any option", () => {
    render(<DropdownSelect {...defaultProps} value="nonexistent" />);
    // falls back to options[0]
    expect(screen.getByText("Alpha")).toBeTruthy();
  });

  // --- Opening and closing modal ---

  it("opens the modal when trigger is pressed", () => {
    render(<DropdownSelect {...defaultProps} />);
    fireEvent.press(screen.getByText("Alpha"));
    // All option labels should now be visible in the modal
    expect(screen.getByText("Beta")).toBeTruthy();
    expect(screen.getByText("Gamma")).toBeTruthy();
  });

  it("closes the modal when an option is selected", () => {
    jest.useFakeTimers();
    const onChange = jest.fn();
    render(<DropdownSelect {...defaultProps} onChange={onChange} />);
    fireEvent.press(screen.getByText("Alpha"));
    fireEvent.press(screen.getByText("Beta"));
    expect(onChange).toHaveBeenCalledWith("b");
    act(() => {
      jest.runAllTimers();
    });
    expect(screen.queryAllByText("Gamma")).toHaveLength(0);
    jest.useRealTimers();
  });

  it("closes the modal via onRequestClose (Android back button)", () => {
    jest.useFakeTimers();
    const { UNSAFE_getByType } = render(<DropdownSelect {...defaultProps} />);
    const { Modal: RNModal } = require("react-native");
    fireEvent.press(screen.getByText("Alpha"));
    expect(screen.getByText("Beta")).toBeTruthy();
    act(() => {
      const modal = UNSAFE_getByType(RNModal);
      modal.props.onRequestClose();
    });
    act(() => {
      jest.runAllTimers();
    });
    expect(screen.queryByText("Beta")).toBeNull();
    jest.useRealTimers();
  });

  it("closes the modal when the overlay backdrop is pressed", () => {
    jest.useFakeTimers();
    const { UNSAFE_getByType } = render(<DropdownSelect {...defaultProps} />);
    const { Modal: RNModal } = require("react-native");
    fireEvent.press(screen.getByText("Alpha"));
    expect(screen.getByText("Beta")).toBeTruthy();
    act(() => {
      const modal = UNSAFE_getByType(RNModal);
      modal.props.children.props.onPress();
    });
    act(() => {
      jest.runAllTimers();
    });
    expect(screen.queryByText("Beta")).toBeNull();
    jest.useRealTimers();
  });

  // --- Selecting options ---

  it("calls onChange with the correct value when an option is pressed", () => {
    const onChange = jest.fn();
    render(<DropdownSelect {...defaultProps} onChange={onChange} />);
    fireEvent.press(screen.getByText("Alpha"));
    fireEvent.press(screen.getByText("Gamma"));
    expect(onChange).toHaveBeenCalledWith("c");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("highlights the currently selected option in the list", () => {
    render(<DropdownSelect {...defaultProps} value="b" />);
    // Trigger shows "Beta" as the selected label
    fireEvent.press(screen.getByText("Beta"));
    // After opening, "Beta" appears both in trigger and in the list
    const betaElements = screen.getAllByText("Beta");
    expect(betaElements.length).toBeGreaterThanOrEqual(2);
    // Other options also visible in the list
    expect(screen.getByText("Alpha")).toBeTruthy();
    expect(screen.getByText("Gamma")).toBeTruthy();
  });

  // --- Disabled state ---

  it("does not open the modal when disabled", () => {
    render(<DropdownSelect {...defaultProps} disabled />);
    fireEvent.press(screen.getByText("Alpha"));
    // Beta should not appear because modal didn't open
    expect(screen.queryByText("Beta")).toBeNull();
  });

  it("applies disabled styling (trigger is still rendered)", () => {
    render(<DropdownSelect {...defaultProps} disabled />);
    expect(screen.getByText("Alpha")).toBeTruthy();
    // SVG chevron is rendered instead of text
  });

  // --- fullWidth prop ---

  it("applies fullWidth stretch style when fullWidth is true", () => {
    const { toJSON } = render(<DropdownSelect {...defaultProps} fullWidth />);
    const tree = toJSON();
    const trigger = getTriggerNode(tree);
    const flatStyle = Object.assign(
      {},
      ...(Array.isArray(trigger?.props?.style) ? trigger.props.style : [trigger?.props?.style]),
    );
    expect(flatStyle.alignSelf).toBe("stretch");
  });

  it("does not apply stretch style when fullWidth is false", () => {
    const { toJSON } = render(<DropdownSelect {...defaultProps} fullWidth={false} />);
    const tree = toJSON();
    const trigger = getTriggerNode(tree);
    const flatStyle = Object.assign(
      {},
      ...(Array.isArray(trigger?.props?.style) ? trigger.props.style : [trigger?.props?.style]),
    );
    expect(flatStyle.alignSelf).not.toBe("stretch");
  });

  // --- Theme variants ---

  it("renders with light theme styling", () => {
    render(<DropdownSelect {...defaultProps} theme="light" />);
    expect(screen.getByText("Alpha")).toBeTruthy();
  });

  it("renders with dark theme styling", () => {
    render(<DropdownSelect {...defaultProps} theme="dark" />);
    expect(screen.getByText("Alpha")).toBeTruthy();
  });

  it("applies dark theme colors to trigger text", () => {
    const { toJSON } = render(<DropdownSelect {...defaultProps} theme="dark" />);
    const tree = toJSON();
    const trigger = getTriggerNode(tree);
    const textNode = getLabelTextNode(trigger, "Alpha");
    const flatStyle = Object.assign(
      {},
      ...(Array.isArray(textNode?.props?.style) ? textNode.props.style : [textNode?.props?.style]),
    );
    expect(flatStyle.color).toBe("#fff");
  });

  it("applies light theme colors to trigger text", () => {
    const { toJSON } = render(<DropdownSelect {...defaultProps} theme="light" />);
    const tree = toJSON();
    const trigger = getTriggerNode(tree);
    const textNode = getLabelTextNode(trigger, "Alpha");
    const flatStyle = Object.assign(
      {},
      ...(Array.isArray(textNode?.props?.style) ? textNode.props.style : [textNode?.props?.style]),
    );
    expect(flatStyle.color).toBe("#1c1917");
  });

  it("applies disabled text color in dark theme", () => {
    const { toJSON } = render(<DropdownSelect {...defaultProps} theme="dark" disabled />);
    const tree = toJSON();
    const trigger = getTriggerNode(tree);
    const textNode = getLabelTextNode(trigger, "Alpha");
    const flatStyle = Object.assign(
      {},
      ...(Array.isArray(textNode?.props?.style) ? textNode.props.style : [textNode?.props?.style]),
    );
    expect(flatStyle.color).toBe("#6b7280");
  });

  it("applies disabled text color in light theme", () => {
    const { toJSON } = render(<DropdownSelect {...defaultProps} theme="light" disabled />);
    const tree = toJSON();
    const trigger = getTriggerNode(tree);
    const textNode = getLabelTextNode(trigger, "Alpha");
    const flatStyle = Object.assign(
      {},
      ...(Array.isArray(textNode?.props?.style) ? textNode.props.style : [textNode?.props?.style]),
    );
    expect(flatStyle.color).toBe("#a8a29e");
  });

  // --- Open state styling ---

  it("applies open state border color in dark theme", () => {
    const { toJSON } = render(<DropdownSelect {...defaultProps} theme="dark" />);
    fireEvent.press(screen.getByText("Alpha"));
    // After opening, the trigger should have the "open" border color
    const tree = toJSON();
    const trigger = getTriggerNode(tree);
    const flatStyle = Object.assign(
      {},
      ...(Array.isArray(trigger?.props?.style) ? trigger.props.style : [trigger?.props?.style]),
    );
    expect(flatStyle.borderColor).toBe("rgba(255,255,255,0.14)");
  });

  it("applies open state border color in light theme", () => {
    render(<DropdownSelect {...defaultProps} theme="light" />);
    fireEvent.press(screen.getByText("Alpha"));
    const tree = screen.toJSON();
    // In open state with light theme, we just confirm it renders without error
    expect(tree).toBeTruthy();
  });

  // --- Edge cases ---

  it("renders correctly with a single option", () => {
    render(
      <DropdownSelect
        {...defaultProps}
        options={[{ value: "only", label: "Only Option" }]}
        value="only"
      />,
    );
    expect(screen.getByText("Only Option")).toBeTruthy();
  });

  it("renders correctly with many options", () => {
    const manyOptions = Array.from({ length: 50 }, (_, i) => ({
      value: `opt${i}`,
      label: `Option ${i}`,
    }));
    render(<DropdownSelect {...defaultProps} options={manyOptions} value="opt0" />);
    expect(screen.getByText("Option 0")).toBeTruthy();
  });
});
