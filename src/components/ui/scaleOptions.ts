import type { ScaleType } from "../../types";

export interface ScaleOption {
  value: ScaleType;
  label: string;
}

export interface ScaleOptionGroup {
  title: string;
  options: ScaleOption[];
}

export function buildScaleOptions(t: (key: string) => string): {
  options: ScaleOption[];
  groups: ScaleOptionGroup[];
} {
  const options: ScaleOption[] = [
    { value: "major", label: t("options.scale.major") },
    { value: "natural-minor", label: t("options.scale.naturalMinor") },
    { value: "major-penta", label: t("options.scale.majorPenta") },
    { value: "minor-penta", label: t("options.scale.minorPenta") },
    { value: "blues", label: t("options.scale.blues") },
    { value: "harmonic-minor", label: t("options.scale.harmonicMinor") },
    { value: "melodic-minor", label: t("options.scale.melodicMinor") },
    { value: "ionian", label: t("options.scale.ionian") },
    { value: "dorian", label: t("options.scale.dorian") },
    { value: "phrygian", label: t("options.scale.phrygian") },
    { value: "lydian", label: t("options.scale.lydian") },
    { value: "mixolydian", label: t("options.scale.mixolydian") },
    { value: "aeolian", label: t("options.scale.aeolian") },
    { value: "locrian", label: t("options.scale.locrian") },
  ];

  const groups: ScaleOptionGroup[] = [
    {
      title: t("scaleGroups.basics"),
      options: options.filter((option) =>
        ["major", "natural-minor", "major-penta", "minor-penta", "blues"].includes(option.value),
      ),
    },
    {
      title: t("scaleGroups.minorDerived"),
      options: options.filter((option) =>
        ["harmonic-minor", "melodic-minor"].includes(option.value),
      ),
    },
    {
      title: t("scaleGroups.modes"),
      options: options.filter((option) =>
        ["ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"].includes(
          option.value,
        ),
      ),
    },
  ];

  return { options, groups };
}
