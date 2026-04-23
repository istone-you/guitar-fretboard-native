import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import TensionAvoidFinder from "..";
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

describe("TensionAvoidFinder", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    expect(render(<TensionAvoidFinder {...defaultProps} />).toJSON()).toBeTruthy();
  });

  it("shows key root and chord root note pickers", () => {
    render(<TensionAvoidFinder {...defaultProps} />);
    expect(screen.getByTestId("note-picker-キールート")).toBeTruthy();
    expect(screen.getByTestId("note-picker-コードルート")).toBeTruthy();
  });

  it("shows major/minor key type toggle", () => {
    render(<TensionAvoidFinder {...defaultProps} />);
    expect(screen.getByTestId("seg-toggle-major")).toBeTruthy();
    expect(screen.getByTestId("seg-toggle-minor")).toBeTruthy();
  });

  it("shows chord type pills", () => {
    render(<TensionAvoidFinder {...defaultProps} />);
    expect(screen.getByTestId("note-pill-M")).toBeTruthy();
    expect(screen.getByTestId("note-pill-m")).toBeTruthy();
    expect(screen.getByTestId("note-pill-7")).toBeTruthy();
  });

  it("shows chord tones for C Major in C Major key (C, E, G)", () => {
    render(<TensionAvoidFinder {...defaultProps} />);
    expect(screen.getByTestId("chord-tone-0")).toBeTruthy();
    expect(screen.getByTestId("chord-tone-4")).toBeTruthy();
    expect(screen.getByTestId("chord-tone-7")).toBeTruthy();
  });

  it("shows tensions for C Major in C Major key (D, A)", () => {
    render(<TensionAvoidFinder {...defaultProps} />);
    expect(screen.getByTestId("tension-2")).toBeTruthy();
    expect(screen.getByTestId("tension-9")).toBeTruthy();
  });

  it("shows avoid note for C Major in C Major key (F)", () => {
    render(<TensionAvoidFinder {...defaultProps} />);
    expect(screen.getByTestId("avoid-5")).toBeTruthy();
  });

  it("switches to minor key type when minor toggle is pressed", () => {
    render(<TensionAvoidFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("seg-toggle-minor"));
    expect(screen.getByTestId("chord-tone-0")).toBeTruthy();
  });

  it("updates chord root when note picker is pressed", () => {
    render(<TensionAvoidFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-picker-コードルート"));
    // G Major: G(7), B(11), D(2)
    expect(screen.getByTestId("chord-tone-7")).toBeTruthy();
    expect(screen.getByTestId("chord-tone-11")).toBeTruthy();
    expect(screen.getByTestId("chord-tone-2")).toBeTruthy();
  });

  it("updates key root when key picker is pressed", () => {
    render(<TensionAvoidFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-picker-キールート"));
    expect(screen.getByTestId("chord-tone-0")).toBeTruthy();
  });

  it("changes chord type when type pill is pressed", () => {
    render(<TensionAvoidFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-pill-m"));
    // C Minor: C(0), Eb(3), G(7)
    expect(screen.getByTestId("chord-tone-0")).toBeTruthy();
    expect(screen.getByTestId("chord-tone-3")).toBeTruthy();
    expect(screen.getByTestId("chord-tone-7")).toBeTruthy();
  });

  it("shows layer description in detail sheet", () => {
    render(<TensionAvoidFinder {...defaultProps} />);
    fireEvent.press(screen.getByTestId("chord-source-card"));
    expect(screen.getByTestId("layer-description")).toBeTruthy();
  });

  it("shows detail sheet when tension note is pressed", () => {
    render(<TensionAvoidFinder {...defaultProps} />);
    // C Major in C Major key: D (9) is a tension note
    fireEvent.press(screen.getByTestId("note-pill-D (9)"));
    expect(screen.getByTestId("layer-description")).toBeTruthy();
  });

  it("renders in dark theme without crashing", () => {
    expect(render(<TensionAvoidFinder {...defaultProps} theme="dark" />).toJSON()).toBeTruthy();
  });

  it("renders with flat accidental without crashing", () => {
    expect(
      render(<TensionAvoidFinder {...defaultProps} accidental="flat" />).toJSON(),
    ).toBeTruthy();
  });

  it("renders with multiple layers without crashing", () => {
    const layers = [makeLayer({ id: "1" }), makeLayer({ id: "2" })];
    expect(render(<TensionAvoidFinder {...defaultProps} layers={layers} />).toJSON()).toBeTruthy();
  });
});
