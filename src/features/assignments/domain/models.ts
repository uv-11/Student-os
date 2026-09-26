import { AssignmentPriority } from '../../../types/assignmentPriority';
import { AssignmentStatus } from '../../../types/assignmentStatus';

export { AssignmentPriority, AssignmentStatus };

export type AssignmentId = string;

export interface AssignmentDomainModel {
  readonly id: AssignmentId;
  readonly title: string;
  readonly description?: string;
  readonly subjectId?: string;
  readonly subjectName?: string;
  readonly courseId?: string;
  readonly dueDate?: number;
  readonly priority: AssignmentPriority;
  readonly status: AssignmentStatus;
  readonly links?: readonly string[];
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface AssignmentUrgencyAnalysis {
  readonly assignmentId: AssignmentId;
  readonly daysUntilDue: number | null;
  readonly isOverdue: boolean;
  readonly isDueSoon: boolean; // within 48 hours
  readonly urgencyScore: number; // 0 to 100+
}
