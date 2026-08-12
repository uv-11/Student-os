import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { AssignmentStatus } from "../../types/assignmentStatus";
import { AssignmentPriority } from "../../types/assignmentPriority";
import type { AssignmentSortOption } from "../../utils/assignments";

type StatusFilter = AssignmentStatus | "ALL" | "ACTIVE";
type PriorityFilter = AssignmentPriority | "ALL";

interface AssignmentsToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (s: StatusFilter) => void;
  priorityFilter: PriorityFilter;
  onPriorityFilterChange: (p: PriorityFilter) => void;
  sortBy: AssignmentSortOption;
  onSortChange: (s: AssignmentSortOption) => void;
}

export type { StatusFilter, PriorityFilter };

export function AssignmentsToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sortBy,
  onSortChange,
}: AssignmentsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search assignments..."
          className="w-full pl-9 pr-3 py-1.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground transition-shadow"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Status filter */}
        <div className="flex items-center gap-1.5 bg-background border border-border rounded-md px-2 py-1">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
            className="bg-transparent text-xs font-medium focus:outline-none text-foreground appearance-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value={AssignmentStatus.TODO}>To Do</option>
            <option value={AssignmentStatus.IN_PROGRESS}>In Progress</option>
            <option value={AssignmentStatus.DONE}>Done</option>
          </select>
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-1.5 bg-background border border-border rounded-md px-2 py-1">
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value as PriorityFilter)}
            className="bg-transparent text-xs font-medium focus:outline-none text-foreground appearance-none cursor-pointer"
          >
            <option value="ALL">All Priority</option>
            <option value={AssignmentPriority.URGENT}>Urgent</option>
            <option value={AssignmentPriority.HIGH}>High</option>
            <option value={AssignmentPriority.MEDIUM}>Medium</option>
            <option value={AssignmentPriority.LOW}>Low</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 bg-background border border-border rounded-md px-2 py-1">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as AssignmentSortOption)}
            className="bg-transparent text-xs font-medium focus:outline-none text-foreground appearance-none cursor-pointer"
          >
            <option value="createdAt">Date Added</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>
    </div>
  );
}
