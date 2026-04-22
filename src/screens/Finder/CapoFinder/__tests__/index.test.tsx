import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import CapoFinder from "..";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../../../i18n", () => ({}));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../../../components/ui/SegmentedToggle", () => ({
  SegmentedToggle: ({
    onChange,
    options,
  }: {
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => {
    const { View, TouchableOpacity, Text } = require("react-native");
    return (
      <View>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            testID={`toggle-${opt.value}`}
            onPress={() => onChange(opt.value)}
          >
            <Text>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
}));

jest.mock("../../../../components/ui/NotePickerButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({
      value,
      onChange,
      label,
    }: {
      value: string;
      onChange: (note: string) => void;
      label: string;
    }) => (
      <TouchableOpacity testID={`note-picker-${label}`} onPress={() => onChange("A")}>
        <Text testID={`note-value-${label}`}>{value}</Text>
      </TouchableOpacity>
    ),
  };
});

const defaultProps = {
  theme: "light" as const,
  accidental: "sharp" as const,
};

describe("CapoFinder", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    const { toJSON } = render(<CapoFinder {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it("shows capo fret starting at 0", () => {
    render(<CapoFinder {...defaultProps} />);
    expect(screen.getByTestId("capo-fret-value").props.children).toBe(0);
  });

  it("increments capo fret on press", () => {
    render(<CapoFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("capo-fret-increment"));
    expect(screen.getByTestId("capo-fret-value").props.children).toBe(1);
  });

  it("capo fret does not go below 0", () => {
    render(<CapoFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("capo-fret-decrement"));
    expect(screen.getByTestId("capo-fret-value").props.children).toBe(0);
  });

  it("shows C when capo is 0 and form key is C", () => {
    render(<CapoFinder {...defaultProps} />);
    expect(screen.getByTestId("actual-sound-value").props.children).toBe("C");
  });

  it("updates actual sound when capo fret changes", () => {
    render(<CapoFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("capo-fret-increment"));
    fireEvent.press(screen.getByTestId("capo-fret-increment"));
    fireEvent.press(screen.getByTestId("capo-fret-increment"));
    // C (index 0) + capo 3 = D♯ (index 3 with sharp)
    expect(screen.getByTestId("actual-sound-value").props.children).toBe("D♯");
  });

  it("switches to sound-to-form mode", () => {
    render(<CapoFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("toggle-sound-to-form"));
    expect(screen.getByText("finder.capo.targetKey")).toBeTruthy();
    expect(screen.getByText("finder.capo.shapeKey")).toBeTruthy();
  });

  it("shows correct capo position in sound-to-form mode", () => {
    render(<CapoFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("toggle-sound-to-form"));
    // default: targetKey="G" (7), shapeKey="E" (4) → capo 3
    expect(screen.getByTestId("capo-result-value").props.children).toBe("3");
  });

  it("shows noCapo key when target equals shape key", () => {
    render(<CapoFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("toggle-sound-to-form"));
    // Press both pickers → both become "A" (mock always returns "A")
    const pickers = screen.getAllByTestId("note-picker-header.root");
    fireEvent.press(pickers[0]); // targetKey
    fireEvent.press(pickers[1]); // shapeKey
    // A === A → capoNeeded = 0 → shows noCapo key
    expect(screen.getByTestId("capo-result-value").props.children).toBe("finder.capo.noCapo");
  });

  it("renders in dark theme without crashing", () => {
    const { toJSON } = render(<CapoFinder {...defaultProps} theme="dark" />);
    expect(toJSON()).toBeTruthy();
  });
});
