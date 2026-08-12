import { useEffect, useState } from "react";
import { Clock, BookOpen, FileText, Activity, Target } from "lucide-react";
import { format } from "date-fns";
import { useDashboardAttendance } from "../hooks/useDashboardAttendance";
import { useDashboardAssignments } from "../hooks/useDashboardAssignments";
import { useDashboardHabits } from "../hooks/useDashboardHabits";
import { useDashboardFocus } from "../hooks/useDashboardFocus";

export function TodaySnapshotWidget() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { currentClass, nextClass, getSubjectName } = useDashboardAttendance();
  const { dueToday } = useDashboardAssignments();
  const { completedToday, totalHabits } = useDashboardHabits();
  const { todayFocusMinutes } = useDashboardFocus();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-row items-center gap-4 lg:gap-6 px-4 py-3 bg-card border border-border rounded-xl w-full min-h-[64px]">
      
      {/* Time */}
      <div className="flex items-center gap-3 lg:pr-6 lg:border-r border-border min-w-0">
        <Clock className="h-5 w-5 text-primary shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold leading-none mb-1">Current Time</span>
          <span className="text-sm font-bold text-foreground truncate leading-none tabular-nums">{format(time, "h:mm a")}</span>
        </div>
      </div>
      
      {/* Class */}
      <div className="flex items-center gap-3 lg:pr-6 lg:border-r border-border min-w-0 col-span-2 sm:col-span-2 lg:col-span-1 lg:flex-1">
        <BookOpen className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex flex-col min-w-0 w-full">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold leading-none mb-1">Class</span>
          <span className="text-sm font-semibold text-foreground truncate leading-none">
            {currentClass ? getSubjectName(currentClass.expectedClass.subjectId) : (nextClass ? `Next: ${getSubjectName(nextClass.expectedClass.subjectId)}` : "No classes today")}
          </span>
        </div>
      </div>

      {/* Due Today */}
      <div className="flex items-center gap-3 lg:pr-6 lg:border-r border-border min-w-0">
        <FileText className="h-5 w-5 text-info shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold leading-none mb-1">Due Today</span>
          <span className="text-sm font-semibold text-foreground truncate leading-none">{dueToday}</span>
        </div>
      </div>

      {/* Habits */}
      <div className="flex items-center gap-3 lg:pr-6 lg:border-r border-border min-w-0">
        <Activity className="h-5 w-5 text-tertiary shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold leading-none mb-1">Habits</span>
          <span className="text-sm font-semibold text-foreground truncate leading-none">{completedToday}/{totalHabits}</span>
        </div>
      </div>

      {/* Focus */}
      <div className="flex items-center gap-3 min-w-0">
        <Target className="h-5 w-5 text-success shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold leading-none mb-1">Focus Time</span>
          <span className="text-sm font-semibold text-foreground truncate leading-none">{Math.round(todayFocusMinutes)}m</span>
        </div>
      </div>

    </div>
  );
}
