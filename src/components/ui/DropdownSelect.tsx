import { useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
  Animated,
} from "react-native";
import ChevronIcon from "./ChevronIcon";
import type { Theme } from "../../types";

interface Option {
  value: string;
  label: string;
}

interface DropdownSelectProps {
  theme: Theme;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: "default" | "plain";
}

export function DropdownSelect({
  theme,
  value,
  onChange,
  options,
  disabled = false,
  fullWidth = false,
  variant = "default",
}: DropdownSelectProps) {
  const [visible, setVisible] = useState(false);
  const listRef = useRef<FlatList>(null);
  const menuScale = useRef(new Animated.Value(1)).current;
  const menuOpacity = useRef(new Animated.Value(1)).current;

  const closeWithAnimation = (callback?: () => void) => {
    Animated.timing(menuOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setVisible(false);
      callback?.();
    });
  };
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const mounted = useRef(false);
  const prevKey = useRef(`${value}:${disabled}`);
  const currentKey = `${value}:${disabled}`;

  if (!mounted.current) {
    mounted.current = true;
  } else if (prevKey.current !== currentKey) {
    prevKey.current = currentKey;
    scaleAnim.stopAnimation();
    scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }
  const isDark = theme === "dark";
  const current = options.find((o) => o.value === value) ?? options[0];
  const triggerLabel = current?.label ?? value;
  const open = visible && !disabled;

  const isPlain = variant === "plain";

  const triggerStyle = isPlain
    ? { borderColor: "transparent", backgroundColor: "transparent" }
    : disabled
      ? {
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e7e5e4",
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(231,229,228,0.7)",
        }
      : open
        ? {
            borderColor: isDark ? "rgba(255,255,255,0.14)" : "#d6d3d1",
            backgroundColor: isDark ? "#1e293b" : "#e7e5e4",
          }
        : {
            borderColor: isDark ? "rgba(255,255,255,0.10)" : "#e7e5e4",
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(250,250,249,0.95)",
          };

  const textColor = disabled ? (isDark ? "#6b7280" : "#a8a29e") : isDark ? "#fff" : "#1c1917";

  return (
    <>
      <Animated.View
        style={
          isPlain
            ? {
                transform: [{ scale: scaleAnim }],
                alignSelf: fullWidth ? ("stretch" as const) : undefined,
              }
            : fullWidth
              ? { alignSelf: "stretch" as const }
              : undefined
        }
      >
        <TouchableOpacity
          onPress={() => {
            if (disabled) return;
            menuScale.setValue(0.5);
            menuOpacity.setValue(1);
            setVisible(true);
          }}
          disabled={disabled}
          style={[
            isPlain ? styles.plainTrigger : styles.trigger,
            triggerStyle,
            fullWidth && { alignSelf: "stretch" },
            disabled && { opacity: 1 },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              isPlain ? styles.plainTriggerText : styles.triggerText,
              { color: textColor, fontWeight: isPlain ? "600" : "500" },
            ]}
            numberOfLines={1}
          >
            {triggerLabel}
          </Text>
          {!disabled && (
            <ChevronIcon
              size={fullWidth ? 10 : 12}
              color={isDark ? "#6b7280" : "#a8a29e"}
              direction={open ? "up" : "down"}
            />
          )}
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => closeWithAnimation()}
        onShow={() => {
          Animated.timing(menuScale, {
            toValue: 1.05,
            duration: 100,
            useNativeDriver: true,
          }).start(() => {
            Animated.spring(menuScale, {
              toValue: 1,
              friction: 4,
              tension: 200,
              useNativeDriver: true,
            }).start();
          });
        }}
      >
        <Pressable style={styles.overlay} onPress={() => closeWithAnimation()}>
          <Animated.View
            style={[
              styles.menu,
              {
                backgroundColor: isDark ? "rgba(17,24,39,0.97)" : "rgba(250,250,249,0.97)",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4",
                transform: [{ scale: menuScale }],
                opacity: menuOpacity,
              },
            ]}
          >
            <FlatList
              ref={listRef}
              data={options}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator
              indicatorStyle={isDark ? "white" : "black"}
              initialScrollIndex={Math.max(0, options.findIndex((o) => o.value === value) - 2)}
              getItemLayout={(_, index) => ({
                length: 38,
                offset: 38 * index,
                index,
              })}
              onLayout={() => listRef.current?.flashScrollIndicators()}
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onChange(item.value);
                      closeWithAnimation();
                    }}
                    style={[
                      styles.menuItem,
                      selected && {
                        backgroundColor: isDark ? "#e5e7eb" : "#1c1917",
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: selected
                          ? isDark
                            ? "#1c1917"
                            : "#fff"
                          : isDark
                            ? "#d1d5db"
                            : "#44403c",
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
  },
  triggerText: {
    fontSize: 13,
    fontWeight: "500",
  },
  plainTrigger: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  plainTriggerText: {
    fontSize: 15,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  menu: {
    borderWidth: 1,
    borderRadius: 20,
    maxHeight: 340,
    width: 220,
    overflow: "hidden",
    padding: 6,
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },
});
