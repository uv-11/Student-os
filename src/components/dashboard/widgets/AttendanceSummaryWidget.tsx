import { CheckSquare } from "lucide-react";
import { useDashboardAttendance } from "../hooks/useDashboardAttendance";
import { DashboardCard } from "../DashboardCard";
import { EmptyState } from "../../ui/EmptyState";
import { ProgressBar } from "../../ui/ProgressBar";

export function AttendanceSummaryWidget() {
  const { attendancePercentage, attendedClasses, conductedClasses, todayAttendance } = useDashboardAttendance();

  if (conductedClasses === 0) {
    return (
      <DashboardCard title="Attendance Summary" className="h-full flex flex-col">
        <EmptyState
          icon={<CheckSquare className="h-6 w-6" />}
          title="No attendance data"
          description="You haven't tracked any classes yet."
          className="flex-1"
        />
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Attendance Summary" className="h-full flex flex-col">
      <div className="p-4 flex-1 flex flex-col justify-center gap-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-3xl font-bold tracking-tight text-foreground">{Math.round(attendancePercentage)}%</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">Overall Attendance</span>
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center border border-border bg-card shadow-sm`}>
             <CheckSquare className={`h-5 w-5 ${attendancePercentage >= 75 ? 'text-success' : 'text-warning'}`} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Attended / Conducted</span>
            <span className="font-medium">{attendedClasses} / {conductedClasses}</span>
          </div>
          <ProgressBar percentage={attendancePercentage} className={`h-2`} />
        </div>

        <div className="pt-2 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            {todayAttendance.length > 0 ? `You have ${todayAttendance.length} classes scheduled today.` : "No classes scheduled for today."}
          </p>
        </div>
      </div>
    </DashboardCard>
  );
}
