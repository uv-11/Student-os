import { useMemo } from "react";
import { useAttendanceData } from "../../../features/attendance/application/hooks";
import { useAssignmentStore } from "../../../store/assignmentStore";
import { useHabitStore } from "../../../store/habitStore";
import { useStudyStore } from "../../../store/studyStore";
import { usePomodoroStore } from "../../../store/pomodoroStore";
import {
  getRecentAttendanceActivity,
  getRecentAssignmentActivity,
  getRecentHabitActivity,
  getRecentPomodoroActivity,
  getRecentStudyActivity,
} from "../utils/activityAdapters";
import type { ActivityItem } from "../utils/activityAdapters";

export function useDashboardActivity(limit: number = 20) {
  const { resolvedAttendance, subjects } = useAttendanceData();
  const { assignments } = useAssignmentStore();
  const { habits } = useHabitStore();
  const { sessions: studySessions } = useStudyStore();
  const { sessions: pomodoroSessions } = usePomodoroStore();

  return useMemo(() => {
    const subjectsMap = subjects.reduce((acc, sub) => {
      acc[sub.id] = sub.name;
      return acc;
    }, {} as Record<string, string>);

    const allActivities: ActivityItem[] = [
      ...getRecentAttendanceActivity(resolvedAttendance, subjectsMap),
      ...getRecentAssignmentActivity(assignments),
      ...getRecentHabitActivity(habits),
      ...getRecentStudyActivity(studySessions),
      ...getRecentPomodoroActivity(pomodoroSessions),
    ];

    allActivities.sort((a, b) => b.timestamp - a.timestamp);

    return allActivities.slice(0, limit);
  }, [resolvedAttendance, subjects, assignments, habits, studySessions, pomodoroSessions, limit]);
}
