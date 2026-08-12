import { clsx } from "clsx";
import { AssignmentStatus } from "../../types/assignmentStatus";

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  [AssignmentStatus.TODO]: "To Do",
  [AssignmentStatus.IN_PROGRESS]: "In Progress",
  [AssignmentStatus.DONE]: "Done",
};

const STATUS_STYLES: Record<AssignmentStatus, string> = {
  [AssignmentStatus.TODO]:
    "bg-slate-100 text-muted-foreground border-slate-200 dark:bg-slate-800 dark:text-muted-foreground dark:border-slate-700",
  [AssignmentStatus.IN_PROGRESS]:
    "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  [AssignmentStatus.DONE]:
    "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
};

interface AssignmentStatusBadgeProps {
  status: AssignmentStatus;
  isOverdue?: boolean;
  className?: string;
}

export function AssignmentStatusBadge({ status, isOverdue, className }: AssignmentStatusBadgeProps) {
  const isActuallyOverdue = isOverdue && status !== AssignmentStatus.DONE;
  
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
        isActuallyOverdue
          ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
          : STATUS_STYLES[status],
        className
      )}
    >
      {isActuallyOverdue ? "Overdue" : STATUS_LABELS[status]}
    </span>
  );
}
