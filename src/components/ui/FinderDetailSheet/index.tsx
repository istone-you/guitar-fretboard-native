import { useState } from "react";
import type { ReactNode } from "react";
import { Alert, View, Text, ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import type { Theme } from "../../../types";
import { getColors } from "../../../themes/design";
import "../../../i18n";
import BottomSheetModal, { SHEET_HANDLE_CLEARANCE, useSheetHeight } from "../BottomSheetModal";
import SheetProgressiveHeader from "../SheetProgressiveHeader";
import GlassIconButton from "../GlassIconButton";
import Icon, { type IconName } from "../Icon";
import PillButton from "../PillButton";

export interface ExtraAction {
  label: string;
  onPress: () => void;
  position?: "before" | "after";
  variant?: "default" | "danger";
  disabled?: boolean;
  iconName?: IconName;
}

export interface FinderDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  theme: Theme;
  title: string;
  subtitle?: string;
  topContent?: ReactNode;
  mediaContent?: ReactNode;
  description?: ReactNode;
  bottomContent?: ReactNode;
  isFull: boolean;
  onAddLayer?: () => void;
  extraAction?: ExtraAction;
}

export default function FinderDetailSheet({
  visible,
  onClose,
  theme,
  title,
  subtitle,
  topContent,
  mediaContent,
  description,
  bottomContent,
  isFull,
  onAddLayer,
  extraAction,
}: FinderDetailSheetProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const colors = getColors(isDark);
  const sheetHeight = useSheetHeight();
  const [headerHeight, setHeaderHeight] = useState(96);
  const sheetBg = colors.deepBg;

  const extraBefore =
    extraAction && (extraAction.position ?? "after") === "before" ? extraAction : undefined;
  const extraAfter =
    extraAction && (extraAction.position ?? "after") === "after" ? extraAction : undefined;

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      {({ close, dragHandlers }) => {
        const renderExtraBtn = (action: ExtraAction) => {
          const isDanger = action.variant === "danger";
          const textColor = isDanger ? colors.textDanger : colors.textStrong;
          return (
            <PillButton
              isDark={isDark}
              onPress={() => {
                action.onPress();
                close();
              }}
              disabled={action.disabled}
              variant={isDanger ? "danger" : "default"}
            >
              {action.iconName && <Icon name={action.iconName} size={15} color={textColor} />}
              <Text style={[styles.btnText, { color: textColor }]}>{action.label}</Text>
            </PillButton>
          );
        };

        return (
          <View
            style={[
              styles.sheet,
              { height: sheetHeight, backgroundColor: sheetBg, borderColor: colors.sheetBorder },
            ]}
          >
            <View style={{ flex: 1, overflow: "hidden" }}>
              <ScrollView
                contentContainerStyle={[styles.sheetContent, { paddingTop: headerHeight }]}
                showsVerticalScrollIndicator={false}
              >
                {topContent && <View style={styles.paddedSlot}>{topContent}</View>}
                {mediaContent}
                {description && <View style={styles.descriptionArea}>{description}</View>}
                {bottomContent && <View style={styles.paddedSlot}>{bottomContent}</View>}

                {(extraBefore || extraAfter) && (
                  <View style={styles.addButtonArea}>
                    {extraBefore && renderExtraBtn(extraBefore)}
                    {extraAfter && renderExtraBtn(extraAfter)}
                  </View>
                )}
              </ScrollView>

              <SheetProgressiveHeader
                isDark={isDark}
                bgColor={sheetBg}
                dragHandlers={dragHandlers}
                contentPaddingHorizontal={14}
                onLayout={setHeaderHeight}
                style={styles.absoluteHeader}
              >
                <View style={styles.headerRow}>
                  <GlassIconButton
                    isDark={isDark}
                    onPress={close}
                    icon="close"
                    style={styles.headerSide}
                  />
                  <View style={styles.headerCenter}>
                    {subtitle && (
                      <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>
                        {subtitle}
                      </Text>
                    )}
                    <Text style={[styles.headerTitle, { color: colors.textStrong }]}>{title}</Text>
                  </View>
                  {onAddLayer ? (
                    <GlassIconButton
                      isDark={isDark}
                      icon="upload"
                      style={styles.headerSide}
                      onPress={() => {
                        if (isFull) {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                          Alert.alert(t("finder.addToLayerFullTitle"), t("finder.addToLayerFull"));
                        } else {
                          onAddLayer();
                          close();
                        }
                      }}
                    />
                  ) : (
                    <View style={styles.headerSide} />
                  )}
                </View>
              </SheetProgressiveHeader>
            </View>
          </View>
        );
      }}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  sheetContent: {
    paddingBottom: 32,
  },
  paddedSlot: {
    paddingHorizontal: 16,
  },
  descriptionArea: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  addButtonArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
    alignItems: "center",
  },
  btnText: {},
  absoluteHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingTop: SHEET_HANDLE_CLEARANCE,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerSide: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
});
