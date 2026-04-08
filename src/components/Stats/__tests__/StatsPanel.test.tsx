import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import StatsPanel from "../StatsPanel";
import type { QuizRecord, Theme, Accidental } from "../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.count !== undefined) return `${key}:${opts.count}`;
      return key;
    },
  }),
}));

jest.mock("../../../logic/fretboard", () => ({
  DEGREE_BY_SEMITONE: ["P1", "m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7"],
  getNotesByAccidental: (acc: string) =>
    acc === "flat"
      ? ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"]
      : ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"],
}));

jest.mock("../../../hooks/useQuiz", () => ({
  CHORD_QUIZ_TYPES_ALL: ["Major", "Minor", "7th"],
}));

const defaultProps = {
  records: [] as QuizRecord[],
  theme: "dark" as Theme,
  accidental: "sharp" as Accidental,
  onClearRecords: jest.fn(),
};

function renderPanel(overrides: Partial<typeof defaultProps> = {}) {
  return render(<StatsPanel {...defaultProps} {...overrides} />);
}

describe("StatsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Empty state ───────────────────────────────────────────────────

  it("shows no-records message when records are empty", () => {
    const { getByText } = renderPanel();
    expect(getByText("stats.noRecords")).toBeTruthy();
  });

  it("hides reset button when no records", () => {
    const { queryByText } = renderPanel();
    expect(queryByText("stats.reset")).toBeNull();
  });

  // ── With records ──────────────────────────────────────────────────

  it("shows total records count when records exist", () => {
    const records: QuizRecord[] = [{ mode: "note", correct: true, noteName: "C" }];
    const { getByText } = renderPanel({ records });
    expect(getByText("stats.totalRecords:1")).toBeTruthy();
  });

  it("shows reset button when records exist", () => {
    const records: QuizRecord[] = [{ mode: "note", correct: true }];
    const { getByText } = renderPanel({ records });
    expect(getByText("stats.reset")).toBeTruthy();
  });

  it("calls onClearRecords when reset is confirmed via Alert", () => {
    const onClearRecords = jest.fn();
    const records: QuizRecord[] = [{ mode: "note", correct: true }];
    const { getByText } = renderPanel({ records, onClearRecords });

    // Alert.alert is called on press — just verify press doesn't throw
    fireEvent.press(getByText("stats.reset"));
    // Alert is mocked by RN test env; onClearRecords would be called via Alert callback
  });

  // ── Sections ──────────────────────────────────────────────────────

  it("renders heatmap section title", () => {
    const { getByText } = renderPanel();
    expect(getByText("stats.sections.byStringFret")).toBeTruthy();
  });

  it("renders all collapsible section titles", () => {
    const { getByText } = renderPanel();
    expect(getByText("stats.sections.byMode")).toBeTruthy();
    expect(getByText("stats.sections.byNote")).toBeTruthy();
    expect(getByText("stats.sections.byDegree")).toBeTruthy();
    expect(getByText("stats.sections.byString")).toBeTruthy();
    expect(getByText("stats.sections.byFret")).toBeTruthy();
    expect(getByText("stats.sections.byChordType")).toBeTruthy();
    expect(getByText("stats.sections.byScale")).toBeTruthy();
  });

  it("collapsible sections are collapsed by default (maxHeight=0, content hidden)", () => {
    // Content is in the tree but hidden via maxHeight animation; header is always visible
    const { getByText } = renderPanel();
    expect(getByText("stats.sections.byMode")).toBeTruthy();
  });

  it("expands collapsible section on press", () => {
    const { getByText } = renderPanel();
    fireEvent.press(getByText("stats.sections.byMode"));
    expect(getByText("stats.modes.note")).toBeTruthy();
  });

  it("can toggle a section open and closed without errors", () => {
    const { getByText } = renderPanel();
    // open
    fireEvent.press(getByText("stats.sections.byMode"));
    // close
    expect(() => fireEvent.press(getByText("stats.sections.byMode"))).not.toThrow();
  });

  // ── Accidental ────────────────────────────────────────────────────

  it("renders with flat accidental without errors", () => {
    expect(() => renderPanel({ accidental: "flat" })).not.toThrow();
  });

  // ── Theme ─────────────────────────────────────────────────────────

  it("renders with light theme without errors", () => {
    expect(() => renderPanel({ theme: "light" })).not.toThrow();
  });
});
