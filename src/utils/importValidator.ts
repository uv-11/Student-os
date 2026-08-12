import type { Assignment } from "../types/assignment";
import type { Habit } from "../types/habit";

export interface BackupData {
  version?: string;
  exportedAt?: number;
  assignments?: unknown[];
  habits?: unknown[];
  attendance?: unknown;
}

export function validateAssignment(item: unknown): item is Assignment {
  if (typeof item !== "object" || item === null) return false;
  const a = item as Record<string, unknown>;
  
  if (typeof a.id !== "string" || !a.id.trim()) return false;
  if (typeof a.title !== "string" || !a.title.trim()) return false;
  
  const validPriorities = ["low", "medium", "high", "urgent"];
  if (typeof a.priority !== "string" || !validPriorities.includes(a.priority)) return false;
  
  const validStatuses = ["todo", "in_progress", "completed"];
  if (typeof a.status !== "string" || !validStatuses.includes(a.status)) return false;

  if (typeof a.createdAt !== "number" || isNaN(a.createdAt)) return false;
  if (typeof a.updatedAt !== "number" || isNaN(a.updatedAt)) return false;

  if (a.description !== undefined && typeof a.description !== "string") return false;
  if (a.dueDate !== undefined && (typeof a.dueDate !== "number" || isNaN(a.dueDate))) return false;
  if (a.subjectId !== undefined && typeof a.subjectId !== "string") return false;
  if (a.courseId !== undefined && typeof a.courseId !== "string") return false;

  return true;
}

export function validateHabit(item: unknown): item is Habit {
  if (typeof item !== "object" || item === null) return false;
  const h = item as Record<string, unknown>;

  if (typeof h.id !== "string" || !h.id.trim()) return false;
  if (typeof h.name !== "string" || !h.name.trim()) return false;
  if (!Array.isArray(h.completionLog)) return false;

  // Validate each log entry matches YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  for (const dateStr of h.completionLog) {
    if (typeof dateStr !== "string" || !dateRegex.test(dateStr)) return false;
  }

  if (typeof h.createdAt !== "number" || isNaN(h.createdAt)) return false;
  if (typeof h.updatedAt !== "number" || isNaN(h.updatedAt)) return false;

  if (h.description !== undefined && typeof h.description !== "string") return false;
  if (h.color !== undefined && typeof h.color !== "string") return false;
  if (h.icon !== undefined && typeof h.icon !== "string") return false;

  return true;
}

export function sanitizeString(val: string, maxLength: number = 1000): string {
  if (typeof val !== "string") return "";
  return val.slice(0, maxLength);
}
