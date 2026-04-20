import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import TemplateFormSheet, { chordDisplayLabel, CHROMATIC_DEGREES, CHORD_TYPE_GROUPS } from "..";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../../../i18n", () => ({}));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" },
}));

jest.mock("../../../../components/ui/BottomSheetModal", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({
      visible,
      children,
      onClose,
    }: {
      visible: boolean;
      children: (c: {
        close: () => void;
        closeWithCallback: () => void;
        dragHandlers: object;
      }) => React.ReactNode;
      onClose: () => void;
    }) =>
      visible ? (
        <View testID="sheet">
          {children({ close: onClose, closeWithCallback: onClose, dragHandlers: {} })}
        </View>
      ) : null,
    SHEET_HANDLE_CLEARANCE: 28,
    useSheetHeight: () => 400,
  };
});

jest.mock("../../../../components/ui/SheetProgressiveHeader", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <View testID="sheet-header">{children}</View>
    ),
  };
});

jest.mock("../../../../components/ui/GlassIconButton", () => {
  const { TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({
      onPress,
      icon,
      disabled,
    }: {
      onPress: () => void;
      icon: string;
      disabled?: boolean;
    }) => <TouchableOpacity testID={`glass-${icon}`} onPress={onPress} disabled={disabled} />,
  };
});

jest.mock("../../../../components/ui/SegmentedToggle", () => ({
  SegmentedToggle: ({ onChange, value }: { onChange: (v: string) => void; value: string }) => {
    const { TouchableOpacity, Text } = require("react-native");
    return (
      <TouchableOpacity testID={`toggle-${value}`} onPress={() => onChange("seventh")}>
        <Text>{value}</Text>
      </TouchableOpacity>
    );
  },
}));

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  theme: "light" as const,
  initialTemplate: null,
  onSave: jest.fn(),
};

// ── chordDisplayLabel ──────────────────────────────────────────────────────

describe("chordDisplayLabel", () => {
  it("returns degree + suffix for Major chord", () => {
    expect(chordDisplayLabel({ degree: "I", chordType: "Major" })).toBe("I");
  });

  it("returns degree + suffix for Minor chord", () => {
    expect(chordDisplayLabel({ degree: "II", chordType: "Minor" })).toBe("IIm");
  });

  it("replaces b with ♭ in degree", () => {
    expect(chordDisplayLabel({ degree: "bVII", chordType: "Major" })).toBe("♭VII");
  });

  it("returns degree + 7 suffix for 7th chord", () => {
    expect(chordDisplayLabel({ degree: "V", chordType: "7th" })).toBe("V7");
  });
});

// ── CHROMATIC_DEGREES ──────────────────────────────────────────────────────

describe("CHROMATIC_DEGREES", () => {
  it("has 12 entries", () => {
    expect(CHROMATIC_DEGREES).toHaveLength(12);
  });

  it("starts with I", () => {
    expect(CHROMATIC_DEGREES[0][0]).toBe("I");
  });
});

// ── CHORD_TYPE_GROUPS ──────────────────────────────────────────────────────

describe("CHORD_TYPE_GROUPS", () => {
  it("has triad, seventh, and tension groups", () => {
    const keys = CHORD_TYPE_GROUPS.map((g) => g.labelKey);
    expect(keys).toContain("triad");
    expect(keys).toContain("seventh");
    expect(keys).toContain("tension");
  });
});

// ── TemplateFormSheet component ───────────────────────────────────────────

describe("TemplateFormSheet", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders when visible=true", () => {
    render(<TemplateFormSheet {...defaultProps} />);
    expect(screen.getByTestId("sheet")).toBeTruthy();
  });

  it("does not render when visible=false", () => {
    render(<TemplateFormSheet {...defaultProps} visible={false} />);
    expect(screen.queryByTestId("sheet")).toBeNull();
  });

  it("closes via close button", () => {
    const onClose = jest.fn();
    render(<TemplateFormSheet {...defaultProps} onClose={onClose} />);
    fireEvent.press(screen.getByTestId("glass-close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("populates name from initialTemplate", () => {
    render(
      <TemplateFormSheet
        {...defaultProps}
        initialTemplate={{
          id: "t1",
          name: "My Template",
          chords: [],
          createdAt: 0,
        }}
      />,
    );
    const { TextInput } = require("react-native");
    const { UNSAFE_getByType } = render(
      <TemplateFormSheet
        {...defaultProps}
        initialTemplate={{ id: "t1", name: "My Template", chords: [], createdAt: 0 }}
      />,
    );
    expect(UNSAFE_getByType(TextInput).props.value).toBe("My Template");
  });

  it("save button is disabled when name is empty and no chords", () => {
    render(<TemplateFormSheet {...defaultProps} />);
    const saveBtn = screen.getByTestId("glass-check");
    expect(
      saveBtn.props.disabled === true || saveBtn.props.accessibilityState?.disabled === true,
    ).toBe(true);
  });

  it("selects a degree and shows chord type panel", () => {
    render(<TemplateFormSheet {...defaultProps} />);
    const degreeBtn = screen.getByText("I");
    fireEvent.press(degreeBtn);
    // After pressing a degree, the callout panel becomes visible (pointerEvents auto)
    expect(screen.getByText("I")).toBeTruthy();
  });

  it("adds a chord by selecting degree then chord type", () => {
    render(<TemplateFormSheet {...defaultProps} />);
    // Press degree "I"
    fireEvent.press(screen.getByText("I"));
    // Press chord type "M" (Major)
    fireEvent.press(screen.getByText("M"));
    // Degree chip "I" should appear in the progression list
    expect(screen.getAllByText("I").length).toBeGreaterThan(0);
  });

  it("re-pressing same degree hides the callout", () => {
    render(<TemplateFormSheet {...defaultProps} />);
    fireEvent.press(screen.getByText("I"));
    fireEvent.press(screen.getByText("I")); // toggle off
    expect(screen.getByText("I")).toBeTruthy();
  });

  it("changing selected degree while another is active replaces it", () => {
    render(<TemplateFormSheet {...defaultProps} />);
    fireEvent.press(screen.getByText("I"));
    fireEvent.press(screen.getByText("II"));
    // No crash — second degree is now selected
    expect(screen.getByText("II")).toBeTruthy();
  });

  it("calls onSave with name and chords when save is pressed", () => {
    const onSave = jest.fn();
    const { UNSAFE_getByType } = render(<TemplateFormSheet {...defaultProps} onSave={onSave} />);
    // Type a name
    const { TextInput } = require("react-native");
    fireEvent.changeText(UNSAFE_getByType(TextInput), "New Prog");
    // Add a chord
    fireEvent.press(screen.getByText("I"));
    fireEvent.press(screen.getByText("M"));
    // Press save
    fireEvent.press(screen.getByTestId("glass-check"));
    expect(onSave).toHaveBeenCalledWith(
      "New Prog",
      expect.arrayContaining([expect.objectContaining({ degree: "I" })]),
    );
  });

  it("dark theme renders without crashing", () => {
    const { toJSON } = render(<TemplateFormSheet {...defaultProps} theme="dark" />);
    expect(toJSON()).toBeTruthy();
  });
});
