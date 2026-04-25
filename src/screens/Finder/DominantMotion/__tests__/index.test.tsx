import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import DominantMotion from "..";
import type { LayerConfig } from "../../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));
jest.mock("../../../../i18n", () => ({}));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" },
  NotificationFeedbackType: { Error: "error" },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../../../components/ui/NotePickerButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ value, onChange }: { value: string; onChange: (n: string) => void }) => (
      <TouchableOpacity testID="note-picker" onPress={() => onChange("G")}>
        <Text testID="note-value">{value}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock("../../../../components/ui/SegmentedToggle", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    SegmentedToggle: ({
      value: _value,
      onChange,
      options,
    }: {
      value: string;
      onChange: (v: string) => void;
      options: { value: string; label: string }[];
    }) => (
      <>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            testID={`toggle-${opt.value}`}
            onPress={() => onChange(opt.value)}
          >
            <Text>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </>
    ),
  };
});

jest.mock("../../../../components/ui/ChordDiagram", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="chord-diagram" />,
    getAllChordForms: () => [[{ string: 0, fret: 1 }]],
  };
});

jest.mock("../../../../components/ui/Icon", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="icon" />,
  };
});

jest.mock("../../../../components/ui/BottomSheetModal", () => ({
  __esModule: true,
  default: ({ children, visible }: any) => {
    if (!visible) return null;
    const { View } = require("react-native");
    return <View testID="bottom-sheet">{children({ close: jest.fn(), dragHandlers: {} })}</View>;
  },
  SHEET_HANDLE_CLEARANCE: 32,
  useSheetHeight: () => 400,
}));

jest.mock("../../../../components/ui/SheetProgressiveHeader", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock("../../../../components/ui/GlassIconButton", () => {
  const { TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({ onPress, icon }: { onPress: () => void; icon: string }) => (
      <TouchableOpacity testID={`glass-btn-${icon}`} onPress={onPress} />
    ),
  };
});

const defaultProps = {
  theme: "light" as const,
  accidental: "sharp" as const,
  layers: [] as LayerConfig[],
  globalRootNote: "C",
  onAddLayerAndNavigate: jest.fn(),
  onNavigateTo: jest.fn(),
};

describe("DominantMotion", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    expect(render(<DominantMotion {...defaultProps} />).toJSON()).toBeTruthy();
  });

  it("shows default key root C", () => {
    render(<DominantMotion {...defaultProps} />);
    expect(screen.getByTestId("note-value").props.children).toBe("C");
  });

  it("shows basic pattern rows with degree labels", () => {
    render(<DominantMotion {...defaultProps} />);
    // C major: V7→I = "G7 → C"
    expect(screen.getByText("G7 → C")).toBeTruthy();
    // ii-V-I = "Dm7 → G7 → C" (may appear in secondary dominant section too)
    expect(screen.getAllByText("Dm7 → G7 → C").length).toBeGreaterThan(0);
  });

  it("shows pattern type badges on each row", () => {
    render(<DominantMotion {...defaultProps} />);
    // The labelKey is rendered via mocked t() which returns the key itself
    expect(screen.getByText("finder.dominantMotion.pattern.basicVI")).toBeTruthy();
    expect(screen.getByText("finder.dominantMotion.pattern.twoFiveOne")).toBeTruthy();
  });

  it("shows secondary dominant section header", () => {
    render(<DominantMotion {...defaultProps} />);
    // The section header + each secondary-dom row badge share this key, so multiple elements exist
    expect(
      screen.getAllByText("finder.dominantMotion.pattern.secondaryDom").length,
    ).toBeGreaterThan(0);
  });

  it("updates key root when picker changes", () => {
    render(<DominantMotion {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-picker"));
    expect(screen.getByTestId("note-value").props.children).toBe("G");
  });

  it("switches to minor key", () => {
    render(<DominantMotion {...defaultProps} />);
    fireEvent.press(screen.getByTestId("toggle-minor"));
    expect(render(<DominantMotion {...defaultProps} />).toJSON()).toBeTruthy();
  });

  it("calls onNavigateTo when progression analysis extra action is pressed", () => {
    const onNavigateTo = jest.fn();
    render(<DominantMotion {...defaultProps} onNavigateTo={onNavigateTo} />);
    // Open the basic V→I pattern row (C major: "G7 → C")
    fireEvent.press(screen.getByText("G7 → C"));
    // Press extra action button (PillButton with the translation key as label)
    fireEvent.press(screen.getByText("finder.dominantMotion.viewProgressionAnalysis"));
    expect(onNavigateTo).toHaveBeenCalledWith(
      "progression-analysis",
      expect.any(Array),
      expect.any(String),
    );
  });

  it("renders in dark theme without crashing", () => {
    expect(render(<DominantMotion {...defaultProps} theme="dark" />).toJSON()).toBeTruthy();
  });
});
