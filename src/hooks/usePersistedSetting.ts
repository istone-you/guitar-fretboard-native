import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Initialize synchronously with default, then load from storage via state initializer callback.
// No useEffect needed — the async load triggers a single re-render when complete.
export function usePersistedSetting<T>(
  storageKey: string,
  defaultValue: T,
  serialize: (value: T) => string = (value) => String(value),
  deserialize: (value: string) => T = (value) => value as unknown as T,
): [T, (value: T | ((current: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    // Kick off async load — will call setValue when done
    AsyncStorage.getItem(storageKey).then((stored) => {
      if (stored !== null) {
        try {
          setValue(deserialize(stored));
        } catch {
          // ignore
        }
      }
    });
    return defaultValue;
  });

  const setPersistedValue = (nextValue: T | ((current: T) => T)) => {
    setValue((current) => {
      const resolved =
        typeof nextValue === "function" ? (nextValue as (current: T) => T)(current) : nextValue;
      AsyncStorage.setItem(storageKey, serialize(resolved));
      return resolved;
    });
  };

  return [value, setPersistedValue];
}
