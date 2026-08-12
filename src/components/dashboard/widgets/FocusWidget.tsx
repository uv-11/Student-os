import { Target, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDashboardFocus } from "../hooks/useDashboardFocus";
import { DashboardCard } from "../DashboardCard";
import { EmptyState } from "../../ui/EmptyState";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";

export function FocusWidget() {
  const { todayFocusMinutes, weeklyFocusMinutes, recentSession } = useDashboardFocus();

  if (todayFocusMinutes === 0 && weeklyFocusMinutes === 0) {
    return (
      <DashboardCard title="Focus" className="h-full flex flex-col">
        <EmptyState
          icon={<Target className="h-6 w-6" />}
          title="No focus time yet"
          description="Start a study session or pomodoro timer."
          action={
            <Link to={APP_ROUTES.POMODORO} className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
              <Play className="h-3 w-3" /> Start Session
            </Link>
          }
          className="flex-1"
        />
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Focus" className="h-full flex flex-col">
      <div className="p-5 flex-1 flex flex-col justify-center gap-6">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Focus Today</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">{Math.floor(todayFocusMinutes / 60)}</span>
              <span className="text-sm text-muted-foreground font-medium">h</span>
              <span className="text-3xl font-bold tracking-tight ml-1">{Math.round(todayFocusMinutes % 60)}</span>
              <span className="text-sm text-muted-foreground font-medium">m</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-card border border-border shadow-sm text-success flex items-center justify-center">
            <Target className="h-5 w-5" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1">This Week</span>
            <span className="font-semibold">{(weeklyFocusMinutes / 60).toFixed(1)}h</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1">Recent</span>
            {recentSession ? (
              <div className="flex flex-col">
                <span className="font-semibold text-sm capitalize">{recentSession.type} {recentSession.course ? `(${recentSession.course})` : ''}</span>
                <span className="text-xs text-muted-foreground">{formatDistanceToNow(recentSession.timestamp)} ago</span>
              </div>
            ) : (
              <span className="text-sm font-medium">—</span>
            )}
          </div>
        </div>
      </div>
      <div className="p-3 border-t border-border bg-card/50 flex divide-x divide-border">
        <Link to={APP_ROUTES.POMODORO} className="flex-1 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          Pomodoro
        </Link>
        <Link to={APP_ROUTES.STUDY} className="flex-1 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          Study Tracker
        </Link>
      </div>
    </DashboardCard>
  );
}
