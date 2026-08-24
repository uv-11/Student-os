import { ExpectedClassStatus, AttendanceStatus } from '../domain';
import type { ResolvedAttendance } from './types';
import type {
    OverallStatistics,
    SubjectStatistics,
    RequirementAnalysis,
    TimeSummary,
    StreakInfo
} from './statistics-types';

/**
 * A pure analytical domain service.
 * Owns all attendance calculations. Performs no I/O.
 */
export class StatisticsService {
    
    /**
     * Calculates overall attendance metrics.
     */
    static calculateOverall(data: ResolvedAttendance[]): OverallStatistics {
        this.detectDuplicates(data);

        const stats = {
            totalScheduled: 0,
            totalAttended: 0,
            totalAbsent: 0,
            totalCancelled: 0,
            totalHolidays: 0,
            totalExtra: 0,
            totalRescheduled: 0
        };

        for (const item of data) {
            if (!this.hasStarted(item)) continue;

            const status = item.expectedClass.status;
            
            if (status === ExpectedClassStatus.CANCELLED) stats.totalCancelled++;
            else if (status === ExpectedClassStatus.HOLIDAY) stats.totalHolidays++;
            else if (status === ExpectedClassStatus.EXTRA) stats.totalExtra++;
            else if (status === ExpectedClassStatus.RESCHEDULED) stats.totalRescheduled++;

            if (this.isCountable(item)) {
                stats.totalScheduled++;
                if (this.isAttended(item)) stats.totalAttended++;
                else if (this.isAbsent(item)) stats.totalAbsent++;
            }
        }

        return {
            ...stats,
            attendancePercentage: this.calculatePercentage(stats.totalAttended, stats.totalAbsent)
        };
    }

    /**
     * Calculates metrics grouped by subject.
     */
    static calculateSubjectWise(data: ResolvedAttendance[]): Record<string, SubjectStatistics> {
        this.detectDuplicates(data);
        
        const map: Record<string, { attended: number; absent: number; scheduled: number }> = {};

        for (const item of data) {
            if (!this.hasStarted(item)) continue;

            const subjectId = item.expectedClass.subjectId;
            if (!map[subjectId]) {
                map[subjectId] = { attended: 0, absent: 0, scheduled: 0 };
            }

            if (this.isCountable(item)) {
                map[subjectId].scheduled++;
                if (this.isAttended(item)) map[subjectId].attended++;
                else if (this.isAbsent(item)) map[subjectId].absent++;
            }
        }

        const result: Record<string, SubjectStatistics> = {};
        for (const [subjectId, stats] of Object.entries(map)) {
            result[subjectId] = {
                subjectId,
                totalScheduled: stats.scheduled,
                totalAttended: stats.attended,
                totalAbsent: stats.absent,
                attendancePercentage: this.calculatePercentage(stats.attended, stats.absent)
            };
        }

        return result;
    }

    /**
     * Returns subjects falling below a given percentage threshold.
     */
    static getLowAttendanceSubjects(data: ResolvedAttendance[], thresholdPercentage: number): SubjectStatistics[] {
        const subjectStats = this.calculateSubjectWise(data);
        return Object.values(subjectStats)
            .filter(stat => stat.attendancePercentage < thresholdPercentage)
            .sort((a, b) => a.attendancePercentage - b.attendancePercentage);
    }

    /**
     * Determines requirements to reach or maintain a target percentage.
     */
    static calculateRequirements(data: ResolvedAttendance[], targetPercentage: number): RequirementAnalysis {
        const overall = this.calculateOverall(data);
        const currentPercentage = overall.attendancePercentage;
        const isTargetSatisfied = currentPercentage >= targetPercentage;

        let additionalConsecutiveClassesRequired = 0;
        let maximumBunkableClasses = 0;
        let isMathematicallyImpossible = false;

        if (targetPercentage > 0 && targetPercentage <= 100) {
            let simulatedAttended = overall.totalAttended;
            let simulatedAbsent = overall.totalAbsent;
            
            if (!isTargetSatisfied) {
                // How many to attend consecutively?
                while (this.calculatePercentage(simulatedAttended, simulatedAbsent) < targetPercentage) {
                    simulatedAttended++;
                    additionalConsecutiveClassesRequired++;
                    // Hard stop to prevent infinite loops if mathematically impossible 
                    if (additionalConsecutiveClassesRequired > 1000) {
                        isMathematicallyImpossible = true;
                        break;
                    }
                }
            } else {
                // How many can safely be missed?
                while (this.calculatePercentage(simulatedAttended, simulatedAbsent + 1) >= targetPercentage) {
                    simulatedAbsent++;
                    maximumBunkableClasses++;
                    if (maximumBunkableClasses > 1000) {
                        // Usually only happens if target is 0 or strange logic
                        break;
                    }
                }
            }
        }

        return {
            targetPercentage,
            currentPercentage,
            isTargetSatisfied,
            additionalConsecutiveClassesRequired,
            maximumBunkableClasses,
            isMathematicallyImpossible
        };
    }

