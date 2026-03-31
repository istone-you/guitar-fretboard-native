import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import FretboardFooter from "../index";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

jest.mock("../../../i18n", () => ({}));

const ALL_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const DEGREE_CHIPS = ["P1", "m2", "M2", "m3", "M3", "P4", "b5", "P5", "m6", "M6", "m7", "M7"];

const defaultProps = {
  theme: "dark" as const,
  baseLabelMode: "note" as const,
  showQuiz: false,
  allNotes: ALL_NOTES,
  overlayNotes: ["C", "E", "G"],
  highlightedOverlayNotes: new Set<string>(),
  highlightedDegrees: new Set<string>(),
  autoFilter: false,
  onAutoFilterChange: jest.fn(),
  onAutoFilter: jest.fn(),
  onResetOrHighlightAll: jest.fn(),
  onSetOverlayNoteHighlights: jest.fn(),
  onToggleOverlayNoteHighlight: jest.fn(),
  onToggleDegree: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("FretboardFooter", () => {
  describe("quiz mode", () => {
    it("renders empty spacer when showQuiz is true", () => {
      const { queryByText } = render(<FretboardFooter {...defaultProps} showQuiz={true} />);
      expect(queryByText("noteFilter.title")).toBeNull();
      expect(queryByText("degreeFilter.title")).toBeNull();
    });

    it("does not render any chips in quiz mode", () => {
      const { queryByText } = render(<FretboardFooter {...defaultProps} showQuiz={true} />);
      ALL_NOTES.forEach((note) => {
        expect(queryByText(note)).toBeNull();
      });
    });
  });

  describe("note mode", () => {
    it("renders note filter title", () => {
      const { getByText } = render(<FretboardFooter {...defaultProps} baseLabelMode="note" />);
      expect(getByText("noteFilter.title")).toBeTruthy();
    });

    it("renders all note chips", () => {
      const { getByText } = render(<FretboardFooter {...defaultProps} baseLabelMode="note" />);
      ALL_NOTES.forEach((note) => {
        expect(getByText(note)).toBeTruthy();
      });
    });

    it("calls onToggleOverlayNoteHighlight when a note chip is pressed", () => {
      const onToggleOverlayNoteHighlight = jest.fn();
      const { getByText } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="note"
          onToggleOverlayNoteHighlight={onToggleOverlayNoteHighlight}
        />,
      );
      fireEvent.press(getByText("C"));
      expect(onToggleOverlayNoteHighlight).toHaveBeenCalledWith("C");
    });

    it("highlights active note chips", () => {
      const { getByText } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="note"
          highlightedOverlayNotes={new Set(["C", "E"])}
        />,
      );
      const chipC = getByText("C");
      // Active chip should have white text color
      expect(chipC.props.style.color).toBe("#fff");
      // Inactive chip should not have white text
      const chipD = getByText("D");
      expect(chipD.props.style.color).not.toBe("#fff");
    });

    it("renders filter button and calls onSetOverlayNoteHighlights with overlay notes", () => {
      const onSetOverlayNoteHighlights = jest.fn();
      const { getByText } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="note"
          overlayNotes={["C", "E", "G"]}
          onSetOverlayNoteHighlights={onSetOverlayNoteHighlights}
        />,
      );
      fireEvent.press(getByText("noteFilter.filter"));
      expect(onSetOverlayNoteHighlights).toHaveBeenCalledWith(["C", "E", "G"]);
    });

    it("shows highlightAll text when no highlights are active", () => {
      const { getByText } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="note"
          highlightedOverlayNotes={new Set()}
        />,
      );
      expect(getByText("noteFilter.highlightAll")).toBeTruthy();
    });

    it("shows reset text when highlights are active", () => {
      const { getByText } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="note"
          highlightedOverlayNotes={new Set(["C"])}
        />,
      );
      expect(getByText("noteFilter.reset")).toBeTruthy();
    });

    it("calls onSetOverlayNoteHighlights with allNotes when highlight all is pressed", () => {
      const onSetOverlayNoteHighlights = jest.fn();
      const { getByText } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="note"
          highlightedOverlayNotes={new Set()}
          onSetOverlayNoteHighlights={onSetOverlayNoteHighlights}
        />,
      );
      fireEvent.press(getByText("noteFilter.highlightAll"));
      expect(onSetOverlayNoteHighlights).toHaveBeenCalledWith(ALL_NOTES);
    });

    it("calls onSetOverlayNoteHighlights with [] and disables autoFilter when reset is pressed", () => {
      const onSetOverlayNoteHighlights = jest.fn();
      const onAutoFilterChange = jest.fn();
      const { getByText } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="note"
          highlightedOverlayNotes={new Set(["C"])}
          onSetOverlayNoteHighlights={onSetOverlayNoteHighlights}
          onAutoFilterChange={onAutoFilterChange}
        />,
      );
      fireEvent.press(getByText("noteFilter.reset"));
      expect(onAutoFilterChange).toHaveBeenCalledWith(false);
      expect(onSetOverlayNoteHighlights).toHaveBeenCalledWith([]);
    });

    it("renders auto filter button and toggles autoFilter on press", () => {
      const onAutoFilterChange = jest.fn();
      const { getByText } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="note"
          autoFilter={false}
          onAutoFilterChange={onAutoFilterChange}
        />,
      );
      fireEvent.press(getByText("noteFilter.autoFilter"));
      expect(onAutoFilterChange).toHaveBeenCalledWith(true);
    });

    it("disables filter button when autoFilter is true", () => {
      const onAutoFilter = jest.fn();
      const { getByText } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="note"
          autoFilter={true}
          onAutoFilter={onAutoFilter}
        />,
      );
      // Filter button should have reduced opacity when autoFilter is on
      const filterBtn = getByText("noteFilter.filter");
      fireEvent.press(filterBtn);
      expect(onAutoFilter).not.toHaveBeenCalled();
    });

    it("does not render degree chips in note mode", () => {
      const { queryByText } = render(<FretboardFooter {...defaultProps} baseLabelMode="note" />);
      expect(queryByText("degreeFilter.title")).toBeNull();
    });
  });

  describe("degree mode", () => {
    it("renders degree filter title", () => {
      const { getByText } = render(<FretboardFooter {...defaultProps} baseLabelMode="degree" />);
      expect(getByText("degreeFilter.title")).toBeTruthy();
    });

    it("renders all degree chips", () => {
      const { getByText } = render(<FretboardFooter {...defaultProps} baseLabelMode="degree" />);
      DEGREE_CHIPS.forEach((deg) => {
        expect(getByText(deg)).toBeTruthy();
      });
    });

    it("calls onToggleDegree when a degree chip is pressed", () => {
      const onToggleDegree = jest.fn();
      const { getByText } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="degree"
          onToggleDegree={onToggleDegree}
        />,
      );
      fireEvent.press(getByText("P1"));
      expect(onToggleDegree).toHaveBeenCalledWith("P1");
    });

    it("highlights active degree chips", () => {
      const { getByText } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="degree"
          highlightedDegrees={new Set(["P1", "P5"])}
        />,
      );
      expect(getByText("P1").props.style.color).toBe("#fff");
      expect(getByText("M2").props.style.color).not.toBe("#fff");
    });

    it("calls onAutoFilter when filter button pressed in degree mode", () => {
      const onAutoFilter = jest.fn();
      const { getByText } = render(
        <FretboardFooter {...defaultProps} baseLabelMode="degree" onAutoFilter={onAutoFilter} />,
      );
      fireEvent.press(getByText("degreeFilter.filter"));
      expect(onAutoFilter).toHaveBeenCalled();
    });

    it("calls onResetOrHighlightAll when toggle all pressed in degree mode", () => {
      const onResetOrHighlightAll = jest.fn();
      const { getByText } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="degree"
          highlightedDegrees={new Set(["P1"])}
          onResetOrHighlightAll={onResetOrHighlightAll}
        />,
      );
      fireEvent.press(getByText("degreeFilter.reset"));
      expect(onResetOrHighlightAll).toHaveBeenCalled();
    });

    it("shows highlightAll when no degrees highlighted", () => {
      const { getByText } = render(
        <FretboardFooter {...defaultProps} baseLabelMode="degree" highlightedDegrees={new Set()} />,
      );
      expect(getByText("degreeFilter.highlightAll")).toBeTruthy();
    });

    it("does not render note chips in degree mode", () => {
      const { queryByText } = render(<FretboardFooter {...defaultProps} baseLabelMode="degree" />);
      expect(queryByText("noteFilter.title")).toBeNull();
    });

    it("auto filter toggle works in degree mode", () => {
      const onAutoFilterChange = jest.fn();
      const { getByText } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="degree"
          autoFilter={true}
          onAutoFilterChange={onAutoFilterChange}
        />,
      );
      fireEvent.press(getByText("degreeFilter.autoFilter"));
      expect(onAutoFilterChange).toHaveBeenCalledWith(false);
    });
  });

  describe("theme", () => {
    it("applies light theme colors to title", () => {
      const { getByText } = render(
        <FretboardFooter {...defaultProps} theme="light" baseLabelMode="note" />,
      );
      const title = getByText("noteFilter.title");
      expect(title.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ color: "#78716c" })]),
      );
    });

    it("applies dark theme colors to title", () => {
      const { getByText } = render(
        <FretboardFooter {...defaultProps} theme="dark" baseLabelMode="note" />,
      );
      const title = getByText("noteFilter.title");
      expect(title.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ color: "#9ca3af" })]),
      );
    });
  });
});
