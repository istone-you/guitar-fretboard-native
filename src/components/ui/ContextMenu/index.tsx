import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheetModal, { SHEET_HANDLE_CLEARANCE, useSheetHeight } from "../BottomSheetModal";
import { getColors, SEMANTIC_COLORS } from "../../../themes/design";

export interface ContextMenuItem {
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  visible: boolean;
  isDark: boolean;
  /** Optional header text shown above items (e.g. item name) */
  title?: string;
  items: ContextMenuItem[];
  /** Optional content rendered below items (e.g. description section) */
  footer?: React.ReactNode;
  onClose: () => void;
}

export function ContextMenu({ visible, isDark, title, items, footer, onClose }: ContextMenuProps) {
  const insets = useSafeAreaInsets();
  const sheetHeight = useSheetHeight();
  const colors = getColors(isDark);

  const sheetBg = colors.cardBg;
  const borderColor = colors.border;
  const titleColor = colors.textSubtle;
  const labelColor = colors.text;
  const dividerColor = colors.border;

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      {({ close, closeWithCallback, dragHandlers }) => (
        <View
          style={[styles.sheet, { height: sheetHeight, backgroundColor: sheetBg, borderColor }]}
          {...dragHandlers}
        >
          {/* Optional title */}
          {title && (
            <View style={styles.titleSection}>
              <Text style={[styles.titleText, { color: titleColor }]} numberOfLines={2}>
                {title}
              </Text>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 8 }}
          >
            {/* Items */}
            {items.map((item, index) => (
              <View key={index}>
                {(index > 0 || title) && (
                  <View style={[styles.divider, { backgroundColor: dividerColor }]} />
                )}
                <TouchableOpacity
                  onPress={
                    item.disabled
                      ? undefined
                      : () =>
                          closeWithCallback(() => {
                            onClose();
                            item.onPress();
                          })
                  }
                  disabled={item.disabled}
                  style={[styles.item, item.disabled && styles.itemDisabled]}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemContent}>
                    <Text
                      style={[
                        styles.label,
                        { color: item.destructive ? SEMANTIC_COLORS.destructive : labelColor },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.subtitle && (
                      <Text style={[styles.subtitle, { color: titleColor }]}>{item.subtitle}</Text>
                    )}
                  </View>
                  {item.icon}
                </TouchableOpacity>
              </View>
            ))}

            {/* Footer (e.g. description section) */}
            {footer && (
              <>
                <View style={[styles.divider, { backgroundColor: dividerColor }]} />
                <View style={styles.footer}>{footer}</View>
              </>
            )}
          </ScrollView>
        </View>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
    paddingTop: SHEET_HANDLE_CLEARANCE,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
  },
  titleText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 0,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 44,
  },
  itemDisabled: {
    opacity: 0.35,
  },
  itemContent: {
    flex: 1,
    gap: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "400",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "400",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
});
