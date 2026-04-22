import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import NoteDegreeModeToggle from "..";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../../../i18n", () => ({}));

jest.mock("../../SegmentedToggle", () => ({
  SegmentedToggle: ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => {
    const { View, TouchableOpacity, Text } = require("react-native");
    return (
      <View>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            testID={`opt-${opt.value}`}
            onPress={() => onChange(opt.value)}
          >
            <Text>{opt.value === value ? `[${opt.label}]` : opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
}));

describe("NoteDegreeModeToggle", () => {
  it("renders note and degree options", () => {
    render(<NoteDegreeModeToggle theme="light" value="note" onChange={jest.fn()} />);
    expect(screen.getByTestId("opt-note")).toBeTruthy();
    expect(screen.getByTestId("opt-degree")).toBeTruthy();
  });

  it("calls onChange with 'degree' when degree option pressed", () => {
    const onChange = jest.fn();
    render(<NoteDegreeModeToggle theme="light" value="note" onChange={onChange} />);
    fireEvent.press(screen.getByTestId("opt-degree"));
    expect(onChange).toHaveBeenCalledWith("degree");
  });

  it("calls onChange with 'note' when note option pressed", () => {
    const onChange = jest.fn();
    render(<NoteDegreeModeToggle theme="dark" value="degree" onChange={onChange} />);
    fireEvent.press(screen.getByTestId("opt-note"));
    expect(onChange).toHaveBeenCalledWith("note");
  });

  it("renders without crashing in dark theme", () => {
    const { toJSON } = render(
      <NoteDegreeModeToggle theme="dark" value="degree" onChange={jest.fn()} />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
