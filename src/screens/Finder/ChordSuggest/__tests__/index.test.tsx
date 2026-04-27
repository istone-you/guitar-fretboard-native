import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import ChordSuggest from "..";

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

jest.mock("../../../../components/ui/NoteDegreeModeToggle", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ value, onChange }: { value: string; onChange: (mode: string) => void }) => (
      <TouchableOpacity
        testID="mode-toggle"
        onPress={() => onChange(value === "note" ? "degree" : "note")}
      >
        <Text>{value}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock("../../../../components/ui/SegmentedToggle", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    SegmentedToggle: ({
      value,
      onChange,
    }: {
      value: "major" | "minor";
      onChange: (value: "major" | "minor") => void;
    }) => (
      <TouchableOpacity
        testID="key-type-toggle"
        onPress={() => onChange(value === "major" ? "minor" : "major")}
      >
        <Text>{value}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock("../../../../components/ui/ProgressionChordInput", () => {
  const { View, TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({
      chords,
      onChordsChange,
      onKeyPress,
      keyAccessory,
      emptyText,
    }: {
      chords: { degree: string; chordType: string }[];
      onChordsChange: (next: { degree: string; chordType: string }[]) => void;
      onKeyPress?: () => void;
      keyAccessory?: React.ReactNode;
      emptyText?: string;
    }) => (
      <View>
        {keyAccessory}
        <TouchableOpacity
          testID="progression-add-chord"
          onPress={() => onChordsChange([...chords, { degree: "I", chordType: "Major" }])}
        />
        {onKeyPress ? <TouchableOpacity testID="key-nav-btn" onPress={onKeyPress} /> : null}
        {chords.length === 0 && emptyText ? <Text>{emptyText}</Text> : null}
        {chords.map((chord, index) => (
          <Text key={`${chord.degree}-${chord.chordType}-${index}`} testID={`chord-chip-${index}`}>
            {`${chord.degree}-${chord.chordType}`}
          </Text>
        ))}
      </View>
    ),
    DEGREE_TO_OFFSET: {
      I: 0,
      bII: 1,
      II: 2,
      bIII: 3,
      III: 4,
      IV: 5,
      bV: 6,
      V: 7,
      bVI: 8,
      VI: 9,
      bVII: 10,
      VII: 11,
    },
    OFFSET_TO_DEGREE: {
      0: "I",
      1: "bII",
      2: "II",
      3: "bIII",
      4: "III",
      5: "IV",
      6: "bV",
      7: "V",
      8: "bVI",
      9: "VI",
      10: "bVII",
      11: "VII",
    },
  };
});

jest.mock("../../../../components/ui/NoteSelectPage", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ onSelect, onBack }: { onSelect: (note: string) => void; onBack: () => void }) => (
      <>
        <TouchableOpacity testID="note-select-G" onPress={() => onSelect("G")} />
        <TouchableOpacity testID="note-select-back" onPress={onBack}>
          <Text>Back</Text>
        </TouchableOpacity>
      </>
    ),
  };
});

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
      children: (controls: {
        close: () => void;
        closeWithCallback: (cb: () => void) => void;
        dragHandlers: object;
      }) => React.ReactNode;
      onClose: () => void;
    }) =>
      visible ? (
        <View testID="bottom-sheet">
          {children({ close: onClose, closeWithCallback: (cb) => cb(), dragHandlers: {} })}
        </View>
      ) : null,
    useSheetHeight: () => 500,
  };
});

jest.mock("../../../../hooks/useProgressionTemplates", () => ({
  useProgressionTemplates: () => ({
    customTemplates: [],
    saveTemplate: jest.fn(() => "tpl-123"),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    reorderTemplates: jest.fn(),
  }),
}));

jest.mock("../../../Templates/TemplateFormSheet", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ visible }: { visible: boolean }) =>
      visible ? <View testID="template-form-sheet" /> : null,
  };
});

const defaultProps = {
  theme: "light" as const,
  accidental: "sharp" as const,
};

describe("ChordSuggest", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    expect(render(<ChordSuggest {...defaultProps} />).toJSON()).toBeTruthy();
  });

  it("shows diatonic suggestion cards when no chords are selected", () => {
    render(<ChordSuggest {...defaultProps} />);
    expect(screen.getAllByTestId("entry-card")).toHaveLength(7);
    expect(screen.getByText("finder.chordSuggest.category.diatonic-first")).toBeTruthy();
    expect(screen.getByText("VIIm(-5)")).toBeTruthy();
  });

  it("switches to minor-key diatonic suggestions", () => {
    render(<ChordSuggest {...defaultProps} />);
    fireEvent.press(screen.getByTestId("key-type-toggle"));

    expect(screen.getByText("Cm")).toBeTruthy();
    expect(screen.getByText("Im")).toBeTruthy();
  });

  it("opens key selection sheet when key button is pressed", () => {
    render(<ChordSuggest {...defaultProps} />);
    fireEvent.press(screen.getByTestId("key-nav-btn"));
    expect(screen.getByTestId("note-select-back")).toBeTruthy();
  });

  it("resets chords when the key is changed", () => {
    render(<ChordSuggest {...defaultProps} />);
    fireEvent.press(screen.getByTestId("progression-add-chord"));
    expect(screen.getByText("finder.progressionAnalysis.save")).toBeTruthy();

    fireEvent.press(screen.getByTestId("key-nav-btn"));
    fireEvent.press(screen.getByTestId("note-select-G"));

    expect(screen.queryByText("finder.progressionAnalysis.save")).toBeNull();
    expect(screen.queryByTestId("note-select-back")).toBeNull();
  });

  it("updates diatonic suggestions when the key changes", () => {
    render(<ChordSuggest {...defaultProps} />);
    expect(screen.queryByText("F♯dim")).toBeNull();

    fireEvent.press(screen.getByTestId("key-nav-btn"));
    fireEvent.press(screen.getByTestId("note-select-G"));

    expect(screen.getByText("F♯dim")).toBeTruthy();
    expect(screen.getByText("VIIm(-5)")).toBeTruthy();
  });

  it("uses next-chord suggestions after a chord is added", () => {
    render(<ChordSuggest {...defaultProps} />);
    fireEvent.press(screen.getByTestId("progression-add-chord"));
    expect(screen.getByText("finder.chordSuggest.category.two-five-entry")).toBeTruthy();
  });

  it("adds a chord when a suggestion card is pressed", () => {
    render(<ChordSuggest {...defaultProps} />);
    fireEvent.press(screen.getByTestId("progression-add-chord"));
    expect(screen.getByTestId("chord-chip-0")).toBeTruthy();

    const [firstCard] = screen.getAllByTestId("entry-card");
    fireEvent.press(firstCard);

    expect(screen.getByTestId("chord-chip-1")).toBeTruthy();
  });

  it("shows the save button when chords are present", () => {
    render(<ChordSuggest {...defaultProps} />);
    fireEvent.press(screen.getByTestId("progression-add-chord"));
    expect(screen.getByText("finder.progressionAnalysis.save")).toBeTruthy();
  });

  it("renders in dark theme without crashing", () => {
    expect(render(<ChordSuggest {...defaultProps} theme="dark" />).toJSON()).toBeTruthy();
  });
});
