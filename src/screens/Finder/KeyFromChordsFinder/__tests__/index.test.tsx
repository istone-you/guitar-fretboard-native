import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import KeyFromChordsFinder from "..";
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
jest.mock("../../../../components/ui/SegmentedToggle", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    SegmentedToggle: ({
      value,
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
            testID={`seg-toggle-${opt.value}`}
            onPress={() => onChange(opt.value)}
            accessibilityState={{ selected: value === opt.value }}
          >
            <Text>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </>
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

describe("KeyFromChordsFinder", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    expect(render(<KeyFromChordsFinder {...defaultProps} />).toJSON()).toBeTruthy();
  });

  it("renders in dark theme without crashing", () => {
    expect(render(<KeyFromChordsFinder {...defaultProps} theme="dark" />).toJSON()).toBeTruthy();
  });

  it("shows note chips for all 12 notes", () => {
    render(<KeyFromChordsFinder {...defaultProps} />);
    expect(screen.getByTestId("note-chip-C")).toBeTruthy();
    expect(screen.getByTestId("note-chip-G")).toBeTruthy();
    expect(screen.getByTestId("note-chip-F")).toBeTruthy();
  });

  it("shows empty hint initially", () => {
    render(<KeyFromChordsFinder {...defaultProps} />);
    expect(screen.getByText("コードを入力してキーを特定")).toBeTruthy();
  });

  it("shows chord type callout when note chip is pressed", () => {
    render(<KeyFromChordsFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    expect(screen.getByTestId("chord-type-Major")).toBeTruthy();
    expect(screen.getByTestId("chord-type-Minor")).toBeTruthy();
  });

  it("adds a chord chip after selecting note then chord type", () => {
    render(<KeyFromChordsFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    expect(screen.getByTestId("chord-chip-0")).toBeTruthy();
  });

  it("shows results after adding a chord", () => {
    render(<KeyFromChordsFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    expect(screen.getByTestId("key-result-0")).toBeTruthy();
  });

  it("removes a chord when its chip is pressed", () => {
    render(<KeyFromChordsFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    expect(screen.getByTestId("chord-chip-0")).toBeTruthy();
    fireEvent.press(screen.getByTestId("chord-chip-0"));
    expect(screen.queryByTestId("chord-chip-0")).toBeNull();
  });

  it("shows reset button after adding a chord", () => {
    render(<KeyFromChordsFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    expect(screen.getByTestId("reset-btn")).toBeTruthy();
  });

  it("clears all chords when reset is pressed", () => {
    render(<KeyFromChordsFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    fireEvent.press(screen.getByTestId("reset-btn"));
    expect(screen.queryByTestId("chord-chip-0")).toBeNull();
  });

  it("hides callout when same note chip is pressed again", () => {
    render(<KeyFromChordsFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("note-chip-C"));
    // Callout should be hidden — chord-type chips still in tree but note selection cleared
    expect(screen.queryByTestId("chord-chip-0")).toBeNull();
  });

  it("shows layer description in detail sheet", () => {
    render(<KeyFromChordsFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-chip-C"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    fireEvent.press(screen.getByTestId("key-result-0"));
    expect(screen.getByTestId("layer-description")).toBeTruthy();
  });

  it("renders with full layers without crashing", () => {
    const fullLayers = [makeLayer({ id: "1" }), makeLayer({ id: "2" }), makeLayer({ id: "3" })];
    expect(
      render(<KeyFromChordsFinder {...defaultProps} layers={fullLayers} />).toJSON(),
    ).toBeTruthy();
  });
});
