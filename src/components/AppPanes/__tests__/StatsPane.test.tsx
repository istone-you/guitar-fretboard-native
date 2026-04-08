import React from "react";
import { render } from "@testing-library/react-native";
import StatsPane from "../StatsPane";
import type { Accidental, QuizRecord, Theme } from "../../../types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.count !== undefined) return `${key}:${opts.count}`;
      return key;
    },
  }),
}));

jest.mock("../../Stats/StatsPanel", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => <View testID="stats-panel" {...props} />,
  };
});

const defaultProps = {
  records: [] as QuizRecord[],
  theme: "dark" as Theme,
  accidental: "sharp" as Accidental,
  onClearRecords: jest.fn(),
};

describe("StatsPane", () => {
  it("renders StatsPanel", () => {
    const { getByTestId } = render(<StatsPane {...defaultProps} />);
    expect(getByTestId("stats-panel")).toBeTruthy();
  });

  it("passes records prop to StatsPanel", () => {
    const records: QuizRecord[] = [{ mode: "note", correct: true, noteName: "C" }];
    const { getByTestId } = render(<StatsPane {...defaultProps} records={records} />);
    const panel = getByTestId("stats-panel");
    expect(panel.props.records).toEqual(records);
  });

  it("passes theme prop to StatsPanel", () => {
    const { getByTestId } = render(<StatsPane {...defaultProps} theme="light" />);
    expect(getByTestId("stats-panel").props.theme).toBe("light");
  });

  it("passes accidental prop to StatsPanel", () => {
    const { getByTestId } = render(<StatsPane {...defaultProps} accidental="flat" />);
    expect(getByTestId("stats-panel").props.accidental).toBe("flat");
  });

  it("passes onClearRecords prop to StatsPanel", () => {
    const onClearRecords = jest.fn();
    const { getByTestId } = render(<StatsPane {...defaultProps} onClearRecords={onClearRecords} />);
    expect(getByTestId("stats-panel").props.onClearRecords).toBe(onClearRecords);
  });
});
