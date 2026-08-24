/**
 * Habit — the stored interface.
 *
 * currentStreak, longestStreak, and completionPercentage are DERIVED values
 * computed live from `completionLog` via src/utils/habits.ts.
 * They are intentionally NOT stored to avoid stale-data inconsistencies.
 */
export interface Habit {
  id: string;
  name: string;
  courseId?: string;
  description?: string;
  color?: string;  // hex color string, e.g. "#10b981"
  icon?: string;   // emoji, e.g. "📚"
  completionLog: string[]; // "YYYY-MM-DD" strings — single source of truth
  createdAt: number;
  updatedAt: number;
}
