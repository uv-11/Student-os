import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { activeStorageAdapter } from "./storageAdapter";
import type { PomodoroSession } from "../types/pomodoroSession";
import type { PomodoroSettings } from "../types/pomodoroSettings";
import { DEFAULT_POMODORO_SETTINGS } from "../types/pomodoroSettings";
import { PomodoroMode } from "../types/pomodoroMode";

interface ActiveTimerState {
  mode: PomodoroMode;
  isRunning: boolean;
  sessionTotal: number;
  timeRemaining: number;
  targetEndTime: number | null;
  courseId?: string;
}

interface PomodoroState {
  sessions: PomodoroSession[];
  settings: PomodoroSettings;
  activeTimer: ActiveTimerState | null;
  addSession: (mode: PomodoroMode, durationMinutes: number, courseId?: string) => void;
  clearHistory: () => void;
  updateSettings: (updates: Partial<PomodoroSettings>) => void;
  setActiveTimer: (timer: ActiveTimerState | null) => void;
  updateActiveTimer: (updates: Partial<ActiveTimerState>) => void;
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set) => ({
      sessions: [],
      settings: DEFAULT_POMODORO_SETTINGS,
      activeTimer: null,
      setActiveTimer: (timer) => set({ activeTimer: timer }),
      updateActiveTimer: (updates) => set((state) => ({ 
        activeTimer: state.activeTimer ? { ...state.activeTimer, ...updates } : null 
      })),
      addSession: (mode, durationMinutes, courseId) => {
        set((state) => {
          const now = Date.now();
          const lastSession = state.sessions[0];
          
          // Prevent duplicate sessions within 10 seconds
          if (lastSession && now - lastSession.completedAt < 10000) {
            return state;
          }

          const session: PomodoroSession = {
            id: crypto.randomUUID(),
            mode,
            durationMinutes,
            completedAt: now,
            courseId,
          };
          return {
            sessions: [session, ...state.sessions].slice(0, 100), // cap history
          };
        });
      },
      clearHistory: () => set({ sessions: [] }),
      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),
    }),
    { 
      name: "studentos-pomodoro-storage",
      storage: createJSONStorage(() => activeStorageAdapter),
      merge: (persistedState: unknown, currentState) => {
        const state = persistedState as Partial<PomodoroState>;
        return {
          ...currentState,
          ...state,
          settings: {
            ...currentState.settings,
            ...(state?.settings || {}),
          },
        };
      },
    }
  )
);
