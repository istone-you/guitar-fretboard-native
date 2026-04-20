import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ProgressionChord } from "../types";

const STORAGE_KEY = "guiter:progression-templates";

export interface CustomProgressionTemplate {
  id: string;
  name: string;
  chords: ProgressionChord[];
  createdAt: number;
}

function migrateLegacyTemplate(raw: Record<string, unknown>): CustomProgressionTemplate {
  if (Array.isArray(raw.chords)) {
    return raw as unknown as CustomProgressionTemplate;
  }
  const degrees = Array.isArray(raw.degrees) ? (raw.degrees as string[]) : [];
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    createdAt: Number(raw.createdAt ?? 0),
    chords: degrees.map((d) => ({
      degree: d,
      chordType: d === d.toLowerCase() ? ("Minor" as const) : ("Major" as const),
    })),
  };
}

export function useProgressionTemplates() {
  const [customTemplates, setCustomTemplates] = useState<CustomProgressionTemplate[]>(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setCustomTemplates(parsed.map((raw) => migrateLegacyTemplate(raw)));
          }
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

  const saveTemplate = (name: string, chords: ProgressionChord[]) => {
    persist([...customTemplates, { id: `tpl-${Date.now()}`, name, chords, createdAt: Date.now() }]);
  };

  const updateTemplate = (id: string, name: string, chords: ProgressionChord[]) => {
    persist(customTemplates.map((t) => (t.id === id ? { ...t, name, chords } : t)));
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
