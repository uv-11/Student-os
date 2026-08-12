import { useState } from "react";
import { Edit2, Trash2, Link2, FileText, Code } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

import { AssignmentStatusBadge } from "./AssignmentStatusBadge";
import { AssignmentPriorityBadge } from "./AssignmentPriorityBadge";
import { formatDueDate, getDueDateStatus } from "../../utils/assignments";
import { AssignmentStatus } from "../../types/assignmentStatus";
import { useAssignmentStore } from "../../store/assignmentStore";
import type { Assignment } from "../../types/assignment";

interface AssignmentCardProps {
  assignment: Assignment;
  onEdit: (assignment: Assignment) => void;
  onDeleteOverride?: () => void;
}

const DUE_DATE_COLORS: Record<string, string> = {
  overdue: "text-red-600 dark:text-red-400",
  today: "text-orange-600 dark:text-orange-400",
  soon: "text-amber-600 dark:text-amber-500",
  upcoming: "text-muted-foreground",
  none: "text-muted-foreground",
};

export function AssignmentCard({ assignment, onEdit, onDeleteOverride }: AssignmentCardProps) {
  const { updateAssignment, deleteAssignment } = useAssignmentStore();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isDone = assignment.status === AssignmentStatus.DONE;
  const dueDateStatus = getDueDateStatus(assignment.dueDate);

  const handleDelete = () => {
    if (isConfirmingDelete) {
      if (onDeleteOverride) {
        onDeleteOverride();
      } else {
        deleteAssignment(assignment.id);
      }
    } else {
      setIsConfirmingDelete(true);
    }
  };

  const handleToggleDone = () => {
    updateAssignment(assignment.id, {
      status: isDone ? AssignmentStatus.TODO : AssignmentStatus.DONE,
    });
  };

  return (
    <Card className={clsx("group p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center transition-all hover:shadow-md border border-border", isDone && "opacity-60")}>
      {/* Left section: Title, Subject, Dates */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* Done toggle checkbox */}
        <button
          onClick={handleToggleDone}
          aria-label={isDone ? "Mark as not done" : "Mark as done"}
          className={clsx(
            "mt-0.5 h-4 w-4 shrink-0 rounded border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 flex items-center justify-center",
            isDone
              ? "border-primary bg-primary"
              : "border-muted-foreground/30 hover:border-primary/50 bg-transparent"
          )}
        >
          {isDone && (
            <svg viewBox="0 0 12 12" className="h-3 w-3 text-primary-foreground" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={clsx("text-sm font-bold text-foreground leading-tight truncate", isDone && "line-through text-muted-foreground")}>
              {assignment.title}
            </h4>
            {isDone && (
              <span className="text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase tracking-wider">
                Done
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
            {assignment.subjectName && (
              <span className="font-medium">{assignment.subjectName}</span>
            )}
            {assignment.subjectName && <span className="opacity-50">•</span>}
            <span className={clsx("font-medium", DUE_DATE_COLORS[dueDateStatus])}>
              {formatDueDate(assignment.dueDate)}
            </span>
          </div>
          
          {assignment.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 opacity-80">
              {assignment.description}
            </p>
          )}

          {assignment.links && assignment.links.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              {assignment.links.map((link, idx) => {
                let Icon = Link2;
                let label = "Link";
                if (link.includes("github.com")) { label = "GitHub"; }
                else if (link.includes("drive.google.com")) { Icon = FileText; label = "Drive"; }
                else if (link.includes("youtube.com") || link.includes("youtu.be")) { label = "YouTube"; }
                else if (link.includes("leetcode.com")) { Icon = Code; label = "LeetCode"; }

                return (
                  <a 
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted hover:bg-muted-foreground/20 hover:text-foreground px-2 py-1 rounded-md transition-colors"
                    title={link}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right section: Badges and Actions */}
      <div className="flex items-center gap-3 sm:ml-auto pl-7 sm:pl-0 pt-2 sm:pt-0 justify-between sm:justify-end border-t border-border sm:border-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <AssignmentStatusBadge status={assignment.status} isOverdue={dueDateStatus === "overdue"} />
          <AssignmentPriorityBadge priority={assignment.priority} />
        </div>
        
        {isConfirmingDelete ? (
          <div className="flex items-center gap-1 shrink-0 bg-destructive/10 px-2 py-1 rounded-md border border-destructive/20">
            <span className="text-xs font-semibold text-destructive whitespace-nowrap hidden sm:inline-block">Delete?</span>
            <Button variant="ghost" size="sm" onClick={handleDelete} className="h-6 px-1.5 text-destructive hover:bg-destructive/20">Yes</Button>
            <Button variant="ghost" size="sm" onClick={() => setIsConfirmingDelete(false)} className="h-6 px-1.5 hover:bg-muted">No</Button>
          </div>
        ) : (
          <div className="flex gap-0.5 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onEdit(assignment)} aria-label="Edit assignment" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted">
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete} aria-label="Delete assignment" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
