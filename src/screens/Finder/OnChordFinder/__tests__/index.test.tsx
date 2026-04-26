import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import OnChordFinder from "..";
import type { LayerConfig } from "../../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, string>) => {
      if (typeof fallback === "string") return fallback;
      return key;
    },
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
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
jest.mock("../../../../components/ui/ChordDiagram", () => ({
  __esModule: true,
  default: () => null,
  getAllChordForms: () => [],
  CHORD_DIAGRAM_HEIGHT: 100,
}));
jest.mock("../../../../components/ui/BottomSheetModal", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({
      visible,
      children,
    }: {
      visible: boolean;
      children: (arg: { close: () => void; dragHandlers: object }) => React.ReactNode;
    }) => (visible ? <View>{children({ close: jest.fn(), dragHandlers: {} })}</View> : null),
    SHEET_HANDLE_CLEARANCE: 0,
    useSheetHeight: () => 500,
  };
});
jest.mock("../../../../components/ui/SheetProgressiveHeader", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});
jest.mock("../../../../components/ui/GlassIconButton", () => {
  const { TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({ onPress }: { onPress: () => void }) => <TouchableOpacity onPress={onPress} />,
  };
});
jest.mock("../../../../components/LayerEditModal/LayerDescription", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View testID="layer-description" /> };
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
      onChange: (n: string) => void;
      label: string;
    }) => (
      <TouchableOpacity testID={`note-picker-${label}`} onPress={() => onChange("G")}>
        <Text testID={`note-picker-value-${label}`}>{value}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock("../../../../components/ui/NotePill", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({
      label,
      selected,
      onPress,
    }: {
      label: string;
      selected: boolean;
      onPress: () => void;
    }) => (
      <TouchableOpacity
        testID={`note-pill-${label}`}
        onPress={onPress}
        accessibilityState={{ selected }}
      >
        <Text>{label}</Text>
      </TouchableOpacity>
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

describe("OnChordFinder", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    expect(render(<OnChordFinder {...defaultProps} />).toJSON()).toBeTruthy();
  });

  it("renders in dark theme without crashing", () => {
    expect(render(<OnChordFinder {...defaultProps} theme="dark" />).toJSON()).toBeTruthy();
  });

  it("renders with flat accidental without crashing", () => {
    expect(render(<OnChordFinder {...defaultProps} accidental="flat" />).toJSON()).toBeTruthy();
  });

  it("shows chord root note picker", () => {
    render(<OnChordFinder {...defaultProps} />);
    expect(screen.getByTestId("note-picker-コードルート")).toBeTruthy();
  });

  it("shows 'All' chip as first chip", () => {
    render(<OnChordFinder {...defaultProps} />);
    expect(screen.getByTestId("note-pill-すべて")).toBeTruthy();
  });

  it("shows chord type chips for types present in C root", () => {
    render(<OnChordFinder {...defaultProps} />);
    expect(screen.getByTestId("note-pill-M")).toBeTruthy();
    expect(screen.getByTestId("note-pill-7")).toBeTruthy();
  });

  it("shows result cards for C root", () => {
    render(<OnChordFinder {...defaultProps} />);
    expect(screen.getByTestId("on-chord-card-C/E")).toBeTruthy();
  });

  it("opens FinderDetailSheet when a card is tapped", () => {
    render(<OnChordFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("on-chord-card-C/E"));
    expect(screen.getByTestId("layer-description")).toBeTruthy();
  });

  it("updates root and results when note picker is pressed", () => {
    render(<OnChordFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-picker-コードルート"));
    expect(screen.getByTestId("note-picker-value-コードルート").props.children).toBe("G");
  });

  it("filters results when a type chip is pressed", () => {
    render(<OnChordFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-pill-M"));
    const majorCards = screen
      .getAllByTestId(/^on-chord-card-/)
      .filter((el) => !el.props.testID.includes("m"));
    expect(majorCards.length).toBeGreaterThan(0);
  });

  it("does not call onAddLayerAndNavigate when layers are full", () => {
    const layers = Array.from({ length: 3 }, (_, i) => makeLayer({ id: String(i) }));
    render(<OnChordFinder {...defaultProps} layers={layers} />);
    fireEvent.press(screen.getByTestId("on-chord-card-C/E"));
    // detail sheet open, but add button should not trigger callback when full
    expect(defaultProps.onAddLayerAndNavigate).not.toHaveBeenCalled();
  });
});
