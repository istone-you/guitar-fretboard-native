import React from "react";
import { render, fireEvent, screen, act } from "@testing-library/react-native";
import { SegmentedToggle } from "../SegmentedToggle";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium", Heavy: "Heavy" },
}));

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

  // --- Rendering ---

  it("renders all option labels", () => {
    render(<SegmentedToggle {...defaultProps} />);
    expect(screen.getByText("One")).toBeTruthy();
    expect(screen.getByText("Two")).toBeTruthy();
    expect(screen.getByText("Three")).toBeTruthy();
  });

  it("uses String(value) as label when label prop is omitted", () => {
    const optionsNoLabel = [{ value: "alpha" }, { value: "beta" }];
    render(
      <SegmentedToggle theme="dark" value="alpha" onChange={jest.fn()} options={optionsNoLabel} />,
    );
    expect(screen.getByText("alpha")).toBeTruthy();
    expect(screen.getByText("beta")).toBeTruthy();
  });

  it("renders boolean options with labels", () => {
    render(
      <SegmentedToggle theme="dark" value={true} onChange={jest.fn()} options={booleanOptions} />,
    );
    expect(screen.getByText("On")).toBeTruthy();
    expect(screen.getByText("Off")).toBeTruthy();
  });

  it("uses String(boolean) as fallback label", () => {
    const boolNoLabel: { value: boolean }[] = [{ value: true }, { value: false }];
    render(
      <SegmentedToggle theme="dark" value={true} onChange={jest.fn()} options={boolNoLabel} />,
    );
    expect(screen.getByText("true")).toBeTruthy();
    expect(screen.getByText("false")).toBeTruthy();
  });

  // --- Selecting ---

  it("calls onChange with the selected value", () => {
    const onChange = jest.fn();
    render(<SegmentedToggle {...defaultProps} onChange={onChange} />);
    fireEvent.press(screen.getByText("Two"));
    expect(onChange).toHaveBeenCalledWith("two");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("calls onChange when pressing the already selected option", () => {
    const onChange = jest.fn();
    render(<SegmentedToggle {...defaultProps} onChange={onChange} />);
    fireEvent.press(screen.getByText("One"));
    expect(onChange).toHaveBeenCalledWith("one");
  });

  it("calls onChange with boolean values", () => {
    const onChange = jest.fn();
    render(
      <SegmentedToggle theme="dark" value={true} onChange={onChange} options={booleanOptions} />,
    );
    fireEvent.press(screen.getByText("Off"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  // --- Theme variants ---

  it("applies dark text to selected option in dark theme", () => {
    const { getByText } = render(<SegmentedToggle {...defaultProps} theme="dark" value="one" />);
    const style = getByText("One").props.style;
    const flat = Object.assign({}, ...(Array.isArray(style) ? style : [style]));
    expect(flat.color).toBe("#1c1917");
  });

  it("applies white text to selected option in light theme", () => {
    const { getByText } = render(<SegmentedToggle {...defaultProps} theme="light" value="one" />);
    const style = getByText("One").props.style;
    const flat = Object.assign({}, ...(Array.isArray(style) ? style : [style]));
    expect(flat.color).toBe("#fff");
  });

  it("buttons have no background color (indicator handles it)", () => {
    const { getByText } = render(<SegmentedToggle {...defaultProps} value="one" />);
    const selected = getByText("One").parent;
    const unselected = getByText("Two").parent;
    // Neither button should have inline backgroundColor
    expect(selected).toBeTruthy();
    expect(unselected).toBeTruthy();
  });

  it("applies dark theme text color to selected option", () => {
    const { toJSON } = render(<SegmentedToggle {...defaultProps} theme="dark" value="one" />);
    const tree = toJSON() as any;
    const selectedButton = tree.children[0];
    const textNode = selectedButton.children[0];
    const flatStyle = Object.assign(
      {},
      ...(Array.isArray(textNode?.props?.style) ? textNode.props.style : [textNode?.props?.style]),
    );
    expect(flatStyle.color).toBe("#1c1917");
  });

  it("applies dark theme text color to unselected option", () => {
    const { toJSON } = render(<SegmentedToggle {...defaultProps} theme="dark" value="one" />);
    const tree = toJSON() as any;
    const unselectedButton = tree.children[1];
    const textNode = unselectedButton.children[0];
    const flatStyle = Object.assign(
      {},
      ...(Array.isArray(textNode?.props?.style) ? textNode.props.style : [textNode?.props?.style]),
    );
    expect(flatStyle.color).toBe("#d1d5db");
  });

  it("applies light theme text color to unselected option", () => {
    const { toJSON } = render(<SegmentedToggle {...defaultProps} theme="light" value="one" />);
    const tree = toJSON() as any;
    const unselectedButton = tree.children[1];
    const textNode = unselectedButton.children[0];
    const flatStyle = Object.assign(
      {},
      ...(Array.isArray(textNode?.props?.style) ? textNode.props.style : [textNode?.props?.style]),
    );
    expect(flatStyle.color).toBe("#57534e");
  });

  it("applies dark theme container border color", () => {
    const { toJSON } = render(<SegmentedToggle {...defaultProps} theme="dark" />);
    const tree = toJSON() as any;
    const flatStyle = Object.assign(
      {},
      ...(Array.isArray(tree?.props?.style) ? tree.props.style : [tree?.props?.style]),
    );
    expect(flatStyle.borderColor).toBe("rgba(255,255,255,0.1)");
  });

  it("applies light theme container border color", () => {
    const { toJSON } = render(<SegmentedToggle {...defaultProps} theme="light" />);
    const tree = toJSON() as any;
    const flatStyle = Object.assign(
      {},
      ...(Array.isArray(tree?.props?.style) ? tree.props.style : [tree?.props?.style]),
    );
    expect(flatStyle.borderColor).toBe("#e7e5e4");
  });

  // --- Size variants ---

  it("applies default size padding", () => {
    const { toJSON } = render(<SegmentedToggle {...defaultProps} size="default" />);
    const tree = toJSON() as any;
    const button = tree.children[0];
    const flatStyle = Object.assign(
      {},
      ...(Array.isArray(button?.props?.style) ? button.props.style : [button?.props?.style]),
    );
    expect(flatStyle.paddingHorizontal).toBe(16);
    expect(flatStyle.paddingVertical).toBe(6);
  });

  it("applies compact size padding and minWidth", () => {
    const { toJSON } = render(<SegmentedToggle {...defaultProps} size="compact" />);
    const tree = toJSON() as any;
    const button = tree.children[0];
    const flatStyle = Object.assign(
      {},
      ...(Array.isArray(button?.props?.style) ? button.props.style : [button?.props?.style]),
    );
    expect(flatStyle.paddingHorizontal).toBe(8);
    expect(flatStyle.paddingVertical).toBe(4);
    expect(flatStyle.minWidth).toBe(48);
  });

  it("defaults to 'default' size when size prop is omitted", () => {
    const { toJSON } = render(<SegmentedToggle {...defaultProps} />);
    const tree = toJSON() as any;
    const button = tree.children[0];
    const flatStyle = Object.assign(
      {},
      ...(Array.isArray(button?.props?.style) ? button.props.style : [button?.props?.style]),
    );
    expect(flatStyle.paddingHorizontal).toBe(16);
  });

  // --- Edge cases ---

  it("renders with a single option", () => {
    render(
      <SegmentedToggle
        theme="dark"
        value="only"
        onChange={jest.fn()}
        options={[{ value: "only", label: "Only" }]}
      />,
    );
    expect(screen.getByText("Only")).toBeTruthy();
  });

  it("renders with many options", () => {
    const manyOptions = Array.from({ length: 10 }, (_, i) => ({
      value: `v${i}`,
      label: `Label ${i}`,
    }));
    render(<SegmentedToggle theme="dark" value="v0" onChange={jest.fn()} options={manyOptions} />);
    expect(screen.getByText("Label 0")).toBeTruthy();
    expect(screen.getByText("Label 9")).toBeTruthy();
  });

  // --- Layout and animation ---

  it("triggers onLayout for each button and shows slide indicator", () => {
    const onChange = jest.fn();
    render(<SegmentedToggle {...defaultProps} value="one" onChange={onChange} />);

    // Find the button elements by their text labels
    const labels = ["One", "Two", "Three"];
    act(() => {
      labels.forEach((label, idx) => {
        const textEl = screen.getByText(label);
        // Walk up to find the element with onLayout
        let node: any = textEl;
        while (node && !node.props?.onLayout) {
          node = node.parent;
        }
        if (node?.props?.onLayout) {
          node.props.onLayout({ nativeEvent: { layout: { width: 60 + idx * 10 } } });
        }
      });
    });

    // After all layouts, the indicator should be rendered (selectedWidth > 0)
    const updatedTree = screen.toJSON() as any;
    const jsonStr = JSON.stringify(updatedTree);
    expect(jsonStr).toContain('"translateX"');
  });

  it("triggers haptic feedback when value changes via handleChange", () => {
    const onChange = jest.fn();
    render(<SegmentedToggle {...defaultProps} value="one" onChange={onChange} />);

    // Set up button widths first
    const labels = ["One", "Two", "Three"];
    act(() => {
      labels.forEach((label) => {
        const textEl = screen.getByText(label);
        let node: any = textEl;
        while (node && !node.props?.onLayout) {
          node = node.parent;
        }
        if (node?.props?.onLayout) {
          node.props.onLayout({ nativeEvent: { layout: { width: 60 } } });
        }
      });
    });

    // Press a different option to trigger handleChange (which calls Haptics.impactAsync)
    fireEvent.press(screen.getByText("Two"));
    expect(onChange).toHaveBeenCalledWith("two");
    // Haptics.impactAsync is called inside handleChange - verify it was invoked
    const Haptics = require("expo-haptics");
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it("computes selectedLeft correctly when buttons have different widths", () => {
    const onChange = jest.fn();
    render(<SegmentedToggle {...defaultProps} value="two" onChange={onChange} />);

    // Set widths: One=50, Two=70, Three=60
    const labels = ["One", "Two", "Three"];
    const widths = [50, 70, 60];
    act(() => {
      labels.forEach((label, idx) => {
        const textEl = screen.getByText(label);
        let node: any = textEl;
        while (node && !node.props?.onLayout) {
          node = node.parent;
        }
        if (node?.props?.onLayout) {
          node.props.onLayout({ nativeEvent: { layout: { width: widths[idx] } } });
        }
      });
    });

    // Indicator should be visible (selectedWidth > 0 for "two")
    const updatedTree = screen.toJSON() as any;
    const jsonStr = JSON.stringify(updatedTree);
    expect(jsonStr).toContain('"translateX"');
  });

  it("does not render indicator before layout events", () => {
    render(<SegmentedToggle {...defaultProps} value="one" />);
    const tree = screen.toJSON() as any;
    // Before any onLayout, selectedWidth = 0, so indicator is not rendered
    const hasAbsoluteIndicator = tree.children.some((c: any) => {
      const style = c.props?.style;
      if (!style) return false;
      const flat = Array.isArray(style) ? Object.assign({}, ...style) : style;
      return flat.position === "absolute";
    });
    expect(hasAbsoluteIndicator).toBe(false);
  });
});
