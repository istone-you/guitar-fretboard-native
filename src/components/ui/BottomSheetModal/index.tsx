import { useCallback, useRef } from "react";
import { OVERLAY_COLORS } from "../../../themes/design";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  type PanResponderGestureState,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import type { ReactNode } from "react";

/**
 * Minimum paddingTop that every bottom sheet panel must apply so content
 * clears the absolute-positioned handle pill (handle bottom ≈ 15px + 13px gap = 28px).
 */
export const SHEET_HANDLE_CLEARANCE = 28;

/** Shared sheet height — use this hook in every BottomSheetModal consumer. */
export function useSheetHeight(): number {
  const { height } = useWindowDimensions();
  return Math.max(360, Math.min(520, Math.round(height * 0.62)));
}

export interface BottomSheetModalControls {
  close: () => void;
  closeWithCallback: (cb: () => void) => void;
  /**
   * Apply to the entire header View of the sheet content.
   * onStartShouldSetPanResponder: true → header empty-space touches start drag immediately.
   * Child buttons (TouchableOpacity) are deeper in the tree so they win responder negotiation
   * and still receive tap events normally.
   */
  dragHandlers: ReturnType<typeof PanResponder.create>["panHandlers"];
}

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: (controls: BottomSheetModalControls) => ReactNode;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CLOSE_THRESHOLD = 100;

export default function BottomSheetModal({ visible, onClose, children }: BottomSheetModalProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const naturalHeightRef = useRef(300);
  const isClosingRef = useRef(false);
  const isOpenRef = useRef(visible);
  const shouldOpenRef = useRef(false);

  // Keep onClose current inside PanResponder closures
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const prevVisible = useRef(visible);
  if (visible && !prevVisible.current) {
    translateY.setValue(SCREEN_HEIGHT);
    overlayOpacity.setValue(0);
    isOpenRef.current = true;
    isClosingRef.current = false;
    shouldOpenRef.current = true;
  }
  if (!visible && prevVisible.current) {
    isOpenRef.current = false;
  }
  prevVisible.current = visible;

  const animateOpen = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: false,
      }),
    ]).start();
  }, [translateY, overlayOpacity]);

  const closeWithCallback = useCallback(
    (cb: () => void) => {
      if (isClosingRef.current) return;
      isClosingRef.current = true;
      isOpenRef.current = false;
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 280,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: false,
        }),
      ]).start(() => {
        isClosingRef.current = false;
        cb();
      });
    },
    [translateY, overlayOpacity],
  );

  const close = useCallback(
    () => closeWithCallback(() => onCloseRef.current()),
    [closeWithCallback],
  );

  const handleLayout = useCallback(
    (h: number) => {
      if (h <= 0) return;
      naturalHeightRef.current = h;
      if (shouldOpenRef.current && isOpenRef.current) {
        shouldOpenRef.current = false;
        animateOpen();
      }
    },
    [animateOpen],
  );

  // Gesture logic via mutable refs so the PanResponder (created once) always sees latest values
  const doMove = useRef((_gs: PanResponderGestureState) => {});
  const doRelease = useRef((_gs: PanResponderGestureState) => {});
  const doTerminate = useRef(() => {});

  doMove.current = (gs: PanResponderGestureState) => {
    if (gs.dy > 0) {
      translateY.setValue(gs.dy);
      overlayOpacity.setValue(Math.max(0, 1 - gs.dy / (naturalHeightRef.current * 0.75)));
    }
    // Upward drag: ignore (no fullscreen, no negative translateY)
  };

  doRelease.current = (gs: PanResponderGestureState) => {
    if (gs.dy > CLOSE_THRESHOLD || gs.vy > 0.8) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        isOpenRef.current = false;
        onCloseRef.current();
      });
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  doTerminate.current = () => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  /**
   * handlePanResponder — attached to the handle pill area (y=0..20, above all buttons).
   * Uses onStartShouldSetPanResponder:true so touching the visual pill always starts drag.
   * All modals have paddingTop≥20 so no buttons exist in this zone.
   */
  const handlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => doMove.current(gs),
      onPanResponderRelease: (_, gs) => doRelease.current(gs),
      onPanResponderTerminate: () => doTerminate.current(),
    }),
  ).current;

  /**
   * dragHandlers — apply to the entire header View of each sheet.
   * onStartShouldSetPanResponder:true → empty header space starts drag immediately.
   * Child TouchableOpacity buttons win responder negotiation (they are deeper in the tree).
   * onMoveShouldSetPanResponder → also steals from a button touch if user clearly drags.
   */
  const dragPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dy) > 10 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => doMove.current(gs),
      onPanResponderRelease: (_, gs) => doRelease.current(gs),
      onPanResponderTerminate: () => doTerminate.current(),
    }),
  ).current;

  const dragHandlers = dragPanResponder.panHandlers;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
      testID="bottom-sheet-modal"
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Dimmed backdrop */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: overlayOpacity, backgroundColor: OVERLAY_COLORS.sheet },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            testID="bottom-sheet-backdrop"
          />
        </Animated.View>

        {/* Sheet — no overflow:hidden, no borderRadius (children own their visual design) */}
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
          onLayout={(e) => handleLayout(e.nativeEvent.layout.height)}
        >
          {children({ close, closeWithCallback, dragHandlers })}

          {/* Handle pill area — absolute, centered over modal top. Modals use paddingTop≥28 to clear it */}
          <View style={styles.handleArea} {...handlePanResponder.panHandlers}>
            <View style={styles.handle} pointerEvents="none" />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  handleArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 24,
    alignItems: "center",
    paddingTop: 10,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: OVERLAY_COLORS.handle,
  },
});
