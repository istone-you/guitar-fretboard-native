import React, { createRef, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import ProgressionChordInput, { type ProgressionChordInputHandle } from "..";
import type { ProgressionChord } from "../../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../../../i18n", () => ({}));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" },
}));
jest.mock("../../SegmentedToggle", () => ({
  SegmentedToggle: ({ value }: { value: string }) => {
    const { Text } = require("react-native");
    return <Text>{value}</Text>;
  },
}));

function TestHarness({
  inputMode = "degree",
  initialChords = [],
  emptyText,
  inputRef,
  onKeyPress,
}: {
  inputMode?: "degree" | "note";
  initialChords?: ProgressionChord[];
  emptyText?: string;
  inputRef?: React.RefObject<ProgressionChordInputHandle | null>;
  onKeyPress?: () => void;
}) {
  const [chords, setChords] = useState<ProgressionChord[]>(initialChords);

  return (
    <ProgressionChordInput
      ref={inputRef}
      theme="light"
      accidental="sharp"
      inputMode={inputMode}
      noteKey="C"
      onKeyPress={onKeyPress}
      chords={chords}
      onChordsChange={setChords}
      calloutBg="#ffffff"
      emptyText={emptyText}
    />
  );
}

describe("ProgressionChordInput", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows degree chips in degree mode", () => {
    render(<TestHarness inputMode="degree" />);
    expect(screen.getByTestId("degree-chip-I")).toBeTruthy();
    expect(screen.getByTestId("degree-chip-IV")).toBeTruthy();
  });

  it("shows note chips in note mode", () => {
    render(<TestHarness inputMode="note" />);
    expect(screen.getByTestId("note-chip-C")).toBeTruthy();
    expect(screen.getByTestId("note-chip-G")).toBeTruthy();
  });

  it("shows built-in key button in note mode when onKeyPress is provided", () => {
    const onKeyPress = jest.fn();
    render(<TestHarness inputMode="note" onKeyPress={onKeyPress} />);
    fireEvent.press(screen.getByTestId("key-nav-btn"));
    expect(onKeyPress).toHaveBeenCalled();
  });

  it("adds a chord after selecting a chip and chord type", () => {
    render(<TestHarness inputMode="degree" />);
    fireEvent.press(screen.getByTestId("degree-chip-I"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    expect(screen.getByTestId("chord-chip-0")).toBeTruthy();
  });

  it("removes a chord when the chord chip is pressed", () => {
    render(<TestHarness inputMode="degree" />);
    fireEvent.press(screen.getByTestId("degree-chip-I"));
    fireEvent.press(screen.getByTestId("chord-type-Major"));
    expect(screen.getByTestId("chord-chip-0")).toBeTruthy();
    fireEvent.press(screen.getByTestId("chord-chip-0"));
    expect(screen.queryByTestId("chord-chip-0")).toBeNull();
  });

  it("shows emptyText only when there are no chords", () => {
    const { rerender } = render(
      <ProgressionChordInput
        theme="light"
        accidental="sharp"
        inputMode="degree"
        noteKey="C"
        chords={[]}
        onChordsChange={jest.fn()}
        calloutBg="#ffffff"
        emptyText="Empty progression"
      />,
    );
    expect(screen.getByText("Empty progression")).toBeTruthy();

    rerender(
      <ProgressionChordInput
        theme="light"
        accidental="sharp"
        inputMode="degree"
        noteKey="C"
        chords={[{ degree: "I", chordType: "Major" }]}
        onChordsChange={jest.fn()}
        calloutBg="#ffffff"
        emptyText="Empty progression"
      />,
    );
    expect(screen.queryByText("Empty progression")).toBeNull();
  });

  it("resetSelection clears the current selection", () => {
    const inputRef = createRef<ProgressionChordInputHandle>();
    render(<TestHarness inputMode="degree" inputRef={inputRef} />);

    fireEvent.press(screen.getByTestId("degree-chip-I"));
    act(() => inputRef.current?.resetSelection());
    fireEvent.press(screen.getByTestId("chord-type-Major"));

    expect(screen.queryByTestId("chord-chip-0")).toBeNull();
  });
});
