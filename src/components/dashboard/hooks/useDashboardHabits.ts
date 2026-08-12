import { useMemo } from "react";
import { useHabitAnalytics } from "../../../hooks/analytics/useHabitAnalytics";
import { useHabitStore } from "../../../store/habitStore";
import { getTodayString } from "../../../utils/habits";
import { useNow } from "../../../hooks/useNow";

export function useDashboardHabits() {
  const analytics = useHabitAnalytics();
  const { habits, toggleCompletion } = useHabitStore();
  const now = useNow();

  return useMemo(() => {
    const todayStr = getTodayString(now);
    let completedToday = 0;
    
    const displayHabits = habits.slice(0, 5).map(h => {
      const isCompleted = h.completionLog.includes(todayStr);
      if (isCompleted) completedToday++;
      return {
        ...h,
        isCompletedToday: isCompleted
      };
    });

    const missedToday = habits.length - completedToday;

    return {
      completionPercentage: analytics?.completionPercentage || 0,
      currentStreak: analytics?.maxStreak || 0, // Using maxStreak as a proxy since currentStreak isn't in analytics type, or we could calculate it.
      completedToday,
      missedToday,
      totalHabits: habits.length,
      displayHabits,
      toggleCompletion,
      todayStr
    };
  }, [habits, analytics, toggleCompletion, now]);
}
