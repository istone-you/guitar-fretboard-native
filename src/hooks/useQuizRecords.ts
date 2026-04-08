import { useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { QuizRecord } from "../types";

const STORAGE_KEY = "guiter:quiz-records";
const MAX_RECORDS = 1000;

export function useQuizRecords() {
  const [records, setRecords] = useState<QuizRecord[]>(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored !== null) {
        try {
          setRecords(JSON.parse(stored) as QuizRecord[]);
        } catch {
          // ignore parse errors
        }
      }
    });
    return [];
  });

  const addRecord = useCallback((record: QuizRecord) => {
    setRecords((prev) => {
      const next = [...prev, record].slice(-MAX_RECORDS);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecords = useCallback(() => {
    setRecords([]);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return { records, addRecord, clearRecords };
}
