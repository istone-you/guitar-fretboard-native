import React from "react";
import { render } from "@testing-library/react-native";
import SecondaryDominantCirclePage from "../CirclePage";

jest.mock("../../../CircleOfFifths", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View testID="circle-pane" /> };
});

const baseProps = {
  theme: "light" as const,
  accidental: "sharp" as const,
  rootSemitone: 0,
  initialKeyType: "major" as const,
};

describe("SecondaryDominantCirclePage", () => {
  it("renders without crashing", () => {
    expect(render(<SecondaryDominantCirclePage {...baseProps} />).toJSON()).toBeTruthy();
  });
});
