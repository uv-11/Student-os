export type ActivityType = 
  | "CLASS"
  | "ASSIGNMENT_DEADLINE"
  | "STUDY_SESSION"
  | "POMODORO"
  | "HABIT"
  | "CALENDAR_EVENT";

export interface Activity {
  id: string; // Unique identifier for the projection
  type: ActivityType;
  timestamp: number; // For chronological sorting
  entityId: string; // Original ID from the source domain
  title: string;
  source: string; // Domain string, e.g., "ATTENDANCE", "STUDY"
  courseId?: string;
  metadata?: Record<string, unknown>; // Flexible field for specific UI rendering needs
}
