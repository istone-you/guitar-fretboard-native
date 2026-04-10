import { useRef } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from "react-native";
import type { ReactNode } from "react";

export interface BottomSheetModalControls {
  close: () => void;
  closeWithCallback: (cb: () => void) => void;
}

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: (controls: BottomSheetModalControls) => ReactNode;
}

export default function BottomSheetModal({ visible, onClose, children }: BottomSheetModalProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  // Blocks onShow from running while a close animation is in progress.
  // React Native's Modal can re-fire onShow on re-renders, which would reset
  // the close animation values and cause the sheet to briefly re-appear.
  const isShowingRef = useRef(visible);

  // Sync-reset animation values when visible transitions false→true,
  // mirroring the AnimatedModal pattern to prevent stale-value flicker.
  const prevVisible = useRef(visible);
  if (visible && !prevVisible.current) {
    opacity.setValue(1);
    translateY.setValue(56);
    isShowingRef.current = true;
  }
  if (!visible && prevVisible.current) {
    isShowingRef.current = false;
  }
  prevVisible.current = visible;

  const closeWithCallback = (cb: () => void) => {
    isShowingRef.current = false;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 84,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => cb());
  };

  const close = () => closeWithCallback(onClose);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
      onShow={() => {
        if (!isShowingRef.current) return;
        Animated.spring(translateY, {
          toValue: 0,
          friction: 9,
          tension: 120,
          useNativeDriver: true,
        }).start();
      }}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={close} testID="bottom-sheet-backdrop" />
        <Animated.View style={{ transform: [{ translateY }], opacity, width: "100%" }}>
          {children({ close, closeWithCallback })}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
});
