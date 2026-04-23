import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import { Alert } from "react-native";
import { Text, View } from "react-native";
import FinderDetailSheet from "..";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../../../i18n", () => ({}));

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Error: "error" },
}));

jest.mock("../../../ui/BottomSheetModal", () => ({
  __esModule: true,
  default: ({
    visible,
    onClose,
    children,
  }: {
    visible: boolean;
    onClose: () => void;
    children: (c: { close: () => void; dragHandlers: object }) => React.ReactNode;
  }) => {
    if (!visible) return null;
    const { View } = require("react-native");
    return <View testID="bottom-sheet">{children({ close: onClose, dragHandlers: {} })}</View>;
  },
  SHEET_HANDLE_CLEARANCE: 28,
  useSheetHeight: () => 500,
}));

jest.mock("../../../ui/SheetProgressiveHeader", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock("../../../ui/GlassIconButton", () => {
  const { TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({ onPress, icon }: { onPress: () => void; icon: string }) => (
      <TouchableOpacity testID={`glass-btn-${icon}`} onPress={onPress} />
    ),
  };
});

jest.mock("../../../ui/Icon", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View /> };
});

jest.mock("../../../ui/PillButton", () => {
  const { TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({
      onPress,
      disabled,
      children,
    }: {
      onPress: () => void;
      disabled?: boolean;
      children: React.ReactNode;
    }) => (
      <TouchableOpacity testID="pill-btn" onPress={onPress} disabled={disabled ?? false}>
        {children}
      </TouchableOpacity>
    ),
  };
});

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  theme: "dark" as const,
  title: "Cmaj7",
  isFull: false,
};

describe("FinderDetailSheet", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders nothing when not visible", () => {
    const { toJSON } = render(<FinderDetailSheet {...defaultProps} visible={false} />);
    expect(toJSON()).toBeNull();
  });

  it("renders when visible", () => {
    render(<FinderDetailSheet {...defaultProps} />);
    expect(screen.getByTestId("bottom-sheet")).toBeTruthy();
  });

  it("renders title", () => {
    render(<FinderDetailSheet {...defaultProps} title="Am7" />);
    expect(screen.getByText("Am7")).toBeTruthy();
  });

  it("renders subtitle when provided", () => {
    render(<FinderDetailSheet {...defaultProps} subtitle="Minor 7th" />);
    expect(screen.getByText("Minor 7th")).toBeTruthy();
  });

  it("renders topContent when provided", () => {
    render(<FinderDetailSheet {...defaultProps} topContent={<View testID="top-content" />} />);
    expect(screen.getByTestId("top-content")).toBeTruthy();
  });

  it("renders mediaContent when provided", () => {
    render(<FinderDetailSheet {...defaultProps} mediaContent={<View testID="media-content" />} />);
    expect(screen.getByTestId("media-content")).toBeTruthy();
  });

  it("renders description when provided", () => {
    render(
      <FinderDetailSheet
        {...defaultProps}
        description={<Text testID="description-content">desc</Text>}
      />,
    );
    expect(screen.getByTestId("description-content")).toBeTruthy();
  });

  it("renders bottomContent when provided", () => {
    render(
      <FinderDetailSheet {...defaultProps} bottomContent={<View testID="bottom-content" />} />,
    );
    expect(screen.getByTestId("bottom-content")).toBeTruthy();
  });

  it("calls onClose when close button pressed", () => {
    const onClose = jest.fn();
    render(<FinderDetailSheet {...defaultProps} onClose={onClose} />);
    fireEvent.press(screen.getByTestId("glass-btn-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render upload button when onAddLayer is undefined", () => {
    render(<FinderDetailSheet {...defaultProps} />);
    expect(screen.queryByTestId("glass-btn-upload")).toBeNull();
  });

  it("renders upload button in header when onAddLayer is provided", () => {
    render(<FinderDetailSheet {...defaultProps} onAddLayer={jest.fn()} />);
    expect(screen.getByTestId("glass-btn-upload")).toBeTruthy();
  });

  it("calls onAddLayer and onClose when upload button pressed and not full", () => {
    const onAddLayer = jest.fn();
    const onClose = jest.fn();
    render(<FinderDetailSheet {...defaultProps} onAddLayer={onAddLayer} onClose={onClose} />);
    fireEvent.press(screen.getByTestId("glass-btn-upload"));
    expect(onAddLayer).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows Alert and triggers haptics when upload button pressed and isFull", async () => {
    const Haptics = require("expo-haptics");
    const alertSpy = jest.spyOn(Alert, "alert");
    const onAddLayer = jest.fn();
    render(<FinderDetailSheet {...defaultProps} isFull onAddLayer={onAddLayer} />);
    fireEvent.press(screen.getByTestId("glass-btn-upload"));
    expect(Haptics.notificationAsync).toHaveBeenCalledWith("error");
    expect(alertSpy).toHaveBeenCalledWith("finder.addToLayerFullTitle", "finder.addToLayerFull");
    expect(onAddLayer).not.toHaveBeenCalled();
  });

  it("does not show isFull text message in content area", () => {
    render(<FinderDetailSheet {...defaultProps} isFull onAddLayer={jest.fn()} />);
    expect(screen.queryByText("finder.addToLayerFull")).toBeNull();
  });

  it("renders extraAction before content when position is 'before'", () => {
    render(
      <FinderDetailSheet
        {...defaultProps}
        onAddLayer={jest.fn()}
        extraAction={{ label: "Set Notes", onPress: jest.fn(), position: "before" }}
      />,
    );
    expect(screen.getByText("Set Notes")).toBeTruthy();
  });

  it("renders extraAction after content when position is 'after'", () => {
    render(
      <FinderDetailSheet
        {...defaultProps}
        onAddLayer={jest.fn()}
        extraAction={{ label: "Remove", onPress: jest.fn(), position: "after", variant: "danger" }}
      />,
    );
    expect(screen.getByText("Remove")).toBeTruthy();
  });

  it("calls extraAction.onPress and onClose when extra button pressed", () => {
    const onPress = jest.fn();
    const onClose = jest.fn();
    render(
      <FinderDetailSheet
        {...defaultProps}
        onClose={onClose}
        extraAction={{ label: "Set Notes", onPress, position: "before" }}
      />,
    );
    fireEvent.press(screen.getByTestId("pill-btn"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders in light theme without crashing", () => {
    const { toJSON } = render(<FinderDetailSheet {...defaultProps} theme="light" />);
    expect(toJSON()).toBeTruthy();
  });
});
