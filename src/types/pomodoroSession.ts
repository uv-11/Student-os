import type { PomodoroMode } from "./pomodoroMode";

export interface PomodoroSession {
  id: string;
  courseId?: string;
  mode: PomodoroMode;
  durationMinutes: number;
  completedAt: number; // Unix timestamp (ms)
}
