import { type ResolvedAttendance } from "../../../features/attendance/services/types";
import { type Assignment } from "../../../types/assignment";
import { type Habit } from "../../../types/habit";
import { type StudySession } from "../../../types/study";
import { type PomodoroSession } from "../../../types/pomodoroSession";
import { PomodoroMode } from "../../../types/pomodoroMode";
import { AssignmentStatus } from "../../../types/assignmentStatus";

export type ActivityType = "attendance" | "assignment" | "habit" | "study" | "pomodoro";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: number;
  iconType: ActivityType;
}

export function getRecentAttendanceActivity(resolved: ResolvedAttendance[], subjectsMap: Record<string, string>): ActivityItem[] {
  return resolved
    .filter((r) => r.attendanceRecord !== null)
    .map((r) => {
      const subjectName = subjectsMap[r.attendanceRecord!.subjectId] || "Unknown Subject";
      return {
        id: `att-${r.attendanceRecord!.id}`,
        type: "attendance",
        title: `Marked ${r.attendanceRecord!.status.toLowerCase()}`,
        description: subjectName,
        timestamp: r.attendanceRecord!.date.getTime(),
        iconType: "attendance",
      };
    });
}

export function getRecentAssignmentActivity(assignments: Assignment[]): ActivityItem[] {
  const completed = assignments
    .filter((a) => a.status === AssignmentStatus.DONE && a.updatedAt)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 10); // arbitrary limit, since dashboard limits overall anyway

  return completed.map((a) => ({
    id: a.id,
    type: "assignment",
    title: a.title,
    description: `Completed assignment${a.courseId ? ` for ${a.courseId}` : ''}`,
    timestamp: a.updatedAt,
    iconType: "assignment",
  }));
}

export function getRecentHabitActivity(habits: Habit[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  habits.forEach((h) => {
    h.completionLog.forEach((dateStr) => {
      const timestamp = new Date(dateStr).getTime();
      items.push({
        id: `hab-${h.id}-${dateStr}`,
        type: "habit",
        title: "Completed Habit",
        description: h.name,
        timestamp,
        iconType: "habit",
      });
    });
  });
  return items;
}

export function getRecentStudyActivity(sessions: StudySession[]): ActivityItem[] {
  return sessions.map((s) => ({
    id: `stu-${s.id}`,
    type: "study",
    title: `Studied for ${s.durationMinutes}m`,
    description: s.title || s.course || "Study session",
    timestamp: s.createdAt,
    iconType: "study",
  }));
}

export function getRecentPomodoroActivity(sessions: PomodoroSession[]): ActivityItem[] {
  return sessions
    .filter((s) => s.mode === PomodoroMode.FOCUS)
    .map((s) => ({
      id: `pom-${s.id}`,
      type: "pomodoro",
      title: `Focus Session (${s.durationMinutes}m)`,
      description: "Completed pomodoro",
      timestamp: s.completedAt,
      iconType: "pomodoro",
    }));
}
