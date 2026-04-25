import React from "react";
import { render, fireEvent, screen, act } from "@testing-library/react-native";
import ProgressionAnalyzer from "..";

jest.mock("../../../../hooks/useProgressionTemplates", () => ({
  useProgressionTemplates: () => ({
    customTemplates: [],
    saveTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
  }),
}));
jest.mock("../../../../components/ui/BottomSheetModal", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ visible, children }: any) =>
      visible ? children({ close: jest.fn(), dragHandlers: {} }) : null,
    SHEET_HANDLE_CLEARANCE: 0,
    useSheetHeight: () => 500,
  };
});
jest.mock("../../../../components/ui/SheetProgressiveHeader", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: ({ children }: any) => <View>{children}</View> };
});
jest.mock("../../../../components/ui/GlassIconButton", () => {
  const { TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({ onPress, testID }: any) => <TouchableOpacity testID={testID} onPress={onPress} />,
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));
jest.mock("../../../../i18n", () => ({}));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../../../components/ui/NoteDegreeModeToggle", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ value, onChange }: { value: string; onChange: (m: string) => void }) => (
      <TouchableOpacity
        testID="mode-toggle"
        onPress={() => onChange(value === "note" ? "degree" : "note")}
      >
        <Text testID="mode-value">{value}</Text>
      </TouchableOpacity>
    ),
  };
});
jest.mock("../../../../components/ui/NoteSelectPage", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ onSelect, onBack }: { onSelect: (n: string) => void; onBack: () => void }) => (
      <>
        <TouchableOpacity testID="note-select-G" onPress={() => onSelect("G")} />
        <TouchableOpacity testID="note-select-back" onPress={onBack}>
          <Text>Back</Text>
        </TouchableOpacity>
      </>
    ),
  };
});

const defaultProps = {
  theme: "light" as const,
  accidental: "sharp" as const,
  customTemplates: [],
  onSaveTemplate: jest.fn(),
};

describe("ProgressionAnalyzer", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    expect(render(<ProgressionAnalyzer {...defaultProps} />).toJSON()).toBeTruthy();
  });

  it("shows empty hint when no chords added", () => {
    render(<ProgressionAnalyzer {...defaultProps} />);
    expect(screen.getByText("finder.progressionAnalysis.empty")).toBeTruthy();
  });

  it("shows note chips in note mode by default", () => {
    render(<ProgressionAnalyzer {...defaultProps} />);
    expect(screen.getByTestId("note-chip-C")).toBeTruthy();
    expect(screen.getByTestId("note-chip-G")).toBeTruthy();
  });

  it("shows degree chips after switching to degree mode", () => {
    render(<ProgressionAnalyzer {...defaultProps} />);
    fireEvent.press(screen.getByTestId("mode-toggle"));
    expect(screen.getByTestId("degree-chip-I")).toBeTruthy();
    expect(screen.getByTestId("degree-chip-IV")).toBeTruthy();
  });

  it("adds chord chip when note then chord type is pressed", () => {
    render(<ProgressionAnalyzer {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    expect(screen.getByTestId("chord-chip-0")).toBeTruthy();
  });

  it("removes chord chip when tapped", () => {
    render(<ProgressionAnalyzer {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    expect(screen.getByTestId("chord-chip-0")).toBeTruthy();
    fireEvent.press(screen.getByTestId("chord-chip-0"));
    expect(screen.queryByTestId("chord-chip-0")).toBeNull();
  });

  it("shows save and reset buttons when at least one chord is added", () => {
    render(<ProgressionAnalyzer {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    expect(screen.getByText("finder.progressionAnalysis.save")).toBeTruthy();
    expect(screen.getByText("finder.progressionAnalysis.reset")).toBeTruthy();
  });

  it("shows analysis results automatically after adding a chord", () => {
    render(<ProgressionAnalyzer {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    expect(screen.getByText("finder.progressionAnalysis.result")).toBeTruthy();
  });

  it("navigates to key select when key pill pressed (note mode)", () => {
    render(<ProgressionAnalyzer {...defaultProps} />);
    fireEvent.press(screen.getByTestId("key-nav-btn"));
    expect(screen.getByTestId("note-select-back")).toBeTruthy();
  });

  it("updates key and returns to main on note select", () => {
    render(<ProgressionAnalyzer {...defaultProps} />);
    fireEvent.press(screen.getByTestId("key-nav-btn"));
    fireEvent.press(screen.getByTestId("note-select-G"));
    fireEvent.press(screen.getByTestId("note-select-back"));
    expect(screen.getByTestId("note-chip-C")).toBeTruthy();
  });

  it("renders in dark theme without crashing", () => {
    expect(render(<ProgressionAnalyzer {...defaultProps} theme="dark" />).toJSON()).toBeTruthy();
  });
});
