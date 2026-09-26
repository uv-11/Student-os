import { describe, it, expect } from 'vitest';
import { AssignmentPriorityEngine } from './priority-engine';
import { AssignmentPriority, AssignmentStatus } from '../domain/models';

describe('AssignmentPriorityEngine', () => {
  const now = 1770000000000; // Fixed timestamp for deterministic tests

  it('marks DONE assignments with 0 urgency score regardless of due date', () => {
    const analysis = AssignmentPriorityEngine.analyzeUrgency(
      {
        id: 'done-1',
        dueDate: now - 10000,
        priority: AssignmentPriority.URGENT,
        status: AssignmentStatus.DONE,
      },
      now
    );

    expect(analysis.urgencyScore).toBe(0);
    expect(analysis.isOverdue).toBe(false);
  });

  it('flags overdue assignment when dueDate < now and status !== DONE', () => {
    const analysis = AssignmentPriorityEngine.analyzeUrgency(
      {
        id: 'overdue-1',
        dueDate: now - 3600000, // 1 hour ago
        priority: AssignmentPriority.HIGH,
        status: AssignmentStatus.IN_PROGRESS,
      },
      now
    );

    expect(analysis.isOverdue).toBe(true);
    expect(analysis.isDueSoon).toBe(false);
    // Base HIGH (30) + Overdue (60) = 90
    expect(analysis.urgencyScore).toBe(90);
  });

  it('flags due soon when due within 48 hours', () => {
    const analysis = AssignmentPriorityEngine.analyzeUrgency(
      {
        id: 'soon-1',
        dueDate: now + 36 * 3600000, // 36 hours from now
        priority: AssignmentPriority.URGENT,
        status: AssignmentStatus.TODO,
      },
      now
    );

    expect(analysis.isDueSoon).toBe(true);
    expect(analysis.isOverdue).toBe(false);
    // Base URGENT (40) + within 48h (30) = 70
    expect(analysis.urgencyScore).toBe(70);
  });

  it('sorts assignments correctly by urgency', () => {
    const assignments = [
      { id: 'low-future', dueDate: now + 10 * 86400000, priority: AssignmentPriority.LOW, status: AssignmentStatus.TODO },
      { id: 'urgent-due-tomorrow', dueDate: now + 20 * 3600000, priority: AssignmentPriority.URGENT, status: AssignmentStatus.TODO },
      { id: 'completed', dueDate: now - 86400000, priority: AssignmentPriority.URGENT, status: AssignmentStatus.DONE },
    ];

    const sorted = AssignmentPriorityEngine.sortByUrgency(assignments, now);
    expect(sorted[0].id).toBe('urgent-due-tomorrow');
    expect(sorted[1].id).toBe('low-future');
    expect(sorted[2].id).toBe('completed');
  });

  it('groups assignments into kanban status buckets', () => {
    const list = [
      { id: '1', status: AssignmentStatus.TODO },
      { id: '2', status: AssignmentStatus.IN_PROGRESS },
      { id: '3', status: AssignmentStatus.DONE },
      { id: '4', status: AssignmentStatus.TODO },
    ];

    const grouped = AssignmentPriorityEngine.groupByStatus(list);
    expect(grouped[AssignmentStatus.TODO]).toHaveLength(2);
    expect(grouped[AssignmentStatus.IN_PROGRESS]).toHaveLength(1);
    expect(grouped[AssignmentStatus.DONE]).toHaveLength(1);
  });
});
