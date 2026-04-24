import React from "react";
import { render, screen } from "@testing-library/react-native";
import CirclePane from "..";

let mockLocale: "ja" | "en" = "ja";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === "circle.title") return mockLocale === "ja" ? "五度圏" : "Circle of Fifths";
      if (key === "circle.keySignature") return "調号";
      if (key === "circle.sharps") return `♯×${String(options?.count ?? "")}`;
      if (key === "circle.flats") return `♭×${String(options?.count ?? "")}`;
      if (key === "circle.noAccidentals") return "無し";
      return key;
    },
  }),
}));

jest.mock("../../../components/AppHeader/SceneHeader", () => {
  const { Text, View } = require("react-native");
  return {
    __esModule: true,
    default: ({ title }: { title?: string }) => (
      <View>
        <Text testID="scene-title">{title}</Text>
      </View>
    ),
  };
});

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
    fretRange: [0, 12] as [number, number],
    leftHanded: false,
    onThemeChange: jest.fn(),
    onFretRangeChange: jest.fn(),
    onAccidentalChange: jest.fn(),
    onLeftHandedChange: jest.fn(),
    selectedIndex: 0,
    keyType: "major" as const,
    activeOverlay: null,
    onSelectedIndexChange: jest.fn(),
    onKeyTypeChange: jest.fn(),
    onActiveOverlayChange: jest.fn(),
  };

  beforeEach(() => {
    mockLocale = "ja";
  });

  it("renders successfully", () => {
    const { toJSON } = render(<CirclePane {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
    expect(screen.getByTestId("circle-wheel")).toBeTruthy();
  });

  it("shows scene header title in Japanese", () => {
    render(<CirclePane {...defaultProps} />);
    expect(screen.getByTestId("scene-title").props.children).toBe("五度圏");
  });

  it("shows scene header title in English", () => {
    mockLocale = "en";
    render(<CirclePane {...defaultProps} />);
    expect(screen.getByTestId("scene-title").props.children).toBe("Circle of Fifths");
  });

  it("starts with C major selected", () => {
    render(<CirclePane {...defaultProps} />);
    expect(screen.getByTestId("circle-root-note").props.children).toBe("C");
    expect(screen.getByTestId("circle-key-type").props.children).toBe("major");
  });
});
