import React from "react";
import { render, fireEvent, screen, act } from "@testing-library/react-native";
import { Animated, Text, View } from "react-native";
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
});
