import { describe, it, expect } from 'vitest';
import { PomodoroFocusEngine } from './focus-engine';
import { PomodoroMode } from '../domain/models';

describe('PomodoroFocusEngine', () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  it('computes daily summary including focus minutes and goal progress', () => {
    const sessions = [
      { completedAt: today.getTime(), durationMinutes: 25, mode: PomodoroMode.FOCUS },
      { completedAt: today.getTime(), durationMinutes: 25, mode: PomodoroMode.FOCUS },
      { completedAt: today.getTime(), durationMinutes: 5, mode: PomodoroMode.BREAK },
    ];

    const summary = PomodoroFocusEngine.getDailySummary(sessions, 4, today);
    expect(summary.completedSessions).toBe(2);
    expect(summary.focusMinutes).toBe(50);
    expect(summary.goalProgressPercentage).toBe(50); // 2 of 4 = 50%
  });

  it('calculates focus streak across consecutive days', () => {
    const sessions = [
      { completedAt: today.getTime(), durationMinutes: 25, mode: PomodoroMode.FOCUS },
      { completedAt: yesterday.getTime(), durationMinutes: 25, mode: PomodoroMode.FOCUS },
    ];

    const streak = PomodoroFocusEngine.calculateFocusStreak(sessions, today);
    expect(streak).toBe(2);
  });
});
