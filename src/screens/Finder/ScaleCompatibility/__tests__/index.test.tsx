import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import ScaleCompatibility from "..";
import type { LayerConfig } from "../../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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
      children: (c: { close: () => void; dragHandlers: object }) => React.ReactNode;
      onClose: () => void;
    }) =>
      visible ? (
        <View testID="detail-sheet">{children({ close: onClose, dragHandlers: {} })}</View>
      ) : null,
    SHEET_HANDLE_CLEARANCE: 28,
    useSheetHeight: () => 500,
  };
});

jest.mock("../../../../components/ui/SheetProgressiveHeader", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({
      children,
      onLayout,
    }: {
      children: React.ReactNode;
      onLayout?: (h: number) => void;
    }) => (
      <View testID="sheet-header" onLayout={() => onLayout?.(60)}>
        {children}
      </View>
    ),
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

function makeLayer(overrides: Partial<LayerConfig> = {}): LayerConfig {
  return {
    id: "l1",
    type: "scale",
    scaleType: "major",
    color: "#ff0000",
    enabled: true,
    chordDisplayMode: "form",
    chordType: "Major",
    triadInversion: "root",
    cagedForms: new Set(),
    cagedChordType: "major",
    onChordName: "C/E",
    customMode: "note",
    selectedNotes: new Set(),
    selectedDegrees: new Set(),
    hiddenCells: new Set(),
    chordFrames: [],
    ...overrides,
  };
}

const defaultProps = {
  theme: "light" as const,
  accidental: "sharp" as const,
  layers: [],
  globalRootNote: "C",
  onAddLayerAndNavigate: jest.fn(),
  onEnablePerLayerRoot: jest.fn(),
};

describe("ScaleCompatibility", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    expect(render(<ScaleCompatibility {...defaultProps} />).toJSON()).toBeTruthy();
  });

  it("shows empty hint when no chords added", () => {
    render(<ScaleCompatibility {...defaultProps} />);
    expect(screen.getByText("finder.scaleCompat.empty")).toBeTruthy();
  });

  it("shows note chips in note mode by default", () => {
    render(<ScaleCompatibility {...defaultProps} />);
    expect(screen.getByTestId("note-chip-C")).toBeTruthy();
    expect(screen.getByTestId("note-chip-G")).toBeTruthy();
  });

  it("shows degree chips after switching to degree mode", () => {
    render(<ScaleCompatibility {...defaultProps} />);
    fireEvent.press(screen.getByTestId("mode-toggle"));
    expect(screen.getByTestId("degree-chip-I")).toBeTruthy();
  });

  it("adds chord chip when note then chord type is pressed", () => {
    render(<ScaleCompatibility {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    expect(screen.getByTestId("chord-chip-0")).toBeTruthy();
  });

  it("opens chord detail sheet when chord chip is tapped", () => {
    render(<ScaleCompatibility {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    fireEvent.press(screen.getByTestId("chord-chip-0"));
    expect(screen.getByTestId("detail-sheet")).toBeTruthy();
  });

  it("removes chord via detail sheet remove button", () => {
    render(<ScaleCompatibility {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    fireEvent.press(screen.getByTestId("chord-chip-0"));
    fireEvent.press(screen.getByText("finder.scaleCompat.removeChord"));
    expect(screen.queryByTestId("chord-chip-0")).toBeNull();
  });

  it("shows compatible scales after adding a C major chord (key=C)", () => {
    render(<ScaleCompatibility {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    expect(screen.getByTestId("scale-row-major")).toBeTruthy();
    expect(screen.getByTestId("scale-row-ionian")).toBeTruthy();
  });

  it("calls onAddLayerAndNavigate when add-to-layer is pressed in scale detail sheet", () => {
    const onAdd = jest.fn();
    render(<ScaleCompatibility {...defaultProps} onAddLayerAndNavigate={onAdd} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    fireEvent.press(screen.getByTestId("scale-row-major"));
    fireEvent.press(screen.getByTestId("glass-btn-upload"));
    expect(onAdd).toHaveBeenCalled();
  });

  it("adding a second chord further restricts compatible scales", () => {
    render(<ScaleCompatibility {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    const afterOne = screen.getAllByTestId(/^scale-row-/).length;
    fireEvent.press(screen.getByTestId("note-chip-A"));
    fireEvent.press(screen.getByTestId("chord-type-Minor"));
    const afterTwo = screen.getAllByTestId(/^scale-row-/).length;
    expect(afterTwo).toBeLessThanOrEqual(afterOne);
  });

  it("navigates to key select when key pill pressed", () => {
    render(<ScaleCompatibility {...defaultProps} />);
    fireEvent.press(screen.getByTestId("key-nav-btn"));
    expect(screen.getByTestId("note-select-back")).toBeTruthy();
  });

  it("shows alert and haptics when add button pressed with full layers", () => {
    const { Alert } = require("react-native");
    const alertSpy = jest.spyOn(Alert, "alert");
    const Haptics = require("expo-haptics");
    const onAdd = jest.fn();
    const fullLayers = [makeLayer({ id: "1" }), makeLayer({ id: "2" }), makeLayer({ id: "3" })];
    render(
      <ScaleCompatibility {...defaultProps} layers={fullLayers} onAddLayerAndNavigate={onAdd} />,
    );
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    fireEvent.press(screen.getByTestId("scale-row-major"));
    fireEvent.press(screen.getByTestId("glass-btn-upload"));
    expect(Haptics.notificationAsync).toHaveBeenCalledWith("error");
    expect(alertSpy).toHaveBeenCalled();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("renders in dark theme without crashing", () => {
    expect(render(<ScaleCompatibility {...defaultProps} theme="dark" />).toJSON()).toBeTruthy();
  });
});
