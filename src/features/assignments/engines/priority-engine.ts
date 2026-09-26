import type { AssignmentDomainModel, AssignmentUrgencyAnalysis } from '../domain/models';
import { AssignmentPriority, AssignmentStatus } from '../domain/models';

export class AssignmentPriorityEngine {
  /**
   * Analyzes an assignment's deadline and priority to compute its urgency score.
   */
  static analyzeUrgency(
    assignment: Pick<AssignmentDomainModel, 'id' | 'dueDate' | 'priority' | 'status'>,
    now: number = Date.now()
  ): AssignmentUrgencyAnalysis {
    if (assignment.status === AssignmentStatus.DONE) {
      return {
        assignmentId: assignment.id,
        daysUntilDue: assignment.dueDate ? (assignment.dueDate - now) / 86400000 : null,
        isOverdue: false,
        isDueSoon: false,
        urgencyScore: 0,
      };
    }

    const priorityWeights: Record<AssignmentPriority, number> = {
      [AssignmentPriority.URGENT]: 40,
      [AssignmentPriority.HIGH]: 30,
      [AssignmentPriority.MEDIUM]: 20,
      [AssignmentPriority.LOW]: 10,
    };

    const baseWeight = priorityWeights[assignment.priority] || 10;

    if (!assignment.dueDate) {
      return {
        assignmentId: assignment.id,
        daysUntilDue: null,
        isOverdue: false,
        isDueSoon: false,
        urgencyScore: baseWeight,
      };
    }

    const diffMs = assignment.dueDate - now;
    const daysUntilDue = diffMs / 86400000;
    const isOverdue = diffMs < 0;
    const isDueSoon = !isOverdue && diffMs <= 48 * 3600000;

    let deadlineScore: number;
    if (isOverdue) {
      deadlineScore = 60; // critical attention needed
    } else if (diffMs <= 24 * 3600000) {
      deadlineScore = 45; // due within 24h
    } else if (diffMs <= 48 * 3600000) {
      deadlineScore = 30; // due within 48h
    } else if (diffMs <= 7 * 86400000) {
      deadlineScore = 15; // due within 7 days
    } else {
      deadlineScore = 5;
    }

    return {
      assignmentId: assignment.id,
      daysUntilDue: Math.round(daysUntilDue * 10) / 10,
      isOverdue,
      isDueSoon,
      urgencyScore: baseWeight + deadlineScore,
    };
  }

  /**
   * Sorts assignments by calculated urgency in descending order.
   */
  static sortByUrgency<T extends Pick<AssignmentDomainModel, 'id' | 'dueDate' | 'priority' | 'status'>>(
    assignments: T[],
    now: number = Date.now()
  ): T[] {
    return [...assignments].sort((a, b) => {
      const scoreA = this.analyzeUrgency(a, now).urgencyScore;
      const scoreB = this.analyzeUrgency(b, now).urgencyScore;
      return scoreB - scoreA;
    });
  }

  /**
   * Groups assignments by Kanban status.
   */
  static groupByStatus<T extends Pick<AssignmentDomainModel, 'status'>>(
    assignments: T[]
  ): Record<AssignmentStatus, T[]> {
    const groups: Record<AssignmentStatus, T[]> = {
      [AssignmentStatus.TODO]: [],
      [AssignmentStatus.IN_PROGRESS]: [],
      [AssignmentStatus.DONE]: [],
    };

    for (const item of assignments) {
      if (groups[item.status]) {
        groups[item.status].push(item);
      }
    }

    return groups;
  }
}
