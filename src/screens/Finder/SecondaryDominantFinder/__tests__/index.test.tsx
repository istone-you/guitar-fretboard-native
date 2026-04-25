import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import SecondaryDominantFinder from "..";
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

jest.mock("../../../../components/ui/NotePickerButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ value, onChange }: { value: string; onChange: (n: string) => void }) => (
      <TouchableOpacity testID="note-picker-btn" onPress={() => onChange("G")}>
        <Text testID="note-picker-value">{value}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock("../../../../components/ui/SegmentedToggle", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    SegmentedToggle: ({
      onChange,
      options,
    }: {
      onChange: (v: string) => void;
      options: { value: string; label: string }[];
    }) => (
      <>
        {options.map((opt: { value: string; label: string }) => (
          <TouchableOpacity
            key={opt.value}
            testID={`seg-toggle-${opt.value}`}
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
    getAllChordForms: () => [[{ string: 1, fret: 1, isRoot: true }]],
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
  onOpenCircle: jest.fn(),
};

describe("SecondaryDominantFinder", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    expect(render(<SecondaryDominantFinder {...defaultProps} />).toJSON()).toBeTruthy();
  });

  it("renders in dark theme without crashing", () => {
    expect(
      render(<SecondaryDominantFinder {...defaultProps} theme="dark" />).toJSON(),
    ).toBeTruthy();
  });

  it("shows secondary dominant rows for C major by default", () => {
    render(<SecondaryDominantFinder {...defaultProps} />);
    // C major diatonic: I ii iii IV V vi — all except vii° get sec doms
    // Tonic I (C Major) should appear
    expect(screen.getByTestId("sec-dom-row-I")).toBeTruthy();
  });

  it("opens detail sheet when a row is tapped", () => {
    render(<SecondaryDominantFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("sec-dom-cell-secDom-I"));
    expect(screen.getByTestId("detail-sheet")).toBeTruthy();
  });

  it("closes detail sheet when close button is pressed", () => {
    render(<SecondaryDominantFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("sec-dom-cell-secDom-I"));
    expect(screen.getByTestId("detail-sheet")).toBeTruthy();
    fireEvent.press(screen.getByTestId("glass-btn-close"));
    expect(screen.queryByTestId("detail-sheet")).toBeNull();
  });

  it("changes key root when note picker fires", () => {
    render(<SecondaryDominantFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-picker-btn"));
    // After changing root to G, rows should still render
    expect(screen.getAllByTestId(/^sec-dom-row-/).length).toBeGreaterThan(0);
  });

  it("switches to minor key type", () => {
    render(<SecondaryDominantFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("seg-toggle-minor"));
    expect(screen.getAllByTestId(/^sec-dom-row-/).length).toBeGreaterThan(0);
  });

  it("fires haptics when a row is tapped", () => {
    const Haptics = require("expo-haptics");
    render(<SecondaryDominantFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("sec-dom-cell-secDom-I"));
    expect(Haptics.impactAsync).toHaveBeenCalledWith("Light");
  });

  it("shows chord diagrams inside detail sheet", () => {
    render(<SecondaryDominantFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("sec-dom-cell-secDom-I"));
    expect(screen.getAllByTestId("chord-diagram").length).toBeGreaterThan(0);
  });

  it("does not show detail sheet on initial render", () => {
    render(<SecondaryDominantFinder {...defaultProps} />);
    expect(screen.queryByTestId("detail-sheet")).toBeNull();
  });

  it("renders with full layers without crashing", () => {
    const fullLayers = [makeLayer({ id: "1" }), makeLayer({ id: "2" }), makeLayer({ id: "3" })];
    expect(
      render(<SecondaryDominantFinder {...defaultProps} layers={fullLayers} />).toJSON(),
    ).toBeTruthy();
  });
});
