import { useMemo } from "react";
import { useAssignmentStore } from "../../../store/assignmentStore";
import { useAttendanceData } from "../../attendance/application/hooks";
import { useStudyStore } from "../../../store/studyStore";
import { usePomodoroStore } from "../../../store/pomodoroStore";
import { useCalendarStore } from "../../../store/calendarStore";
import { useHabitStore } from "../../../store/habitStore";
import type { Activity } from "../types";
import { getTodayString } from "../../../utils/habits";
import { useNow } from "../../../hooks/useNow";
import { startOfDay } from "date-fns";

export function useActivityProjection(): Activity[] {
  const { assignments } = useAssignmentStore();
  const { todayAttendance } = useAttendanceData();
  const { sessions: studySessions } = useStudyStore();
  const { sessions: pomodoroSessions } = usePomodoroStore();
  const { events: calendarEvents } = useCalendarStore();
  const { habits } = useHabitStore();
  const now = useNow();
  const todayStr = getTodayString(now);
  const todayStart = startOfDay(now);

  return useMemo(() => {
    const activities: Activity[] = [];

    // 1. Assignments
    assignments.forEach(assignment => {
      if (assignment.dueDate) {
        activities.push({
          id: `assignment-${assignment.id}`,
          type: "ASSIGNMENT_DEADLINE",
          timestamp: assignment.dueDate,
          entityId: assignment.id,
          title: assignment.title,
          source: "ASSIGNMENT",
          courseId: assignment.courseId,
          metadata: { status: assignment.status, priority: assignment.priority }
        });
      }
    });

    // 2. Attendance / Classes (Today's scheduled classes)
    todayAttendance.forEach(item => {
      // Assuming item.expectedClass.startTime is "HH:mm"
      const [hours, minutes] = item.expectedClass.startTime.split(":").map(Number);
      const classDate = new Date(todayStart);
      classDate.setHours(hours, minutes, 0, 0);

      activities.push({
        id: `class-${item.expectedClass.timetableSlotId}-${item.expectedClass.date.getTime()}`,
        type: "CLASS",
        timestamp: classDate.getTime(),
        entityId: item.expectedClass.timetableSlotId || "unknown",
        title: "Class",
        source: "ATTENDANCE",
        courseId: item.expectedClass.subjectId, // Migrated to courseId under the hood
        metadata: {
           status: item.attendanceRecord?.status, 
           endTime: item.expectedClass.endTime
        }
      });
    });

    // 3. Study Sessions
    studySessions.forEach(session => {
      activities.push({
        id: `study-${session.id}`,
        type: "STUDY_SESSION",
        timestamp: session.date,
        entityId: session.id,
        title: session.title || "Study Session",
        source: "STUDY",
        courseId: session.courseId,
        metadata: { durationMinutes: session.durationMinutes }
      });
    });

    // 4. Pomodoro Sessions
    pomodoroSessions.forEach(session => {
      activities.push({
        id: `pomodoro-${session.id}`,
        type: "POMODORO",
        timestamp: session.completedAt,
        entityId: session.id,
        title: "Focus Session",
        source: "POMODORO",
        courseId: session.courseId,
        metadata: { mode: session.mode, durationMinutes: session.durationMinutes }
      });
    });

    // 5. Calendar Events
    calendarEvents.forEach(event => {
      activities.push({
        id: `calendar-${event.id}`,
        type: "CALENDAR_EVENT",
        timestamp: event.date,
        entityId: event.id,
        title: event.title,
        source: "CALENDAR",
        metadata: { type: event.type }
      });
    });

    // 6. Habits (Only recording today's completions for the timeline)
    habits.forEach(habit => {
      if (habit.completionLog.includes(todayStr)) {
        activities.push({
          id: `habit-${habit.id}-${todayStr}`,
          type: "HABIT",
          timestamp: now.getTime(), // Using now for timeline display if done today
          entityId: habit.id,
          title: habit.name,
          source: "HABIT",
          courseId: habit.courseId
        });
      }
    });

    // Sort chronologically
    return activities.sort((a, b) => a.timestamp - b.timestamp);
  }, [assignments, todayAttendance, studySessions, pomodoroSessions, calendarEvents, habits, todayStr, now, todayStart]);
}
