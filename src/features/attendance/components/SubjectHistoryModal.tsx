import { useState, useEffect, useMemo } from 'react';
import { useAttendanceData, useAttendanceCommands } from '../application/hooks';
import { ExpectedClassStatus, AttendanceStatus } from '../domain';
import { Button } from '../../../components/ui/Button';

interface SubjectHistoryModalProps {
    subjectId: string;
    onClose: () => void;
}

export function SubjectHistoryModal({ subjectId, onClose }: SubjectHistoryModalProps) {
    const { subjects, resolvedAttendance } = useAttendanceData();
    const { markAttendance } = useAttendanceCommands();
    const subject = subjects.find(s => s.id === subjectId);
    
    const [activeTab, setActiveTab] = useState<'HISTORY' | 'UPCOMING'>('HISTORY');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Get all classes for this specific subject memoized
    const { historyClasses, upcomingClasses } = useMemo(() => {
        const allSubjectClasses = resolvedAttendance.filter(r => r.expectedClass.subjectId === subjectId);
        // eslint-disable-next-line react-hooks/purity
        const now = Date.now();

        const history = allSubjectClasses
            .filter(r => {
                const [h, m] = r.expectedClass.startTime.split(':').map(Number);
                const classStart = new Date(r.expectedClass.date.getTime());
                classStart.setHours(h || 0, m || 0, 0, 0);
                return classStart.getTime() <= now;
            })
            .sort((a, b) => b.expectedClass.date.getTime() - a.expectedClass.date.getTime());

        const upcoming = allSubjectClasses
            .filter(r => {
                const [h, m] = r.expectedClass.startTime.split(':').map(Number);
                const classStart = new Date(r.expectedClass.date.getTime());
                classStart.setHours(h || 0, m || 0, 0, 0);
                return classStart.getTime() > now;
            })
            .sort((a, b) => a.expectedClass.date.getTime() - b.expectedClass.date.getTime());

        return { historyClasses: history, upcomingClasses: upcoming };
    }, [resolvedAttendance, subjectId]);

    const handleMark = async (date: Date, subjectId: string, slotId: string | null, startTime: string, status: AttendanceStatus) => {
        try {
            await markAttendance(date, subjectId, slotId, startTime, status);
        } catch (e) {
            console.error("Failed to mark attendance", e);
        }
    };

    const displayList = activeTab === 'HISTORY' ? historyClasses : upcomingClasses;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label={`${subject?.name || 'Subject'} Details`}>
            <div className="bg-card w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl border border-border flex flex-col max-h-[85dvh] animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: subject?.color || '#ccc' }} />
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold tracking-tight truncate">
                                {subject?.name}
                            </h2>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">{subject?.code}</p>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={onClose} className="h-8 w-8 rounded-full p-0 shrink-0 text-muted-foreground hover:text-foreground">
                        ✕
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border px-6 pt-2">
                    <button
                        onClick={() => setActiveTab('HISTORY')}
                        className={`pb-3 px-2 text-sm font-bold tracking-wide uppercase border-b-2 transition-colors ${
                            activeTab === 'HISTORY'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        History ({historyClasses.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('UPCOMING')}
                        className={`pb-3 px-2 ml-4 text-sm font-bold tracking-wide uppercase border-b-2 transition-colors ${
                            activeTab === 'UPCOMING'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Upcoming ({upcomingClasses.length})
                    </button>
                </div>
                
                {/* List Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {displayList.map((item, idx) => {
                        const expected = item.expectedClass;
                        const record = item.attendanceRecord;

                        const currentStatus = record?.status || (expected.status === ExpectedClassStatus.CANCELLED ? AttendanceStatus.CANCELLED : null);

                        return (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors gap-3">
                                <div className="min-w-0">
                                    <div className="font-bold text-sm">
                                        {expected.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                                        {expected.startTime} - {expected.endTime}
                                    </div>
                                    {expected.status === ExpectedClassStatus.EXTRA && (
                                        <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-info bg-info/10 px-1.5 py-0.5 rounded">
                                            Extra
                                        </span>
                                    )}
                                    {expected.status === ExpectedClassStatus.RESCHEDULED && (
                                        <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                                            Rescheduled
                                        </span>
                                    )}
                                </div>

                                {activeTab === 'HISTORY' ? (
                                    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg self-start sm:self-auto shrink-0">
                                        <button
                                            onClick={() => handleMark(expected.date, expected.subjectId, expected.timetableSlotId, expected.startTime, AttendanceStatus.PRESENT)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all min-w-[70px] ${
                                                currentStatus === AttendanceStatus.PRESENT 
                                                    ? 'bg-success text-success-foreground shadow-sm' 
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            Present
                                        </button>
                                        <button
                                            onClick={() => handleMark(expected.date, expected.subjectId, expected.timetableSlotId, expected.startTime, AttendanceStatus.ABSENT)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all min-w-[70px] ${
                                                currentStatus === AttendanceStatus.ABSENT 
                                                    ? 'bg-danger text-danger-foreground shadow-sm' 
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            Absent
                                        </button>
                                        <button
                                            onClick={() => handleMark(expected.date, expected.subjectId, expected.timetableSlotId, expected.startTime, AttendanceStatus.CANCELLED)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all min-w-[70px] ${
                                                currentStatus === AttendanceStatus.CANCELLED 
                                                    ? 'bg-foreground text-background shadow-sm' 
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-muted-foreground bg-muted self-start sm:self-auto shrink-0">
                                        Upcoming
                                    </span>
                                )}
                            </div>
                        );
                    })}
                    {displayList.length === 0 && (
                        <div className="text-center py-12 text-gray-500 text-sm">
                            {activeTab === 'HISTORY' 
                                ? 'No past conducted classes recorded yet.' 
                                : 'No upcoming classes scheduled.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

