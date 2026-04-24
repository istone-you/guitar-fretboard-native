import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import ModalInterchangeBrowser from "..";
import type { LayerConfig } from "../../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.mode) return `from ${opts.mode}`;
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

jest.mock("../../../../components/ui/NotePickerButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({
      value,
      label,
    }: {
      value: string;
      onChange: (n: string) => void;
      label: string;
    }) => (
      <TouchableOpacity testID="note-picker">
        <Text>{label}</Text>
        <Text>{value}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock("../../../../components/ui/SegmentedToggle", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    SegmentedToggle: ({
      value: _value,
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
            testID={`seg-${o.value}`}
            onPress={() => onChange(o.value)}
          >
            <Text>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </>
    ),
  };
});

jest.mock("../../../../components/ui/FinderDetailSheet", () => {
  const { View, TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({
      visible,
      onClose,
      onAddLayer,
      isFull,
      title,
    }: {
      visible: boolean;
      onClose: () => void;
      onAddLayer?: () => void;
      isFull?: boolean;
      title?: string;
    }) =>
      visible ? (
        <View testID="detail-sheet">
          <Text testID="detail-title">{title}</Text>
          <TouchableOpacity testID="detail-close" onPress={onClose} />
          {onAddLayer && !isFull && <TouchableOpacity testID="detail-add" onPress={onAddLayer} />}
        </View>
      ) : null,
  };
});

jest.mock("../../../../components/ui/ChordDiagram", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="chord-diagram" />,
    getAllChordForms: () => [],
  };
});

jest.mock("../../../../components/LayerEditModal/LayerDescription", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View testID="layer-desc" /> };
});

function makeLayer(overrides: Partial<LayerConfig> = {}): LayerConfig {
  return {
    id: "l1",
    type: "chord",
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

describe("ModalInterchangeBrowser", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    expect(render(<ModalInterchangeBrowser {...defaultProps} />).toJSON()).toBeTruthy();
  });

  it("shows 5 borrowed chord chips for C major", () => {
    render(<ModalInterchangeBrowser {...defaultProps} />);
    expect(screen.getByTestId("mi-chip-IIm(-5)")).toBeTruthy();
    expect(screen.getByTestId("mi-chip-♭III")).toBeTruthy();
    expect(screen.getByTestId("mi-chip-IVm")).toBeTruthy();
    expect(screen.getByTestId("mi-chip-♭VI")).toBeTruthy();
    expect(screen.getByTestId("mi-chip-♭VII")).toBeTruthy();
  });

  it("opens detail sheet when a chip is pressed", () => {
    render(<ModalInterchangeBrowser {...defaultProps} />);
    fireEvent.press(screen.getByTestId("mi-chip-♭VII"));
    expect(screen.getByTestId("detail-sheet")).toBeTruthy();
  });

  it("closes detail sheet when close is pressed", () => {
    render(<ModalInterchangeBrowser {...defaultProps} />);
    fireEvent.press(screen.getByTestId("mi-chip-♭VII"));
    fireEvent.press(screen.getByTestId("detail-close"));
    expect(screen.queryByTestId("detail-sheet")).toBeNull();
  });

  it("calls onAddLayerAndNavigate when add is pressed in detail sheet", () => {
    const onAdd = jest.fn();
    render(<ModalInterchangeBrowser {...defaultProps} onAddLayerAndNavigate={onAdd} />);
    fireEvent.press(screen.getByTestId("mi-chip-♭VII"));
    fireEvent.press(screen.getByTestId("detail-add"));
    expect(onAdd).toHaveBeenCalled();
  });

  it("does not call onAddLayerAndNavigate when layers are full", () => {
    const onAdd = jest.fn();
    const fullLayers = [makeLayer({ id: "1" }), makeLayer({ id: "2" }), makeLayer({ id: "3" })];
    render(
      <ModalInterchangeBrowser
        {...defaultProps}
        layers={fullLayers}
        onAddLayerAndNavigate={onAdd}
      />,
    );
    fireEvent.press(screen.getByTestId("mi-chip-♭VII"));
    // detail-add not present when isFull
    expect(screen.queryByTestId("detail-add")).toBeNull();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("switches to minor borrowed chords when minor tab selected", () => {
    render(<ModalInterchangeBrowser {...defaultProps} />);
    fireEvent.press(screen.getByTestId("seg-minor"));
    expect(screen.getByTestId("mi-chip-V")).toBeTruthy();
  });

  it("renders in dark theme without crashing", () => {
    expect(
      render(<ModalInterchangeBrowser {...defaultProps} theme="dark" />).toJSON(),
    ).toBeTruthy();
  });
});
