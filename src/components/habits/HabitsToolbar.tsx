import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import type { HabitSortOption } from "../../utils/habits";

export type HabitFilter = "ALL" | "COMPLETED_TODAY" | "NOT_COMPLETED" | "ACTIVE";

interface HabitsToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filter: HabitFilter;
  onFilterChange: (f: HabitFilter) => void;
  sortBy: HabitSortOption;
  onSortChange: (s: HabitSortOption) => void;
}

export function HabitsToolbar({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  sortBy,
  onSortChange,
}: HabitsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search habits..."
          className="w-full pl-9 pr-3 py-1.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground transition-shadow"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Filter */}
        <div className="flex items-center gap-1.5 bg-background border border-border rounded-md px-2 py-1">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as HabitFilter)}
            className="bg-transparent text-xs font-medium focus:outline-none text-foreground appearance-none cursor-pointer"
          >
            <option value="ALL">All Habits</option>
            <option value="ACTIVE">Active (7 days)</option>
            <option value="COMPLETED_TODAY">Completed Today</option>
            <option value="NOT_COMPLETED">Not Completed</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 bg-background border border-border rounded-md px-2 py-1">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as HabitSortOption)}
            className="bg-transparent text-xs font-medium focus:outline-none text-foreground appearance-none cursor-pointer"
          >
            <option value="createdAt">Date Added</option>
            <option value="name">Name (A-Z)</option>
            <option value="currentStreak">Current Streak</option>
            <option value="longestStreak">Longest Streak</option>
          </select>
        </div>
      </div>
    </div>
  );
}
