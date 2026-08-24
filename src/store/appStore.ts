import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { activeStorageAdapter } from "./storageAdapter";

export type Theme = "light" | "dark" | "system";

export interface AppSettings {
  theme: Theme;
  compactMode: boolean;
  animationsEnabled: boolean;
}

interface AppState {
  settings: AppSettings;
  schemaVersion: number;
  updateSettings: (updates: Partial<AppSettings>) => void;
  setSchemaVersion: (version: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      schemaVersion: 2, // Default to 2 for existing legacy users
      settings: {
        theme: "system",
        compactMode: false,
        animationsEnabled: true,
      },
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
      setSchemaVersion: (version) => set({ schemaVersion: version }),
    }),
    { 
      name: "studentos-app-storage",
      storage: createJSONStorage(() => activeStorageAdapter)
    }
  )
);
