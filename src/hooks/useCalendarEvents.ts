import { useMemo } from "react";
import { useTodoStore } from "../store/todoStore";
import { useAssignmentStore } from "../store/assignmentStore";
import { usePomodoroStore } from "../store/pomodoroStore";
import { AssignmentStatus } from "../types/assignmentStatus";
import { PomodoroMode } from "../types/pomodoroMode";
import { useStudyStore } from "../store/studyStore";
import { useCalendarStore } from "../store/calendarStore";
import type { CalendarEvent } from "../types/calendar";

export function useCalendarEvents(): CalendarEvent[] {
  const { todos } = useTodoStore();
  const { assignments } = useAssignmentStore();
  const { sessions: pomodoroSessions } = usePomodoroStore();
  const { sessions: studySessions } = useStudyStore();
  const { events: customEvents } = useCalendarStore();

  return useMemo(() => {
    const events: CalendarEvent[] = [...customEvents];

    // Map Todos
    todos.forEach((todo) => {
      const eventDate = todo.dueDate;
      
      if (eventDate) {
        events.push({
          id: `todo-${todo.id}`,
          title: todo.title,
          date: eventDate,
          type: "task",
          color: "blue",
          isCompleted: todo.status === "completed",
          priority: todo.priority,
          description: todo.description,
        });
      }
    });

    // Map Assignments
    assignments.forEach((assignment) => {
      if (assignment.dueDate) {
        events.push({
          id: `assignment-${assignment.id}`,
          title: assignment.title,
          date: assignment.dueDate,
          type: "assignment",
          color: "indigo",
          isCompleted: assignment.status === AssignmentStatus.DONE,
          priority: assignment.priority,
          description: assignment.description,
        });
      }
    });

    // Map Pomodoros
    pomodoroSessions.forEach((session) => {
      events.push({
        id: `pomodoro-${session.id}`,
        title: `${session.mode === PomodoroMode.FOCUS ? "Focus" : "Break"} Session (${session.durationMinutes}m)`,
        date: session.completedAt,
        type: "pomodoro",
        color: "emerald",
        isCompleted: true,
      });
    });

    // Map Study Sessions
    studySessions.forEach((session) => {
      events.push({
        id: `study-${session.id}`,
        title: `Study: ${session.course} (${session.durationMinutes}m)`,
        date: session.date,
        type: "study",
        color: "violet",
        isCompleted: true,
        description: session.title,
      });
    });

    return events;
  }, [todos, assignments, pomodoroSessions, studySessions, customEvents]);
}
