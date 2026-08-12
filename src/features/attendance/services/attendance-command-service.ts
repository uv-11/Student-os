import type { AttendanceRepository } from '../repositories/interfaces';
import type { AttendanceRecord, AttendanceStatus } from '../domain';

/**
 * Handles write operations (Commands) for Attendance.
 * Separated from AttendanceService to enforce CQRS principles.
 */
export class AttendanceCommandService {
    constructor(private readonly attendanceRepo: AttendanceRepository) {}

    /**
     * Records or updates an attendance entry.
     * Enforces idempotency by checking for an existing record for the same occurrence.
     */
    async recordAttendance(
        date: Date,
        subjectId: string,
        timetableSlotId: string,
        status: AttendanceStatus
    ): Promise<AttendanceRecord> {
        // Idempotency check: Does a record already exist for this exact class occurrence?
        // Note: In a real system, the repository might support a direct `findByBusinessKey` method.
        const dayRecords = await this.attendanceRepo.findAttendanceForDate(date);
        
        const existingRecord = dayRecords.find(r => 
            r.subjectId === subjectId && 
            r.timetableSlotId === timetableSlotId
        );

        if (existingRecord) {
            const updatedRecord = { ...existingRecord, status };
            await this.attendanceRepo.updateAttendance(updatedRecord);
            return updatedRecord;
        }

        // Simple random UUID generation for the record. 
        const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
        
        const newRecord: AttendanceRecord = {
            id,
            date,
            subjectId,
            timetableSlotId,
            status
        };

        await this.attendanceRepo.createAttendance(newRecord);
        return newRecord;
    }
}
