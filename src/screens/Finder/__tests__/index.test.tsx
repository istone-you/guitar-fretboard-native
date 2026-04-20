import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import FinderPane from "..";
import type { Accidental, BaseLabelMode, Theme } from "../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
jest.mock("../../../i18n", () => ({}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock("../../../components/AppHeader/SceneHeader", () => () => null);

jest.mock("../../../components/NormalFretboard", () => {
  const { View, TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({
      onNoteClick,
      onNoteLongPress,
    }: {
      onNoteClick: (note: string) => void;
      onNoteLongPress?: (note: string) => void;
    }) => (
      <View testID="fretboard">
        <TouchableOpacity testID="tap-E" onPress={() => onNoteClick("E")} />
        <TouchableOpacity testID="tap-G" onPress={() => onNoteClick("G")} />
        <TouchableOpacity testID="tap-C" onPress={() => onNoteClick("C")} />
        <TouchableOpacity testID="longpress-C" onPress={() => onNoteLongPress?.("C")} />
        <TouchableOpacity testID="longpress-G" onPress={() => onNoteLongPress?.("G")} />
      </View>
    ),
  };
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
  onThemeChange: jest.fn(),
  onFretRangeChange: jest.fn(),
  onAccidentalChange: jest.fn(),
  onLeftHandedChange: jest.fn(),
};

function renderPane(overrides: Partial<typeof defaultProps> = {}) {
  return render(<FinderPane {...defaultProps} {...overrides} />);
}

describe("FinderPane", () => {
  it("renders without crashing", () => {
    expect(() => renderPane()).not.toThrow();
  });

  it("renders the fretboard", () => {
    renderPane();
    expect(screen.getByTestId("fretboard")).toBeTruthy();
  });

  it("shows long press instruction on initial render (no root selected)", () => {
    renderPane();
    expect(screen.getByText("finder.longPressInstruction")).toBeTruthy();
  });

  it("does not show root chip before root is set", () => {
    renderPane({ rootNote: "C" });
    expect(screen.queryByText("C")).toBeNull();
  });

  it("does not show results before root is set", () => {
    renderPane();
    expect(screen.queryByText("finder.exactMatch")).toBeNull();
    expect(screen.queryByText("finder.containingMatch")).toBeNull();
    expect(screen.queryByText("finder.containedMatch")).toBeNull();
  });

  it("sets root chip after long press", () => {
    renderPane({ rootNote: "C" });
    fireEvent.press(screen.getByTestId("longpress-C"));
    expect(screen.getByText("C")).toBeTruthy();
  });

  it("shows tap instruction after root is set and no extra notes", () => {
    renderPane();
    fireEvent.press(screen.getByTestId("longpress-C"));
    expect(screen.getByText("finder.tapInstruction")).toBeTruthy();
  });

  it("shows results sections after root is set", () => {
    renderPane();
    fireEvent.press(screen.getByTestId("longpress-C"));
    // sections appear once (merged)
    expect(screen.getByText("finder.exactMatch")).toBeTruthy();
    expect(screen.getByText("finder.containingMatch")).toBeTruthy();
    expect(screen.getByText("finder.containedMatch")).toBeTruthy();
    // tags appear per row — at least one of each kind
    expect(screen.getAllByText("finder.chords").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("finder.scales").length).toBeGreaterThanOrEqual(1);
  });

  it("tap does nothing before root is set", () => {
    renderPane({ rootNote: "C" });
    fireEvent.press(screen.getByTestId("tap-E"));
    expect(screen.queryByText("E")).toBeNull();
  });

  it("adds note chip after root is set and note is tapped", () => {
    renderPane({ rootNote: "C" });
    fireEvent.press(screen.getByTestId("longpress-C"));
    fireEvent.press(screen.getByTestId("tap-E"));
    expect(screen.getByText("E")).toBeTruthy();
  });

  it("removes note chip when tapped again", () => {
    renderPane({ rootNote: "C" });
    fireEvent.press(screen.getByTestId("longpress-C"));
    fireEvent.press(screen.getByTestId("tap-E"));
    expect(screen.getByText("E")).toBeTruthy();
    fireEvent.press(screen.getByTestId("tap-E"));
    expect(screen.queryByText("E")).toBeNull();
  });

  it("root note cannot be removed by tap", () => {
    renderPane({ rootNote: "C" });
    fireEvent.press(screen.getByTestId("longpress-C"));
    fireEvent.press(screen.getByTestId("tap-C"));
    expect(screen.getByText("C")).toBeTruthy();
  });

  it("long pressing a new note changes root and clears extra notes", () => {
    renderPane({ rootNote: "C" });
    fireEvent.press(screen.getByTestId("longpress-C"));
    fireEvent.press(screen.getByTestId("tap-E"));
    fireEvent.press(screen.getByTestId("longpress-G"));
    expect(screen.getByText("G")).toBeTruthy();
    expect(screen.queryByText("E")).toBeNull();
  });

  it("reset button clears extra notes", () => {
    renderPane({ rootNote: "C" });
    fireEvent.press(screen.getByTestId("longpress-C"));
    fireEvent.press(screen.getByTestId("tap-E"));
    fireEvent.press(screen.getByTestId("tap-G"));
    expect(screen.getByText("E")).toBeTruthy();
    fireEvent.press(screen.getByText("finder.reset"));
    expect(screen.queryByText("E")).toBeNull();
    expect(screen.queryByText("G")).toBeNull();
  });

  it("reset button clears root and restores long press instruction", () => {
    renderPane({ rootNote: "C" });
    fireEvent.press(screen.getByTestId("longpress-C"));
    fireEvent.press(screen.getByTestId("tap-E"));
    fireEvent.press(screen.getByText("finder.reset"));
    expect(screen.getByText("finder.longPressInstruction")).toBeTruthy();
    expect(screen.queryByText("C")).toBeNull();
  });

  it("reset button not shown before root is set", () => {
    renderPane();
    expect(screen.queryByText("finder.reset")).toBeNull();
  });

  it("renders in light theme without crashing", () => {
    expect(() => renderPane({ theme: "light" as Theme })).not.toThrow();
  });

  it("renders settings button", () => {
    renderPane();
    expect(screen.getByTestId("finder-settings-btn")).toBeTruthy();
  });

  it("opens settings modal on settings button press", () => {
    renderPane();
    fireEvent.press(screen.getByTestId("finder-settings-btn"));
    expect(screen.getByText("finder.settings")).toBeTruthy();
  });
});
