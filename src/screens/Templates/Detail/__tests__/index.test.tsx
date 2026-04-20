import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import TemplateDetailPane from "..";
import type { CustomProgressionTemplate } from "../../../../hooks/useProgressionTemplates";
import type { LayerConfig } from "../../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../../../i18n", () => ({}));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" },
}));

jest.mock("../../../../components/ui/NotePickerButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
      <TouchableOpacity testID="note-picker" onPress={() => onChange("G")}>
        <Text testID="note-value">{value}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock("../../../../components/ui/ChordDiagram", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="chord-diagram" />,
    getAllChordForms: () => [[{ string: 0, fret: 1 }]],
  };
});

jest.mock("../../TemplateFormSheet", () => {
  const { View, TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({
      visible,
      onClose,
      onSave,
    }: {
      visible: boolean;
      onClose: () => void;
      onSave: (name: string, chords: unknown[]) => void;
    }) =>
      visible ? (
        <View testID="form-sheet">
          <TouchableOpacity testID="form-close" onPress={onClose} />
          <TouchableOpacity
            testID="form-save"
            onPress={() => onSave("Updated", [{ degree: "I", chordType: "Major" }])}
          />
        </View>
      ) : null,
  };
});

const makeTemplate = (
  overrides: Partial<CustomProgressionTemplate> = {},
): CustomProgressionTemplate => ({
  id: "t1",
  name: "II-V-I",
  chords: [
    { degree: "II", chordType: "Minor" },
    { degree: "V", chordType: "7th" },
    { degree: "I", chordType: "Major" },
  ],
  createdAt: 0,
  ...overrides,
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
  template: makeTemplate(),
  layers: [],
  onUpdateTemplate: jest.fn(),
  onAddLayer: jest.fn(),
};

describe("TemplateDetailPane", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    const { toJSON } = render(<TemplateDetailPane {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders the template name", () => {
    render(<TemplateDetailPane {...defaultProps} />);
    expect(screen.getByText("II-V-I")).toBeTruthy();
  });

  it("renders chord diagrams for each chord", () => {
    render(<TemplateDetailPane {...defaultProps} />);
    const diagrams = screen.getAllByTestId("chord-diagram");
    expect(diagrams.length).toBeGreaterThan(0);
  });

  it("shows the key root via NotePickerButton", () => {
    render(<TemplateDetailPane {...defaultProps} />);
    expect(screen.getByTestId("note-value").props.children).toBe("C");
  });

  it("updates key root when NotePickerButton changes", () => {
    render(<TemplateDetailPane {...defaultProps} />);
    fireEvent.press(screen.getByTestId("note-picker"));
    expect(screen.getByTestId("note-value").props.children).toBe("G");
  });

  it("calls onAddLayer when add button is pressed with empty layers", () => {
    const onAddLayer = jest.fn();
    render(<TemplateDetailPane {...defaultProps} onAddLayer={onAddLayer} />);
    // Find the upload (add to layer) pill button - second PillButton
    const { TouchableOpacity } = require("react-native");
    const { UNSAFE_getAllByType } = render(
      <TemplateDetailPane {...defaultProps} onAddLayer={onAddLayer} />,
    );
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    // The add button is the second action button (after note picker)
    fireEvent.press(buttons[1]);
    expect(onAddLayer).toHaveBeenCalled();
  });

  it("disables add button when layers are full (MAX_LAYERS=3)", () => {
    const layers = [makeLayer({ id: "l1" }), makeLayer({ id: "l2" }), makeLayer({ id: "l3" })];
    const { UNSAFE_getAllByType } = render(
      <TemplateDetailPane {...defaultProps} layers={layers} />,
    );
    const { TouchableOpacity } = require("react-native");
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    // The add button should be disabled
    const addBtn = buttons.find((b: any) => b.props.disabled === true);
    expect(addBtn).toBeTruthy();
  });

  it("opens the template form sheet when ellipsis button is pressed", () => {
    const { UNSAFE_getAllByType } = render(<TemplateDetailPane {...defaultProps} />);
    const { TouchableOpacity } = require("react-native");
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    // Ellipsis is the last button
    fireEvent.press(buttons[buttons.length - 1]);
    expect(screen.getByTestId("form-sheet")).toBeTruthy();
  });

  it("calls onUpdateTemplate when form is saved", () => {
    const onUpdateTemplate = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <TemplateDetailPane {...defaultProps} onUpdateTemplate={onUpdateTemplate} />,
    );
    const { TouchableOpacity } = require("react-native");
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[buttons.length - 1]);
    fireEvent.press(screen.getByTestId("form-save"));
    expect(onUpdateTemplate).toHaveBeenCalledWith("t1", "Updated", expect.any(Array));
  });

  it("closes the form sheet on form-close", () => {
    const { UNSAFE_getAllByType } = render(<TemplateDetailPane {...defaultProps} />);
    const { TouchableOpacity } = require("react-native");
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[buttons.length - 1]);
    fireEvent.press(screen.getByTestId("form-close"));
    expect(screen.queryByTestId("form-sheet")).toBeNull();
  });

  it("renders in dark theme without crashing", () => {
    const { toJSON } = render(<TemplateDetailPane {...defaultProps} theme="dark" />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders template with no chords without crashing", () => {
    const { toJSON } = render(
      <TemplateDetailPane {...defaultProps} template={makeTemplate({ chords: [] })} />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
