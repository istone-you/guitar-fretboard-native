import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function usePersistedSetting<T>(
  storageKey: string,
  defaultValue: T,
  serialize: (value: T) => string = (value) => String(value),
  deserialize: (value: string) => T = (value) => value as unknown as T,
): [T, (value: T | ((current: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((stored) => {
      if (stored !== null) {
        try {
          setValue(deserialize(stored));
        } catch {
          // ignore
        }
      }
      setLoaded(true);
    });
  }, [storageKey]);

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
