import { useRef } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet } from "react-native";
import type { ReactNode } from "react";

export interface AnimatedModalControls {
  close: () => void;
  closeWithCallback: (cb: () => void) => void;
  bounce: () => void;
}

interface AnimatedModalProps {
  visible: boolean;
  onClose: () => void;
  onShow?: () => void;
  children: (controls: AnimatedModalControls) => ReactNode;
}

export default function AnimatedModal({ visible, onClose, onShow, children }: AnimatedModalProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Reset animation values synchronously when transitioning to visible,
  // so the modal never flickers with stale values from the previous close animation.
  const prevVisible = useRef(visible);
  if (visible && !prevVisible.current) {
    opacity.setValue(1);
    scale.setValue(0.5);
  }
  prevVisible.current = visible;

  const closeWithCallback = (cb: () => void) => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => cb());
  };

  const close = () => closeWithCallback(onClose);

  const bounce = () => {
    scale.stopAnimation();
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.06,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
      onShow={() => {
        onShow?.();
        opacity.setValue(1);
        scale.setValue(0.5);
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 150,
          useNativeDriver: true,
        }).start();
      }}
    >
      <Pressable style={styles.overlay} onPress={close} testID="animated-modal-overlay">
        <Animated.View style={{ transform: [{ scale }], opacity }}>
          {children({ close, closeWithCallback, bounce })}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
});
