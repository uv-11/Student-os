
export interface OverallStatistics {
    readonly totalScheduled: number;
    readonly totalAttended: number;
    readonly totalAbsent: number;
    readonly totalCancelled: number;
    readonly totalHolidays: number;
    readonly totalExtra: number;
    readonly totalRescheduled: number;
    readonly attendancePercentage: number;
}

export interface SubjectStatistics {
    readonly subjectId: string;
    readonly totalScheduled: number;
    readonly totalAttended: number;
    readonly totalAbsent: number;
    readonly attendancePercentage: number;
}

export interface RequirementAnalysis {
    readonly targetPercentage: number;
    readonly currentPercentage: number;
    readonly isTargetSatisfied: boolean;
    readonly additionalConsecutiveClassesRequired: number;
    readonly maximumBunkableClasses: number;
}

export interface TimeSummary {
    readonly period: string; // e.g., '2023-10-05', '2023-W41', '2023-10'
    readonly totalAttended: number;
    readonly totalAbsent: number;
    readonly attendancePercentage: number;
}

export interface StreakInfo {
    readonly currentStreak: number;
    readonly longestStreak: number;
}
