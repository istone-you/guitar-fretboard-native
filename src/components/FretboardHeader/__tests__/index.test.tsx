import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import FretboardHeader from "../index";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

jest.mock("../../../i18n", () => ({}));

const defaultProps = {
  theme: "dark" as const,
  rootNote: "C",
  accidental: "sharp" as const,
  baseLabelMode: "note" as const,
  showQuiz: false,
  onBaseLabelModeChange: jest.fn(),
  onRootNoteChange: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("FretboardHeader", () => {
  it("renders root note label and current root note", () => {
    const { getByText } = render(<FretboardHeader {...defaultProps} />);
    expect(getByText("header.root:")).toBeTruthy();
    expect(getByText("C")).toBeTruthy();
  });

  it("renders different root notes", () => {
    const { getByText } = render(
      <FretboardHeader {...defaultProps} rootNote="G" />
    );
    expect(getByText("G")).toBeTruthy();
  });

  it("steps root note forward on right arrow press (sharp)", () => {
    const onRootNoteChange = jest.fn();
    const { getByText } = render(
      <FretboardHeader
        {...defaultProps}
        rootNote="C"
        accidental="sharp"
        onRootNoteChange={onRootNoteChange}
      />
    );
    fireEvent.press(getByText("\u203A")); // right arrow
    expect(onRootNoteChange).toHaveBeenCalledWith("C\u266F");
  });

  it("steps root note backward on left arrow press (sharp)", () => {
    const onRootNoteChange = jest.fn();
    const { getByText } = render(
      <FretboardHeader
        {...defaultProps}
        rootNote="C"
        accidental="sharp"
        onRootNoteChange={onRootNoteChange}
      />
    );
    fireEvent.press(getByText("\u2039")); // left arrow
    expect(onRootNoteChange).toHaveBeenCalledWith("B");
  });

  it("wraps around from B forward to C (sharp)", () => {
    const onRootNoteChange = jest.fn();
    const { getByText } = render(
      <FretboardHeader
        {...defaultProps}
        rootNote="B"
        accidental="sharp"
        onRootNoteChange={onRootNoteChange}
      />
    );
    fireEvent.press(getByText("\u203A"));
    expect(onRootNoteChange).toHaveBeenCalledWith("C");
  });

  it("uses flat note names when accidental is flat", () => {
    const onRootNoteChange = jest.fn();
    const { getByText } = render(
      <FretboardHeader
        {...defaultProps}
        rootNote="C"
        accidental="flat"
        onRootNoteChange={onRootNoteChange}
      />
    );
    fireEvent.press(getByText("\u203A"));
    expect(onRootNoteChange).toHaveBeenCalledWith("D\u266D");
  });

  it("does not change root note when rootChangeDisabled is true", () => {
    const onRootNoteChange = jest.fn();
    const { getByText } = render(
      <FretboardHeader
        {...defaultProps}
        rootChangeDisabled={true}
        onRootNoteChange={onRootNoteChange}
      />
    );
    fireEvent.press(getByText("\u203A"));
    fireEvent.press(getByText("\u2039"));
    expect(onRootNoteChange).not.toHaveBeenCalled();
  });

  it("renders step buttons as non-functional when rootChangeDisabled", () => {
    const onRootNoteChange = jest.fn();
    const { getByText } = render(
      <FretboardHeader {...defaultProps} rootChangeDisabled={true} onRootNoteChange={onRootNoteChange} />
    );
    fireEvent.press(getByText("\u2039"));
    fireEvent.press(getByText("\u203A"));
    expect(onRootNoteChange).not.toHaveBeenCalled();
  });

  it("shows label mode toggle when not in quiz mode", () => {
    const { getByText } = render(
      <FretboardHeader {...defaultProps} showQuiz={false} />
    );
    expect(getByText("header.note")).toBeTruthy();
    expect(getByText("header.degree")).toBeTruthy();
  });

  it("hides label mode toggle when in quiz mode", () => {
    const { queryByText } = render(
      <FretboardHeader {...defaultProps} showQuiz={true} />
    );
    expect(queryByText("header.note")).toBeNull();
    expect(queryByText("header.degree")).toBeNull();
  });

  it("calls onBaseLabelModeChange when toggling label mode", () => {
    const onBaseLabelModeChange = jest.fn();
    const { getByText } = render(
      <FretboardHeader
        {...defaultProps}
        baseLabelMode="note"
        onBaseLabelModeChange={onBaseLabelModeChange}
      />
    );
    fireEvent.press(getByText("header.degree"));
    expect(onBaseLabelModeChange).toHaveBeenCalledWith("degree");
  });

  it("applies light theme colors", () => {
    const { getByText } = render(
      <FretboardHeader {...defaultProps} theme="light" />
    );
    const rootLabel = getByText("header.root:");
    expect(rootLabel.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: "#78716c" })])
    );
  });

  it("applies dark theme colors", () => {
    const { getByText } = render(
      <FretboardHeader {...defaultProps} theme="dark" />
    );
    const rootLabel = getByText("header.root:");
    expect(rootLabel.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: "#9ca3af" })])
    );
    const rootNote = getByText("C");
    expect(rootNote.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: "#fff" })])
    );
  });

  it("defaults rootChangeDisabled to false", () => {
    const onRootNoteChange = jest.fn();
    const { getByText } = render(
      <FretboardHeader
        {...defaultProps}
        onRootNoteChange={onRootNoteChange}
      />
    );
    fireEvent.press(getByText("\u203A"));
    expect(onRootNoteChange).toHaveBeenCalled();
  });
});
