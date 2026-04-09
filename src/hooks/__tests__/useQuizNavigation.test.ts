import { renderHook, act } from "@testing-library/react-native";
import { Animated, PanResponder } from "react-native";
import { useQuizNavigation } from "../useQuizNavigation";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light" },
}));

describe("useQuizNavigation", () => {
  const defaultParams = {
    winWidth: 390,
    onQuizKindChange: jest.fn(),
    onShowQuizChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("showQuiz starts as false", () => {
    const { result } = renderHook(() => useQuizNavigation(defaultParams));
    expect(result.current.showQuiz).toBe(false);
  });

  it("quizModeSelected starts as false", () => {
    const { result } = renderHook(() => useQuizNavigation(defaultParams));
    expect(result.current.quizModeSelected).toBe(false);
  });

  it("setShowQuiz updates showQuiz", () => {
    const { result } = renderHook(() => useQuizNavigation(defaultParams));
    act(() => {
      result.current.setShowQuiz(true);
    });
    expect(result.current.showQuiz).toBe(true);
  });

  it("setQuizModeSelected updates quizModeSelected", () => {
    const { result } = renderHook(() => useQuizNavigation(defaultParams));
    act(() => {
      result.current.setQuizModeSelected(true);
    });
    expect(result.current.quizModeSelected).toBe(true);
  });

  it("handleQuizModeSelect calls onQuizKindChange with the value", () => {
    const onQuizKindChange = jest.fn();
    const { result } = renderHook(() => useQuizNavigation({ ...defaultParams, onQuizKindChange }));

    act(() => {
      result.current.handleQuizModeSelect("chord");
    });

    expect(onQuizKindChange).toHaveBeenCalledWith("chord");
  });

  it("handleQuizModeSelect sets quizModeSelected to true", () => {
    const { result } = renderHook(() => useQuizNavigation(defaultParams));

    act(() => {
      result.current.handleQuizModeSelect("note");
    });

    expect(result.current.quizModeSelected).toBe(true);
  });

  it("handleChangeQuiz calls onShowQuizChange(false) after animation", () => {
    const onShowQuizChange = jest.fn();
    const timingSpy = jest.spyOn(Animated, "timing").mockReturnValue({
      start: (cb?: Animated.EndCallback) => cb?.({ finished: true }),
    } as Animated.CompositeAnimation);

    const { result } = renderHook(() => useQuizNavigation({ ...defaultParams, onShowQuizChange }));

    act(() => {
      result.current.handleChangeQuiz();
    });

    expect(onShowQuizChange).toHaveBeenCalledWith(false);
    timingSpy.mockRestore();
  });

  it("handleChangeQuiz resets quizModeSelected to false after animation", () => {
    const timingSpy = jest.spyOn(Animated, "timing").mockReturnValue({
      start: (cb?: Animated.EndCallback) => cb?.({ finished: true }),
    } as Animated.CompositeAnimation);

    const { result } = renderHook(() => useQuizNavigation(defaultParams));

    act(() => {
      result.current.setQuizModeSelected(true);
    });
    act(() => {
      result.current.handleChangeQuiz();
    });

    expect(result.current.quizModeSelected).toBe(false);
    timingSpy.mockRestore();
  });

  it("exposes a swipePanResponder", () => {
    const { result } = renderHook(() => useQuizNavigation(defaultParams));
    expect(result.current.swipePanResponder).toBeDefined();
    expect(result.current.swipePanResponder.panHandlers).toBeDefined();
  });

  it("exposes quizSlideAnim as an Animated.Value", () => {
    const { result } = renderHook(() => useQuizNavigation(defaultParams));
    expect(result.current.quizSlideAnim).toBeInstanceOf(Animated.Value);
  });

  describe("swipePanResponder handlers", () => {
    let capturedConfig: Record<string, any>;

    beforeEach(() => {
      jest.spyOn(PanResponder, "create").mockImplementation((config) => {
        capturedConfig = config as Record<string, any>;
        return { panHandlers: {} } as any;
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("onMoveShouldSetPanResponder returns false when showQuiz is false", () => {
      renderHook(() => useQuizNavigation(defaultParams));
      expect(capturedConfig.onMoveShouldSetPanResponder({}, { dx: 20, dy: 0 })).toBe(false);
    });

    it("onMoveShouldSetPanResponder returns false when quizModeSelected is false", () => {
      const { result } = renderHook(() => useQuizNavigation(defaultParams));
      act(() => {
        result.current.setShowQuiz(true);
      });
      expect(capturedConfig.onMoveShouldSetPanResponder({}, { dx: 20, dy: 0 })).toBe(false);
    });

    it("onMoveShouldSetPanResponder returns true when all conditions are met", () => {
      const { result } = renderHook(() => useQuizNavigation(defaultParams));
      act(() => {
        result.current.setShowQuiz(true);
        result.current.setQuizModeSelected(true);
      });
      expect(capturedConfig.onMoveShouldSetPanResponder({}, { dx: 20, dy: 0 })).toBe(true);
    });

    it("onMoveShouldSetPanResponder returns false when dx <= 10", () => {
      const { result } = renderHook(() => useQuizNavigation(defaultParams));
      act(() => {
        result.current.setShowQuiz(true);
        result.current.setQuizModeSelected(true);
      });
      expect(capturedConfig.onMoveShouldSetPanResponder({}, { dx: 5, dy: 0 })).toBe(false);
    });

    it("onMoveShouldSetPanResponder returns false when vertical swipe dominates", () => {
      const { result } = renderHook(() => useQuizNavigation(defaultParams));
      act(() => {
        result.current.setShowQuiz(true);
        result.current.setQuizModeSelected(true);
      });
      expect(capturedConfig.onMoveShouldSetPanResponder({}, { dx: 20, dy: 50 })).toBe(false);
    });

    it("onPanResponderRelease does not trigger navigation when dx <= 80", () => {
      const onShowQuizChange = jest.fn();
      const timingSpy = jest.spyOn(Animated, "timing").mockReturnValue({
        start: (cb?: Animated.EndCallback) => cb?.({ finished: true }),
      } as Animated.CompositeAnimation);

      renderHook(() => useQuizNavigation({ ...defaultParams, onShowQuizChange }));
      capturedConfig.onPanResponderRelease({}, { dx: 50 });

      expect(onShowQuizChange).not.toHaveBeenCalled();
      timingSpy.mockRestore();
    });

    it("onPanResponderRelease triggers navigation when dx > 80", () => {
      const onShowQuizChange = jest.fn();
      const timingSpy = jest.spyOn(Animated, "timing").mockReturnValue({
        start: (cb?: Animated.EndCallback) => cb?.({ finished: true }),
      } as Animated.CompositeAnimation);

      renderHook(() => useQuizNavigation({ ...defaultParams, onShowQuizChange }));
      capturedConfig.onPanResponderRelease({}, { dx: 100 });

      expect(onShowQuizChange).toHaveBeenCalledWith(false);
      timingSpy.mockRestore();
    });
  });
});
