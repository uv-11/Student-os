import type { TimetableVersion, TimetableSlot, AcademicCalendarEvent, ScheduleOverride } from '../domain';
import { AcademicCalendarEventType, ScheduleOverrideType, DayOfWeek } from '../domain/types';
import { determineEffectiveVersion } from './timetable-engine';

export enum ExpectedClassStatus {
    SCHEDULED = 'SCHEDULED',
    CANCELLED = 'CANCELLED',
    HOLIDAY = 'HOLIDAY',
    EXTRA = 'EXTRA',
    RESCHEDULED = 'RESCHEDULED'
}

export interface ExpectedClass {
    readonly date: Date;
    readonly subjectId: string;
    readonly timetableVersionId: string;
    readonly timetableSlotId: string | null;
    readonly startTime: string;
    readonly endTime: string;
    readonly status: ExpectedClassStatus;
}

/**
 * Projects expected classes for a given date range by evaluating timetable versions,
 * recurring slots, academic calendar events, and schedule overrides.
 */
export function projectExpectedClasses(
    startDate: Date,
    endDate: Date,
    versions: TimetableVersion[],
    slots: TimetableSlot[],
    events: AcademicCalendarEvent[],
    overrides: ScheduleOverride[]
): ExpectedClass[] {
    let projections = generateBaseProjections(startDate, endDate, versions, slots);
    
    // PRECEDENCE PIPELINE:
    // 1. Base Projections (SCHEDULED)
    // 2. Micro-modifications (Overrides map to CANCELLED, RESCHEDULED, or append EXTRA)
    projections = applyScheduleOverrides(projections, overrides);
    // 3. Macro-constraints (Calendar events map to HOLIDAY)
    projections = applyCalendarEvents(projections, events);
    
    return sortChronologically(projections);
}

function generateBaseProjections(
    startDate: Date,
    endDate: Date,
    versions: TimetableVersion[],
    slots: TimetableSlot[]
): ExpectedClass[] {
    const projections: ExpectedClass[] = [];
    
    const currentDate = new Date(startDate.getTime());
    currentDate.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate.getTime());
    end.setHours(0, 0, 0, 0);

    while (currentDate.getTime() <= end.getTime()) {
        const effectiveVersion = determineEffectiveVersion(versions, currentDate);
        
        if (effectiveVersion) {
            const dayOfWeek = getDayOfWeek(currentDate);
            const activeSlots = slots.filter(
                s => s.timetableVersionId === effectiveVersion.id && s.dayOfWeek === dayOfWeek
            );
            
            for (const slot of activeSlots) {
                projections.push({
                    date: new Date(currentDate.getTime()),
                    subjectId: slot.subjectId,
                    timetableVersionId: effectiveVersion.id,
                    timetableSlotId: slot.id,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    status: ExpectedClassStatus.SCHEDULED
                });
            }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return projections;
}

function applyScheduleOverrides(
    projections: ExpectedClass[],
    overrides: ScheduleOverride[]
): ExpectedClass[] {
    let finalProjections = [...projections];

    // Priority to CANCELLED overrides in case of collision
    const sortedOverrides = [...overrides].sort((a, b) => {
        if (a.type === ScheduleOverrideType.CANCELLED && b.type !== ScheduleOverrideType.CANCELLED) return -1;
        if (b.type === ScheduleOverrideType.CANCELLED && a.type !== ScheduleOverrideType.CANCELLED) return 1;
        return 0;
    });

    for (const override of sortedOverrides) {
        const overrideDate = new Date(override.date.getTime());
        overrideDate.setHours(0, 0, 0, 0);

        if (override.type === ScheduleOverrideType.CANCELLED) {
            finalProjections = finalProjections.map(p => {
                if (p.date.getTime() === overrideDate.getTime() && 
                    p.subjectId === override.subjectId && 
                    p.startTime === override.originalStartTime) {
                    return { ...p, status: ExpectedClassStatus.CANCELLED };
                }
                return p;
            });
        } else if (override.type === ScheduleOverrideType.RESCHEDULED) {
            finalProjections = finalProjections.map(p => {
                if (p.date.getTime() === overrideDate.getTime() && 
                    p.subjectId === override.subjectId && 
                    p.startTime === override.originalStartTime) {
                    // Do not reschedule if already cancelled
                    if (p.status === ExpectedClassStatus.CANCELLED) return p;
                    
                    return {
                        ...p,
                        startTime: override.replacementStartTime,
                        endTime: override.replacementEndTime,
                        status: ExpectedClassStatus.RESCHEDULED
                    };
                }
                return p;
            });
        } else if (override.type === ScheduleOverrideType.EXTRA) {
            finalProjections.push({
                date: new Date(overrideDate.getTime()),
                subjectId: override.subjectId,
                timetableVersionId: '', // Extras operate outside versioning
                timetableSlotId: null,
                startTime: override.replacementStartTime,
                endTime: override.replacementEndTime,
                status: ExpectedClassStatus.EXTRA
            });
        }
    }

    return finalProjections;
}

function applyCalendarEvents(
    projections: ExpectedClass[],
    events: AcademicCalendarEvent[]
): ExpectedClass[] {
    const holidayDates = new Set(
        events
            .filter(e => e.type === AcademicCalendarEventType.HOLIDAY)
            .map(e => {
                const d = new Date(e.date.getTime());
                d.setHours(0, 0, 0, 0);
                return d.getTime();
            })
    );

    return projections.map(p => {
        if (holidayDates.has(p.date.getTime())) {
            return { ...p, status: ExpectedClassStatus.HOLIDAY };
        }
        return p;
    });
}

function sortChronologically(projections: ExpectedClass[]): ExpectedClass[] {
    return [...projections].sort((a, b) => {
        const dateDiff = a.date.getTime() - b.date.getTime();
        if (dateDiff !== 0) return dateDiff;
        return a.startTime.localeCompare(b.startTime);
    });
}

function getDayOfWeek(date: Date): DayOfWeek {
    const days = [
        DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY,
        DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY,
        DayOfWeek.SATURDAY
    ];
    return days[date.getDay()];
}
