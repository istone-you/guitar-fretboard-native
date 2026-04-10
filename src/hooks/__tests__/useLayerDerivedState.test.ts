import { renderHook } from "@testing-library/react-native";
import { useLayerDerivedState } from "../useLayerDerivedState";
import { createDefaultLayer } from "../../types";
import type { Accidental, BaseLabelMode, LayerConfig } from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface SetupParams {
  layers?: LayerConfig[];
  previewLayer?: LayerConfig | null;
  accidental?: Accidental;
  rootNote?: string;
  baseLabelMode?: BaseLabelMode;
}

function setup(overrides: SetupParams = {}) {
  const defaultParams = {
    layers: [] as LayerConfig[],
    previewLayer: null as LayerConfig | null,
    accidental: "sharp" as Accidental,
    rootNote: "C",
    baseLabelMode: "note" as BaseLabelMode,
  };
  return renderHook(() => useLayerDerivedState({ ...defaultParams, ...overrides }));
}

// ---------------------------------------------------------------------------
// effectiveLayers
// ---------------------------------------------------------------------------

describe("useLayerDerivedState – effectiveLayers", () => {
  it("returns layers when no previewLayer", () => {
    const layer = createDefaultLayer("scale", "l1", "#ff0000");
    const { result } = setup({ layers: [layer], previewLayer: null });
    expect(result.current.effectiveLayers).toEqual([layer]);
  });

  it("replaces layer with same id as previewLayer", () => {
    const layer = createDefaultLayer("scale", "l1", "#ff0000");
    const preview = { ...createDefaultLayer("chord", "l1", "#00ff00") };
    const { result } = setup({ layers: [layer], previewLayer: preview });
    expect(result.current.effectiveLayers).toHaveLength(1);
    expect(result.current.effectiveLayers[0].type).toBe("chord");
    expect(result.current.effectiveLayers[0].color).toBe("#00ff00");
  });

  it("appends previewLayer if it has a new id", () => {
    const layer = createDefaultLayer("scale", "l1", "#ff0000");
    const preview = createDefaultLayer("chord", "l2", "#00ff00");
    const { result } = setup({ layers: [layer], previewLayer: preview });
    expect(result.current.effectiveLayers).toHaveLength(2);
    expect(result.current.effectiveLayers[1].id).toBe("l2");
  });
});

// ---------------------------------------------------------------------------
// overlaySemitones
// ---------------------------------------------------------------------------

describe("useLayerDerivedState – overlaySemitones", () => {
  it("returns major scale semitones for a scale layer", () => {
    const layer = createDefaultLayer("scale", "l1", "#ff0000");
    layer.scaleType = "major";
    const { result } = setup({ layers: [layer], rootNote: "C" });
    // Major scale: 0, 2, 4, 5, 7, 9, 11
    expect(result.current.overlaySemitones).toEqual(new Set([0, 2, 4, 5, 7, 9, 11]));
  });

  it("returns 5 chord semitones for form mode with chordType 5", () => {
    const layer = createDefaultLayer("chord", "l1", "#ff0000");
    layer.chordDisplayMode = "form";
    layer.chordType = "5";
    const { result } = setup({ layers: [layer], rootNote: "C" });
    expect(result.current.overlaySemitones).toEqual(new Set([0, 7]));
  });

  it("returns diatonic chord semitones", () => {
    const layer = createDefaultLayer("chord", "l1", "#ff0000");
    layer.chordDisplayMode = "diatonic";
    layer.diatonicKeyType = "major";
    layer.diatonicChordSize = "triad";
    layer.diatonicDegree = "I";
    const { result } = setup({ layers: [layer], rootNote: "C" });
    // Diatonic I in C major triad = C Major = {0, 4, 7}
    expect(result.current.overlaySemitones).toEqual(new Set([0, 4, 7]));
  });

  it("returns Major semitones for caged layer type", () => {
    const layer = createDefaultLayer("caged", "l1", "#ff0000");
    const { result } = setup({ layers: [layer], rootNote: "C" });
    // CAGED always uses Major semitones: {0, 4, 7}
    expect(result.current.overlaySemitones).toEqual(new Set([0, 4, 7]));
  });

  it("returns correct semitones for on-chord mode", () => {
    const layer = createDefaultLayer("chord", "l1", "#ff0000");
    layer.chordDisplayMode = "on-chord";
    layer.onChordName = "C/E";
    const { result } = setup({ layers: [layer], rootNote: "C" });
    // parseOnChord("C/E") -> chordType "Major" -> {0, 4, 7}
    expect(result.current.overlaySemitones).toEqual(new Set([0, 4, 7]));
  });

  it("returns chord form semitones by default", () => {
    const layer = createDefaultLayer("chord", "l1", "#ff0000");
    layer.chordDisplayMode = "form";
    layer.chordType = "Minor";
    const { result } = setup({ layers: [layer], rootNote: "C" });
    // Minor: {0, 3, 7}
    expect(result.current.overlaySemitones).toEqual(new Set([0, 3, 7]));
  });

  it("excludes disabled layers from overlay", () => {
    const layer = createDefaultLayer("scale", "l1", "#ff0000");
    layer.scaleType = "major";
    layer.enabled = false;
    const { result } = setup({ layers: [layer], rootNote: "C" });
    expect(result.current.overlaySemitones).toEqual(new Set());
  });
});

