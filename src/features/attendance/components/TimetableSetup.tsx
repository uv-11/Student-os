import { useState, useEffect, useMemo } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAttendanceCommands, useAttendanceData } from '../application/hooks';
import { DayOfWeek, AttendanceStatus, type TimetableVersion } from '../domain';

const DAYS = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY
];

function timeToMins(t: string) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function minsToTime(m: number) {
    const h = Math.floor(m / 60);
    const mins = m % 60;
    return `${h.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

interface TimetableSetupProps {
    onComplete: () => void;
    onBack: () => void;
    readOnly?: boolean;
    onEditSchedule?: () => void;
}

export function TimetableSetup({ onComplete, onBack, readOnly = false, onEditSchedule }: TimetableSetupProps) {
    const { getOrCreateInitialTimetableVersion, addTimetableSlot, removeTimetableSlot, addSubject, updateSubject, removeSubject, markAttendance } = useAttendanceCommands();
    const { activeSemester, subjects, timetableSlots, resolvedAttendance } = useAttendanceData();
    
    const [activeVersion, setActiveVersion] = useState<TimetableVersion | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successToast, setSuccessToast] = useState('');

    const [weekOffset, setWeekOffset] = useState(0);

    // Modal & Confirmation States
    const [isAddingSubject, setIsAddingSubject] = useState(false);
    const [isManagingSubjects, setIsManagingSubjects] = useState(false);
    const [confirmDeleteSlotId, setConfirmDeleteSlotId] = useState<string | null>(null);
    const [popover, setPopover] = useState<{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        slot: any;
        date: Date;
        currentStatus: AttendanceStatus | null;
        isFuture?: boolean;
    } | null>(null);

    // New subject state
    const [newSubName, setNewSubName] = useState('');
    const [newSubCode, setNewSubCode] = useState('');
    const [newSubColor, setNewSubColor] = useState('#3b82f6');

    // Inline edit subject state
    const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
    const [editSubName, setEditSubName] = useState('');
    const [editSubCode, setEditSubCode] = useState('');
    const [editSubColor, setEditSubColor] = useState('#3b82f6');

    const showToast = (msg: string) => {
        setSuccessToast(msg);
        setTimeout(() => setSuccessToast(''), 3000);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setPopover(null);
                setIsAddingSubject(false);
                setIsManagingSubjects(false);
                setConfirmDeleteSlotId(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Calculate dates for current/navigated week
    const weekDates = useMemo(() => {
        const now = new Date();
        const currentDay = now.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset + weekOffset * 7);
        monday.setHours(0, 0, 0, 0);

        const createDate = (offset: number) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + offset);
            return d;
        };

        const map: Record<DayOfWeek, Date> = {
            [DayOfWeek.MONDAY]: createDate(0),
            [DayOfWeek.TUESDAY]: createDate(1),
            [DayOfWeek.WEDNESDAY]: createDate(2),
            [DayOfWeek.THURSDAY]: createDate(3),
            [DayOfWeek.FRIDAY]: createDate(4),
            [DayOfWeek.SATURDAY]: createDate(5),
            [DayOfWeek.SUNDAY]: createDate(6),
        };
        return map;
    }, [weekOffset]);

    // Active slots for this version
    const slots = useMemo(() => {
        if (!activeVersion) return [];
        return timetableSlots.filter(s => s.timetableVersionId === activeVersion.id);
    }, [activeVersion, timetableSlots]);

    // Find next upcoming class ID
    const nextUpcomingSlotId = useMemo(() => {
        if (!readOnly || slots.length === 0) return null;
        // eslint-disable-next-line react-hooks/purity
        const nowTime = Date.now();
        let minFutureTime = Infinity;
        let targetSlotId: string | null = null;

        slots.forEach(slot => {
            const date = weekDates[slot.dayOfWeek];
            if (!date) return;
            const [h, m] = slot.startTime.split(':').map(Number);
            const startTime = new Date(date.getTime());
            startTime.setHours(h, m, 0, 0);

            if (startTime.getTime() > nowTime && startTime.getTime() < minFutureTime) {
                minFutureTime = startTime.getTime();
                targetSlotId = slot.id;
            }
        });

        return targetSlotId;
    }, [readOnly, slots, weekDates]);

    // Initialize version
    useEffect(() => {
        if (activeSemester && !activeVersion) {
            getOrCreateInitialTimetableVersion(activeSemester.id, activeSemester.startDate)
                .then(v => setActiveVersion(v))
                .catch(e => console.error("Failed to create/get version", e));
        }
    }, [activeSemester, activeVersion, getOrCreateInitialTimetableVersion]);

    const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DayOfWeek.MONDAY);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');

    // Fix async subject loading bug
    // useEffect(() => {
    //    // Only set default if it's currently unset and we have subjects
    //    // and we haven't rendered yet (so not strictly reactive to subjects length growing)
    // }, [subjects, selectedSubjectId]);

    const hasOverlap = (day: DayOfWeek, startMins: number, endMins: number, excludeSlotId?: string) => {
        return slots.some(s => {
            if (s.dayOfWeek !== day) return false;
            if (s.id === excludeSlotId) return false;
            const sStart = timeToMins(s.startTime);
            const sEnd = timeToMins(s.endTime);
            return startMins < sEnd && endMins > sStart;
        });
    };

    const handleAddSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedSubjectId) {
            setError('Please select a subject first.');
            return;
        }

        if (!activeVersion) return;

        const startMins = timeToMins(startTime);
        const endMins = timeToMins(endTime);

        if (startMins >= endMins) {
            setError('Start time must be before end time.');
            return;
        }

        if (hasOverlap(selectedDay, startMins, endMins)) {
            setError('This slot overlaps with an existing class on the same day.');
            return;
        }

        setLoading(true);
        try {
            await addTimetableSlot({
                id: crypto.randomUUID(),
                timetableVersionId: activeVersion.id,
                subjectId: selectedSubjectId,
                dayOfWeek: selectedDay,
                startTime,
                endTime
            });
            showToast('Class slot added!');
        } catch (err) {
            console.error(err);
            setError('Failed to add slot');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSlot = async (id: string) => {
        setLoading(true);
        try {
            await removeTimetableSlot(id);
            showToast('Class slot removed!');
            setConfirmDeleteSlotId(null);
        } catch(e) {
            console.error(e);
            setError('Failed to delete slot.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackWithUnsavedWarning = () => {
        if (slots.length > 0 && window.confirm("You have timetable slots added. Are you sure you want to go back?")) {
            onBack();
        } else if (slots.length === 0) {
            onBack();
        }
    };

    const handleAddSubjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubName.trim() || !newSubCode.trim()) return;
        setLoading(true);
        try {
            const created = await addSubject(newSubName.trim(), newSubCode.trim(), newSubColor);
            setSelectedSubjectId(created.id);
            setNewSubName('');
            setNewSubCode('');
            setNewSubColor('#3b82f6');
            setIsAddingSubject(false);
            showToast(`Subject "${created.name}" added!`);
        } catch (err) {
            console.error("Failed to add subject", err);
        } finally {
            setLoading(false);
        }
    };


    const handleSaveEditSubject = async () => {
        if (!editingSubjectId || !editSubName.trim() || !editSubCode.trim()) return;
        setLoading(true);
        try {
            await updateSubject({
                id: editingSubjectId,
                name: editSubName.trim(),
                code: editSubCode.trim(),
                color: editSubColor
            });
            setEditingSubjectId(null);
            showToast('Subject updated!');
        } catch (err) {
            console.error("Failed to update subject", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStatus = async (status: AttendanceStatus) => {
        if (!popover) return;
        try {
            await markAttendance(popover.date, popover.slot.subjectId, popover.slot.id, popover.slot.startTime, status);
            setPopover(null);
            showToast('Attendance updated!');
        } catch (e) {
            console.error("Failed to mark attendance", e);
        }
    };

    // Calculate grid range dynamically
    const { minHour, maxHour, earliestClassHour, latestClassHour } = useMemo(() => {
        if (slots.length === 0) {
            return { minHour: 8, maxHour: 18, earliestClassHour: 8, latestClassHour: 18 };
        }
        const minMins = Math.min(...slots.map(s => timeToMins(s.startTime)));
        const maxMins = Math.max(...slots.map(s => timeToMins(s.endTime)));
        
        const earliestClassHour = Math.floor(minMins / 60);
        const latestClassHour = Math.ceil(maxMins / 60);

        let minH = earliestClassHour - 1;
        let maxH = latestClassHour + 1;
        
        if (minH < 0) minH = 0;
        if (maxH > 24) maxH = 24;
        if (maxH - minH < 5) maxH = minH + 5;
        
        return { minHour: minH, maxHour: maxH, earliestClassHour, latestClassHour };
    }, [slots]);

    const totalGridMins = (maxHour - minHour) * 60;
    const hoursArray = Array.from({ length: maxHour - minHour }, (_, i) => minHour + i);

    return (
        <div className="max-w-6xl mx-auto p-6 bg-card rounded-xl shadow-sm border border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Weekly Timetable</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        {readOnly ? `Semester: ${activeSemester?.name || 'Active'}` : 'Build your recurring weekly schedule.'}
                    </p>
                </div>
                {readOnly ? (
                    <Button onClick={onEditSchedule}>
                        Edit Schedule
                    </Button>
                ) : (
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={handleBackWithUnsavedWarning}>Back</Button>
                        <Button onClick={onComplete} disabled={loading || slots.length === 0}>
                            {loading ? 'Finishing...' : 'Finish Setup'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Success Toast */}
            {successToast && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm rounded-lg flex items-center justify-between">
                    <span>✓ {successToast}</span>
                </div>
            )}

            <div className={`flex flex-col ${readOnly ? '' : 'xl:flex-row'} gap-8`}>
                {/* Add Class Form (Only in Setup Mode) */}
                {!readOnly && (
                    <div className="xl:w-72 shrink-0 bg-muted/30 p-4 rounded-xl h-fit border border-border">
                        <h3 className="font-bold tracking-tight mb-4">Add Class</h3>
                        <form onSubmit={handleAddSlot} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1 uppercase tracking-wider text-gray-500">Day</label>
                                <select 
                                    className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                    value={selectedDay}
                                    onChange={e => setSelectedDay(e.target.value as DayOfWeek)}
                                >
                                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-medium uppercase tracking-wider text-gray-500">Subject</label>
                                    <div className="flex gap-2 text-xs">
                                        <button 
                                            type="button" 
                                            onClick={() => setIsAddingSubject(true)} 
                                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                        >
                                            + Add Subject
                                        </button>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setIsManagingSubjects(true)} 
                                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
                                        >
                                            Manage
                                        </button>
                                    </div>
                                </div>
                                <select 
                                    className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                    value={selectedSubjectId}
                                    onChange={e => { setSelectedSubjectId(e.target.value); setError(''); }}
                                    required
                                >
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium mb-1 uppercase tracking-wider text-gray-500">Start Time</label>
                                    <input 
                                        type="time" 
                                        className="w-full h-10 px-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                        value={startTime}
                                        onChange={e => { setStartTime(e.target.value); setError(''); }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1 uppercase tracking-wider text-gray-500">End Time</label>
                                    <input 
                                        type="time" 
                                        className="w-full h-10 px-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                        value={endTime}
                                        onChange={e => { setEndTime(e.target.value); setError(''); }}
                                        required
                                    />
                                </div>
                            </div>

                            {error && <div className="text-red-500 text-xs font-medium">⚠️ {error}</div>}

                            <Button type="submit" variant="secondary" className="mt-2" disabled={loading || subjects.length === 0}>
                                {loading ? 'Adding...' : 'Add Slot'}
                            </Button>
                        </form>
                    </div>
                )}

                {/* Timetable Grid */}
                <div className="flex-1 flex flex-col gap-4 overflow-x-auto">
                    {readOnly && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="secondary" onClick={() => setWeekOffset(prev => prev - 1)}>
                                    ← Prev
                                </Button>
                                <Button size="sm" variant={weekOffset === 0 ? "secondary" : "outline"} onClick={() => setWeekOffset(0)}>
                                    Today
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => setWeekOffset(prev => prev + 1)}>
                                    Next →
                                </Button>
                            </div>
                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                {weekDates[DayOfWeek.MONDAY].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {weekDates[DayOfWeek.SUNDAY].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>
                    )}
                    <div className="min-w-[800px] border border-border rounded-xl bg-card relative overflow-hidden">
                        {/* Header Row */}
                        <div className="flex border-b border-border bg-muted/20">
                            <div className="w-16 shrink-0 border-r border-border" />
                            {DAYS.map(day => (
                                <div key={day} className="flex-1 p-2 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border last:border-r-0">
                                    {day.substring(0, 3)}
                                    {readOnly && weekDates[day] && (
                                        <div className="text-xs font-medium text-foreground mt-0.5">
                                            {weekDates[day].getDate()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Grid Body */}
                        <div className="flex relative" style={{ height: `${totalGridMins}px` }}>
                            {/* Time Axis (Hide artificial padding labels) */}
                            <div className="w-16 shrink-0 border-r border-border relative text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {hoursArray.map(hour => {
                                    const isPaddingLabel = slots.length > 0 && (hour < earliestClassHour || hour > latestClassHour);
                                    return (
                                        <div key={hour} className="absolute w-full text-right pr-2" style={{ top: `${(hour - minHour) * 60 - 8}px` }}>
                                            {isPaddingLabel ? '' : minsToTime(hour * 60)}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Days Columns */}
                            {DAYS.map(day => {
                                const daySlots = slots.filter(s => s.dayOfWeek === day);
                                const classDate = weekDates[day];

                                if (import.meta.env.DEV) {
                                    for (let i = 0; i < daySlots.length; i++) {
                                        for (let j = i + 1; j < daySlots.length; j++) {
                                            const start1 = timeToMins(daySlots[i].startTime);
                                            const end1 = timeToMins(daySlots[i].endTime);
                                            const start2 = timeToMins(daySlots[j].startTime);
                                            const end2 = timeToMins(daySlots[j].endTime);
                                            if (start1 < end2 && end1 > start2) {
                                                console.warn(`[TimetableSetup] Overlapping slots reached renderer on ${day}:`, daySlots[i], daySlots[j]);
                                            }
                                        }
                                    }
                                }

                                return (
                                    <div key={day} className="flex-1 border-r border-border last:border-r-0 relative">
                                        {/* Horizontal Hour Lines (Background) */}
                                        {hoursArray.map(hour => (
                                            <div key={hour} className="absolute w-full border-t border-border/50" style={{ top: `${(hour - minHour) * 60}px` }} />
                                        ))}

                                        {/* Placed Slots */}
                                        {daySlots.map(slot => {
                                            const sub = subjects.find(s => s.id === slot.subjectId);
                                            const sMins = timeToMins(slot.startTime);
                                            const eMins = timeToMins(slot.endTime);
                                            
                                            const topOffset = Math.max(0, sMins - minHour * 60);
                                            const height = Math.max(15, eMins - sMins);

                                            const [startH, startM] = slot.startTime.split(':').map(Number);
                                            const [endH, endM] = slot.endTime.split(':').map(Number);
                                            const classStart = new Date(classDate.getTime());
                                            classStart.setHours(startH, startM, 0, 0);
                                            const classEnd = new Date(classDate.getTime());
                                            classEnd.setHours(endH, endM, 0, 0);

                                            const nowTime = Date.now();
                                            const isPast = classEnd.getTime() < nowTime;
                                            const isCurrent = classStart.getTime() <= nowTime && nowTime <= classEnd.getTime();
                                            const isFuture = classStart.getTime() > nowTime;
                                            const isNextUpcoming = slot.id === nextUpcomingSlotId;

                                            const resolved = resolvedAttendance.find(r => 
                                                r.expectedClass.subjectId === slot.subjectId &&
                                                (r.expectedClass.timetableSlotId === slot.id || r.expectedClass.startTime === slot.startTime) &&
                                                new Date(r.expectedClass.date.getTime()).setHours(0,0,0,0) === new Date(classDate.getTime()).setHours(0,0,0,0)
                                            );
                                            const recordStatus = resolved?.attendanceRecord?.status || null;

                                            const statusBorder = sub?.color || '#ccc';
                                            const statusBg = sub?.color ? `${sub.color}20` : 'rgba(128,128,128,0.1)';
                                            let statusBadge = null;
                                            let classOverlay = '';

                                            if (readOnly) {
                                                if (recordStatus === AttendanceStatus.PRESENT) {
                                                    statusBadge = <span className="text-[10px] font-bold text-success bg-success/20 px-1.5 py-0.5 rounded border border-success/30 shadow-sm leading-none flex items-center">P</span>;
                                                } else if (recordStatus === AttendanceStatus.ABSENT) {
                                                    statusBadge = <span className="text-[10px] font-bold text-danger bg-danger/20 px-1.5 py-0.5 rounded border border-danger/30 shadow-sm leading-none flex items-center">A</span>;
                                                } else if (recordStatus === AttendanceStatus.CANCELLED) {
                                                    statusBadge = <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border shadow-sm leading-none flex items-center">C</span>;
                                                    classOverlay = 'opacity-60 border-dashed';
                                                }
                                            }

                                            return (
                                                <div 
                                                    key={slot.id}
                                                    onClick={() => {
                                                        if (readOnly) {
                                                            setPopover({ slot, date: classDate, currentStatus: recordStatus, isFuture });
                                                        }
                                                    }}
                                                    className={`absolute left-1 right-1 rounded-md overflow-hidden shadow-sm transition-all border ${classOverlay} ${
                                                        readOnly 
                                                            ? isPast 
                                                                ? 'cursor-pointer hover:z-20 hover:scale-[1.02] hover:shadow-md' 
                                                                : 'cursor-pointer hover:z-20 hover:scale-[1.02] hover:shadow-md' 
                                                            : 'hover:z-10 group'
                                                    } ${isCurrent ? 'ring-2 ring-primary shadow-md z-10' : ''} ${isNextUpcoming ? 'ring-2 ring-info/50 border-dashed' : 'border-transparent'}`}
                                                    style={{ 
                                                        top: `${topOffset}px`, 
                                                        height: `${height}px`,
                                                        backgroundColor: statusBg,
                                                        borderLeftWidth: '4px',
                                                        borderLeftColor: statusBorder
                                                    }}
                                                >
                                                    <div className="p-1.5 h-full flex flex-col relative bg-card/60 backdrop-blur-[2px] overflow-hidden">
                                                        <div className="flex items-center justify-between">
                                                            <div className="font-bold text-xs leading-tight truncate">{sub?.code}</div>
                                                            {isCurrent && (
                                                                <span className="text-[9px] font-extrabold text-primary bg-primary/20 px-1 rounded border border-primary/30 animate-pulse">NOW</span>
                                                            )}
                                                            {isNextUpcoming && !isCurrent && (
                                                                <span className="text-[9px] font-extrabold text-info bg-info/20 px-1 rounded border border-info/30">NEXT</span>
                                                            )}
                                                        </div>
                                                        {height >= 40 && (
                                                            <>
                                                                <div className="text-[10px] leading-tight truncate text-muted-foreground mt-0.5 font-medium">{sub?.name}</div>
                                                                <div className="flex items-end justify-between mt-auto">
                                                                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{slot.startTime}</div>
                                                                    {statusBadge}
                                                                </div>
                                                            </>
                                                        )}
                                                        {/* Delete Button overlaid (Only in Setup Mode with Confirm) */}
                                                        {!readOnly && (
                                                            confirmDeleteSlotId === slot.id ? (
                                                                <div className="absolute inset-0 bg-red-600 text-white flex items-center justify-center gap-1 p-1 z-30 text-[10px] font-bold">
                                                                    <span>Delete?</span>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }} className="bg-white text-red-600 px-1 rounded">Yes</button>
                                                                    <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteSlotId(null); }} className="bg-red-800 text-white px-1 rounded">No</button>
                                                                </div>
                                                            ) : (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteSlotId(slot.id); }}
                                                                    className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-4 w-4"
                                                                    title="Delete"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Popover / Context Menu: Mark Attendance */}
            {popover && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-card rounded-t-2xl sm:rounded-xl max-w-sm w-full sm:w-[90vw] p-6 shadow-2xl border border-border flex flex-col gap-4 animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200">
                        <div>
                            {popover.isFuture && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                    Upcoming Class
                                </span>
                            )}
                            <h4 className="font-bold text-lg tracking-tight mt-2">
                                {subjects.find(s => s.id === popover.slot.subjectId)?.name}
                            </h4>
                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">
                                {popover.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {popover.slot.startTime} - {popover.slot.endTime}
                            </p>
                        </div>

                        {!popover.isFuture ? (
                            <div className="flex flex-col gap-2 mt-2">
                                <Button 
                                    className={`h-12 ${popover.currentStatus === AttendanceStatus.PRESENT ? 'bg-success hover:bg-success text-success-foreground' : ''}`}
                                    variant={popover.currentStatus === AttendanceStatus.PRESENT ? 'primary' : 'secondary'}
                                    onClick={() => handleSelectStatus(AttendanceStatus.PRESENT)}
                                    disabled={loading}
                                >
                                    Present
                                </Button>
                                <Button 
                                    className={`h-12 ${popover.currentStatus === AttendanceStatus.ABSENT ? 'bg-danger hover:bg-danger text-danger-foreground' : ''}`}
                                    variant={popover.currentStatus === AttendanceStatus.ABSENT ? 'primary' : 'secondary'}
                                    onClick={() => handleSelectStatus(AttendanceStatus.ABSENT)}
                                    disabled={loading}
                                >
                                    Absent
                                </Button>
                                <Button 
                                    className={`h-12 ${popover.currentStatus === AttendanceStatus.CANCELLED ? 'bg-foreground hover:bg-foreground text-background' : ''}`}
                                    variant={popover.currentStatus === AttendanceStatus.CANCELLED ? 'primary' : 'secondary'}
                                    onClick={() => handleSelectStatus(AttendanceStatus.CANCELLED)}
                                    disabled={loading}
                                >
                                    Cancelled
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground mt-2 bg-muted p-3 rounded-lg">
                                Attendance can be recorded once this class has started.
                            </p>
                        )}

                        <div className="flex justify-end mt-2 pt-4 border-t border-border">
                            <Button size="lg" className="w-full sm:w-auto" variant="secondary" onClick={() => setPopover(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add Subject */}
            {isAddingSubject && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-[90vw] p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-4">Add New Subject</h3>
                        <form onSubmit={handleAddSubjectSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1 uppercase tracking-wider text-gray-500">Subject Name *</label>
                                <Input 
                                    placeholder="e.g. Data Structures"
                                    value={newSubName}
                                    onChange={e => setNewSubName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 uppercase tracking-wider text-gray-500">Subject Code *</label>
                                <Input 
                                    placeholder="e.g. CS201"
                                    value={newSubCode}
                                    onChange={e => setNewSubCode(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 uppercase tracking-wider text-gray-500">Color</label>
                                <Input 
                                    type="color"
                                    value={newSubColor}
                                    onChange={e => setNewSubColor(e.target.value)}
                                    className="h-10 p-1 w-full cursor-pointer"
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <Button type="button" variant="secondary" onClick={() => setIsAddingSubject(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Adding...' : 'Add Subject'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Manage Subjects */}
            {isManagingSubjects && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-[90vw] p-6 shadow-xl border border-gray-200 dark:border-gray-700 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Manage Subjects</h3>
                            <Button size="sm" variant="secondary" onClick={() => setIsAddingSubject(true)}>
                                + Add Subject
                            </Button>
                        </div>
                        <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                            {subjects.map(sub => (
                                <div key={sub.id} className="p-3 border dark:border-gray-700 rounded-lg flex items-center justify-between">
                                    {editingSubjectId === sub.id ? (
                                        <div className="flex-1 flex flex-col gap-2">
                                            <Input value={editSubName} onChange={e => setEditSubName(e.target.value)} placeholder="Name" />
                                            <div className="flex gap-2">
                                                <Input value={editSubCode} onChange={e => setEditSubCode(e.target.value)} placeholder="Code" className="w-28" />
                                                <Input type="color" value={editSubColor} onChange={e => setEditSubColor(e.target.value)} className="w-16 h-10 p-1 cursor-pointer" />
                                                <Button size="sm" onClick={handleSaveEditSubject} disabled={loading}>Save</Button>
                                                <Button size="sm" variant="ghost" onClick={() => setEditingSubjectId(null)}>Cancel</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: sub.color }} />
                                                <div>
                                                    <div className="font-medium text-sm">{sub.name}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{sub.code}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => {
                                                    setEditingSubjectId(sub.id);
                                                    setEditSubName(sub.name);
                                                    setEditSubCode(sub.code);
                                                    setEditSubColor(sub.color);
                                                }}>Edit</Button>
                                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => removeSubject(sub.id)}>Remove</Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {subjects.length === 0 && (
                                <div className="text-center py-6 text-gray-400 text-sm">No subjects yet.</div>
                            )}
                        </div>
                        <div className="flex justify-end mt-4 pt-3 border-t dark:border-gray-700">
                            <Button variant="secondary" onClick={() => setIsManagingSubjects(false)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

