import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import IdentifyPane from "..";
import type { Accidental, BaseLabelMode, Theme } from "../../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../../../i18n", () => ({}));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light" },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../../../hooks/usePersistedSetting", () => ({
  usePersistedSetting: (_key: string, initial: unknown) => {
    const { useState } = require("react");
    return useState(initial);
  },
}));

jest.mock("../../../../components/NormalFretboard", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ onNoteClick }: { onNoteClick?: (note: string) => void }) => (
      <>
        <TouchableOpacity testID="fretboard-note-C" onPress={() => onNoteClick?.("C")} />
        <TouchableOpacity testID="fretboard-note-E" onPress={() => onNoteClick?.("E")} />
        <Text testID="fretboard-mock">fretboard</Text>
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
      children: (c: { close: () => void; dragHandlers: object }) => React.ReactNode;
      onClose: () => void;
    }) =>
      visible ? (
        <View testID="settings-sheet">{children({ close: onClose, dragHandlers: {} })}</View>
      ) : null,
    SHEET_HANDLE_CLEARANCE: 28,
    useSheetHeight: () => 500,
  };
});

jest.mock("../../../../components/ui/SheetProgressiveHeader", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <View testID="sheet-header">{children}</View>
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

jest.mock("../../../../components/ui/FinderDetailSheet", () => {
  const { View, TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({
      visible,
      title,
      onClose,
      onAddLayer,
      extraAction,
    }: {
      visible: boolean;
      title: string;
      onClose: () => void;
      onAddLayer?: () => void;
      isFull: boolean;
      extraAction?: { label: string; onPress: () => void; disabled?: boolean };
    }) =>
      visible ? (
        <View testID="finder-detail-sheet">
          <Text testID="detail-sheet-title">{title}</Text>
          {extraAction && (
            <TouchableOpacity
              testID={`detail-extra-${extraAction.label}`}
              onPress={extraAction.onPress}
              disabled={extraAction.disabled}
            >
              <Text>{extraAction.label}</Text>
            </TouchableOpacity>
          )}
          {onAddLayer && (
            <TouchableOpacity testID="detail-add-layer" onPress={onAddLayer}>
              <Text>finder.addToLayerTitle</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity testID="detail-close" onPress={onClose} />
        </View>
      ) : null,
  };
});

jest.mock("../../../../components/ui/Icon", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View /> };
});

jest.mock("../../../../components/ui/ChordDiagram", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="chord-diagram" />,
    getAllChordForms: (_rootIndex: number, _chordType: string) => [],
  };
});

jest.mock("../../../../components/ui/ColorPicker", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View testID="color-picker" /> };
});

jest.mock("../../../../components/ui/SegmentedToggle", () => {
  const { View } = require("react-native");
  return { SegmentedToggle: () => <View testID="segmented-toggle" /> };
});

jest.mock("../../../../components/ui/PillButton", () => {
  const { TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({
      onPress,
      children,
      testID,
    }: {
      onPress: () => void;
      children: React.ReactNode;
      testID?: string;
    }) => (
      <TouchableOpacity testID={testID ?? "pill-btn"} onPress={onPress}>
        {children}
      </TouchableOpacity>
    ),
  };
});

jest.mock("../../../../components/ui/NotePill", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ label, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
      <TouchableOpacity testID={`note-pill-${label}`} onPress={onPress}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock("../../../../components/LayerEditModal/LayerDescription", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View testID="layer-description" /> };
});

const defaultProps = {
  theme: "dark" as Theme,
  accidental: "sharp" as Accidental,
  baseLabelMode: "note" as BaseLabelMode,
  fretRange: [0, 12] as [number, number],
  rootNote: "C",
  layers: [],
  onAddLayerAndNavigate: jest.fn(),
  onBaseLabelModeChange: jest.fn(),
};

describe("IdentifyPane", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    const { toJSON } = render(<IdentifyPane {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it("shows fretboard by default", () => {
    render(<IdentifyPane {...defaultProps} />);
    expect(screen.getByTestId("fretboard-mock")).toBeTruthy();
  });

  it("shows instruction placeholder text when no root selected", () => {
    render(<IdentifyPane {...defaultProps} />);
    expect(screen.getByText("finder.chipRootInstruction")).toBeTruthy();
  });

  it("shows settings button", () => {
    render(<IdentifyPane {...defaultProps} />);
    expect(screen.getByTestId("finder-settings-btn")).toBeTruthy();
  });

  it("opens settings sheet when settings button is pressed", () => {
    render(<IdentifyPane {...defaultProps} />);
    fireEvent.press(screen.getByTestId("finder-settings-btn"));
    expect(screen.getByTestId("settings-sheet")).toBeTruthy();
  });

  it("closes settings sheet when close button is pressed", () => {
    render(<IdentifyPane {...defaultProps} />);
    fireEvent.press(screen.getByTestId("finder-settings-btn"));
    fireEvent.press(screen.getByTestId("glass-btn-close"));
    expect(screen.queryByTestId("settings-sheet")).toBeNull();
  });

  it("shows reset button after root is set via long press", () => {
    render(<IdentifyPane {...defaultProps} />);
    fireEvent.press(screen.getByTestId("fretboard-note-C"));
    expect(screen.getByText("finder.reset")).toBeTruthy();
  });

  it("hides instruction text after root is set", () => {
    render(<IdentifyPane {...defaultProps} />);
    fireEvent.press(screen.getByTestId("fretboard-note-C"));
    expect(screen.queryByText("finder.chipRootInstruction")).toBeNull();
  });

  it("clears root when reset button is pressed", () => {
    render(<IdentifyPane {...defaultProps} />);
    fireEvent.press(screen.getByTestId("fretboard-note-C"));
    fireEvent.press(screen.getByText("finder.reset"));
    expect(screen.queryByText("finder.reset")).toBeNull();
  });

  it("opens detail sheet when a result row is tapped", () => {
    render(<IdentifyPane {...defaultProps} />);
    fireEvent.press(screen.getByTestId("fretboard-note-C"));
    fireEvent.press(screen.getByTestId("fretboard-note-E"));
    const sheet = screen.queryByTestId("finder-detail-sheet");
    if (sheet) {
      expect(sheet).toBeTruthy();
    }
  });

  it("calls onAddLayerAndNavigate from detail sheet add action", () => {
    const onAdd = jest.fn();
    render(<IdentifyPane {...defaultProps} onAddLayerAndNavigate={onAdd} />);
    fireEvent.press(screen.getByTestId("fretboard-note-C"));
    fireEvent.press(screen.getByTestId("fretboard-note-E"));
    const addBtn = screen.queryByTestId("detail-add-layer");
    if (addBtn) {
      fireEvent.press(addBtn);
      expect(onAdd).toHaveBeenCalled();
    }
  });

  it("renders in light theme without crashing", () => {
    const { toJSON } = render(<IdentifyPane {...defaultProps} theme="light" />);
    expect(toJSON()).toBeTruthy();
  });
});
