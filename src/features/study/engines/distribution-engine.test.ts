import { describe, it, expect } from 'vitest';
import { StudyDistributionEngine } from './distribution-engine';
import { dateToString } from '../../../utils/habits';

describe('StudyDistributionEngine', () => {
  const sessions = [
    { course: 'Physics', durationMinutes: 120, date: Date.now() },
    { course: 'Physics', durationMinutes: 60, date: Date.now() },
    { course: 'Math', durationMinutes: 60, date: Date.now() },
  ];

  it('aggregates course study distribution with percentages and hours', () => {
    const dist = StudyDistributionEngine.aggregateByCourse(sessions);
    expect(dist).toHaveLength(2);
    expect(dist[0].course).toBe('Physics');
    expect(dist[0].totalMinutes).toBe(180);
    expect(dist[0].totalHours).toBe(3.0);
    expect(dist[0].percentage).toBe(75); // 180 / 240 = 75%
    expect(dist[0].sessionCount).toBe(2);

    expect(dist[1].course).toBe('Math');
    expect(dist[1].totalMinutes).toBe(60);
    expect(dist[1].percentage).toBe(25);
  });

  it('aggregates daily trends across given days', () => {
    const today = new Date();
    const todayStr = dateToString(today);

    const trends = StudyDistributionEngine.aggregateDailyTrends(sessions, 7, today);
    expect(trends).toHaveLength(7);
    const todayTrend = trends.find(t => t.date === todayStr);
    expect(todayTrend?.totalMinutes).toBe(240);
    expect(todayTrend?.sessionCount).toBe(3);
  });

  it('calculates total hours across all sessions', () => {
    const hours = StudyDistributionEngine.calculateTotalHours(sessions);
    expect(hours).toBe(4.0);
  });
});
