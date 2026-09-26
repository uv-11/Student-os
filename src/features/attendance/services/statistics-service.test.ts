import { describe, it, expect } from 'vitest';
import { StatisticsService } from './statistics-service';
import { ExpectedClassStatus } from '../engines/projection-engine';
import { AttendanceStatus } from '../domain/types';
import type { ResolvedAttendance } from './types';

describe('Statistics Service', () => {
    // Past date so hasStarted(item) returns true
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const makeResolved = (
        subjectId: string,
        status: ExpectedClassStatus,
        attendance: AttendanceStatus | null,
        offsetHours = 0
    ): ResolvedAttendance => ({
        expectedClass: {
            date: new Date(pastDate.getTime() + offsetHours * 3600000),
            subjectId,
            timetableVersionId: 'ver-1',
            timetableSlotId: 'slot-1',
            startTime: '08:00',
            endTime: '09:00',
            status,
        },
        attendanceRecord: attendance
            ? {
                  id: 'rec-1',
                  date: new Date(pastDate.getTime() + offsetHours * 3600000),
                  subjectId,
                  timetableSlotId: 'slot-1',
                  status: attendance,
              }
            : null,
    });

    describe('calculateOverall', () => {
        it('calculates correct percentages for present and absent classes', () => {
            const data: ResolvedAttendance[] = [
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.PRESENT),
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.PRESENT),
                makeResolved('cs', ExpectedClassStatus.SCHEDULED, AttendanceStatus.PRESENT),
                makeResolved('cs', ExpectedClassStatus.SCHEDULED, AttendanceStatus.ABSENT),
            ];

            const stats = StatisticsService.calculateOverall(data);
            expect(stats.totalScheduled).toBe(4);
            expect(stats.totalAttended).toBe(3);
            expect(stats.totalAbsent).toBe(1);
            expect(stats.attendancePercentage).toBe(75);
        });

        it('ignores cancelled classes and holidays in the total countable scheduled count', () => {
            const data: ResolvedAttendance[] = [
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.PRESENT),
                makeResolved('math', ExpectedClassStatus.CANCELLED, null),
                makeResolved('math', ExpectedClassStatus.HOLIDAY, null),
            ];

            const stats = StatisticsService.calculateOverall(data);
            expect(stats.totalScheduled).toBe(1);
            expect(stats.totalAttended).toBe(1);
            expect(stats.totalCancelled).toBe(1);
            expect(stats.totalHolidays).toBe(1);
            expect(stats.attendancePercentage).toBe(100);
        });

        it('uncounts classes tagged as AttendanceStatus.CANCELLED so total classes reduce and they are not unrecorded', () => {
            const data: ResolvedAttendance[] = [
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.PRESENT, 0),
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.ABSENT, 1),
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.CANCELLED, 2),
            ];

            const stats = StatisticsService.calculateOverall(data);
            // Cancelled class should NOT be in totalScheduled (so 2 instead of 3)
            expect(stats.totalScheduled).toBe(2);
            expect(stats.totalAttended).toBe(1);
            expect(stats.totalAbsent).toBe(1);
            expect(stats.totalCancelled).toBe(1);
            expect(stats.attendancePercentage).toBe(50);

            // Unrecorded formula: totalScheduled - (totalAttended + totalAbsent) should be 0
            const unrecorded = stats.totalScheduled - (stats.totalAttended + stats.totalAbsent);
            expect(unrecorded).toBe(0);

            const bySubject = StatisticsService.calculateSubjectWise(data);
            expect(bySubject['math'].totalScheduled).toBe(2);
            expect(bySubject['math'].totalAttended).toBe(1);
            expect(bySubject['math'].totalAbsent).toBe(1);
        });
    });

    describe('calculateSubjectWise', () => {
        it('partitions stats cleanly by subject ID', () => {
            const data: ResolvedAttendance[] = [
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.PRESENT),
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.ABSENT),
                makeResolved('cs', ExpectedClassStatus.SCHEDULED, AttendanceStatus.PRESENT),
            ];

            const bySubject = StatisticsService.calculateSubjectWise(data);
            expect(bySubject['math'].attendancePercentage).toBe(50);
            expect(bySubject['math'].totalScheduled).toBe(2);

            expect(bySubject['cs'].attendancePercentage).toBe(100);
            expect(bySubject['cs'].totalScheduled).toBe(1);
        });
    });

    describe('calculateRequirements (Bunk / Recovery calculations)', () => {
        it('correctly calculates maximum bunkable classes when above target', () => {
            // 9 attended, 1 absent = 90%. Target is 75%.
            const data: ResolvedAttendance[] = [];
            for (let i = 0; i < 9; i++) {
                data.push(makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.PRESENT, i));
            }
            data.push(makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.ABSENT, 9));

            const req = StatisticsService.calculateRequirements(data, 75);
            expect(req.isTargetSatisfied).toBe(true);
            expect(req.currentPercentage).toBe(90);
            // If we skip 1: 9/11 = 81.8% >= 75
            // If we skip 2: 9/12 = 75.0% >= 75
            // If we skip 3: 9/13 = 69.2% < 75
            // So maximum bunkable = 2
            expect(req.maximumBunkableClasses).toBe(2);
            expect(req.additionalConsecutiveClassesRequired).toBe(0);
        });

        it('correctly calculates consecutive classes needed when below target', () => {
            // 1 attended, 3 absent = 25%. Target is 75%.
            const data: ResolvedAttendance[] = [
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.PRESENT, 0),
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.ABSENT, 1),
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.ABSENT, 2),
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.ABSENT, 3),
            ];

            const req = StatisticsService.calculateRequirements(data, 75);
            expect(req.isTargetSatisfied).toBe(false);
            expect(req.currentPercentage).toBe(25);
            // Need (1 + x) / (4 + x) >= 0.75 => 1 + x >= 3 + 0.75x => 0.25x >= 2 => x >= 8
            expect(req.additionalConsecutiveClassesRequired).toBe(8);
        });
    });

    describe('calculateStreaks', () => {
        it('tracks consecutive attendances and does not break streak on holidays or cancellations', () => {
            const data: ResolvedAttendance[] = [
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.PRESENT, 0),
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.PRESENT, 1),
                makeResolved('math', ExpectedClassStatus.HOLIDAY, null, 2),
                makeResolved('math', ExpectedClassStatus.CANCELLED, null, 3),
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.PRESENT, 4),
            ];

            const streaks = StatisticsService.calculateStreaks(data);
            expect(streaks.currentStreak).toBe(3);
            expect(streaks.longestStreak).toBe(3);
        });

        it('resets current streak on absence', () => {
            const data: ResolvedAttendance[] = [
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.PRESENT, 0),
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.PRESENT, 1),
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.ABSENT, 2),
                makeResolved('math', ExpectedClassStatus.SCHEDULED, AttendanceStatus.PRESENT, 3),
            ];

            const streaks = StatisticsService.calculateStreaks(data);
            expect(streaks.currentStreak).toBe(1);
            expect(streaks.longestStreak).toBe(2);
        });
    });
});
