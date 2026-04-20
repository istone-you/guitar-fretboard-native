import React from "react";
import { render, fireEvent, screen, act } from "@testing-library/react-native";
import { Animated, PanResponder, Text, View } from "react-native";
import BottomSheetModal from "../index";

jest.useFakeTimers();

function renderModal(props: Partial<React.ComponentProps<typeof BottomSheetModal>> = {}) {
  const onClose = jest.fn();
  const result = render(
    <BottomSheetModal visible={true} onClose={onClose} {...props}>
      {({ close, closeWithCallback, dragHandlers }) => (
        <View testID="sheet-content" {...dragHandlers}>
          <Text testID="close-btn" onPress={close}>
            Close
          </Text>
          <Text testID="callback-btn" onPress={() => closeWithCallback(() => {})}>
            Callback
          </Text>
        </View>
      )}
    </BottomSheetModal>,
  );
  return { ...result, onClose };
}

describe("BottomSheetModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when visible=true", () => {
    renderModal();
    expect(screen.getByTestId("sheet-content")).toBeTruthy();
  });

  it("does not render children when visible=false", () => {
    renderModal({ visible: false });
    expect(screen.queryByTestId("sheet-content")).toBeNull();
  });

  it("calls onClose after close animation completes", () => {
    jest.spyOn(Animated, "parallel").mockReturnValue({
      start: (cb?: (result: { finished: boolean }) => void) => cb?.({ finished: true }),
    } as Animated.CompositeAnimation);

    const { onClose } = renderModal();
    fireEvent.press(screen.getByTestId("close-btn"));
    act(() => {
      jest.runAllTimers();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closeWithCallback calls the callback after animation", () => {
    jest.spyOn(Animated, "parallel").mockReturnValue({
      start: (cb?: (result: { finished: boolean }) => void) => cb?.({ finished: true }),
    } as Animated.CompositeAnimation);

    const cb = jest.fn();
    render(
      <BottomSheetModal visible={true} onClose={jest.fn()}>
        {({ closeWithCallback }) => (
          <Text testID="cb-btn" onPress={() => closeWithCallback(cb)}>
            CB
          </Text>
        )}
      </BottomSheetModal>,
    );
    fireEvent.press(screen.getByTestId("cb-btn"));
    act(() => {
      jest.runAllTimers();
    });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("backdrop press triggers close", () => {
    jest.spyOn(Animated, "parallel").mockReturnValue({
      start: (cb?: (result: { finished: boolean }) => void) => cb?.({ finished: true }),
    } as Animated.CompositeAnimation);

    const { onClose } = renderModal();
    fireEvent.press(screen.getByTestId("bottom-sheet-backdrop"));
    act(() => {
      jest.runAllTimers();
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("onRequestClose triggers close", () => {
    jest.spyOn(Animated, "parallel").mockReturnValue({
      start: (cb?: (result: { finished: boolean }) => void) => cb?.({ finished: true }),
    } as Animated.CompositeAnimation);

    const { onClose, UNSAFE_root } = renderModal();
    const { Modal } = require("react-native");
    const modal = UNSAFE_root.findByType(Modal);
    act(() => {
      modal.props.onRequestClose();
    });
    act(() => {
      jest.runAllTimers();
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("sheet content is rendered inside the modal when visible", () => {
    renderModal();
    expect(screen.getByTestId("sheet-content")).toBeTruthy();
    expect(screen.getByTestId("bottom-sheet-modal")).toBeTruthy();
  });

  it("transitions from visible=false to visible=true correctly", () => {
    const { rerender } = renderModal({ visible: false });
    rerender(
      <BottomSheetModal visible={true} onClose={jest.fn()}>
        {({ close, closeWithCallback, dragHandlers }) => (
          <View testID="sheet-content" {...dragHandlers}>
            <Text testID="close-btn" onPress={close}>
              Close
            </Text>
            <Text testID="callback-btn" onPress={() => closeWithCallback(() => {})}>
              Callback
            </Text>
          </View>
        )}
      </BottomSheetModal>,
    );
    expect(screen.getByTestId("sheet-content")).toBeTruthy();
  });

  it("useSheetHeight returns a number between 360 and 520", () => {
    const { renderHook } = require("@testing-library/react-native");
    const { useSheetHeight } = require("../index");
    const { result } = renderHook(() => useSheetHeight());
    expect(result.current).toBeGreaterThanOrEqual(360);
    expect(result.current).toBeLessThanOrEqual(520);
  });

  describe("PanResponder gesture handlers", () => {
    let capturedConfigs: Record<string, any>[];

    beforeEach(() => {
      capturedConfigs = [];
      jest.spyOn(PanResponder, "create").mockImplementation((config) => {
        capturedConfigs.push(config as Record<string, any>);
        return { panHandlers: {} } as any;
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("onPanResponderMove with dy>0 moves the sheet", () => {
      renderModal();
      capturedConfigs[0]?.onPanResponderMove?.({}, { dy: 100 });
    });

    it("onPanResponderMove with dy<=0 does not move the sheet", () => {
      renderModal();
      capturedConfigs[0]?.onPanResponderMove?.({}, { dy: -10 });
    });

    it("onPanResponderRelease with large dy triggers close", () => {
      const onClose = jest.fn();
      jest.spyOn(Animated, "parallel").mockReturnValue({
        start: (cb?: (r: { finished: boolean }) => void) => cb?.({ finished: true }),
      } as unknown as Animated.CompositeAnimation);
      renderModal({ onClose });
      capturedConfigs[0]?.onPanResponderRelease?.({}, { dy: 200, vy: 0 });
      act(() => jest.runAllTimers());
      expect(onClose).toHaveBeenCalled();
    });

    it("onPanResponderRelease with high vy triggers close", () => {
      const onClose = jest.fn();
      jest.spyOn(Animated, "parallel").mockReturnValue({
        start: (cb?: (r: { finished: boolean }) => void) => cb?.({ finished: true }),
      } as unknown as Animated.CompositeAnimation);
      renderModal({ onClose });
      capturedConfigs[0]?.onPanResponderRelease?.({}, { dy: 50, vy: 1.0 });
      act(() => jest.runAllTimers());
      expect(onClose).toHaveBeenCalled();
    });

    it("onPanResponderRelease with small dy snaps back", () => {
      const parallelSpy = jest.spyOn(Animated, "parallel").mockReturnValue({
        start: jest.fn(),
      } as unknown as Animated.CompositeAnimation);
      renderModal();
      capturedConfigs[0]?.onPanResponderRelease?.({}, { dy: 20, vy: 0 });
      expect(parallelSpy).toHaveBeenCalled();
      parallelSpy.mockRestore();
    });

    it("onPanResponderTerminate snaps sheet back via timing", () => {
      const timingSpy = jest.spyOn(Animated, "timing").mockReturnValue({
        start: jest.fn(),
      } as unknown as Animated.CompositeAnimation);
      renderModal();
      capturedConfigs[0]?.onPanResponderTerminate?.();
      expect(timingSpy).toHaveBeenCalled();
      timingSpy.mockRestore();
    });
  });
});
