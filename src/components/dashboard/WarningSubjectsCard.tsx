import { useNavigate } from "react-router-dom";
import { DashboardCard } from "./DashboardCard";
import { ProgressBar } from "../ui/ProgressBar";
import { useDashboardAttendance } from "./hooks/useDashboardAttendance";
import { APP_ROUTES } from "../../config/routes";
import { AlertTriangle } from "lucide-react";

export function WarningSubjectsCard() {
  const navigate = useNavigate();
  const { subjects, subjectStats } = useDashboardAttendance();

  // Sort subjects by attendance percentage to find risk subjects (ascending, < 75%)
  const riskSubjects = subjects
    .map(sub => {
      const stats = subjectStats[sub.id];
      const attendancePercentage = stats?.attendancePercentage ?? 100;
      return { ...sub, attendancePercentage };
    })
    .filter(sub => sub.attendancePercentage < 75)
    .sort((a, b) => a.attendancePercentage - b.attendancePercentage);

  if (riskSubjects.length === 0) {
    return null; // Don't show if no warnings
  }

  return (
    <DashboardCard title="Attendance Warnings">
      <ul className="divide-y divide-border">
        {riskSubjects.slice(0, 3).map((subject) => (
          <li
            key={subject.id}
            className="flex flex-col gap-2 p-3 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate(APP_ROUTES.ATTENDANCE)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate(APP_ROUTES.ATTENDANCE)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 pr-2 overflow-hidden">
                <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
                <p className="text-sm font-semibold text-foreground truncate">
                  {subject.name}
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-danger bg-danger/10 px-2 py-0.5 rounded shrink-0">
                Risk
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ProgressBar percentage={subject.attendancePercentage} className="flex-1 h-1.5 bg-danger/20" />
              <p className="text-xs tabular-nums text-muted-foreground shrink-0 font-medium">
                {Math.round(subject.attendancePercentage)}%
              </p>
            </div>
          </li>
        ))}
      </ul>
    </DashboardCard>
  )
}
