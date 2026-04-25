import React from "react";
import { render, fireEvent, screen, act } from "@testing-library/react-native";
import FinderPane from "..";
import type { Accidental, BaseLabelMode, Theme } from "../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
jest.mock("../../../i18n", () => ({}));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("../../../components/AppHeader/SceneHeader", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ title, onBack }: { title?: string; onBack?: () => void }) => (
      <>
        {title && <Text testID="scene-title">{title}</Text>}
        {onBack && (
          <TouchableOpacity testID="scene-back" onPress={onBack}>
            <Text>back</Text>
          </TouchableOpacity>
        )}
      </>
    ),
  };
});

jest.mock("../Selection", () => {
  const { View, TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ onSelect }: { onSelect: (mode: string) => void }) => (
      <View testID="home-pane">
        <TouchableOpacity testID="select-identify" onPress={() => onSelect("identify")}>
          <Text>finder.homeIdentifyTitle</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="select-chord-list" onPress={() => onSelect("chord-list")}>
          <Text>finder.homeChordListTitle</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});

jest.mock("../IdentifyPane", () => {
  const { View, Text } = require("react-native");
  return {
    __esModule: true,
    default: () => (
      <View testID="identify-pane">
        <Text>identify</Text>
      </View>
    ),
  };
});

jest.mock("../ChordBrowser", () => {
  const { View, Text } = require("react-native");
  return {
    __esModule: true,
    default: () => (
      <View testID="chord-browser-pane">
        <Text>chord-browser</Text>
      </View>
    ),
  };
});

jest.mock("../../../hooks/useProgressionTemplates", () => ({
  useProgressionTemplates: () => ({
    customTemplates: [],
    saveTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
  }),
}));

jest.mock("../CirclePage", () => ({ __esModule: true, default: () => null }));
jest.mock("../DiatonicBrowser/CirclePage", () => ({ __esModule: true, default: () => null }));
const defaultProps = {
  theme: "dark" as Theme,
  accidental: "sharp" as Accidental,
  baseLabelMode: "note" as BaseLabelMode,
  fretRange: [0, 12] as [number, number],
  rootNote: "C",
  layers: [],
  onAddLayerAndNavigate: jest.fn(),
  onBaseLabelModeChange: jest.fn(),
  onThemeChange: jest.fn(),
  onFretRangeChange: jest.fn(),
  onAccidentalChange: jest.fn(),
  onLeftHandedChange: jest.fn(),
  customTemplates: [],
  onSaveTemplate: jest.fn(),
};

describe("FinderPane (parent wrapper)", () => {
  beforeAll(() => {
    const { Animated } = require("react-native");
    jest.spyOn(Animated, "timing").mockImplementation((_value: any, config: any) => ({
      start: (callback?: () => void) => {
        _value.setValue(config.toValue);
        callback?.();
      },
    }));
  });
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    const { toJSON } = render(<FinderPane {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it("shows home pane initially", () => {
    render(<FinderPane {...defaultProps} />);
    expect(screen.getByTestId("home-pane")).toBeTruthy();
  });

  it("shows Finder title on home pane", () => {
    render(<FinderPane {...defaultProps} />);
    expect(screen.getByTestId("scene-title").props.children).toBe("tabs.finder");
  });

  it("does not show back button on home pane", () => {
    render(<FinderPane {...defaultProps} />);
    expect(screen.queryByTestId("scene-back")).toBeNull();
  });

  it("slides to IdentifyPane when identify is selected", () => {
    render(<FinderPane {...defaultProps} />);
    act(() => {
      fireEvent.press(screen.getByTestId("select-identify"));
    });
    expect(screen.getByTestId("identify-pane")).toBeTruthy();
  });

  it("slides to ChordBrowser when chord-list is selected", () => {
    render(<FinderPane {...defaultProps} />);
    act(() => {
      fireEvent.press(screen.getByTestId("select-chord-list"));
    });
    expect(screen.getByTestId("chord-browser-pane")).toBeTruthy();
  });

  it("shows back button in SceneHeader when in a child mode", () => {
    render(<FinderPane {...defaultProps} />);
    act(() => {
      fireEvent.press(screen.getByTestId("select-identify"));
    });
    expect(screen.getByTestId("scene-back")).toBeTruthy();
  });

  it("hides title in SceneHeader when in a child mode", () => {
    render(<FinderPane {...defaultProps} />);
    act(() => {
      fireEvent.press(screen.getByTestId("select-identify"));
    });
    expect(screen.queryByTestId("scene-title")).toBeNull();
  });

  it("returns to home pane when back button is pressed", () => {
    render(<FinderPane {...defaultProps} />);
    act(() => {
      fireEvent.press(screen.getByTestId("select-identify"));
    });
    act(() => {
      fireEvent.press(screen.getByTestId("scene-back"));
    });
    expect(screen.queryByTestId("identify-pane")).toBeNull();
  });

  it("renders in light theme without crashing", () => {
    const { toJSON } = render(<FinderPane {...defaultProps} theme="light" />);
    expect(toJSON()).toBeTruthy();
  });
});
