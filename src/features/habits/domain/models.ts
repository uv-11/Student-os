export type HabitId = string;

export interface HabitDomainModel {
  readonly id: HabitId;
  readonly name: string;
  readonly courseId?: string;
  readonly description?: string;
  readonly color?: string;
  readonly icon?: string;
  readonly completionLog: readonly string[]; // "YYYY-MM-DD"
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface HabitStreakMetrics {
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly completionPercentage30d: number;
  readonly isCompletedToday: boolean;
  readonly isCompletedYesterday: boolean;
  readonly totalCompletions: number;
}

export interface HabitHeatmapCell {
  readonly date: string;
  readonly isCompleted: boolean;
  readonly dayOfWeek: number; // 0 (Sun) - 6 (Sat)
}