    /**
     * Calculates streak information. Holidays and Cancelled classes do not break the streak.
     */
    static calculateStreaks(data: ResolvedAttendance[]): StreakInfo {
        // Must be sorted chronologically for streaks to work
        const sorted = [...data].sort((a, b) => a.expectedClass.date.getTime() - b.expectedClass.date.getTime());
        
        let currentStreak = 0;
        let longestStreak = 0;

        for (const item of sorted) {
            if (!this.hasStarted(item)) continue;

            if (this.isAttended(item)) {
                currentStreak++;
                if (currentStreak > longestStreak) {
                    longestStreak = currentStreak;
                }
            } else if (this.isAbsent(item)) {
                currentStreak = 0;
            }
            // If CANCELLED, HOLIDAY, or unrecorded, streak is maintained (neither increments nor resets)
        }

        return { currentStreak, longestStreak };
    }

    // --- Time-Based Statistics ---

    static calculateDailySummary(data: ResolvedAttendance[]): TimeSummary[] {
        return this.aggregateByPeriod(data, date => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        });
    }

    static calculateWeeklySummary(data: ResolvedAttendance[]): TimeSummary[] {
        return this.aggregateByPeriod(data, date => {
            const d = new Date(date.getTime());
            d.setHours(0, 0, 0, 0);
            // Simple ISO week logic: find Thursday of the week to determine the year and week number
            d.setDate(d.getDate() + 4 - (d.getDay() || 7));
            const yearStart = new Date(d.getFullYear(), 0, 1);
            const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
            return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
        });
    }

    static calculateMonthlySummary(data: ResolvedAttendance[]): TimeSummary[] {
        return this.aggregateByPeriod(data, date => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            return `${y}-${m}`;
        });
    }

    // --- Private Pure Helpers ---

    private static aggregateByPeriod(data: ResolvedAttendance[], keySelector: (date: Date) => string): TimeSummary[] {
        const map: Record<string, { attended: number; absent: number }> = {};

        for (const item of data) {
            if (!this.hasStarted(item)) continue;

            if (this.isCountable(item)) {
                const key = keySelector(item.expectedClass.date);
                if (!map[key]) map[key] = { attended: 0, absent: 0 };

                if (this.isAttended(item)) map[key].attended++;
                else if (this.isAbsent(item)) map[key].absent++;
            }
        }

        return Object.entries(map)
            .map(([period, stats]) => ({
                period,
                totalAttended: stats.attended,
                totalAbsent: stats.absent,
                attendancePercentage: this.calculatePercentage(stats.attended, stats.absent)
            }))
            .sort((a, b) => a.period.localeCompare(b.period));
    }

    private static hasStarted(item: ResolvedAttendance): boolean {
        const startTime = item.expectedClass.startTime || '00:00';
        const [h, m] = startTime.split(':').map(Number);
        const classStart = new Date(item.expectedClass.date.getTime());
        classStart.setHours(h || 0, m || 0, 0, 0);
        return classStart.getTime() <= Date.now();
    }

    private static isCountable(item: ResolvedAttendance): boolean {
        // A class is countable if it was supposed to happen (SCHEDULED, EXTRA, RESCHEDULED)
        const status = item.expectedClass.status;
        return status === ExpectedClassStatus.SCHEDULED || 
               status === ExpectedClassStatus.EXTRA || 
               status === ExpectedClassStatus.RESCHEDULED;
    }

    private static isAttended(item: ResolvedAttendance): boolean {
        return this.isCountable(item) && item.attendanceRecord?.status === AttendanceStatus.PRESENT;
    }

    private static isAbsent(item: ResolvedAttendance): boolean {
        return this.isCountable(item) && item.attendanceRecord?.status === AttendanceStatus.ABSENT;
    }

    private static calculatePercentage(attended: number, absent: number): number {
        const total = attended + absent;
        if (total === 0) return 0; // Use null/0 semantics instead of fabricating 100%
        return Math.round((attended / total) * 10000) / 100; // 2 decimal places
    }

    private static detectDuplicates(data: ResolvedAttendance[]): void {
        const keys = new Set<string>();
        for (const item of data) {
            const key = `${item.expectedClass.date.getTime()}_${item.expectedClass.subjectId}_${item.expectedClass.startTime}`;
            if (keys.has(key)) {
                console.warn(`[StatisticsService] Duplicate class occurrence detected for key: ${key}`);
            }
            keys.add(key);
        }
    }
}
