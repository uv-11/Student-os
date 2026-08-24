export type CalendarEventType = "assignment" | "task" | "pomodoro" | "study" | "custom";

export interface CalendarEvent {
  id: string;
  title: string;
  date: number; // Timestamp of the event (dueDate or completedAt)
  type: CalendarEventType;
  color: string;
  isCompleted?: boolean;
  priority?: string;
  description?: string;
  courseId?: string;
}
