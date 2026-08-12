import type {
    Semester,
    Subject,
    TimetableVersion,
    TimetableSlot,
    AcademicCalendarEvent,
    ScheduleOverride,
    AttendanceRecord
} from '../domain';

export interface SemesterRepository {
    getActiveSemester(currentDate: Date): Promise<Semester | null>;
    getSemester(id: string): Promise<Semester | null>;
    saveSemester(semester: Semester): Promise<void>;
}

export interface SubjectRepository {
    findSubjects(): Promise<Subject[]>;
    getSubject(id: string): Promise<Subject | null>;
    createSubject(subject: Subject): Promise<void>;
    updateSubject(subject: Subject): Promise<void>;
    removeSubject(id: string): Promise<void>;
}

export interface TimetableVersionRepository {
    findActiveVersion(semesterId: string, date: Date): Promise<TimetableVersion | null>;
    findVersionsForSemester(semesterId: string): Promise<TimetableVersion[]>;
    findTimetableSlots(timetableVersionId: string): Promise<TimetableSlot[]>;
    createVersion(version: TimetableVersion): Promise<void>;
    updateVersion(version: TimetableVersion): Promise<void>;
    createTimetableSlots(slots: TimetableSlot[]): Promise<void>;
    updateTimetableSlots(slots: TimetableSlot[]): Promise<void>;
    removeTimetableSlot(id: string): Promise<void>;
}

export interface AcademicCalendarRepository {
    findEventsBetween(startDate: Date, endDate: Date): Promise<AcademicCalendarEvent[]>;
    createEvent(event: AcademicCalendarEvent): Promise<void>;
    updateEvent(event: AcademicCalendarEvent): Promise<void>;
    removeEvent(id: string): Promise<void>;
}

export interface ScheduleOverrideRepository {
    findOverridesBetween(startDate: Date, endDate: Date): Promise<ScheduleOverride[]>;
    createOverride(override: ScheduleOverride): Promise<void>;
    updateOverride(override: ScheduleOverride): Promise<void>;
    removeOverride(id: string): Promise<void>;
}

export interface AttendanceRepository {
    findAttendanceBetween(startDate: Date, endDate: Date): Promise<AttendanceRecord[]>;
    findAttendanceForDate(date: Date): Promise<AttendanceRecord[]>;
    createAttendance(record: AttendanceRecord): Promise<void>;
    updateAttendance(record: AttendanceRecord): Promise<void>;
    removeAttendance(id: string): Promise<void>;
}
