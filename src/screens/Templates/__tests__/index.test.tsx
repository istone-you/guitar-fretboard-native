import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import TemplatesPane from "..";
import type { CustomProgressionTemplate } from "../../../hooks/useProgressionTemplates";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../../i18n", () => ({}));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" },
  NotificationFeedbackType: { Warning: "Warning" },
}));

jest.mock("../../../components/AppHeader/SceneHeader", () => () => null);

jest.mock("../TemplateFormSheet", () => {
  const { View, TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({
      visible,
      onClose,
      onSave,
    }: {
      visible: boolean;
      onClose: () => void;
      onSave: (name: string, chords: unknown[]) => void;
    }) =>
      visible ? (
        <View testID="template-form-sheet">
          <TouchableOpacity testID="form-close" onPress={onClose} />
          <TouchableOpacity testID="form-save" onPress={() => onSave("New Template", [])} />
        </View>
      ) : null,
    chordDisplayLabel: (c: { degree: string; chordType: string }) => c.degree,
  };
});

jest.mock("../Detail", () => {
  const { View, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ template }: { template: { name: string } }) => (
      <View testID="template-detail">
        <Text>{template.name}</Text>
      </View>
    ),
  };
});

const makeTemplate = (
  overrides: Partial<CustomProgressionTemplate> = {},
): CustomProgressionTemplate => ({
  id: "t1",
  name: "Test Template",
  chords: [{ degree: "I", chordType: "Major" }],
  createdAt: 0,
  ...overrides,
});

const defaultProps = {
  theme: "light" as const,
  accidental: "flat" as const,
  layers: [],
  customTemplates: [],
  onSaveTemplate: jest.fn(),
  onUpdateTemplate: jest.fn(),
  onDeleteTemplate: jest.fn(),
  onReorderTemplates: jest.fn(),
  onAddLayerAndNavigate: jest.fn(),
  fretRange: [0, 12] as [number, number],
  onThemeChange: jest.fn(),
  onFretRangeChange: jest.fn(),
  onAccidentalChange: jest.fn(),
  onLeftHandedChange: jest.fn(),
};

describe("TemplatesPane", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    const { toJSON } = render(<TemplatesPane {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it("shows empty state when no templates", () => {
    render(<TemplatesPane {...defaultProps} customTemplates={[]} />);
    expect(screen.getByText("templates.noTemplates")).toBeTruthy();
  });

  it("renders a template row when templates exist", () => {
    render(
      <TemplatesPane {...defaultProps} customTemplates={[makeTemplate({ name: "My Prog" })]} />,
    );
    expect(screen.getByText("My Prog")).toBeTruthy();
  });

  it("opens template detail when a template row is pressed", () => {
    const tpl = makeTemplate({ name: "My Prog" });
    render(<TemplatesPane {...defaultProps} customTemplates={[tpl]} />);
    fireEvent.press(screen.getByText("My Prog"));
    expect(screen.getByTestId("template-detail")).toBeTruthy();
  });

  it("opens the template form when + button is pressed", () => {
    render(<TemplatesPane {...defaultProps} />);
    const { TouchableOpacity } = require("react-native");
    const { UNSAFE_getAllByType } = render(<TemplatesPane {...defaultProps} />);
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[0]);
    expect(screen.getByTestId("template-form-sheet")).toBeTruthy();
  });

  it("calls onSaveTemplate when form is saved for new template", () => {
    const onSaveTemplate = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <TemplatesPane {...defaultProps} onSaveTemplate={onSaveTemplate} />,
    );
    const { TouchableOpacity } = require("react-native");
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0]);
    fireEvent.press(screen.getByTestId("form-save"));
    expect(onSaveTemplate).toHaveBeenCalled();
  });

  it("calls onUpdateTemplate when form is saved for existing template", () => {
    const onUpdateTemplate = jest.fn();
    const tpl = makeTemplate();
    const ref = React.createRef<any>();
    render(
      <TemplatesPane
        {...defaultProps}
        ref={ref}
        customTemplates={[tpl]}
        onUpdateTemplate={onUpdateTemplate}
      />,
    );
    React.act(() => {
      ref.current?.openTemplateForm(tpl);
    });
    fireEvent.press(screen.getByTestId("form-save"));
    expect(onUpdateTemplate).toHaveBeenCalledWith(tpl.id, "New Template", []);
  });

  it("closes the form when form-close is pressed", () => {
    const { UNSAFE_getAllByType } = render(<TemplatesPane {...defaultProps} />);
    const { TouchableOpacity } = require("react-native");
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0]);
    expect(screen.getByTestId("template-form-sheet")).toBeTruthy();
    fireEvent.press(screen.getByTestId("form-close"));
    expect(screen.queryByTestId("template-form-sheet")).toBeNull();
  });

  it("renders section title", () => {
    render(<TemplatesPane {...defaultProps} />);
    expect(screen.getByText("templates.progressionTemplates".toUpperCase())).toBeTruthy();
  });

  it("renders in dark theme without crashing", () => {
    const { toJSON } = render(<TemplatesPane {...defaultProps} theme="dark" />);
    expect(toJSON()).toBeTruthy();
  });

  it("exposes openTemplateForm via ref", () => {
    const ref = React.createRef<any>();
    render(<TemplatesPane {...defaultProps} ref={ref} />);
    expect(typeof ref.current?.openTemplateForm).toBe("function");
  });
});
