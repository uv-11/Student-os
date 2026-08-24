export type CourseType = "academic" | "personal" | "skill";

export interface Course {
  id: string;
  name: string;
  type: CourseType;
  emoji?: string;
  color?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;

  // Future Compatibility Fields
  code?: string;
  targetAttendancePercentage?: number;
  credits?: number;
  semester?: string;
  section?: string;
  teacher?: string;
  attendanceWeight?: number;
}
