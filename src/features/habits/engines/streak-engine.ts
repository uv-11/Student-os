import type { HabitDomainModel, HabitStreakMetrics, HabitHeatmapCell } from '../domain/models';
import {
  getCurrentStreak,
  getLongestStreak,
  getCompletionPercentage,
  isCompletedToday,
  isCompletedYesterday,
  dateToString
} from '../../../utils/habits';

/**
 * Pure calculation engine for habit streaks, consistency, and time-series analytics.
 */
export class HabitStreakEngine {
  /**
   * Computes full streak and performance metrics for a habit.
   */
  static calculateMetrics(habit: Pick<HabitDomainModel, 'completionLog' | 'createdAt'>): HabitStreakMetrics {
    const log = [...habit.completionLog];
    return {
      currentStreak: getCurrentStreak(log),
      longestStreak: getLongestStreak(log),
      completionPercentage30d: getCompletionPercentage(log, habit.createdAt),
      isCompletedToday: isCompletedToday(log),
      isCompletedYesterday: isCompletedYesterday(log),
      totalCompletions: log.length,
    };
  }

  /**
   * Generates a time-series heatmap array for the last N days.
   */
  static generateHeatmap(completionLog: readonly string[], days = 60, endDate = new Date()): HabitHeatmapCell[] {
    const logSet = new Set(completionLog);
    const cells: HabitHeatmapCell[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const dateStr = dateToString(d);

      cells.push({
        date: dateStr,
        isCompleted: logSet.has(dateStr),
        dayOfWeek: d.getDay(),
      });
    }

    return cells;
  }

  /**
   * Computes habit completion consistency score between 0 and 100.
   */
  static calculateConsistencyScore(completionLog: readonly string[], days = 30): number {
    if (days <= 0) return 0;
    const today = new Date();
    const cells = this.generateHeatmap(completionLog, days, today);
    const completedCount = cells.filter(c => c.isCompleted).length;
    return Math.round((completedCount / days) * 100);
  }

  /**
   * Returns completions grouped by day of week ('Sun', 'Mon', etc.).
   */
  static getDayOfWeekDistribution(completionLog: readonly string[]): Record<string, number> {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const distribution: Record<string, number> = {
      Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0,
    };

    for (const dateStr of completionLog) {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (y && m && d) {
        const date = new Date(y, m - 1, d);
        const dayName = days[date.getDay()];
        if (dayName) {
          distribution[dayName]++;
        }
      }
    }

    return distribution;
  }
}
