import { Button } from '../../../components/ui/Button';
import { useAttendanceCommands, useAttendanceData } from '../application/hooks';
import { ExpectedClassStatus, AttendanceStatus } from '../domain';

export function TodayClasses() {
    const { todayAttendance, subjects, isLoading } = useAttendanceData();
    const { markAttendance } = useAttendanceCommands();

    if (isLoading) {
        return <div className="h-40 flex items-center justify-center text-gray-500">Loading today's classes...</div>;
    }

    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();

    if (todayAttendance.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-border shadow-sm flex items-center justify-center p-4">
                <span className="text-sm font-medium text-muted-foreground">☕ No classes scheduled for today.</span>
            </div>
        );
    }

    const handleMark = async (date: Date, subjectId: string, slotId: string | null, startTime: string, status: AttendanceStatus) => {
        await markAttendance(date, subjectId, slotId, startTime, status);
    };

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold tracking-tight">Today's Classes</h3>
            </div>
            <div className="divide-y divide-border">
                {todayAttendance.map((item, idx) => {
                    const expected = item.expectedClass;
                    const record = item.attendanceRecord;
                    const subject = subjects.find(s => s.id === expected.subjectId);
                    
                    const isCancelled = expected.status === ExpectedClassStatus.CANCELLED || record?.status === AttendanceStatus.CANCELLED;
                    const isHoliday = expected.status === ExpectedClassStatus.HOLIDAY;
                    const isPast = new Date(expected.date.getTime()).setHours(
                        parseInt(expected.startTime.split(':')[0]), 
                        parseInt(expected.startTime.split(':')[1])
                    ) < now;
                    
                    const isFuture = !isPast;
                    
                    // Determine visual state
                    let statusLabel = 'Not Recorded';
                    let statusColor = 'text-muted-foreground bg-muted';
                    
                    if (isCancelled) {
                        statusLabel = 'Cancelled';
                        statusColor = 'text-muted-foreground bg-muted/50';
                    } else if (isHoliday) {
                        statusLabel = 'Holiday';
                        statusColor = 'text-primary bg-primary/10';
                    } else if (record) {
                        if (record.status === AttendanceStatus.PRESENT) {
                            statusLabel = 'Present';
                            statusColor = 'text-success bg-success/10';
                        } else if (record.status === AttendanceStatus.ABSENT) {
                            statusLabel = 'Absent';
                            statusColor = 'text-danger bg-danger/10';
                        }
                    } else if (isFuture) {
                        statusLabel = 'Upcoming';
                        statusColor = 'text-muted-foreground bg-accent';
                    }

                    return (
                        <div key={idx} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: subject?.color || '#ccc' }} />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-sm truncate">{subject?.code || 'Unknown'}</h4>
                                        {expected.status === ExpectedClassStatus.EXTRA && (
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-info bg-info/10 px-1.5 py-0.5 rounded">Extra</span>
                                        )}
                                        {expected.status === ExpectedClassStatus.RESCHEDULED && (
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-warning bg-warning/10 px-1.5 py-0.5 rounded">Rescheduled</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">{subject?.name}</div>
                                    <div className="text-[11px] font-medium text-foreground mt-0.5">
                                        {expected.startTime} - {expected.endTime}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold ${statusColor}`}>
                                    {statusLabel}
                                </span>
                                
                                {(!isHoliday && !isFuture && expected.status !== ExpectedClassStatus.CANCELLED) && (
                                    <div className="flex gap-1 ml-1">
                                        <Button 
                                            size="sm" 
                                            variant={record?.status === AttendanceStatus.PRESENT ? 'primary' : 'outline'}
                                            onClick={() => handleMark(expected.date, expected.subjectId, expected.timetableSlotId, expected.startTime, AttendanceStatus.PRESENT)}
                                            className={`h-8 w-8 p-0 min-w-0 flex items-center justify-center rounded-md ${record?.status === AttendanceStatus.PRESENT ? 'bg-success hover:bg-success text-success-foreground border-transparent' : ''}`}
                                            title="Mark Present"
                                        >
                                            P
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant={record?.status === AttendanceStatus.ABSENT ? 'primary' : 'outline'}
                                            onClick={() => handleMark(expected.date, expected.subjectId, expected.timetableSlotId, expected.startTime, AttendanceStatus.ABSENT)}
                                            className={`h-8 w-8 p-0 min-w-0 flex items-center justify-center rounded-md ${record?.status === AttendanceStatus.ABSENT ? 'bg-danger hover:bg-danger text-danger-foreground border-transparent' : ''}`}
                                            title="Mark Absent"
                                        >
                                            A
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant={record?.status === AttendanceStatus.CANCELLED ? 'primary' : 'outline'}
                                            onClick={() => handleMark(expected.date, expected.subjectId, expected.timetableSlotId, expected.startTime, AttendanceStatus.CANCELLED)}
                                            className={`h-8 w-8 p-0 min-w-0 flex items-center justify-center rounded-md ${record?.status === AttendanceStatus.CANCELLED ? 'bg-foreground hover:bg-foreground text-background border-transparent' : ''}`}
                                            title="Tag Cancelled"
                                        >
                                            C
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
