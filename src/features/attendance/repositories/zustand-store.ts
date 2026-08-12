import { createStore } from 'zustand/vanilla';
import { persist, createJSONStorage } from 'zustand/middleware';
import { activeStorageAdapter } from '../../../store/storageAdapter';
import type {
    Semester,
    Subject,
    TimetableVersion,
    TimetableSlot,
    AcademicCalendarEvent,
    ScheduleOverride,
    AttendanceRecord
} from '../domain';

export interface AttendanceState {
    semesters: Record<string, Semester>;
    subjects: Record<string, Subject>;
    timetableVersions: Record<string, TimetableVersion>;
    timetableSlots: Record<string, TimetableSlot>;
    calendarEvents: Record<string, AcademicCalendarEvent>;
    scheduleOverrides: Record<string, ScheduleOverride>;
    attendanceRecords: Record<string, AttendanceRecord>;
}

// Custom reviver to parse ISO date strings back into Date objects
const dateReviver = (_key: string, value: unknown) => {
    if (typeof value === 'string') {
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?(?:[-+]\d{2}:?\d{2}|Z)?$/;
        if (isoDateRegex.test(value)) {
            return new Date(value);
        }
    }
    return value;
};

export const attendanceStore = createStore<AttendanceState>()(
    persist(
        () => ({
            semesters: {},
            subjects: {},
            timetableVersions: {},
            timetableSlots: {},
            calendarEvents: {},
            scheduleOverrides: {},
            attendanceRecords: {}
        }),
        {
            name: 'studentos-attendance-domain-storage',
            storage: createJSONStorage(() => activeStorageAdapter, { reviver: dateReviver })
        }
    )
);
