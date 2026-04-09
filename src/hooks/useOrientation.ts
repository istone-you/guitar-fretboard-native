import { useState, useCallback, useRef } from "react";
import { useWindowDimensions } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";

export function useOrientation() {
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const isLandscape = winWidth > winHeight;
  const [animDisabled, setAnimDisabled] = useState(false);
  const rotateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleLayout = useCallback(async () => {
    if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current);
    setAnimDisabled(true);
    if (isLandscape) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    }
    rotateTimerRef.current = setTimeout(() => {
      setAnimDisabled(false);
      rotateTimerRef.current = null;
    }, 500);
  }, [isLandscape]);

  return { isLandscape, toggleLayout, animDisabled, winWidth, winHeight };
}
