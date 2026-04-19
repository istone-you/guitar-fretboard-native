import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "guiter:progression-templates";

export interface CustomProgressionTemplate {
  id: string;
  name: string;
  degrees: string[];
  createdAt: number;
}

export function useProgressionTemplates() {
  const [customTemplates, setCustomTemplates] = useState<CustomProgressionTemplate[]>(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          setCustomTemplates(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    });
    return [];
  });

  const persist = (next: CustomProgressionTemplate[]) => {
    setCustomTemplates(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const saveTemplate = (name: string, degrees: string[]) => {
    persist([
      ...customTemplates,
      { id: `tpl-${Date.now()}`, name, degrees, createdAt: Date.now() },
    ]);
  };

  const updateTemplate = (id: string, name: string, degrees: string[]) => {
    persist(customTemplates.map((t) => (t.id === id ? { ...t, name, degrees } : t)));
  };

  const deleteTemplate = (id: string) => {
    persist(customTemplates.filter((t) => t.id !== id));
  };

  const reorderTemplates = (orderedIds: string[]) => {
    const map = new Map(customTemplates.map((t) => [t.id, t]));
    persist(orderedIds.map((id) => map.get(id)!).filter(Boolean));
  };

  return { customTemplates, saveTemplate, updateTemplate, deleteTemplate, reorderTemplates };
}
