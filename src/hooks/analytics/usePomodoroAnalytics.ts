import { useMemo } from "react";
import { usePomodoroStore } from "../../store/pomodoroStore";
import { format, subDays, startOfDay } from "date-fns";
import { PomodoroMode } from "../../types/pomodoroMode";
import { useNow } from "../useNow";

export function usePomodoroAnalytics() {
  const { sessions } = usePomodoroStore();
  const now = useNow();

  return useMemo(() => {
    if (sessions.length === 0) return null;

    const focusSessions = sessions.filter(s => s.mode === PomodoroMode.FOCUS);
    const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalFocusHours = totalFocusMinutes / 60;

    const today = startOfDay(now);
    
    let todayMinutes = 0;
    let thisWeekMinutes = 0;

    // Daily breakdown for the last 7 days
    const last7DaysMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      last7DaysMap.set(format(subDays(today, i), "MMM dd"), 0);
    }

    focusSessions.forEach(s => {
      const d = new Date(s.completedAt);
      const dateStr = format(d, "MMM dd");
      
      if (last7DaysMap.has(dateStr)) {
        last7DaysMap.set(dateStr, last7DaysMap.get(dateStr)! + s.durationMinutes);
      }

      const diffDays = (today.getTime() - startOfDay(d).getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 0) todayMinutes += s.durationMinutes;
      if (diffDays >= 0 && diffDays < 7) thisWeekMinutes += s.durationMinutes;
    });

    const chartData = Array.from(last7DaysMap.entries()).map(([date, minutes]) => ({
      date,
      hours: (minutes / 60).toFixed(1)
    }));

    const dailyAverage = (thisWeekMinutes / 7) / 60; // in hours

    return {
      totalFocusHours,
      totalFocusMinutes,
      todayMinutes,
      thisWeekMinutes,
      dailyAverage,
      sessionsCompleted: focusSessions.length,
      chartData,
    };
  }, [sessions, now]);
}
