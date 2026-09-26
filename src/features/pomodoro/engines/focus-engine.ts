import type { PomodoroSessionDomainModel, DailyFocusSummary } from '../domain/models';
import { PomodoroMode } from '../domain/models';
import { dateToString } from '../../../utils/habits';

export class PomodoroFocusEngine {
  /**
   * Computes the daily focus summary for today against a user-defined session goal.
   */
  static getDailySummary(
    sessions: readonly Pick<PomodoroSessionDomainModel, 'completedAt' | 'durationMinutes' | 'mode'>[],
    dailyGoal = 8,
    now = new Date()
  ): DailyFocusSummary {
    const todayStr = dateToString(now);

    const todaySessions = sessions.filter(s => {
      if (s.mode !== PomodoroMode.FOCUS) return false;
      const sDateStr = dateToString(new Date(s.completedAt));
      return sDateStr === todayStr;
    });

    const totalMinutes = todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const sessionCount = todaySessions.length;
    const progress = dailyGoal > 0 ? Math.min(100, Math.round((sessionCount / dailyGoal) * 100)) : 0;

    return {
      date: todayStr,
      focusMinutes: totalMinutes,
      completedSessions: sessionCount,
      goalTarget: dailyGoal,
      goalProgressPercentage: progress,
    };
  }

  /**
   * Calculates consecutive days with at least one focus session.
   */
  static calculateFocusStreak(
    sessions: readonly Pick<PomodoroSessionDomainModel, 'completedAt' | 'mode'>[],
    now = new Date()
  ): number {
    const focusDays = new Set<string>();
    for (const s of sessions) {
      if (s.mode === PomodoroMode.FOCUS) {
        focusDays.add(dateToString(new Date(s.completedAt)));
      }
    }

    if (focusDays.size === 0) return 0;

    const todayStr = dateToString(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = dateToString(yesterday);

    const cursor = focusDays.has(todayStr) ? todayStr : focusDays.has(yesterdayStr) ? yesterdayStr : null;
    if (!cursor) return 0;

    let streak = 0;
    const [y, m, d] = cursor.split('-').map(Number);
    const currDate = new Date(y, m - 1, d);

    while (true) {
      const cStr = dateToString(currDate);
      if (focusDays.has(cStr)) {
        streak++;
        currDate.setDate(currDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }
}
