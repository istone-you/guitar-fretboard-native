import StatsPanel from "../../components/Stats";
import type { Accidental, QuizRecord, Theme } from "../../types";

interface StatsPaneProps {
  records: QuizRecord[];
  theme: Theme;
  accidental: Accidental;
  onClearRecords: () => void;
}

export default function StatsPane({ records, theme, accidental, onClearRecords }: StatsPaneProps) {
  return (
    <StatsPanel
      records={records}
      theme={theme}
      accidental={accidental}
      onClearRecords={onClearRecords}
    />
  );
}
