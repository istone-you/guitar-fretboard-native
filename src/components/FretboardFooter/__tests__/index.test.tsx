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
  onReset: jest.fn(),
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
      const { getByTestId } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="note"
          overlayNotes={["C", "E", "G"]}
          onSetOverlayNoteHighlights={onSetOverlayNoteHighlights}
        />,
      );
      fireEvent.press(getByTestId("filter-btn"));
      expect(onSetOverlayNoteHighlights).toHaveBeenCalledWith(["C", "E", "G"]);
    });

    it("shows reset button when notes are highlighted", () => {
      const { getByTestId } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="note"
          highlightedOverlayNotes={new Set(["C"])}
        />,
      );
      expect(getByTestId("reset-btn")).toBeTruthy();
    });

    it("always shows reset button", () => {
      const { getByTestId } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="note"
          highlightedOverlayNotes={new Set()}
        />,
      );
      expect(getByTestId("reset-btn")).toBeTruthy();
    });

    it("calls onSetOverlayNoteHighlights with [] and disables autoFilter when reset is pressed", () => {
      const onSetOverlayNoteHighlights = jest.fn();
      const onAutoFilterChange = jest.fn();
      const { getByTestId } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="note"
          highlightedOverlayNotes={new Set(["C"])}
          onSetOverlayNoteHighlights={onSetOverlayNoteHighlights}
          onAutoFilterChange={onAutoFilterChange}
        />,
      );
      fireEvent.press(getByTestId("reset-btn"));
      expect(onAutoFilterChange).toHaveBeenCalledWith(false);
      expect(onSetOverlayNoteHighlights).toHaveBeenCalledWith([]);
    });

    it("long press on filter button enables auto filter", () => {
      const onAutoFilterChange = jest.fn();
      const { getByTestId } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="note"
          autoFilter={false}
          onAutoFilterChange={onAutoFilterChange}
        />,
      );
      fireEvent(getByTestId("filter-btn"), "longPress");
      expect(onAutoFilterChange).toHaveBeenCalledWith(true);
    });

    it("tap on filter button disables auto filter when active", () => {
      const onAutoFilterChange = jest.fn();
      const { getByTestId } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="note"
          autoFilter={true}
          onAutoFilterChange={onAutoFilterChange}
        />,
      );
      fireEvent.press(getByTestId("filter-btn"));
      expect(onAutoFilterChange).toHaveBeenCalledWith(false);
    });

    it("does not render degree chips in note mode", () => {
      const { queryByText } = render(<FretboardFooter {...defaultProps} baseLabelMode="note" />);
      expect(queryByText("degreeFilter.title")).toBeNull();
    });
  });

  describe("degree mode", () => {
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
      const { getByTestId } = render(
        <FretboardFooter {...defaultProps} baseLabelMode="degree" onAutoFilter={onAutoFilter} />,
      );
      fireEvent.press(getByTestId("filter-btn"));
      expect(onAutoFilter).toHaveBeenCalled();
    });

    it("calls onReset when reset pressed in degree mode", () => {
      const onReset = jest.fn();
      const { getByTestId } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="degree"
          highlightedDegrees={new Set(["P1"])}
          onReset={onReset}
        />,
      );
      fireEvent.press(getByTestId("reset-btn"));
      expect(onReset).toHaveBeenCalled();
    });

    it("does not render note chips in degree mode", () => {
      const { queryByText } = render(<FretboardFooter {...defaultProps} baseLabelMode="degree" />);
      expect(queryByText("noteFilter.title")).toBeNull();
    });

    it("auto filter toggle works in degree mode", () => {
      const onAutoFilterChange = jest.fn();
      const { getByTestId } = render(
        <FretboardFooter
          {...defaultProps}
          baseLabelMode="degree"
          autoFilter={true}
          onAutoFilterChange={onAutoFilterChange}
        />,
      );
      fireEvent.press(getByTestId("filter-btn"));
      expect(onAutoFilterChange).toHaveBeenCalledWith(false);
    });
  });
});
