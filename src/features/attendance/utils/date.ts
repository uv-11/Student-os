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
