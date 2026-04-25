import React from "react";
import { render, screen } from "@testing-library/react-native";
import CirclePane from "..";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../CircleWheel", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="circle-wheel" />,
  };
});

jest.mock("../CircleHeader", () => {
  const { View, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ rootNote, keyType }: { rootNote: string; keyType: string }) => (
      <View testID="circle-header">
        <Text testID="circle-root-note">{rootNote}</Text>
        <Text testID="circle-key-type">{keyType}</Text>
      </View>
    ),
  };
});

jest.mock("../../../components/ui/FinderDetailSheet", () => ({
  __esModule: true,
  default: () => null,
}));

describe("CirclePane", () => {
  const defaultProps = {
    theme: "light" as const,
    accidental: "flat" as const,
    selectedIndex: 0,
    keyType: "major" as const,
    activeOverlay: null,
    onSelectedIndexChange: jest.fn(),
    onKeyTypeChange: jest.fn(),
    onActiveOverlayChange: jest.fn(),
  };

  it("renders successfully", () => {
    const { toJSON } = render(<CirclePane {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
    expect(screen.getByTestId("circle-wheel")).toBeTruthy();
  });

  it("starts with C major selected", () => {
    render(<CirclePane {...defaultProps} />);
    expect(screen.getByTestId("circle-root-note").props.children).toBe("C");
    expect(screen.getByTestId("circle-key-type").props.children).toBe("major");
  });
});
