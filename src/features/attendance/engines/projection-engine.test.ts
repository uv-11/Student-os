import { describe, it, expect } from 'vitest';
import {
    projectExpectedClasses,
    ExpectedClassStatus
} from './projection-engine';
import {
    DayOfWeek,
    AcademicCalendarEventType,
    ScheduleOverrideType
} from '../domain/types';
import type {
    TimetableVersion,
    TimetableSlot,
    AcademicCalendarEvent,
    ScheduleOverride
} from '../domain';

describe('Projection Engine', () => {
    // A Monday date: 2026-03-02
    const monday = new Date('2026-03-02T00:00:00.000Z');

    const version: TimetableVersion = {
        id: 'ver-1',
        semesterId: 'sem-1',
        validFrom: new Date('2026-01-01T00:00:00.000Z'),
        validUntil: null
    };

    const slots: TimetableSlot[] = [
        {
            id: 'slot-mon-cs',
            timetableVersionId: 'ver-1',
            subjectId: 'sub-cs',
            dayOfWeek: DayOfWeek.MONDAY,
            startTime: '09:00',
            endTime: '10:00'
        },
        {
            id: 'slot-mon-math',
            timetableVersionId: 'ver-1',
            subjectId: 'sub-math',
            dayOfWeek: DayOfWeek.MONDAY,
            startTime: '10:15',
            endTime: '11:15'
        }
    ];

    it('generates base scheduled classes for matching days of week', () => {
        // Range Monday to Monday (1 day)
        const projections = projectExpectedClasses(monday, monday, [version], slots, [], []);

        expect(projections).toHaveLength(2);
        expect(projections[0].subjectId).toBe('sub-cs');
        expect(projections[0].status).toBe(ExpectedClassStatus.SCHEDULED);
        expect(projections[0].startTime).toBe('09:00');

        expect(projections[1].subjectId).toBe('sub-math');
        expect(projections[1].status).toBe(ExpectedClassStatus.SCHEDULED);
        expect(projections[1].startTime).toBe('10:15');
    });

    it('marks classes as CANCELLED when override matches', () => {
        const cancelOverride: ScheduleOverride = {
            id: 'ov-1',
            type: ScheduleOverrideType.CANCELLED,
            subjectId: 'sub-cs',
            originalStartTime: '09:00',
            date: monday,
            notes: 'Professor sick'
        };

        const projections = projectExpectedClasses(
            monday,
            monday,
            [version],
            slots,
            [],
            [cancelOverride]
        );

        expect(projections).toHaveLength(2);
        const csClass = projections.find(p => p.subjectId === 'sub-cs');
        expect(csClass?.status).toBe(ExpectedClassStatus.CANCELLED);

        const mathClass = projections.find(p => p.subjectId === 'sub-math');
        expect(mathClass?.status).toBe(ExpectedClassStatus.SCHEDULED);
    });

    it('applies RESCHEDULED override updates startTime and endTime', () => {
        const rescheduleOverride: ScheduleOverride = {
            id: 'ov-2',
            type: ScheduleOverrideType.RESCHEDULED,
            subjectId: 'sub-math',
            originalStartTime: '10:15',
            replacementStartTime: '14:00',
            replacementEndTime: '15:00',
            date: monday,
            notes: 'Lab swapped'
        };

        const projections = projectExpectedClasses(
            monday,
            monday,
            [version],
            slots,
            [],
            [rescheduleOverride]
        );

        const mathClass = projections.find(p => p.subjectId === 'sub-math');
        expect(mathClass?.status).toBe(ExpectedClassStatus.RESCHEDULED);
        expect(mathClass?.startTime).toBe('14:00');
        expect(mathClass?.endTime).toBe('15:00');
    });

    it('adds EXTRA class outside timetable version slots', () => {
        const extraOverride: ScheduleOverride = {
            id: 'ov-extra',
            type: ScheduleOverrideType.EXTRA,
            subjectId: 'sub-physics',
            replacementStartTime: '16:00',
            replacementEndTime: '17:00',
            date: monday,
            notes: 'Remedial session'
        };

        const projections = projectExpectedClasses(
            monday,
            monday,
            [version],
            slots,
            [],
            [extraOverride]
        );

        expect(projections).toHaveLength(3);
        const extraClass = projections.find(p => p.status === ExpectedClassStatus.EXTRA);
        expect(extraClass).toBeDefined();
        expect(extraClass?.subjectId).toBe('sub-physics');
        expect(extraClass?.startTime).toBe('16:00');
    });

    it('marks classes on holiday dates as HOLIDAY overriding normal scheduled status', () => {
        const holidayEvent: AcademicCalendarEvent = {
            id: 'event-holiday',
            semesterId: 'sem-1',
            date: monday,
            type: AcademicCalendarEventType.HOLIDAY,
            description: 'Spring Break'
        };

        const projections = projectExpectedClasses(
            monday,
            monday,
            [version],
            slots,
            [holidayEvent],
            []
        );

        expect(projections).toHaveLength(2);
        expect(projections.every(p => p.status === ExpectedClassStatus.HOLIDAY)).toBe(true);
    });
});
