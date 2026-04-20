import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import ChordBrowser from "..";
import type { LayerConfig } from "../../../../types";

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
        <View testID="chord-detail-sheet">{children({ close: onClose, dragHandlers: {} })}</View>
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
  onAddLayerAndNavigate: jest.fn(),
};

describe("ChordBrowser", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    const { toJSON } = render(<ChordBrowser {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it("shows the note picker button with default root C", () => {
    render(<ChordBrowser {...defaultProps} />);
    expect(screen.getByTestId("note-value").props.children).toBe("C");
  });

  it("updates root note when NotePickerButton changes", () => {
    render(<ChordBrowser {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-picker"));
    expect(screen.getByTestId("note-value").props.children).toBe("G");
  });

  it("renders chord diagrams in the list", () => {
    render(<ChordBrowser {...defaultProps} />);
    const diagrams = screen.getAllByTestId("chord-diagram");
    expect(diagrams.length).toBeGreaterThan(0);
  });

  it("shows chord labels for chord types with forms", () => {
    render(<ChordBrowser {...defaultProps} />);
    expect(screen.getAllByText("C").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cm").length).toBeGreaterThan(0);
  });

  it("opens detail sheet when a chord item is tapped", () => {
    const { UNSAFE_getAllByType } = render(<ChordBrowser {...defaultProps} />);
    const { TouchableOpacity } = require("react-native");
    const items = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(items[1]);
    expect(screen.getByTestId("chord-detail-sheet")).toBeTruthy();
  });

  it("closes detail sheet when close button is pressed", () => {
    const { UNSAFE_getAllByType } = render(<ChordBrowser {...defaultProps} />);
    const { TouchableOpacity } = require("react-native");
    const items = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(items[1]);
    fireEvent.press(screen.getByTestId("glass-btn-close"));
    expect(screen.queryByTestId("chord-detail-sheet")).toBeNull();
  });

  it("shows layer description in detail sheet", () => {
    const { UNSAFE_getAllByType } = render(<ChordBrowser {...defaultProps} />);
    const { TouchableOpacity } = require("react-native");
    const items = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(items[1]);
    expect(screen.getByTestId("layer-description")).toBeTruthy();
  });

  it("calls onAddLayerAndNavigate when add button is pressed", () => {
    const onAdd = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <ChordBrowser {...defaultProps} onAddLayerAndNavigate={onAdd} />,
    );
    const { TouchableOpacity } = require("react-native");
    const items = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(items[1]);
    fireEvent.press(screen.getByText("finder.addToLayerTitle"));
    expect(onAdd).toHaveBeenCalled();
  });

  it("disables add button when layers are full", () => {
    const fullLayers = [makeLayer({ id: "1" }), makeLayer({ id: "2" }), makeLayer({ id: "3" })];
    const { UNSAFE_getAllByType } = render(<ChordBrowser {...defaultProps} layers={fullLayers} />);
    const { TouchableOpacity } = require("react-native");
    const items = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(items[1]);
    const allItems = UNSAFE_getAllByType(TouchableOpacity);
    const disabledBtn = allItems.find((b: any) => b.props.disabled === true);
    expect(disabledBtn).toBeTruthy();
  });

  it("renders in dark theme without crashing", () => {
    const { toJSON } = render(<ChordBrowser {...defaultProps} theme="dark" />);
    expect(toJSON()).toBeTruthy();
  });
});
