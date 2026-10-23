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

import { determineEffectiveVersion } from '../engines/timetable-engine';
import { normalizeToStartOfDay } from '../utils/date';

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
            const effective = determineEffectiveVersion(versions, validFrom);
            return effective || versions[0];
        }
        
        const version: TimetableVersion = {
            id: crypto.randomUUID(),
            semesterId,
            validFrom: normalizeToStartOfDay(validFrom),
            validUntil: null
        };
        await timetableVersionRepo.createVersion(version);
        return version;
    }, []);

    const getOrCreateEditableVersion = useCallback(async (semesterId: string, effectiveDate: Date) => {
        const normalizedDate = normalizeToStartOfDay(effectiveDate);
        const targetTime = normalizedDate.getTime();
        const versions = await timetableVersionRepo.findVersionsForSemester(semesterId);

        // 1. If no versions exist for this semester, create the initial one
        if (versions.length === 0) {
            const initialVersion: TimetableVersion = {
                id: crypto.randomUUID(),
                semesterId,
                validFrom: normalizedDate,
                validUntil: null
            };
            await timetableVersionRepo.createVersion(initialVersion);
            return initialVersion;
        }

        // Sort existing versions ascending by validFrom
        const sortedVersions = [...versions]
            .filter(v => v && v.validFrom)
            .sort((a, b) => normalizeToStartOfDay(a.validFrom).getTime() - normalizeToStartOfDay(b.validFrom).getTime());

        // Find the currently open version (validUntil === null)
        const openVersion = sortedVersions.find(v => v.validUntil === null);

        if (openVersion) {
            const openStartTime = normalizeToStartOfDay(openVersion.validFrom).getTime();

            // Case A: The open version was already created on this exact effective date.
            // Re-use this version directly so multiple edits on the same day modify it.
            if (openStartTime === targetTime) {
                return openVersion;
            }

            // Case B: The open version started in the past (openStartTime < targetTime).
            // Close openVersion at normalizedDate, and create a new version starting at normalizedDate.
            if (openStartTime < targetTime) {
                // Close previous version
                await timetableVersionRepo.updateVersion({
                    ...openVersion,
                    validUntil: normalizedDate
                });

                // Create new version
                const newVersion: TimetableVersion = {
                    id: crypto.randomUUID(),
                    semesterId,
                    validFrom: normalizedDate,
                    validUntil: null
                };
                await timetableVersionRepo.createVersion(newVersion);

                // Copy active slots from openVersion into newVersion
                const existingSlots = await timetableVersionRepo.findTimetableSlots(openVersion.id);
                if (existingSlots.length > 0) {
                    const clonedSlots: TimetableSlot[] = existingSlots.map(s => ({
                        id: crypto.randomUUID(),
                        timetableVersionId: newVersion.id,
                        subjectId: s.subjectId,
                        dayOfWeek: s.dayOfWeek,
                        startTime: s.startTime,
                        endTime: s.endTime
                    }));
                    await timetableVersionRepo.createTimetableSlots(clonedSlots);
                }

                return newVersion;
            }
        }

        // If targetDate falls into an existing version interval, return the effective one
        const effective = determineEffectiveVersion(sortedVersions, normalizedDate);
        if (effective) {
            return effective;
        }

        // Fallback: create a new version starting at normalizedDate
        const fallbackVersion: TimetableVersion = {
            id: crypto.randomUUID(),
            semesterId,
            validFrom: normalizedDate,
            validUntil: null
        };
        await timetableVersionRepo.createVersion(fallbackVersion);
        return fallbackVersion;
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
        getOrCreateEditableVersion,
        addTimetableSlot,
        removeTimetableSlot
    };
}
