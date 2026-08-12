import { useMemo } from "react";
import { useStudyStore } from "../../store/studyStore";
import { format, startOfWeek, startOfMonth } from "date-fns";
import { useNow } from "../useNow";

export function useStudyAnalytics() {
  const { sessions } = useStudyStore();
  const now = useNow();

  return useMemo(() => {
    if (sessions.length === 0) return null;

    let totalMinutes = 0;
    let thisWeekMinutes = 0;
    let thisMonthMinutes = 0;
    let todayMinutes = 0;

    const courseDistribution = new Map<string, number>();
    const allSessionDates: Date[] = [];

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }).getTime();
    const monthStart = startOfMonth(now).getTime();

    // To calculate streaks, we need unique sorted days
    const uniqueDays = new Set<string>();

    sessions.forEach(session => {
      const d = new Date(session.date);
      allSessionDates.push(d);
      
      const sessionTime = session.date;
      
      totalMinutes += session.durationMinutes;

      if (sessionTime >= todayStart) {
        todayMinutes += session.durationMinutes;
      }
      if (sessionTime >= weekStart) {
        thisWeekMinutes += session.durationMinutes;
      }
      if (sessionTime >= monthStart) {
        thisMonthMinutes += session.durationMinutes;
      }

      const currentCourseTotal = courseDistribution.get(session.course) || 0;
      courseDistribution.set(session.course, currentCourseTotal + session.durationMinutes);

      uniqueDays.add(format(d, "yyyy-MM-dd"));
    });

    const averageSessionLength = totalMinutes / sessions.length;

    let favoriteCourse = { name: "—", minutes: 0 };
    const pieData: { name: string; value: number; color: string }[] = [];
    const colors = ["#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#3b82f6"];

    let i = 0;
    for (const [course, minutes] of courseDistribution.entries()) {
      if (minutes > favoriteCourse.minutes) {
        favoriteCourse = { name: course, minutes };
      }
      pieData.push({
        name: course,
        value: Number((minutes / 60).toFixed(1)), // hours
        color: colors[i % colors.length],
      });
      i++;
    }

    // Longest Streak calculation
    const sortedDays = Array.from(uniqueDays).sort();
    let longestStreak = 0;
    let currentStreak = 0;
    
    if (sortedDays.length > 0) {
      currentStreak = 1;
      longestStreak = 1;
      for (let j = 1; j < sortedDays.length; j++) {
        const diff = (new Date(sortedDays[j]).getTime() - new Date(sortedDays[j-1]).getTime()) / (1000 * 60 * 60 * 24);
        if (diff <= 1.5) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
    }

    return {
      todayMinutes,
      thisWeekHours: thisWeekMinutes / 60,
      thisMonthHours: thisMonthMinutes / 60,
      averageSessionLength,
      favoriteCourse,
      longestStreak,
      currentStreak,
      courseDistribution: pieData.sort((a, b) => b.value - a.value),
      allSessionDates,
    };
  }, [sessions, now]);
}
