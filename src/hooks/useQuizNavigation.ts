import { useState, useRef, useCallback } from "react";
import { Animated, PanResponder } from "react-native";
import * as Haptics from "expo-haptics";

interface UseQuizNavigationParams {
  winWidth: number;
  onQuizKindChange: (value: string) => void;
  onShowQuizChange: (show: boolean) => void;
}

export function useQuizNavigation({
  winWidth,
  onQuizKindChange,
  onShowQuizChange,
}: UseQuizNavigationParams) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizModeSelected, setQuizModeSelected] = useState(false);
  const quizSlideAnim = useRef(new Animated.Value(0)).current;

  // Store callbacks in refs so animations always call the latest version
  const onQuizKindChangeRef = useRef(onQuizKindChange);
  onQuizKindChangeRef.current = onQuizKindChange;
  const onShowQuizChangeRef = useRef(onShowQuizChange);
  onShowQuizChangeRef.current = onShowQuizChange;

  const handleChangeQuiz = useCallback(() => {
    Animated.timing(quizSlideAnim, {
      toValue: winWidth,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      onShowQuizChangeRef.current(false);
      setQuizModeSelected(false);
    });
  }, [quizSlideAnim, winWidth]);

  const handleQuizModeSelect = useCallback(
    (value: string) => {
      onQuizKindChangeRef.current(value);
      quizSlideAnim.setValue(winWidth);
      setQuizModeSelected(true);
      setTimeout(() => {
        Animated.timing(quizSlideAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start();
      }, 0);
    },
    [quizSlideAnim, winWidth],
  );

  // Refs for swipe handler (created once, always reads latest values)
  const handleChangeQuizRef = useRef(handleChangeQuiz);
  handleChangeQuizRef.current = handleChangeQuiz;
  const showQuizRef = useRef(showQuiz);
  showQuizRef.current = showQuiz;
  const quizModeSelectedRef = useRef(quizModeSelected);
  quizModeSelectedRef.current = quizModeSelected;

  const swipePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        showQuizRef.current &&
        quizModeSelectedRef.current &&
        g.dx > 10 &&
        Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dx > 80) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          handleChangeQuizRef.current();
        }
      },
    }),
  ).current;

  return {
    showQuiz,
    setShowQuiz,
    quizModeSelected,
    setQuizModeSelected,
    quizSlideAnim,
    handleQuizModeSelect,
    handleChangeQuiz,
    swipePanResponder,
  };
}
