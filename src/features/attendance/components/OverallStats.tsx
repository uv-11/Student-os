import { useAttendanceData } from '../application/hooks';

export function OverallStats() {
    const { overallStats, isLoading } = useAttendanceData();

    if (isLoading) {
        return <div className="h-28 bg-card border border-border animate-pulse rounded-xl" />;
    }

    if (!overallStats) return null;

    const notRecorded = overallStats.totalScheduled - (overallStats.totalAttended + overallStats.totalAbsent);
    const hasClasses = overallStats.totalScheduled > 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col justify-center items-center text-center">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Attendance</span>
                <span className="text-3xl font-bold tracking-tight">
                    {hasClasses ? `${overallStats.attendancePercentage}%` : '—'}
                </span>
            </div>
            
            <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col justify-center items-center text-center">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Attended / Conducted</span>
                <span className="text-3xl font-bold tracking-tight text-primary">
                    {overallStats.totalAttended} <span className="text-xl text-muted-foreground">/ {overallStats.totalScheduled}</span>
                </span>
            </div>

            <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col justify-center items-center text-center">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Not Recorded</span>
                <span className={`text-3xl font-bold tracking-tight ${notRecorded > 0 ? 'text-warning' : 'text-foreground'}`}>
                    {notRecorded}
                </span>
            </div>
        </div>
    );
}
