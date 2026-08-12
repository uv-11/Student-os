import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from 'zustand';
import { attendanceStore } from '../repositories/zustand-store';
import { 
    attendanceService, 
    attendanceCommandService, 
    semesterRepo, 
    subjectRepo,
    timetableVersionRepo
} from './composition';
import type { ResolvedAttendance } from '../services/types';
import { StatisticsService } from '../services/statistics-service';
import type { OverallStatistics, SubjectStatistics } from '../services/statistics-types';
import { AttendanceStatus } from '../domain';
import type { Semester, Subject, TimetableVersion, TimetableSlot } from '../domain';

export function useAttendanceData() {
    // We subscribe to the entire store to trigger re-renders when data changes.
    // In a massive app, we'd slice this, but for this feature it ensures our
    // projections are always up-to-date.
    const state = useStore(attendanceStore);
    
    const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    
    // Derived state
    const [resolvedAttendance, setResolvedAttendance] = useState<ResolvedAttendance[]>([]);
    const [todayAttendance, setTodayAttendance] = useState<ResolvedAttendance[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        async function loadData() {
            try {
                const now = new Date();
                const semester = await semesterRepo.getActiveSemester(now);
                
                if (!isMounted) return;
                setActiveSemester(semester);
                
                const allSubjects = await subjectRepo.findSubjects();
                if (!isMounted) return;
                setSubjects(allSubjects);
                
                if (semester) {
                    const resolved = await attendanceService.resolveForSemester(semester.id);
                    if (!isMounted) return;
                    setResolvedAttendance(resolved);
                    
                    // Filter for today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    const todayClasses = resolved.filter(r => {
                        const classDate = new Date(r.expectedClass.date.getTime());
                        classDate.setHours(0, 0, 0, 0);
                        return classDate.getTime() === today.getTime();
                    });
                    
                    if (!isMounted) return;
                    setTodayAttendance(todayClasses);
                } else {
                    if (!isMounted) return;
                    setResolvedAttendance([]);
                    setTodayAttendance([]);
                }
            } catch (error) {
                console.error("Failed to load attendance data:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        
        loadData();
        
        return () => { isMounted = false; };
    }, [state]); // Re-run when Zustand state changes

    const overallStats = useMemo<OverallStatistics | null>(() => {
        if (!resolvedAttendance.length) return null;
        return StatisticsService.calculateOverall(resolvedAttendance);
    }, [resolvedAttendance]);

    const subjectStats = useMemo<Record<string, SubjectStatistics>>(() => {
        if (!resolvedAttendance.length) return {};
        return StatisticsService.calculateSubjectWise(resolvedAttendance);
    }, [resolvedAttendance]);

    return {
        activeSemester,
        subjects,
        resolvedAttendance,
        todayAttendance,
        overallStats,
        subjectStats,
        isLoading,
        timetableVersions: Object.values(state.timetableVersions),
        timetableSlots: Object.values(state.timetableSlots)
    };
}

export function useAttendanceCommands() {
    const markAttendance = useCallback(async (date: Date, subjectId: string, slotId: string | null, startTime: string, status: AttendanceStatus) => {
        // EXTRA classes don't have a slotId. We use startTime as the unique identifier for that slot.
        const safeSlotId = slotId || startTime;
        await attendanceCommandService.recordAttendance(date, subjectId, safeSlotId, status);
    }, []);

    const createSemester = useCallback(async (name: string, startDate: Date, endDate: Date, targetAttendancePercentage: number) => {
        const semester: Semester = {
            id: crypto.randomUUID(),
            name,
            startDate,
            endDate,
            targetAttendancePercentage
        };
        await semesterRepo.saveSemester(semester);
        return semester;
    }, []);

    const updateSemester = useCallback(async (semester: Semester) => {
        await semesterRepo.saveSemester(semester);
    }, []);

    const addSubject = useCallback(async (name: string, code: string, color: string) => {
        const subject: Subject = {
            id: crypto.randomUUID(),
            name,
            code,
            color
        };
        await subjectRepo.createSubject(subject);
        return subject;
    }, []);

    const updateSubject = useCallback(async (subject: Subject) => {
        await subjectRepo.updateSubject(subject);
    }, []);

    const removeSubject = useCallback(async (id: string) => {
        await subjectRepo.removeSubject(id);
    }, []);

    const createTimetableVersion = useCallback(async (semesterId: string, validFrom: Date, validUntil: Date | null, slots: Omit<TimetableSlot, 'id' | 'timetableVersionId'>[]) => {
        const version: TimetableVersion = {
            id: crypto.randomUUID(),
            semesterId,
            validFrom,
            validUntil
        };
        
        await timetableVersionRepo.createVersion(version);
        
        const fullSlots: TimetableSlot[] = slots.map(s => ({
            ...s,
            id: crypto.randomUUID(),
            timetableVersionId: version.id
        }));

        await timetableVersionRepo.createTimetableSlots(fullSlots);
        return version;
    }, []);

    const getOrCreateInitialTimetableVersion = useCallback(async (semesterId: string, validFrom: Date) => {
        const versions = await timetableVersionRepo.findVersionsForSemester(semesterId);
        if (versions.length > 0) {
            return versions[0];
        }
        
        const version: TimetableVersion = {
            id: crypto.randomUUID(),
            semesterId,
            validFrom,
            validUntil: null
        };
        await timetableVersionRepo.createVersion(version);
        return version;
    }, []);

    const addTimetableSlot = useCallback(async (slot: TimetableSlot) => {
        await timetableVersionRepo.createTimetableSlots([slot]);
    }, []);

    const removeTimetableSlot = useCallback(async (id: string) => {
        await timetableVersionRepo.removeTimetableSlot(id);
    }, []);

    return {
        markAttendance,
        createSemester,
        updateSemester,
        addSubject,
        updateSubject,
        removeSubject,
        createTimetableVersion,
        getOrCreateInitialTimetableVersion,
        addTimetableSlot,
        removeTimetableSlot
    };
}
