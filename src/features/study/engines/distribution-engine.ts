import type { StudySessionDomainModel, CourseDistributionItem, DailyStudyAggregate } from '../domain/models';
import { dateToString } from '../../../utils/habits';

export class StudyDistributionEngine {
  /**
   * Aggregates study time grouped by course.
   */
  static aggregateByCourse(sessions: readonly Pick<StudySessionDomainModel, 'course' | 'courseId' | 'durationMinutes'>[]): CourseDistributionItem[] {
    const map = new Map<string, { course: string; courseId?: string; totalMinutes: number; sessionCount: number }>();
    let grandTotal = 0;

    for (const session of sessions) {
      const key = session.courseId || session.course || 'General Study';
      const existing = map.get(key);
      const minutes = session.durationMinutes || 0;
      grandTotal += minutes;

      if (existing) {
        existing.totalMinutes += minutes;
        existing.sessionCount += 1;
      } else {
        map.set(key, {
          course: session.course || 'General Study',
          courseId: session.courseId,
          totalMinutes: minutes,
          sessionCount: 1,
        });
      }
    }

    return Array.from(map.values())
      .map(item => ({
        course: item.course,
        courseId: item.courseId,
        totalMinutes: item.totalMinutes,
        totalHours: Math.round((item.totalMinutes / 60) * 10) / 10,
        percentage: grandTotal > 0 ? Math.round((item.totalMinutes / grandTotal) * 100) : 0,
        sessionCount: item.sessionCount,
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  }

  /**
   * Aggregates study time per day for the last N days.
   */
  static aggregateDailyTrends(
    sessions: readonly Pick<StudySessionDomainModel, 'date' | 'durationMinutes'>[],
    days = 14,
    endDate = new Date()
  ): DailyStudyAggregate[] {
    const dailyMap = new Map<string, { totalMinutes: number; sessionCount: number }>();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      dailyMap.set(dateToString(d), { totalMinutes: 0, sessionCount: 0 });
    }

    for (const session of sessions) {
      const sessionDateStr = dateToString(new Date(session.date));
      if (dailyMap.has(sessionDateStr)) {
        const entry = dailyMap.get(sessionDateStr)!;
        entry.totalMinutes += session.durationMinutes || 0;
        entry.sessionCount += 1;
      }
    }

    return Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      totalMinutes: stats.totalMinutes,
      sessionCount: stats.sessionCount,
    }));
  }

  /**
   * Computes total focus hours across all sessions.
   */
  static calculateTotalHours(sessions: readonly Pick<StudySessionDomainModel, 'durationMinutes'>[]): number {
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    return Math.round((totalMinutes / 60) * 10) / 10;
  }
}
