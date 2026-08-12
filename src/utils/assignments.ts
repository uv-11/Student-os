import { AssignmentPriority } from "../types/assignmentPriority";
import { AssignmentStatus } from "../types/assignmentStatus";
import type { Assignment } from "../types/assignment";

// ─── Due Date Helpers ────────────────────────────────────────────────────────

export type DueDateStatus = "overdue" | "today" | "soon" | "upcoming" | "none";

export function getDueDateStatus(dueDate?: number): DueDateStatus {
  if (!dueDate) return "none";

  const now = new Date();
  const due = new Date(dueDate);

  // Compare calendar days, not exact ms
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDay.getTime() - nowDay.getTime()) / 86_400_000);

  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 2) return "soon";
  return "upcoming";
}

export function formatDueDate(dueDate?: number): string {
  if (!dueDate) return "No deadline";

  const status = getDueDateStatus(dueDate);
  const due = new Date(dueDate);
  const now = new Date();
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.abs(Math.round((dueDay.getTime() - nowDay.getTime()) / 86_400_000));

  if (status === "overdue") {
    return diffDays === 1 ? "Overdue by 1 day" : `Overdue by ${diffDays} days`;
  }
  if (status === "today") return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (status === "soon") return `Due in ${diffDays} days`;
  return due.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Converts a YYYY-MM-DD string (from <input type="date">) to a Unix timestamp (ms). */
export function dateInputToTimestamp(value: string): number | undefined {
  if (!value) return undefined;
  const d = new Date(value + "T00:00:00");
  return isNaN(d.getTime()) ? undefined : d.getTime();
}

/** Converts a Unix timestamp (ms) to a YYYY-MM-DD string for <input type="date">. */
export function timestampToDateInput(ts?: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Priority Helpers ────────────────────────────────────────────────────────

function getPriorityOrder(priority: AssignmentPriority): number {
  const order: Record<AssignmentPriority, number> = {
    [AssignmentPriority.URGENT]: 0,
    [AssignmentPriority.HIGH]: 1,
    [AssignmentPriority.MEDIUM]: 2,
    [AssignmentPriority.LOW]: 3,
  };
  return order[priority];
}

// ─── Sorting ────────────────────────────────────────────────────────────────

export type AssignmentSortOption = "dueDate" | "priority" | "status" | "createdAt";

const STATUS_ORDER: Record<AssignmentStatus, number> = {
  [AssignmentStatus.TODO]: 0,
  [AssignmentStatus.IN_PROGRESS]: 1,
  [AssignmentStatus.DONE]: 2,
};

export function sortAssignments(
  assignments: Assignment[],
  sortBy: AssignmentSortOption
): Assignment[] {
  return [...assignments].sort((a, b) => {
    if (sortBy === "dueDate") {
      // No deadline goes to the bottom
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate - b.dueDate; // Earliest first
    }
    if (sortBy === "priority") {
      return getPriorityOrder(a.priority) - getPriorityOrder(b.priority);
    }
    if (sortBy === "status") {
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    }
    return b.createdAt - a.createdAt; // Newest first
  });
}
