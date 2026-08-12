import type { TimetableVersion } from '../domain';

/**
 * Determines the effective timetable version for a given date from a list of versions.
 * Uses half-open intervals: validFrom <= date < validUntil
 */
export function determineEffectiveVersion(
    versions: TimetableVersion[],
    date: Date
): TimetableVersion | null {
    const effectiveVersion = versions.find(v => {
        const isAfterStart = date.getTime() >= v.validFrom.getTime();
        const isBeforeEnd = v.validUntil === null || date.getTime() < v.validUntil.getTime();
        return isAfterStart && isBeforeEnd;
    });

    return effectiveVersion || null;
}

/**
 * Resolves all timetable versions for a semester to ensure there are no overlapping 
 * boundaries or invalid gaps between transitions.
 */
export function resolveVersionBoundaries(versions: TimetableVersion[]): TimetableVersion[] {
    // Sort by validFrom ascending
    const sorted = [...versions].sort((a, b) => a.validFrom.getTime() - b.validFrom.getTime());
    
    for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        // If the current version is open-ended, automatically close it exactly when the next one starts
        if (current.validUntil === null) {
            sorted[i] = { ...current, validUntil: new Date(next.validFrom.getTime()) };
        }

        // Ensure no invalid overlaps (current cannot end after next starts)
        if (sorted[i].validUntil!.getTime() > next.validFrom.getTime()) {
            throw new Error("Timetable versions cannot overlap.");
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
    for (const version of versions) {
        if (version.validUntil !== null && newValidFrom.getTime() < version.validUntil.getTime()) {
            throw new Error("New version validFrom date cannot precede existing closed versions.");
        }
    }
}
