// ─── Date String Helpers ─────────────────────────────────────────────────────

export function dateToString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Offsets a YYYY-MM-DD string by N days without timezone issues. */
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return dateToString(date);
}

export function getTodayString(d?: Date): string {
  return dateToString(d || new Date());
}

export function getYesterdayString(): string {
  return addDays(getTodayString(), -1);
}

// ─── Completion Queries ───────────────────────────────────────────────────────

function isCompletedOn(log: string[], dateStr: string): boolean {
  return log.includes(dateStr);
}

export function isCompletedToday(log: string[]): boolean {
  return isCompletedOn(log, getTodayString());
}

export function isCompletedYesterday(log: string[]): boolean {
  return isCompletedOn(log, getYesterdayString());
}

// ─── Streak Calculations ──────────────────────────────────────────────────────

/**
 * Current streak: consecutive days ending today or yesterday.
 * If today is not done and yesterday is not done → 0.
 */
export function getCurrentStreak(log: string[]): number {
  if (log.length === 0) return 0;

  const logSet = new Set(log);
  const today = getTodayString();
  const yesterday = getYesterdayString();

  const startDate = logSet.has(today) ? today : logSet.has(yesterday) ? yesterday : null;
  if (!startDate) return 0;

  let streak = 1;
  let cursor = startDate;

  while (true) {
    const prev = addDays(cursor, -1);
    if (logSet.has(prev)) {
      streak++;
      cursor = prev;
    } else {
      break;
    }
  }

  return streak;
}

/** All-time best consecutive-day streak. */
export function getLongestStreak(log: string[]): number {
  if (log.length === 0) return 0;

  const sorted = [...new Set(log)].sort(); // deduplicate + chronological
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === addDays(sorted[i - 1], 1)) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}

// ─── Completion Percentage ────────────────────────────────────────────────────

/**
 * Completion % over the last 30 days (or since creation, whichever is shorter).
 * Returns 0–100.
 */
export function getCompletionPercentage(log: string[], createdAt: number): number {
  const today = getTodayString();
  const logSet = new Set(log);
  const daysSinceCreation = Math.floor((Date.now() - createdAt) / 86_400_000);
  const daysToCheck = Math.min(30, daysSinceCreation + 1);

  if (daysToCheck <= 0) return 0;

  let completed = 0;
  for (let i = 0; i < daysToCheck; i++) {
    if (logSet.has(addDays(today, -i))) completed++;
  }

  return Math.round((completed / daysToCheck) * 100);
}

// ─── 7-Day Strip ─────────────────────────────────────────────────────────────

export type DayStatus = "done" | "missed";

/**
 * Returns statuses for the last 7 days.
 * Index 0 = 6 days ago, index 6 = today.
 */
export function getLast7DayStatuses(log: string[]): DayStatus[] {
  const today = getTodayString();
  const logSet = new Set(log);
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, -(6 - i));
    return logSet.has(d) ? "done" : "missed";
  });
}

// ─── Sorting ──────────────────────────────────────────────────────────────────

export type HabitSortOption = "name" | "currentStreak" | "longestStreak" | "createdAt";

import type { Habit } from "../types/habit";

export function sortHabits(habits: Habit[], sortBy: HabitSortOption): Habit[] {
  return [...habits].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "currentStreak") return getCurrentStreak(b.completionLog) - getCurrentStreak(a.completionLog);
    if (sortBy === "longestStreak") return getLongestStreak(b.completionLog) - getLongestStreak(a.completionLog);
    return b.createdAt - a.createdAt;
  });
}
