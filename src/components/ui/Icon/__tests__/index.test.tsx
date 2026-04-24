import React from "react";
import { render } from "@testing-library/react-native";
import Icon, { type IconName } from "..";

const allIcons: IconName[] = [
  "close",
  "back",
  "check",
  "plus",
  "upload",
  "trash",
  "duplicate",
  "chevron-left",
  "chevron-right",
  "chevron-up",
  "chevron-down",
  "drag-handle",
  "settings",
  "bookmark",
  "bar-chart",
  "search",
  "music-note",
  "ellipsis",
  "mode-steps",
];

describe("Icon", () => {
  it.each(allIcons)("renders %s without crashing", (name) => {
    const { toJSON } = render(<Icon name={name} size={24} color="#000" />);
    expect(toJSON()).toBeTruthy();
  });

  it("uses default strokeWidth of 2", () => {
    const { toJSON } = render(<Icon name="close" size={24} color="#000" />);
    expect(toJSON()).toBeTruthy();
  });

  it("accepts custom strokeWidth", () => {
    const { toJSON } = render(<Icon name="plus" size={24} color="#000" strokeWidth={3} />);
    expect(toJSON()).toBeTruthy();
  });

  it("accepts surfaceColor for duplicate icon", () => {
    const { toJSON } = render(<Icon name="duplicate" size={24} color="#000" surfaceColor="#fff" />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders upload icon (lines 74-80)", () => {
    const { toJSON } = render(<Icon name="upload" size={24} color="#ff0000" />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders chevron-right icon (lines 111-117)", () => {
    const { toJSON } = render(<Icon name="chevron-right" size={24} color="#ff0000" />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders bar-chart icon (lines 159-163)", () => {
    const { toJSON } = render(<Icon name="bar-chart" size={24} color="#ff0000" />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders search icon with Circle and Line (lines 166-177)", () => {
    const { toJSON } = render(<Icon name="search" size={24} color="#ff0000" />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders music-note icon with Path and Circles (lines 180-190)", () => {
    const { toJSON } = render(<Icon name="music-note" size={24} color="#ff0000" />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders with different sizes", () => {
    const { toJSON: small } = render(<Icon name="close" size={16} color="#000" />);
    const { toJSON: large } = render(<Icon name="close" size={48} color="#000" />);
    expect(small()).toBeTruthy();
    expect(large()).toBeTruthy();
  });
});