// ---------------------------------------------------------------------------
// overlayNotes
// ---------------------------------------------------------------------------

describe("useLayerDerivedState – overlayNotes", () => {
  it("maps semitones to note names with sharp accidental", () => {
    const layer = createDefaultLayer("chord", "l1", "#ff0000");
    layer.chordDisplayMode = "form";
    layer.chordType = "5";
    // 5 = {0, 7} → rootNote C → C (index 0), G (index 7)
    const { result } = setup({ layers: [layer], rootNote: "C", accidental: "sharp" });
    expect(result.current.overlayNotes).toEqual(["C", "G"]);
  });

  it("maps semitones to note names with flat accidental and non-C root", () => {
    const layer = createDefaultLayer("chord", "l1", "#ff0000");
    layer.chordDisplayMode = "form";
    layer.chordType = "5";
    // 5 = {0, 7} → rootNote E♭ → E♭ (root+0), B♭ (root+7)
    const { result } = setup({ layers: [layer], rootNote: "E♭", accidental: "flat" });
    expect(result.current.overlayNotes).toEqual(["E♭", "B♭"]);
  });
});

// ---------------------------------------------------------------------------
// layerNoteLabelsMap
// ---------------------------------------------------------------------------

describe("useLayerDerivedState – layerNoteLabelsMap", () => {
  it("returns note labels for a scale layer in note mode", () => {
    const layer = createDefaultLayer("scale", "l1", "#ff0000");
    layer.scaleType = "major";
    const { result } = setup({
      layers: [layer],
      rootNote: "C",
      accidental: "sharp",
      baseLabelMode: "note",
    });
    const labels = result.current.layerNoteLabelsMap.get("l1");
    // C major notes: C, D, E, F, G, A, B
    expect(labels).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
  });

  it("returns note labels for custom note mode", () => {
    const layer = createDefaultLayer("custom", "l1", "#ff0000");
    layer.customMode = "note";
    layer.selectedNotes = new Set(["C", "E", "G"]);
    const { result } = setup({
      layers: [layer],
      rootNote: "C",
      accidental: "sharp",
      baseLabelMode: "note",
    });
    const labels = result.current.layerNoteLabelsMap.get("l1");
    // C=0, E=4, G=7 → sorted by semitone → notes at rootIndex+semitone
    expect(labels).toEqual(["C", "E", "G"]);
  });

  it("returns degree labels for custom degree mode with baseLabelMode=degree", () => {
    const layer = createDefaultLayer("custom", "l1", "#ff0000");
    layer.customMode = "degree";
    layer.selectedDegrees = new Set(["P1", "M3", "P5"]);
    const { result } = setup({
      layers: [layer],
      rootNote: "C",
      accidental: "sharp",
      baseLabelMode: "degree",
    });
    const labels = result.current.layerNoteLabelsMap.get("l1");
    // Custom degree with baseLabelMode=degree uses normalized selectedDegrees sorted by DEGREE_LABEL_ORDER
    expect(labels).toEqual(["P1", "M3", "P5"]);
  });

  it("returns degree labels for scale layer with baseLabelMode=degree", () => {
    const layer = createDefaultLayer("scale", "l1", "#ff0000");
    layer.scaleType = "major";
    const { result } = setup({
      layers: [layer],
      rootNote: "C",
      accidental: "sharp",
      baseLabelMode: "degree",
    });
    const labels = result.current.layerNoteLabelsMap.get("l1");
    // Major scale semitones: 0,2,4,5,7,9,11 → degree names
    expect(labels).toEqual(["P1", "M2", "M3", "P4", "P5", "M6", "M7"]);
  });
});
