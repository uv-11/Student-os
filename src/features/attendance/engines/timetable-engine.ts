import type { TimetableVersion } from '../domain';

/**
 * Determines the effective timetable version for a given date from a list of versions.
 * Uses half-open intervals: validFrom <= date < validUntil
 */
export function determineEffectiveVersion(
    versions: TimetableVersion[],
    date: Date
): TimetableVersion | null {
    if (!versions || versions.length === 0) return null;

    // Filter valid versions and sort by validFrom ascending
    const sorted = [...versions]
        .filter(v => v && v.validFrom && !isNaN(new Date(v.validFrom).getTime()))
        .sort((a, b) => new Date(a.validFrom).getTime() - new Date(b.validFrom).getTime());

    const dateTime = date.getTime();

    // 1. Direct timestamp check
    const effectiveVersion = sorted.find(v => {
        const vStart = new Date(v.validFrom).getTime();
        const vEnd = v.validUntil !== null ? new Date(v.validUntil).getTime() : null;

        const isAfterStart = dateTime >= vStart;
        const isBeforeEnd = vEnd === null || dateTime < vEnd;
        return isAfterStart && isBeforeEnd;
    });

    if (effectiveVersion) return effectiveVersion;

    // 2. Fallback to start-of-day comparison (handles cases where date or validFrom has a time component)
    const targetDay = new Date(date);
    targetDay.setHours(0, 0, 0, 0);
    const targetDayTime = targetDay.getTime();

    const effectiveByDay = sorted.find(v => {
        const vStartDay = new Date(v.validFrom);
        vStartDay.setHours(0, 0, 0, 0);
        const vStartDayTime = vStartDay.getTime();

        const vEndDayTime = v.validUntil !== null ? (() => {
            const vEndDay = new Date(v.validUntil);
            vEndDay.setHours(0, 0, 0, 0);
            return vEndDay.getTime();
        })() : null;

        const isAfterStart = targetDayTime >= vStartDayTime;
        const isBeforeEnd = vEndDayTime === null || targetDayTime < vEndDayTime;
        return isAfterStart && isBeforeEnd;
    });

    return effectiveByDay || null;
}

/**
 * Resolves all timetable versions for a semester to ensure there are no overlapping 
 * boundaries or invalid gaps between transitions.
 */
export function resolveVersionBoundaries(versions: TimetableVersion[]): TimetableVersion[] {
    if (!versions || versions.length === 0) return [];

    // Sort by validFrom ascending
    const sorted = [...versions]
        .filter(v => v && v.validFrom)
        .sort((a, b) => new Date(a.validFrom).getTime() - new Date(b.validFrom).getTime());
    
    for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        // If the current version is open-ended, automatically close it exactly when the next one starts
        if (current.validUntil === null) {
            sorted[i] = { ...current, validUntil: new Date(next.validFrom.getTime()) };
        } else {
            // Ensure no invalid overlaps (current cannot end after next starts)
            if (sorted[i].validUntil!.getTime() > next.validFrom.getTime()) {
                throw new Error("Timetable versions cannot overlap.");
            }
        }
    }

    return sorted;
}

/**
 * Prepares a new timetable version to be persisted.
 * Automatically adjusts the previous active version's validity to prevent overlaps,
 * returning the updated closed versions and the new version.
 */
export function prepareNewVersion(
    existingVersions: TimetableVersion[],
    newVersion: TimetableVersion
): { updatedVersions: TimetableVersion[], newVersion: TimetableVersion } {
    validateVersionBoundaries(existingVersions, newVersion.validFrom);

    const updatedVersions = existingVersions.map(v => {
        if (v.validUntil === null) {
            // Close the currently active open version exactly when the new one starts
            return { ...v, validUntil: new Date(newVersion.validFrom.getTime()) };
        }
        return { ...v };
    });

    return { updatedVersions, newVersion };
}

/**
 * Internal boundary validation. 
 * Ensures we don't insert a version earlier than explicitly closed historical versions.
 */
function validateVersionBoundaries(versions: TimetableVersion[], newValidFrom: Date): void {
    const newStartTime = newValidFrom.getTime();
    for (const version of versions) {
        if (version.validUntil !== null && newStartTime < new Date(version.validUntil).getTime()) {
            throw new Error("New version validFrom date cannot precede existing closed versions.");
        }
    }
}


