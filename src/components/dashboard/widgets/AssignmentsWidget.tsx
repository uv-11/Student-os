import { FileText, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardAssignments } from "../hooks/useDashboardAssignments";
import { DashboardCard } from "../DashboardCard";
import { EmptyState } from "../../ui/EmptyState";
import { APP_ROUTES } from "../../../config/routes";

export function AssignmentsWidget() {
  const { dueToday, dueThisWeek, overdue, recentlyCompleted, totalCount } = useDashboardAssignments();

  if (totalCount === 0) {
    return (
      <DashboardCard title="Assignments" className="h-full flex flex-col">
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No assignments yet"
          description="Create your first assignment."
          action={
            <Link to={APP_ROUTES.ASSIGNMENTS} className="text-sm text-primary hover:underline font-medium">
              Add Assignment
            </Link>
          }
          className="flex-1"
        />
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Assignments" className="h-full flex flex-col">
      <div className="p-5 flex-1 flex flex-col justify-center gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-primary">{dueToday}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">Due Today</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-warning">{dueThisWeek}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">This Week</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-danger">{overdue}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">Overdue</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-success">{recentlyCompleted}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">Completed (7d)</span>
          </div>
        </div>
      </div>
      <div className="p-3 border-t border-border bg-card/50">
        <Link to={APP_ROUTES.ASSIGNMENTS} className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-full">
          View all assignments <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </DashboardCard>
  );
}
