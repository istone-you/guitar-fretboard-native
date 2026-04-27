import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import SubstitutionFinder from "..";
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
    default: ({
      value,
      onChange,
      label = "",
    }: {
      value: string;
      onChange: (n: string) => void;
      label?: string;
    }) => (
      <TouchableOpacity testID={`note-picker-${label}`} onPress={() => onChange("G")}>
        <Text testID={`note-value-${label}`}>{value}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock("../../../../components/ui/SegmentedToggle", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    SegmentedToggle: ({
      onChange,
      options,
    }: {
      value: string;
      onChange: (v: string) => void;
      options: { value: string; label: string }[];
    }) => (
      <>
        {options.map((o) => (
          <TouchableOpacity
            key={o.value}
            testID={`segmented-${o.value}`}
            onPress={() => onChange(o.value)}
          >
            <Text>{o.label}</Text>
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
    getAllChordForms: (_rootIndex: number, chordType: string) =>
      chordType === "Major" || chordType === "Minor" ? [[{ string: 0, fret: 1 }]] : [],
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

describe("SubstitutionFinder", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    expect(render(<SubstitutionFinder {...defaultProps} />).toJSON()).toBeTruthy();
  });

  it("shows chord root picker with default value C", () => {
    render(<SubstitutionFinder {...defaultProps} />);
    expect(screen.getByTestId("note-value-header.root").props.children).toBe("C");
  });

  it("shows key root picker with default value C", () => {
    render(<SubstitutionFinder {...defaultProps} />);
    expect(screen.getByTestId("note-value-finder.substitution.keyRoot").props.children).toBe("C");
  });

  it("renders chord type chips", () => {
    render(<SubstitutionFinder {...defaultProps} />);
    expect(screen.getByText("Maj")).toBeTruthy();
    expect(screen.getByText("m")).toBeTruthy();
    expect(screen.getByText("maj7")).toBeTruthy();
    expect(screen.getByText("m7")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
  });

  it("shows two tonic substitutions for I (C Major in C major)", () => {
    render(<SubstitutionFinder {...defaultProps} />);
    expect(screen.getByTestId("sub-section-tonic-9")).toBeTruthy();
    expect(screen.getByTestId("sub-section-tonic-4")).toBeTruthy();
  });

  it("shows dominant substitution for V7 (G7 in C major)", () => {
    render(<SubstitutionFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-picker-header.root"));
    fireEvent.press(screen.getByText("7"));
    expect(screen.getByTestId("sub-section-dominant-1")).toBeTruthy();
  });

  it("shows subdominant substitution for IV (F in C major)", () => {
    render(<SubstitutionFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-picker-header.root"));
    expect(screen.queryByTestId("sub-section-subdominant-2")).toBeNull();
  });

  it("shows no substitution for non-diatonic chord", () => {
    render(<SubstitutionFinder {...defaultProps} />);
    expect(screen.queryByText("finder.substitution.none")).toBeNull();
  });

  it("updates chord root when NotePickerButton changes", () => {
    render(<SubstitutionFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-picker-header.root"));
    expect(screen.getByTestId("note-value-header.root").props.children).toBe("G");
  });

  it("switches to minor key when minor toggle is pressed", () => {
    render(<SubstitutionFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("segmented-minor"));
  });

  it("opens bottom sheet when tapping a sub-section card", () => {
    render(<SubstitutionFinder {...defaultProps} />);
    expect(screen.queryByTestId("bottom-sheet")).toBeNull();
    fireEvent.press(screen.getByTestId("sub-section-tonic-9"));
    expect(screen.getByTestId("bottom-sheet")).toBeTruthy();
  });

  it("calls onAddLayerAndNavigate when add button is pressed in sheet", () => {
    const onAdd = jest.fn();
    render(<SubstitutionFinder {...defaultProps} onAddLayerAndNavigate={onAdd} />);
    fireEvent.press(screen.getByTestId("sub-section-tonic-9"));
    fireEvent.press(screen.getByTestId("glass-btn-upload"));
    expect(onAdd).toHaveBeenCalled();
  });

  it("shows alert and haptics when add button is pressed with full layers", () => {
    const { Alert } = require("react-native");
    const alertSpy = jest.spyOn(Alert, "alert");
    const Haptics = require("expo-haptics");
    const onAdd = jest.fn();
    const fullLayers = [makeLayer({ id: "1" }), makeLayer({ id: "2" }), makeLayer({ id: "3" })];
    render(
      <SubstitutionFinder {...defaultProps} layers={fullLayers} onAddLayerAndNavigate={onAdd} />,
    );
    fireEvent.press(screen.getByTestId("sub-section-tonic-9"));
    fireEvent.press(screen.getByTestId("glass-btn-upload"));
    expect(Haptics.notificationAsync).toHaveBeenCalledWith("error");
    expect(alertSpy).toHaveBeenCalled();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("renders in dark theme without crashing", () => {
    expect(render(<SubstitutionFinder {...defaultProps} theme="dark" />).toJSON()).toBeTruthy();
  });
});
