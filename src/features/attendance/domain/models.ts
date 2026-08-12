import { AttendanceStatus, AcademicCalendarEventType, ScheduleOverrideType, DayOfWeek } from './types';

export interface Semester {
    readonly id: string;
    readonly name: string;
    readonly startDate: Date;
    readonly endDate: Date;
    readonly targetAttendancePercentage: number;
}

export interface Subject {
    readonly id: string;
    readonly name: string;
    readonly code: string;
    readonly color: string;
}

export interface TimetableVersion {
    readonly id: string;
    readonly semesterId: string;
    readonly validFrom: Date;
    readonly validUntil: Date | null;
}

export interface TimetableSlot {
    readonly id: string;
    readonly timetableVersionId: string;
    readonly subjectId: string;
    readonly dayOfWeek: DayOfWeek;
    readonly startTime: string; // Format: "HH:mm"
    readonly endTime: string;   // Format: "HH:mm"
}

export interface AcademicCalendarEvent {
    readonly id: string;
    readonly semesterId: string;
    readonly date: Date;
    readonly type: AcademicCalendarEventType;
    readonly description: string;
}

export interface BaseScheduleOverride {
    readonly id: string;
    readonly date: Date;
    readonly notes: string | null;
}

export interface CancelledOverride extends BaseScheduleOverride {
    readonly type: ScheduleOverrideType.CANCELLED;
    readonly subjectId: string;
    readonly originalStartTime: string;
}

export interface RescheduledOverride extends BaseScheduleOverride {
    readonly type: ScheduleOverrideType.RESCHEDULED;
    readonly subjectId: string;
    readonly originalStartTime: string;
    readonly replacementStartTime: string;
    readonly replacementEndTime: string;
}

export interface ExtraOverride extends BaseScheduleOverride {
    readonly type: ScheduleOverrideType.EXTRA;
    readonly subjectId: string;
    readonly replacementStartTime: string;
    readonly replacementEndTime: string;
}

export type ScheduleOverride = CancelledOverride | RescheduledOverride | ExtraOverride;

export interface AttendanceRecord {
    readonly id: string;
    readonly date: Date;
    readonly subjectId: string;
    readonly timetableSlotId: string;
    readonly status: AttendanceStatus;
}
