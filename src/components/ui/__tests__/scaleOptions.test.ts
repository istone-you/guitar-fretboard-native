import { buildScaleOptions } from "../scaleOptions";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

// Simple translation mock that returns the key itself
const t = (key: string) => key;

describe("buildScaleOptions", () => {
  const result = buildScaleOptions(t);

  // --- Structure ---

  it("returns an object with options and groups", () => {
    expect(result).toHaveProperty("options");
    expect(result).toHaveProperty("groups");
    expect(Array.isArray(result.options)).toBe(true);
    expect(Array.isArray(result.groups)).toBe(true);
  });

  // --- Options ---

  it("returns 14 scale options", () => {
    expect(result.options).toHaveLength(14);
  });

  it("each option has value and label properties", () => {
    for (const option of result.options) {
      expect(option).toHaveProperty("value");
      expect(option).toHaveProperty("label");
      expect(typeof option.value).toBe("string");
      expect(typeof option.label).toBe("string");
    }
  });

  it("contains all expected scale types", () => {
    const values = result.options.map((o) => o.value);
    expect(values).toEqual([
      "major",
      "natural-minor",
      "major-penta",
      "minor-penta",
      "blues",
      "harmonic-minor",
      "melodic-minor",
      "ionian",
      "dorian",
      "phrygian",
      "lydian",
      "mixolydian",
      "aeolian",
      "locrian",
    ]);
  });

  it("labels are translation keys passed through the t function", () => {
    const majorOption = result.options.find((o) => o.value === "major");
    expect(majorOption?.label).toBe("options.scale.major");

    const bluesOption = result.options.find((o) => o.value === "blues");
    expect(bluesOption?.label).toBe("options.scale.blues");

    const dorianOption = result.options.find((o) => o.value === "dorian");
    expect(dorianOption?.label).toBe("options.scale.dorian");
  });

  // --- Groups ---

  it("returns 3 groups", () => {
    expect(result.groups).toHaveLength(3);
  });

  it("each group has title and options properties", () => {
    for (const group of result.groups) {
      expect(group).toHaveProperty("title");
      expect(group).toHaveProperty("options");
      expect(typeof group.title).toBe("string");
      expect(Array.isArray(group.options)).toBe(true);
    }
  });

  it("first group is 'basics' with 5 scales", () => {
    const basicsGroup = result.groups[0];
    expect(basicsGroup.title).toBe("scaleGroups.basics");
    expect(basicsGroup.options).toHaveLength(5);
    const values = basicsGroup.options.map((o) => o.value);
    expect(values).toEqual(["major", "natural-minor", "major-penta", "minor-penta", "blues"]);
  });

  it("second group is 'minorDerived' with 2 scales", () => {
    const minorDerivedGroup = result.groups[1];
    expect(minorDerivedGroup.title).toBe("scaleGroups.minorDerived");
    expect(minorDerivedGroup.options).toHaveLength(2);
    const values = minorDerivedGroup.options.map((o) => o.value);
    expect(values).toEqual(["harmonic-minor", "melodic-minor"]);
  });

  it("third group is 'modes' with 7 scales", () => {
    const modesGroup = result.groups[2];
    expect(modesGroup.title).toBe("scaleGroups.modes");
    expect(modesGroup.options).toHaveLength(7);
    const values = modesGroup.options.map((o) => o.value);
    expect(values).toEqual([
      "ionian",
      "dorian",
      "phrygian",
      "lydian",
      "mixolydian",
      "aeolian",
      "locrian",
    ]);
  });

  it("all group options are subsets of the full options list", () => {
    const allValues = result.options.map((o) => o.value);
    for (const group of result.groups) {
      for (const option of group.options) {
        expect(allValues).toContain(option.value);
      }
    }
  });

  it("group options reference the same objects as the main options array", () => {
    // The options in groups are filtered from the same array, so they should be the same references
    for (const group of result.groups) {
      for (const groupOption of group.options) {
        const mainOption = result.options.find((o) => o.value === groupOption.value);
        expect(groupOption).toBe(mainOption);
      }
    }
  });

  it("all options are covered by exactly one group", () => {
    const groupedValues = result.groups.flatMap((g) => g.options.map((o) => o.value));
    const allValues = result.options.map((o) => o.value);
    expect(groupedValues.sort()).toEqual(allValues.sort());
    // No duplicates
    expect(new Set(groupedValues).size).toBe(groupedValues.length);
  });

  // --- Translation function usage ---

  it("calls t function for each option label", () => {
    const mockT = jest.fn((key: string) => key);
    buildScaleOptions(mockT);
    expect(mockT).toHaveBeenCalledTimes(17); // 14 options + 3 group titles
  });

  it("calls t function for each group title", () => {
    const mockT = jest.fn((key: string) => key);
    buildScaleOptions(mockT);
    expect(mockT).toHaveBeenCalledWith("scaleGroups.basics");
    expect(mockT).toHaveBeenCalledWith("scaleGroups.minorDerived");
    expect(mockT).toHaveBeenCalledWith("scaleGroups.modes");
  });

  it("uses translated strings when t returns different values", () => {
    const customT = (key: string) => `translated:${key}`;
    const customResult = buildScaleOptions(customT);
    expect(customResult.options[0].label).toBe("translated:options.scale.major");
    expect(customResult.groups[0].title).toBe("translated:scaleGroups.basics");
  });
});
