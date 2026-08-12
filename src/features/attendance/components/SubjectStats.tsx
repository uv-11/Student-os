import { useState } from 'react';
import { useAttendanceData } from '../application/hooks';
import { SubjectHistoryModal } from './SubjectHistoryModal';

export function SubjectStats() {
    const { subjectStats, subjects, isLoading } = useAttendanceData();
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

    if (isLoading) return null;

    if (Object.keys(subjectStats).length === 0) return null;

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {subjects.map(subject => {
                    const stats = subjectStats[subject.id] || {
                        subjectId: subject.id,
                        totalScheduled: 0,
                        totalAttended: 0,
                        totalAbsent: 0,
                        attendancePercentage: 0
                    };
                    const notRecorded = stats.totalScheduled - (stats.totalAttended + stats.totalAbsent);
                    
                    let ringColor = 'border-border';
                    if (stats.totalScheduled > 0) {
                        if (stats.attendancePercentage >= 75) ringColor = 'border-success/50';
                        else if (stats.attendancePercentage >= 60) ringColor = 'border-warning/50';
                        else ringColor = 'border-danger/50';
                    }

                    return (
                        <div 
                            key={subject.id} 
                            onClick={() => setSelectedSubjectId(subject.id)}
                            className={`bg-card p-4 rounded-xl border shadow-sm flex flex-col cursor-pointer hover:shadow-md hover:border-primary transition-all ${ringColor}`}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: subject.color || '#ccc' }} />
                                <div className="min-w-0">
                                    <h4 className="font-bold text-sm leading-tight truncate">{subject.name}</h4>
                                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{subject.code}</span>
                                </div>
                            </div>
                            
                            <div className="mt-auto flex items-end justify-between">
                                <div>
                                    <div className="text-2xl font-bold tracking-tight">{stats.totalScheduled > 0 ? `${stats.attendancePercentage}%` : '—'}</div>
                                    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                                        {stats.totalAttended} / {stats.totalScheduled} Conducted
                                    </div>
                                </div>
                                
                                {notRecorded > 0 && (
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-warning bg-warning/10 px-2 py-1 rounded">
                                        {notRecorded} Unrecorded
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedSubjectId && (
                <SubjectHistoryModal 
                    subjectId={selectedSubjectId} 
                    onClose={() => setSelectedSubjectId(null)} 
                />
            )}
        </>
    );
}
