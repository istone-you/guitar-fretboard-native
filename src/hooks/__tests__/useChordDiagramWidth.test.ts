import { calcChordDiagramWidth } from "../useChordDiagramWidth";

describe("calcChordDiagramWidth", () => {
  it("iPhone 14 相当 (390px) で正しい幅を返す", () => {
    // (390 - 60 - 16) / 3 = 314 / 3 = 104.67 → 104
    expect(calcChordDiagramWidth(390)).toBe(104);
  });

  it("iPad 相当 (744px) で正しい幅を返す", () => {
    // (744 - 60 - 16) / 3 = 668 / 3 = 222.67 → 222
    expect(calcChordDiagramWidth(744)).toBe(222);
  });

  it("常に整数を返す", () => {
    expect(Number.isInteger(calcChordDiagramWidth(375))).toBe(true);
    expect(Number.isInteger(calcChordDiagramWidth(430))).toBe(true);
  });

  it("3枚並べたときに screenWidth - 60 に収まる", () => {
    const screenWidth = 390;
    const w = calcChordDiagramWidth(screenWidth);
    // 3枚分 + gap 2本 ≤ screenWidth - 60 (カード内利用可能幅)
    expect(w * 3 + 8 * 2).toBeLessThanOrEqual(screenWidth - 60);
  });
});
