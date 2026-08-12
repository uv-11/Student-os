import type {
    SemesterRepository,
    TimetableVersionRepository,
    AcademicCalendarRepository,
    ScheduleOverrideRepository,
    AttendanceRepository
} from '../repositories/interfaces';
import type { AttendanceRecord } from '../domain';
import { projectExpectedClasses } from '../engines/projection-engine';
import type { ExpectedClass } from '../engines/projection-engine';
import type { ResolvedAttendance } from './types';

/**
 * Orchestrates attendance domain logic by coordinating repositories and the ProjectionEngine.
 * Contains no business logic or state. All methods are deterministic.
 */
export class AttendanceService {
    constructor(
        private readonly semesterRepo: SemesterRepository,
        private readonly timetableVersionRepo: TimetableVersionRepository,
        private readonly academicCalendarRepo: AcademicCalendarRepository,
        private readonly scheduleOverrideRepo: ScheduleOverrideRepository,
        private readonly attendanceRepo: AttendanceRepository
    ) {}

    /**
     * Resolves expected classes against actual attendance records for a specific date range.
     */
    async resolveForDateRange(semesterId: string, startDate: Date, endDate: Date): Promise<ResolvedAttendance[]> {
        const [
            versions,
            events,
            overrides,
            attendanceRecords
        ] = await Promise.all([
            this.timetableVersionRepo.findVersionsForSemester(semesterId),
            this.academicCalendarRepo.findEventsBetween(startDate, endDate),
            this.scheduleOverrideRepo.findOverridesBetween(startDate, endDate),
            this.attendanceRepo.findAttendanceBetween(startDate, endDate)
        ]);

        // We need slots for all the returned versions
        const slotsPromises = versions.map(v => this.timetableVersionRepo.findTimetableSlots(v.id));
        const slotsArrays = await Promise.all(slotsPromises);
        const slots = slotsArrays.flat();

        const expectedClasses = projectExpectedClasses(
            startDate,
            endDate,
            versions,
            slots,
            events,
            overrides
        );

        return this.mergeProjectionsWithAttendance(expectedClasses, attendanceRecords);
    }

    /**
     * Resolves attendance for a single day.
     */
    async resolveForDate(semesterId: string, date: Date): Promise<ResolvedAttendance[]> {
        return this.resolveForDateRange(semesterId, date, date);
    }

    /**
     * Resolves attendance for an entire semester.
     */
    async resolveForSemester(semesterId: string): Promise<ResolvedAttendance[]> {
        const semester = await this.semesterRepo.getSemester(semesterId);
        if (!semester) {
            throw new Error(`Semester with ID ${semesterId} not found.`);
        }

        return this.resolveForDateRange(semesterId, semester.startDate, semester.endDate);
    }

    /**
     * Internal helper to merge projections with actual attendance records.
     * Matches based on Date, Subject, and TimetableSlot.
     * EXTRA classes with null slot IDs will simply not match any record, returning null (Not Recorded).
     */
    private mergeProjectionsWithAttendance(
        expectedClasses: ExpectedClass[],
        attendanceRecords: AttendanceRecord[]
    ): ResolvedAttendance[] {
        // Create an O(1) lookup map for attendance records
        // Key format: "timestamp_subjectId_timetableSlotId"
        const recordMap = new Map<string, AttendanceRecord>();
        
        for (const record of attendanceRecords) {
            const date = new Date(record.date.getTime());
            date.setHours(0, 0, 0, 0);
            
            const key = `${date.getTime()}_${record.subjectId}_${record.timetableSlotId}`;
            recordMap.set(key, record);
        }

        return expectedClasses.map(expected => {
            const expectedDate = new Date(expected.date.getTime());
            expectedDate.setHours(0, 0, 0, 0);
            
            // For EXTRA classes, timetableSlotId is null, but we save the record with startTime as the slotId.
            const matchKey = expected.timetableSlotId || expected.startTime;
            const key = `${expectedDate.getTime()}_${expected.subjectId}_${matchKey}`;
            const matchingRecord = recordMap.get(key) || null;

            return {
                expectedClass: expected,
                attendanceRecord: matchingRecord
            };
        });
    }
}
