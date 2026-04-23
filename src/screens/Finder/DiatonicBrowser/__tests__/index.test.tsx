import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import DiatonicBrowser from "..";
import type { LayerConfig } from "../../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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
        <View testID="diatonic-detail-sheet">{children({ close: onClose, dragHandlers: {} })}</View>
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
      <View testID="sheet-header" onLayout={() => onLayout?.(96)}>
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
      <TouchableOpacity testID="note-picker" onPress={() => onChange("G")}>
        <Text testID="note-value">{value}</Text>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock("../../../../components/ui/ChordDiagram", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="chord-diagram" />,
    getAllChordForms: (_rootIndex: number, chordType: string) =>
      chordType === "Major" || chordType === "Minor" ? [[{ string: 0, fret: 1 }]] : [],
  };
});

jest.mock("../../../../components/LayerEditModal/LayerDescription", () => {
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ layer }: { layer: { chordType: string } }) => (
      <Text testID="layer-description">{layer.chordType}</Text>
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
};

describe("DiatonicBrowser", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    const { toJSON } = render(<DiatonicBrowser {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it("shows the note picker with default root C", () => {
    render(<DiatonicBrowser {...defaultProps} />);
    expect(screen.getByTestId("note-value").props.children).toBe("C");
  });

  it("updates root note when NotePickerButton changes", () => {
    render(<DiatonicBrowser {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-picker"));
    expect(screen.getByTestId("note-value").props.children).toBe("G");
  });

  it("renders 7 chord rows for major key with app-style labels", () => {
    render(<DiatonicBrowser {...defaultProps} />);
    expect(screen.getByText("I")).toBeTruthy();
    expect(screen.getByText("IIm")).toBeTruthy();
    expect(screen.getByText("IV")).toBeTruthy();
    expect(screen.getByText("VIIm(-5)")).toBeTruthy();
  });

  it("shows minor key chords when Min is selected from mode sheet", () => {
    render(<DiatonicBrowser {...defaultProps} />);
    fireEvent.press(screen.getByText("Maj"));
    fireEvent.press(screen.getByText("Minor Triad"));
    expect(screen.getByText("Im")).toBeTruthy();
    expect(screen.getByText("♭III")).toBeTruthy();
  });

  it("renders chord diagrams for Major and Minor chords", () => {
    render(<DiatonicBrowser {...defaultProps} />);
    const diagrams = screen.getAllByTestId("chord-diagram");
    expect(diagrams.length).toBeGreaterThan(0);
  });

  it("opens detail sheet when a chord row is tapped", () => {
    render(<DiatonicBrowser {...defaultProps} />);
    fireEvent.press(screen.getByTestId("chord-row-I"));
    expect(screen.getByTestId("diatonic-detail-sheet")).toBeTruthy();
  });

  it("closes detail sheet when close button is pressed", () => {
    render(<DiatonicBrowser {...defaultProps} />);
    fireEvent.press(screen.getByTestId("chord-row-I"));
    fireEvent.press(screen.getByTestId("glass-btn-close"));
    expect(screen.queryByTestId("diatonic-detail-sheet")).toBeNull();
  });

  it("calls onAddLayerAndNavigate when add button is pressed", () => {
    const onAdd = jest.fn();
    render(<DiatonicBrowser {...defaultProps} onAddLayerAndNavigate={onAdd} />);
    fireEvent.press(screen.getByTestId("chord-row-I"));
    fireEvent.press(screen.getByTestId("glass-btn-upload"));
    expect(onAdd).toHaveBeenCalled();
  });

  it("shows alert and haptics when add button is pressed with full layers", () => {
    const { Alert } = require("react-native");
    const alertSpy = jest.spyOn(Alert, "alert");
    const Haptics = require("expo-haptics");
    const onAdd = jest.fn();
    const fullLayers = [makeLayer({ id: "1" }), makeLayer({ id: "2" }), makeLayer({ id: "3" })];
    render(<DiatonicBrowser {...defaultProps} layers={fullLayers} onAddLayerAndNavigate={onAdd} />);
    fireEvent.press(screen.getByTestId("chord-row-I"));
    fireEvent.press(screen.getByTestId("glass-btn-upload"));
    expect(Haptics.notificationAsync).toHaveBeenCalledWith("error");
    expect(alertSpy).toHaveBeenCalled();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("renders in dark theme without crashing", () => {
    const { toJSON } = render(<DiatonicBrowser {...defaultProps} theme="dark" />);
    expect(toJSON()).toBeTruthy();
  });
});
