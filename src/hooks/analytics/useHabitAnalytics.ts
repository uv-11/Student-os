import { useMemo } from "react";
import { useHabitStore } from "../../store/habitStore";
import { parseISO } from "date-fns";

export function useHabitAnalytics() {
  const { habits } = useHabitStore();

  return useMemo(() => {
    if (habits.length === 0) return null;

    let totalCompletions = 0;
    let totalPossible = 0;
    const today = new Date();
    
    // For heatmap
    const allCompletionDates: Date[] = [];

    const habitsWithStats = habits.map(habit => {
      // Basic streak calculation (Current and Longest)
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak: number;

      // Sort logs descending
      const logs = [...habit.completionLog].sort((a, b) => b.localeCompare(a));
      
      logs.forEach(log => {
        allCompletionDates.push(parseISO(log));
      });

      // Calculate total possible since creation
      const createdDate = new Date(habit.createdAt);
      const daysSinceCreation = Math.max(1, Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      totalCompletions += logs.length;
      totalPossible += daysSinceCreation;

      // Simple longest streak
      // Note: This is an approximation. A real streak counts consecutive days.
      const logDates = logs.map(l => parseISO(l).getTime()).sort((a,b) => a - b);
      if (logDates.length > 0) {
        tempStreak = 1;
        longestStreak = 1;
        for (let i = 1; i < logDates.length; i++) {
          const diff = (logDates[i] - logDates[i-1]) / (1000 * 60 * 60 * 24);
          if (diff <= 1.5) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            tempStreak = 1;
          }
        }

        // Current streak
        const lastDate = new Date(logDates[logDates.length - 1]);
        const diffToToday = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffToToday <= 1.5) {
          currentStreak = tempStreak;
        }
      }

      return {
        ...habit,
        currentStreak,
        longestStreak,
        completionRate: (logs.length / daysSinceCreation) * 100
      };
    });

    const completionPercentage = totalPossible > 0 ? (totalCompletions / totalPossible) * 100 : 0;
    
    // Best streaks across all habits
    const maxStreak = Math.max(...habitsWithStats.map(h => h.longestStreak), 0);
    const bestHabit = habitsWithStats.find(h => h.longestStreak === maxStreak);

    return {
      completionPercentage,
      bestHabit,
      maxStreak,
      allCompletionDates,
      totalCompletions,
    };
  }, [habits]);
}
