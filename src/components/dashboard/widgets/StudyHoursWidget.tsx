import { ChevronRight, BookOpen, Clock, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import { useDashboardFocus } from "../hooks/useDashboardFocus";
import { useStudyAnalytics } from "../../../hooks/analytics/useStudyAnalytics";
import { DashboardCard } from "../DashboardCard";

export function StudyHoursWidget() {
  const { todayFocusMinutes, weeklyFocusMinutes } = useDashboardFocus();
  const studyAnalytics = useStudyAnalytics();

  return (
    <div className="flex flex-col mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Study Hours</h2>
        <Link to={APP_ROUTES.ANALYTICS_STUDY} className="text-sm text-primary hover:underline flex items-center gap-1">
          View Analytics <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard className="p-4 flex items-center gap-4 hover:border-primary transition-colors">
          <div className="h-10 w-10 shrink-0 bg-tertiary/10 text-tertiary rounded-xl flex items-center justify-center">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground leading-tight mb-0.5">Today's Focus Time</div>
            <div className="text-xl font-bold tracking-tight">{Math.round(todayFocusMinutes)}m</div>
          </div>
        </DashboardCard>
        <DashboardCard className="p-4 flex items-center gap-4 hover:border-primary transition-colors">
          <div className="h-10 w-10 shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground leading-tight mb-0.5">Weekly Total</div>
            <div className="text-xl font-bold tracking-tight">{(weeklyFocusMinutes / 60).toFixed(1)}h</div>
          </div>
        </DashboardCard>
        <DashboardCard className="p-4 flex items-center gap-4 hover:border-primary transition-colors">
          <div className="h-10 w-10 shrink-0 bg-success/10 text-success rounded-xl flex items-center justify-center">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground leading-tight mb-0.5">Favorite Course</div>
            <div className="text-xl font-bold tracking-tight truncate">{studyAnalytics?.favoriteCourse.name || "—"}</div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
