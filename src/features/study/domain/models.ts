export type StudySessionId = string;

export interface StudySessionDomainModel {
  readonly id: StudySessionId;
  readonly title: string;
  readonly course: string;
  readonly courseId?: string;
  readonly durationMinutes: number;
  readonly date: number;
  readonly tags: readonly string[];
  readonly notes?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly confidence?: number;
  readonly revisionCount?: number;
  readonly resources?: readonly string[];
}

export interface CourseDistributionItem {
  readonly course: string;
  readonly courseId?: string;
  readonly totalMinutes: number;
  readonly totalHours: number;
  readonly percentage: number;
  readonly sessionCount: number;
}

export interface DailyStudyAggregate {
  readonly date: string; // YYYY-MM-DD
  readonly totalMinutes: number;
  readonly sessionCount: number;
}
