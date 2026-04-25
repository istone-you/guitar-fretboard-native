import React from "react";
import { render } from "@testing-library/react-native";
import FinderCirclePage from "..";

jest.mock("../../../CircleOfFifths", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View testID="circle-pane" /> };
});

const baseProps = {
  theme: "light" as const,
  accidental: "sharp" as const,
};

describe("FinderCirclePage", () => {
  it("renders without crashing", () => {
    expect(render(<FinderCirclePage {...baseProps} />).toJSON()).toBeTruthy();
  });
});
