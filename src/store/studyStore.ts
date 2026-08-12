import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { activeStorageAdapter } from "./storageAdapter";
import type { StudySession } from "../types/study";

interface ActiveStudySession {
  courseId?: string;
  course: string;
  startTime: number;
}

interface StudyState {
  sessions: StudySession[];
  activeSession: ActiveStudySession | null;
  lastDeletedSession: StudySession | null;
  startActiveSession: (course: string, courseId?: string) => void;
  stopActiveSession: (notes?: string, tags?: string[]) => void;
  cancelActiveSession: () => void;
  addSession: (data: Omit<StudySession, "id" | "createdAt" | "updatedAt">) => void;
  updateSession: (id: string, updates: Partial<Omit<StudySession, "id">>) => void;
  deleteSession: (id: string) => void;
  undoDelete: () => void;
  importData: (sessions: StudySession[]) => void;
  resetData: () => void;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set) => ({
      sessions: [],
      activeSession: null,
      lastDeletedSession: null,
      
      startActiveSession: (course, courseId) => {
        set({ activeSession: { course, courseId, startTime: Date.now() } });
      },

      stopActiveSession: (notes, tags) => {
        set((state) => {
          if (!state.activeSession) return state;
          const endTime = Date.now();
          const durationMs = endTime - state.activeSession.startTime;
          const durationMinutes = Math.max(1, Math.round(durationMs / 60000));
          
          const newSession: StudySession = {
            id: crypto.randomUUID(),
            title: `${state.activeSession.course} Study`,
            courseId: state.activeSession.courseId,
            course: state.activeSession.course,
            date: state.activeSession.startTime,
            durationMinutes,
            notes,
            tags: tags || [],
            createdAt: endTime,
            updatedAt: endTime,
          };
          
          return {
            sessions: [...state.sessions, newSession],
            activeSession: null,
          };
        });
      },

      cancelActiveSession: () => set({ activeSession: null }),

      addSession: (data) => {
        const now = Date.now();
        const newSession: StudySession = {
          ...data,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ sessions: [...state.sessions, newSession] }));
      },
      
      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id ? { ...session, ...updates, updatedAt: Date.now() } : session
          ),
        })),
        
      deleteSession: (id) =>
        set((state) => {
          const sessionToDelete = state.sessions.find((s) => s.id === id);
          if (!sessionToDelete) return state;
          
          return {
            sessions: state.sessions.filter((s) => s.id !== id),
            lastDeletedSession: sessionToDelete,
          };
        }),
        
      undoDelete: () =>
        set((state) => {
          if (!state.lastDeletedSession) return state;
          
          if (state.sessions.some((s) => s.id === state.lastDeletedSession!.id)) {
            return { lastDeletedSession: null };
          }
          
          return {
            sessions: [...state.sessions, state.lastDeletedSession],
            lastDeletedSession: null,
          };
        }),
        
      importData: (sessions) => set({ sessions }),
      
      resetData: () => set({ sessions: [], lastDeletedSession: null }),
    }),
    {
      name: "studentos-study-storage",
      storage: createJSONStorage(() => activeStorageAdapter),
    }
  )
);
