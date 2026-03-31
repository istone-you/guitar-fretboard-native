import { useState } from "react";
import { Text, TouchableOpacity, Modal, FlatList, StyleSheet, Pressable } from "react-native";
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
}

export function DropdownSelect({
  theme,
  value,
  onChange,
  options,
  disabled = false,
  fullWidth = false,
}: DropdownSelectProps) {
  const [visible, setVisible] = useState(false);
  const isDark = theme === "dark";
  const current = options.find((o) => o.value === value) ?? options[0];
  const open = visible && !disabled;

  const triggerStyle = disabled
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

  return (
    <>
      <TouchableOpacity
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
        style={[
          styles.trigger,
          triggerStyle,
          fullWidth && { alignSelf: "stretch" },
          disabled && { opacity: 1 },
        ]}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.triggerText,
            { color: disabled ? (isDark ? "#6b7280" : "#a8a29e") : isDark ? "#fff" : "#1c1917" },
          ]}
          numberOfLines={1}
        >
          {current?.label ?? value}
        </Text>
        <Text
          style={{
            fontSize: 10,
            color: isDark ? "#e5e7eb" : "#78716c",
            transform: [{ rotate: open ? "180deg" : "0deg" }],
          }}
        >
          ▾
        </Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable
            style={[
              styles.menu,
              {
                backgroundColor: isDark ? "rgba(17,24,39,0.97)" : "rgba(250,250,249,0.97)",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e7e5e4",
              },
            ]}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      onChange(item.value);
                      setVisible(false);
                    }}
                    style={[
                      styles.menuItem,
                      selected && {
                        backgroundColor: isDark ? "#0284c7" : "#0ea5e9",
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: selected ? "#fff" : isDark ? "#d1d5db" : "#44403c",
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
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
