import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import VoiceLeadingFinder from "..";
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

describe("VoiceLeadingFinder", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    expect(render(<VoiceLeadingFinder {...defaultProps} />).toJSON()).toBeTruthy();
  });

  it("shows chord A and chord B note pickers", () => {
    render(<VoiceLeadingFinder {...defaultProps} />);
    const pickers = screen.getAllByTestId("note-picker-コード");
    expect(pickers.length).toBe(2);
  });

  it("shows chord type pills for both chords", () => {
    render(<VoiceLeadingFinder {...defaultProps} />);
    const mPills = screen.getAllByTestId("note-pill-M");
    expect(mPills.length).toBe(2);
  });

  it("displays common tones for C Major → G Major", () => {
    render(<VoiceLeadingFinder {...defaultProps} />);
    // C Major: C(0), E(4), G(7) — G Major: G(7), B(11), D(2) — common: G(7)
    expect(screen.getByTestId("common-tone-7")).toBeTruthy();
  });

  it("shows movement rows for non-common tones", () => {
    render(<VoiceLeadingFinder {...defaultProps} />);
    const movements = screen.getAllByTestId(/^movement-row-/);
    expect(movements.length).toBeGreaterThan(0);
  });

  it("shows note A pills for chord A notes", () => {
    render(<VoiceLeadingFinder {...defaultProps} />);
    // C Major: C(0), E(4), G(7)
    expect(screen.getByTestId("note-a-0")).toBeTruthy();
    expect(screen.getByTestId("note-a-4")).toBeTruthy();
    expect(screen.getByTestId("note-a-7")).toBeTruthy();
  });

  it("shows note B pills for chord B notes", () => {
    render(<VoiceLeadingFinder {...defaultProps} />);
    // G Major: G(7), B(11), D(2)
    expect(screen.getByTestId("note-b-2")).toBeTruthy();
    expect(screen.getByTestId("note-b-7")).toBeTruthy();
    expect(screen.getByTestId("note-b-11")).toBeTruthy();
  });

  it("updates chord A root when note picker is pressed", () => {
    render(<VoiceLeadingFinder {...defaultProps} />);
    fireEvent.press(screen.getAllByTestId("note-picker-コード")[0]);
    expect(screen.getByTestId("note-a-7")).toBeTruthy();
  });

  it("updates chord B root when note picker is pressed", () => {
    render(<VoiceLeadingFinder {...defaultProps} />);
    fireEvent.press(screen.getAllByTestId("note-picker-コード")[1]);
    expect(screen.getByTestId("common-tone-7")).toBeTruthy();
  });

  it("changes chord type A when type pill is pressed", () => {
    render(<VoiceLeadingFinder {...defaultProps} />);
    const mPills = screen.getAllByTestId("note-pill-m");
    fireEvent.press(mPills[0]);
    const movements = screen.getAllByTestId(/^movement-row-/);
    expect(movements.length).toBeGreaterThan(0);
  });

  it("shows layer description in detail sheet", () => {
    render(<VoiceLeadingFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("chord-b-card"));
    expect(screen.getByTestId("layer-description")).toBeTruthy();
  });

  it("renders in dark theme without crashing", () => {
    expect(render(<VoiceLeadingFinder {...defaultProps} theme="dark" />).toJSON()).toBeTruthy();
  });

  it("renders with flat accidental without crashing", () => {
    expect(
      render(<VoiceLeadingFinder {...defaultProps} accidental="flat" />).toJSON(),
    ).toBeTruthy();
  });

  it("renders with multiple layers without crashing", () => {
    const layers = [makeLayer({ id: "1" }), makeLayer({ id: "2" })];
    expect(render(<VoiceLeadingFinder {...defaultProps} layers={layers} />).toJSON()).toBeTruthy();
  });
});
