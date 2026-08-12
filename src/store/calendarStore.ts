import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { activeStorageAdapter } from "./storageAdapter";
import type { CalendarEvent } from "../types/calendar";

export type StandaloneCalendarEvent = Omit<CalendarEvent, "type" | "color" | "isCompleted"> & {
  type: "custom";
  color: string;
  isCompleted?: boolean;
};

interface CalendarState {
  events: StandaloneCalendarEvent[];
  addEvent: (event: Omit<StandaloneCalendarEvent, "id">) => void;
  updateEvent: (id: string, updates: Partial<Omit<StandaloneCalendarEvent, "id">>) => void;
  deleteEvent: (id: string) => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (eventData) => {
        const newEvent: StandaloneCalendarEvent = {
          ...eventData,
          id: crypto.randomUUID(),
        };
        set((state) => ({ events: [...state.events, newEvent] }));
      },
      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },
      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        }));
      },
    }),
    {
      name: "studentos-calendar-storage",
      storage: createJSONStorage(() => activeStorageAdapter),
    }
  )
);
