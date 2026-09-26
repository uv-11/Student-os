import { BookOpen } from "lucide-react";
import { useDashboardAttendance } from "../hooks/useDashboardAttendance";
import { DashboardCard } from "../DashboardCard";
import { EmptyState } from "../../ui/EmptyState";
import { AttendanceStatus, ExpectedClassStatus } from "../../../features/attendance/domain";

export function TodayClassesWidget() {
  const { todayAttendance, getSubjectName, getSubjectColor, markAttendance } = useDashboardAttendance();

  if (todayAttendance.length === 0) {
    return (
      <DashboardCard title="Today's Classes" className="h-full flex flex-col">
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No classes today"
          description="Enjoy your free time!"
          className="flex-1"
        />
      </DashboardCard>
    );
  }

  const sortedToday = [...todayAttendance].sort((a, b) => {
    return a.expectedClass.startTime.localeCompare(b.expectedClass.startTime);
  });

  return (
    <DashboardCard title="Today's Classes" className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-2 max-h-[300px]">
        <ul className="divide-y divide-border/50">
          {sortedToday.map((item) => {
            const subjectName = getSubjectName(item.expectedClass.subjectId);
            const subjectColor = getSubjectColor(item.expectedClass.subjectId);
            const isMarked = item.attendanceRecord !== null;
            
            return (
              <li key={`${item.expectedClass.subjectId}-${item.expectedClass.startTime}`} className="flex flex-col gap-2 p-2 hover:bg-accent/50 rounded-lg transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: subjectColor }} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate">{subjectName}</span>
                      <span className="text-xs text-muted-foreground font-medium">{item.expectedClass.startTime} - {item.expectedClass.endTime}</span>
                    </div>
                  </div>
                  {item.expectedClass.status === ExpectedClassStatus.CANCELLED ? (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold shrink-0 bg-muted text-muted-foreground">
                      Cancelled
                    </span>
                  ) : isMarked ? (
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold shrink-0 ${
                      item.attendanceRecord!.status === AttendanceStatus.PRESENT ? 'bg-success/10 text-success' :
                      item.attendanceRecord!.status === AttendanceStatus.ABSENT ? 'bg-danger/10 text-danger' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {item.attendanceRecord!.status}
                    </span>
                  ) : (
                    <div className="flex gap-1 shrink-0">
                      <button 
                        onClick={() => markAttendance(item.expectedClass.date, item.expectedClass.subjectId, item.expectedClass.timetableSlotId, item.expectedClass.startTime, AttendanceStatus.PRESENT)}
                        className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-success/10 hover:bg-success/20 text-success rounded transition-colors"
                      >
                        Present
                      </button>
                      <button 
                        onClick={() => markAttendance(item.expectedClass.date, item.expectedClass.subjectId, item.expectedClass.timetableSlotId, item.expectedClass.startTime, AttendanceStatus.ABSENT)}
                        className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-danger/10 hover:bg-danger/20 text-danger rounded transition-colors"
                      >
                        Absent
                      </button>
                      <button 
                        onClick={() => markAttendance(item.expectedClass.date, item.expectedClass.subjectId, item.expectedClass.timetableSlotId, item.expectedClass.startTime, AttendanceStatus.CANCELLED)}
                        className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-muted hover:bg-accent text-muted-foreground rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </DashboardCard>
  );
}
