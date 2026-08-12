import type { AttendanceRecord } from '../domain';
import type { ExpectedClass } from '../engines/projection-engine';

export interface ResolvedAttendance {
    readonly expectedClass: ExpectedClass;
    readonly attendanceRecord: AttendanceRecord | null;
}
