/**
 * Formats a Date object to a local YYYY-MM-DD string without timezone shifting.
 */
export function toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Parses a YYYY-MM-DD string into a local midnight Date without timezone shifting.
 */
export function parseLocalDate(dateString: string): Date {
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/**
 * Normalizes any Date, ISO string, or timestamp to the local midnight Date (00:00:00.000).
 */
export function normalizeToStartOfDay(date: Date | string | number): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Safely normalizes a date to local midnight, falling back to a default if invalid or missing.
 */
export function safeNormalizeDate(
    date: Date | string | number | null | undefined,
    fallback: Date = new Date(0)
): Date {
    if (date === null || date === undefined || date === '') {
        return normalizeToStartOfDay(fallback);
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) {
        return normalizeToStartOfDay(fallback);
    }
    return normalizeToStartOfDay(d);
}

