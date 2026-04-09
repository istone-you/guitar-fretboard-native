import { renderHook, act } from "@testing-library/react-native";
import { Dimensions } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { useOrientation } from "../useOrientation";

jest.mock("expo-screen-orientation", () => ({
  lockAsync: jest.fn().mockResolvedValue(undefined),
  OrientationLock: {
    PORTRAIT_UP: "PORTRAIT_UP",
    LANDSCAPE_RIGHT: "LANDSCAPE_RIGHT",
  },
}));

const mockLockAsync = ScreenOrientation.lockAsync as jest.MockedFunction<
  typeof ScreenOrientation.lockAsync
>;

// jest-expo default dimensions are portrait (750 x 1334)
// Spy on Dimensions.get to control width/height per test
function mockDimensions(width: number, height: number) {
  jest.spyOn(Dimensions, "get").mockReturnValue({
    width,
    height,
    scale: 1,
    fontScale: 1,
  });
}

describe("useOrientation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("isLandscape is false with default portrait dimensions", () => {
    // Default jest-expo dimensions: 750 x 1334 (portrait)
    const { result } = renderHook(() => useOrientation());
    expect(result.current.isLandscape).toBe(false);
  });

  it("animDisabled starts as false", () => {
    const { result } = renderHook(() => useOrientation());
    expect(result.current.animDisabled).toBe(false);
  });

  it("exposes winWidth and winHeight", () => {
    const { result } = renderHook(() => useOrientation());
    expect(typeof result.current.winWidth).toBe("number");
    expect(typeof result.current.winHeight).toBe("number");
  });

  it("toggleLayout locks to LANDSCAPE_RIGHT when portrait", async () => {
    // Default is portrait
    const { result } = renderHook(() => useOrientation());

    await act(async () => {
      await result.current.toggleLayout();
    });

    expect(mockLockAsync).toHaveBeenCalledWith(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
  });

  it("animDisabled becomes true during toggleLayout then resets after 500ms", async () => {
    const { result } = renderHook(() => useOrientation());

    await act(async () => {
      await result.current.toggleLayout();
    });

    expect(result.current.animDisabled).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.animDisabled).toBe(false);
  });

  it("toggleLayout locks to PORTRAIT_UP when landscape", async () => {
    mockDimensions(844, 390);
    const { result } = renderHook(() => useOrientation());
    expect(result.current.isLandscape).toBe(true);

    await act(async () => {
      await result.current.toggleLayout();
    });

    expect(mockLockAsync).toHaveBeenCalledWith(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  });
});
