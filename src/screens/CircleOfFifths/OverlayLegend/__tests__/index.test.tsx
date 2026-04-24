import React from "react";
import { render } from "@testing-library/react-native";
import OverlayLegend from "..";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("OverlayLegend", () => {
  it("renders nothing when activeOverlay is null", () => {
    const { queryByTestId } = render(<OverlayLegend theme="light" activeOverlay={null} />);
    expect(queryByTestId("circle-overlay-legend")).toBeNull();
  });

  it("renders 4 related-key chips when active", () => {
    const { getByTestId, getByText } = render(
      <OverlayLegend theme="light" activeOverlay="relatedKeys" />,
    );
    expect(getByTestId("circle-overlay-legend")).toBeTruthy();
    expect(getByText("circle.relation.tonic")).toBeTruthy();
    expect(getByText("circle.relation.dominant")).toBeTruthy();
    expect(getByText("circle.relation.subdominant")).toBeTruthy();
    expect(getByText("circle.relation.parallel")).toBeTruthy();
  });

  it("renders 3 function chips for diatonic overlay", () => {
    const { getByText } = render(<OverlayLegend theme="light" activeOverlay="diatonic" />);
    expect(getByText("circle.legend.tonicFn")).toBeTruthy();
    expect(getByText("circle.legend.subdominantFn")).toBeTruthy();
    expect(getByText("circle.legend.dominantFn")).toBeTruthy();
  });

  it("renders secondary dominant and tritone sub chips for dominants overlay", () => {
    const { getByText } = render(<OverlayLegend theme="light" activeOverlay="dominants" />);
    expect(getByText("circle.legend.secondaryDominant")).toBeTruthy();
    expect(getByText("circle.legend.tritoneSub")).toBeTruthy();
  });
});
