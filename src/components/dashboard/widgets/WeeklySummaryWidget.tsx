import { useDashboardAssignments } from "../hooks/useDashboardAssignments";
import { useDashboardFocus } from "../hooks/useDashboardFocus";
import { useDashboardHabits } from "../hooks/useDashboardHabits";
import { useTaskAnalytics } from "../../../hooks/analytics/useTaskAnalytics";
import { DashboardCard } from "../DashboardCard";

export function WeeklySummaryWidget() {
  const { overdue } = useDashboardAssignments();
  const { weeklyFocusMinutes } = useDashboardFocus();
  const { currentStreak } = useDashboardHabits();
  const tasks = useTaskAnalytics();

  return (
    <div className="flex flex-col mb-8">
      <h2 className="text-lg font-semibold tracking-tight mb-4">Weekly Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardCard className="p-4 hover:border-primary transition-colors h-full flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Task Completion</div>
          <div className="text-xl font-bold tracking-tight text-foreground">{tasks ? `${tasks.completionRate.toFixed(1)}%` : "—"}</div>
        </DashboardCard>
        <DashboardCard className="p-4 hover:border-primary transition-colors h-full flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Focus Time</div>
          <div className="text-xl font-bold tracking-tight text-foreground">{(weeklyFocusMinutes / 60).toFixed(1)}h</div>
        </DashboardCard>
        <DashboardCard className="p-4 hover:border-primary transition-colors h-full flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Best Streak</div>
          <div className="text-xl font-bold tracking-tight text-foreground">{currentStreak} days</div>
        </DashboardCard>
        <DashboardCard className="p-4 hover:border-primary transition-colors h-full flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Overdue Tasks</div>
          <div className="text-xl font-bold tracking-tight text-danger">{overdue}</div>
        </DashboardCard>
      </div>
    </div>
  );
}
