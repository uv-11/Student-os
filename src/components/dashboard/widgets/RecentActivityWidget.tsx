import { Activity, CheckSquare, FileText, Target, BookOpen, LayoutList } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDashboardActivity } from "../hooks/useDashboardActivity";
import { DashboardCard } from "../DashboardCard";
import { EmptyState } from "../../ui/EmptyState";
import type { ActivityType } from "../utils/activityAdapters";

const typeConfig: Record<ActivityType, { icon: React.ReactNode; color: string; bg: string }> = {
  attendance: { icon: <CheckSquare className="h-4 w-4" />, color: "text-success", bg: "bg-success/10" },
  assignment: { icon: <FileText className="h-4 w-4" />, color: "text-primary", bg: "bg-primary/10" },
  habit: { icon: <Activity className="h-4 w-4" />, color: "text-danger", bg: "bg-danger/10" },
  study: { icon: <BookOpen className="h-4 w-4" />, color: "text-info", bg: "bg-info/10" },
  pomodoro: { icon: <Target className="h-4 w-4" />, color: "text-warning", bg: "bg-warning/10" },
};

export function RecentActivityWidget() {
  const activities = useDashboardActivity(10); // get top 10

  if (activities.length === 0) {
    return (
      <DashboardCard title="Recent Activity" className="h-full flex flex-col">
        <EmptyState
          icon={<LayoutList className="h-6 w-6" />}
          title="No recent activity"
          description="Your completed tasks and sessions will appear here."
          className="flex-1 min-h-[250px]"
        />
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Recent Activity" className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-2 max-h-[300px]">
        <ul className="space-y-1">
          {activities.map((activity) => {
            const config = typeConfig[activity.type] || typeConfig.attendance;
            return (
              <li key={activity.id} className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg transition-colors">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                  {config.icon}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{activity.title}</span>
                  <span className="text-xs text-muted-foreground truncate">{activity.description}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </DashboardCard>
  );
}
