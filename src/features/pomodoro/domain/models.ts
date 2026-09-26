import { PomodoroMode } from '../../../types/pomodoroMode';

export { PomodoroMode };

export type PomodoroSessionId = string;

export interface PomodoroSessionDomainModel {
  readonly id: PomodoroSessionId;
  readonly courseId?: string;
  readonly mode: PomodoroMode;
  readonly durationMinutes: number;
  readonly completedAt: number; // ms timestamp
}

export interface DailyFocusSummary {
  readonly date: string;
  readonly focusMinutes: number;
  readonly completedSessions: number;
  readonly goalTarget: number;
  readonly goalProgressPercentage: number;
}
