import type {
    SemesterRepository,
    SubjectRepository,
    TimetableVersionRepository,
    AcademicCalendarRepository,
    ScheduleOverrideRepository,
    AttendanceRepository
} from './interfaces';
import { attendanceStore } from './zustand-store';
import type {
    Semester,
    Subject,
    TimetableVersion,
    TimetableSlot,
    AcademicCalendarEvent,
    ScheduleOverride,
    AttendanceRecord
} from '../domain';

export class ZustandSemesterRepository implements SemesterRepository {
    async getActiveSemester(currentDate: Date): Promise<Semester | null> {
        const state = attendanceStore.getState();
        const targetTime = currentDate.getTime();
        const active = Object.values(state.semesters).find(s => {
            const start = new Date(s.startDate).setHours(0, 0, 0, 0);
            const end = new Date(s.endDate).setHours(23, 59, 59, 999);
            return targetTime >= start && targetTime <= end;
        });
        return active || null;
    }

    async getSemester(id: string): Promise<Semester | null> {
        return attendanceStore.getState().semesters[id] || null;
    }

    async saveSemester(semester: Semester): Promise<void> {
        attendanceStore.setState(state => ({
            semesters: { ...state.semesters, [semester.id]: semester }
        }));
    }
}

export class ZustandSubjectRepository implements SubjectRepository {
    async findSubjects(): Promise<Subject[]> {
        return Object.values(attendanceStore.getState().subjects);
    }

    async getSubject(id: string): Promise<Subject | null> {
        return attendanceStore.getState().subjects[id] || null;
    }

    async createSubject(subject: Subject): Promise<void> {
        attendanceStore.setState(state => ({
            subjects: { ...state.subjects, [subject.id]: subject }
        }));
    }

    async updateSubject(subject: Subject): Promise<void> {
        await this.createSubject(subject);
    }

    async removeSubject(id: string): Promise<void> {
        attendanceStore.setState(state => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _, ...restSubjects } = state.subjects;
            const remainingSlots: Record<string, TimetableSlot> = {};
            for (const [slotId, slot] of Object.entries(state.timetableSlots)) {
                if (slot.subjectId !== id) {
                    remainingSlots[slotId] = slot;
                }
            }
            const remainingRecords: Record<string, AttendanceRecord> = {};
            for (const [recId, rec] of Object.entries(state.attendanceRecords)) {
                if (rec.subjectId !== id) {
                    remainingRecords[recId] = rec;
                }
            }
            return { 
                subjects: restSubjects,
                timetableSlots: remainingSlots,
                attendanceRecords: remainingRecords
            };
        });
    }
}

export class ZustandTimetableVersionRepository implements TimetableVersionRepository {
    async findActiveVersion(semesterId: string, date: Date): Promise<TimetableVersion | null> {
        const state = attendanceStore.getState();
        const dateTime = date.getTime();
        const version = Object.values(state.timetableVersions).find(v => {
            if (v.semesterId !== semesterId) return false;
            const vStart = new Date(v.validFrom).getTime();
            const isAfterStart = dateTime >= vStart;
            const isBeforeEnd = v.validUntil === null || dateTime < new Date(v.validUntil).getTime();
            return isAfterStart && isBeforeEnd;
        });
        return version || null;
    }

    async findVersionsForSemester(semesterId: string): Promise<TimetableVersion[]> {
        const state = attendanceStore.getState();
        return Object.values(state.timetableVersions).filter(v => v.semesterId === semesterId);
    }

    async findTimetableSlots(timetableVersionId: string): Promise<TimetableSlot[]> {
        const state = attendanceStore.getState();
        return Object.values(state.timetableSlots).filter(s => s.timetableVersionId === timetableVersionId);
    }

    async createVersion(version: TimetableVersion): Promise<void> {
        attendanceStore.setState(state => ({
            timetableVersions: { ...state.timetableVersions, [version.id]: version }
        }));
    }

    async updateVersion(version: TimetableVersion): Promise<void> {
        await this.createVersion(version);
    }

    async createTimetableSlots(slots: TimetableSlot[]): Promise<void> {
        attendanceStore.setState(state => {
            const newSlots = { ...state.timetableSlots };
            for (const slot of slots) {
                newSlots[slot.id] = slot;
            }
            return { timetableSlots: newSlots };
        });
    }

    async updateTimetableSlots(slots: TimetableSlot[]): Promise<void> {
        await this.createTimetableSlots(slots);
    }

    async removeTimetableSlot(id: string): Promise<void> {
        attendanceStore.setState(state => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _, ...rest } = state.timetableSlots;
            return { timetableSlots: rest };
        });
    }
}

export class ZustandAcademicCalendarRepository implements AcademicCalendarRepository {
    async findEventsBetween(startDate: Date, endDate: Date): Promise<AcademicCalendarEvent[]> {
        const state = attendanceStore.getState();
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        return Object.values(state.calendarEvents).filter(e => {
            const t = new Date(e.date).getTime();
            return t >= start && t <= end;
        });
    }

    async createEvent(event: AcademicCalendarEvent): Promise<void> {
        attendanceStore.setState(state => ({
            calendarEvents: { ...state.calendarEvents, [event.id]: event }
        }));
    }

    async updateEvent(event: AcademicCalendarEvent): Promise<void> {
        await this.createEvent(event);
    }

    async removeEvent(id: string): Promise<void> {
        attendanceStore.setState(state => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _, ...rest } = state.calendarEvents;
            return { calendarEvents: rest };
        });
    }
}

export class ZustandScheduleOverrideRepository implements ScheduleOverrideRepository {
    async findOverridesBetween(startDate: Date, endDate: Date): Promise<ScheduleOverride[]> {
        const state = attendanceStore.getState();
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        return Object.values(state.scheduleOverrides).filter(o => {
            const t = new Date(o.date).getTime();
            return t >= start && t <= end;
        });
    }

    async createOverride(override: ScheduleOverride): Promise<void> {
        attendanceStore.setState(state => ({
            scheduleOverrides: { ...state.scheduleOverrides, [override.id]: override }
        }));
    }

    async updateOverride(override: ScheduleOverride): Promise<void> {
        await this.createOverride(override);
    }

    async removeOverride(id: string): Promise<void> {
        attendanceStore.setState(state => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _, ...rest } = state.scheduleOverrides;
            return { scheduleOverrides: rest };
        });
    }
}

export class ZustandAttendanceRepository implements AttendanceRepository {
    async findAttendanceBetween(startDate: Date, endDate: Date): Promise<AttendanceRecord[]> {
        const state = attendanceStore.getState();
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        return Object.values(state.attendanceRecords).filter(r => {
            const t = new Date(r.date).getTime();
            return t >= start && t <= end;
        });
    }

    async findAttendanceForDate(date: Date): Promise<AttendanceRecord[]> {
        const state = attendanceStore.getState();
        const targetDay = new Date(date).setHours(0, 0, 0, 0);
        return Object.values(state.attendanceRecords).filter(r => {
            const rDay = new Date(r.date).setHours(0, 0, 0, 0);
            return rDay === targetDay;
        });
    }

    async createAttendance(record: AttendanceRecord): Promise<void> {
        attendanceStore.setState(state => ({
            attendanceRecords: { ...state.attendanceRecords, [record.id]: record }
        }));
    }

    async updateAttendance(record: AttendanceRecord): Promise<void> {
        await this.createAttendance(record);
    }

    async removeAttendance(id: string): Promise<void> {
        attendanceStore.setState(state => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _, ...rest } = state.attendanceRecords;
            return { attendanceRecords: rest };
        });
    }
}



