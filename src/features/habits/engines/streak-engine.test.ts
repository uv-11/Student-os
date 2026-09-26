import { describe, it, expect } from 'vitest';
import { HabitStreakEngine } from './streak-engine';
import { dateToString } from '../../../utils/habits';

describe('HabitStreakEngine', () => {
  const today = new Date();
  const todayStr = dateToString(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = dateToString(yesterday);

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = dateToString(twoDaysAgo);

  it('computes metrics including current streak and completion states', () => {
    const habit = {
      completionLog: [twoDaysAgoStr, yesterdayStr, todayStr],
      createdAt: Date.now() - 30 * 86400000,
    };

    const metrics = HabitStreakEngine.calculateMetrics(habit);
    expect(metrics.currentStreak).toBe(3);
    expect(metrics.longestStreak).toBe(3);
    expect(metrics.isCompletedToday).toBe(true);
    expect(metrics.isCompletedYesterday).toBe(true);
    expect(metrics.totalCompletions).toBe(3);
  });

  it('generates heatmap with correct number of days and completion flags', () => {
    const log = [todayStr, twoDaysAgoStr];
    const cells = HabitStreakEngine.generateHeatmap(log, 7, today);

    expect(cells).toHaveLength(7);
    expect(cells[cells.length - 1].date).toBe(todayStr);
    expect(cells[cells.length - 1].isCompleted).toBe(true);
    expect(cells[cells.length - 2].date).toBe(yesterdayStr);
    expect(cells[cells.length - 2].isCompleted).toBe(false);
  });

  it('calculates consistency score over 30 days', () => {
    const log = [todayStr, yesterdayStr, twoDaysAgoStr];
    const score = HabitStreakEngine.calculateConsistencyScore(log, 30);
    // 3 / 30 = 10%
    expect(score).toBe(10);
  });

  it('computes day-of-week distribution', () => {
    const log = [todayStr];
    const dist = HabitStreakEngine.getDayOfWeekDistribution(log);
    const total = Object.values(dist).reduce((acc, count) => acc + count, 0);
    expect(total).toBe(1);
  });
});
