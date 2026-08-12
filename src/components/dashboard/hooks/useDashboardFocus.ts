import { useMemo } from "react";
import { usePomodoroAnalytics } from "../../../hooks/analytics/usePomodoroAnalytics";
import { useStudyAnalytics } from "../../../hooks/analytics/useStudyAnalytics";
import { usePomodoroStore } from "../../../store/pomodoroStore";
import { useStudyStore } from "../../../store/studyStore";
import { PomodoroMode } from "../../../types/pomodoroMode";

export function useDashboardFocus() {
  const pomodoroAnalytics = usePomodoroAnalytics();
  const studyAnalytics = useStudyAnalytics();
  const { sessions: pomodoroSessions } = usePomodoroStore();
  const { sessions: studySessions } = useStudyStore();

  return useMemo(() => {
    const todayPomodoroMinutes = pomodoroAnalytics?.todayMinutes || 0;
    const todayStudyMinutes = studyAnalytics?.todayMinutes || 0;
    const todayFocusMinutes = todayPomodoroMinutes + todayStudyMinutes;

    const weeklyPomodoroMinutes = pomodoroAnalytics?.thisWeekMinutes || 0;
    const weeklyStudyMinutes = studyAnalytics ? studyAnalytics.thisWeekHours * 60 : 0;
    const weeklyFocusMinutes = weeklyPomodoroMinutes + weeklyStudyMinutes;

    // Find most recent session
    let recentSession = null;
    const lastPomodoro = pomodoroSessions.find(s => s.mode === PomodoroMode.FOCUS);
    const lastStudy = studySessions.length > 0 ? studySessions[studySessions.length - 1] : null; // Assuming ordered, but we can sort

    if (lastPomodoro && lastStudy) {
      if (lastPomodoro.completedAt > lastStudy.createdAt) {
        recentSession = { type: 'pomodoro', minutes: lastPomodoro.durationMinutes, timestamp: lastPomodoro.completedAt };
      } else {
        recentSession = { type: 'study', minutes: lastStudy.durationMinutes, timestamp: lastStudy.createdAt, course: lastStudy.course };
      }
    } else if (lastPomodoro) {
      recentSession = { type: 'pomodoro', minutes: lastPomodoro.durationMinutes, timestamp: lastPomodoro.completedAt };
    } else if (lastStudy) {
      recentSession = { type: 'study', minutes: lastStudy.durationMinutes, timestamp: lastStudy.createdAt, course: lastStudy.course };
    }

    return {
      todayFocusMinutes,
      weeklyFocusMinutes,
      recentSession
    };
  }, [pomodoroAnalytics, studyAnalytics, pomodoroSessions, studySessions]);
}
