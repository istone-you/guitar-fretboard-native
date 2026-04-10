import React from "react";
import { render, fireEvent, screen, act } from "@testing-library/react-native";
import { Animated, Text, View } from "react-native";
import AnimatedModal from "../index";

jest.useFakeTimers();

function renderModal(props: Partial<React.ComponentProps<typeof AnimatedModal>> = {}) {
  const onClose = jest.fn();
  const result = render(
    <AnimatedModal visible={true} onClose={onClose} {...props}>
      {({ close, closeWithCallback, bounce }) => (
        <View testID="modal-content">
          <Text testID="close-btn" onPress={close}>
            Close
          </Text>
          <Text testID="bounce-btn" onPress={bounce}>
            Bounce
          </Text>
          <Text testID="callback-btn" onPress={() => closeWithCallback(() => {})}>
            Callback
          </Text>
        </View>
      )}
    </AnimatedModal>,
  );
  return { ...result, onClose };
}

describe("AnimatedModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when visible=true", () => {
    renderModal();
    expect(screen.getByTestId("modal-content")).toBeTruthy();
  });

  it("does not render children when visible=false", () => {
    renderModal({ visible: false });
    expect(screen.queryByTestId("modal-content")).toBeNull();
  });

  it("calls onClose after close animation completes", () => {
    jest.spyOn(Animated, "timing").mockReturnValue({
      start: (cb?: (result: { finished: boolean }) => void) => cb?.({ finished: true }),
    } as Animated.CompositeAnimation);

    const { onClose } = renderModal();
    fireEvent.press(screen.getByTestId("close-btn"));
    act(() => {
      jest.runAllTimers();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onShow callback when provided", () => {
    const onShow = jest.fn();
    const { UNSAFE_root } = renderModal({ onShow });
    const { Modal } = require("react-native");
    const modal = UNSAFE_root.findByType(Modal);
    act(() => {
      modal.props.onShow();
    });
    expect(onShow).toHaveBeenCalledTimes(1);
  });

  it("bounce does not throw", () => {
    renderModal();
    expect(() => fireEvent.press(screen.getByTestId("bounce-btn"))).not.toThrow();
  });

  it("closeWithCallback calls the callback after animation", () => {
    jest.spyOn(Animated, "timing").mockReturnValue({
      start: (cb?: (result: { finished: boolean }) => void) => cb?.({ finished: true }),
    } as Animated.CompositeAnimation);

    const cb = jest.fn();
    const { UNSAFE_root } = render(
      <AnimatedModal visible={true} onClose={jest.fn()}>
        {({ closeWithCallback }) => (
          <Text testID="cb-btn" onPress={() => closeWithCallback(cb)}>
            CB
          </Text>
        )}
      </AnimatedModal>,
    );
    fireEvent.press(screen.getByTestId("cb-btn"));
    act(() => {
      jest.runAllTimers();
    });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("overlay press triggers close", () => {
    jest.spyOn(Animated, "timing").mockReturnValue({
      start: (cb?: (result: { finished: boolean }) => void) => cb?.({ finished: true }),
    } as Animated.CompositeAnimation);

    const { onClose } = renderModal();
    fireEvent.press(screen.getByTestId("animated-modal-overlay"));
    act(() => {
      jest.runAllTimers();
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("onRequestClose triggers close", () => {
    jest.spyOn(Animated, "timing").mockReturnValue({
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
});
