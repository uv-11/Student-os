import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    determineEffectiveVersion,
    resolveVersionBoundaries,
    prepareNewVersion
} from './timetable-engine';
import {
    projectExpectedClasses,
    ExpectedClassStatus
} from './projection-engine';
import { StatisticsService } from '../services/statistics-service';
import { AttendanceService } from '../services/attendance-service';
import { AttendanceCommandService } from '../services/attendance-command-service';
import {
    ZustandSemesterRepository,
    ZustandTimetableVersionRepository,
    ZustandAcademicCalendarRepository,
    ZustandScheduleOverrideRepository,
    ZustandAttendanceRepository
} from '../repositories/zustand-repositories';
import { attendanceStore, type AttendanceState } from '../repositories/zustand-store';
import {
    DayOfWeek,
    AttendanceStatus,
    ScheduleOverrideType,
    AcademicCalendarEventType,
    type Semester,
    type TimetableVersion,
    type TimetableSlot,
    type ScheduleOverride,
    type AcademicCalendarEvent
} from '../domain';
import { BackupEngine } from '../../../lib/backup/BackupEngine';
import { MigrationEngine } from '../../../lib/migrations/MigrationEngine';
import { parseLocalDate, toLocalDateString } from '../utils/date';

describe('Historical Timetable Integrity and Schedule Versioning', () => {
    let initialStoreSnapshot: AttendanceState;

    beforeEach(() => {
        initialStoreSnapshot = attendanceStore.getState();
        // Clear isolated in-memory store for tests
        attendanceStore.setState({
            semesters: {},
            subjects: {},
            timetableVersions: {},
            timetableSlots: {},
            calendarEvents: {},
            scheduleOverrides: {},
            attendanceRecords: {}
        });
    });

    afterEach(() => {
        // Restore isolated in-memory store
        attendanceStore.setState(initialStoreSnapshot);
    });

    /**
     * Test A — Schedule change effective today
     * From 1 September through 12 October: Monday 09:00 class.
     * On 13 October: Changed to Tuesday 11:00 class.
     * Verify:
     * - Dates before 13 Oct use the original Monday schedule.
     * - Dates 13 Oct onward use the new Tuesday schedule.
     * - Recorded attendance before 13 Oct remains identical.
     */
    describe('Test A — Schedule change effective today', () => {
        it('preserves historical schedule before effective date and applies new schedule on/after effective date', async () => {
            const semesterRepo = new ZustandSemesterRepository();
            const timetableRepo = new ZustandTimetableVersionRepository();
            const calendarRepo = new ZustandAcademicCalendarRepository();
            const overrideRepo = new ZustandScheduleOverrideRepository();
            const attendanceRepo = new ZustandAttendanceRepository();
            const commandService = new AttendanceCommandService(attendanceRepo);
            const attendanceService = new AttendanceService(
                semesterRepo,
                timetableRepo,
                calendarRepo,
                overrideRepo,
                attendanceRepo
            );

            const semesterId = 'sem-fall-2026';
            const semester: Semester = {
                id: semesterId,
                name: 'Fall 2026',
                startDate: parseLocalDate('2026-09-01'),
                endDate: parseLocalDate('2026-12-31'),
                targetAttendancePercentage: 75
            };
            await semesterRepo.saveSemester(semester);

            // Version 1: 1 Sept to 13 Oct, Monday 09:00 class
            const v1: TimetableVersion = {
                id: 'v1',
                semesterId,
                validFrom: parseLocalDate('2026-09-01'),
                validUntil: parseLocalDate('2026-10-13')
            };
            const v1Slot: TimetableSlot = {
                id: 'slot-mon-cs',
                timetableVersionId: 'v1',
                subjectId: 'sub-cs',
                dayOfWeek: DayOfWeek.MONDAY,
                startTime: '09:00',
                endTime: '10:00'
            };
            await timetableRepo.createVersion(v1);
            await timetableRepo.createTimetableSlots([v1Slot]);

            // Version 2: 13 Oct onward, Tuesday 11:00 class
            const v2: TimetableVersion = {
                id: 'v2',
                semesterId,
                validFrom: parseLocalDate('2026-10-13'),
                validUntil: null
            };
            const v2Slot: TimetableSlot = {
                id: 'slot-tue-cs',
                timetableVersionId: 'v2',
                subjectId: 'sub-cs',
                dayOfWeek: DayOfWeek.TUESDAY,
                startTime: '11:00',
                endTime: '12:00'
            };
            await timetableRepo.createVersion(v2);
            await timetableRepo.createTimetableSlots([v2Slot]);

            // Record attendance for historical Monday: 2026-09-07
            const historicalMonDate = parseLocalDate('2026-09-07');
            const recordedRecord = await commandService.recordAttendance(
                historicalMonDate,
                'sub-cs',
                'slot-mon-cs',
                AttendanceStatus.PRESENT
            );

            // Resolve attendance for historical range (1 Sept - 12 Oct)
            const historicalResolved = await attendanceService.resolveForDateRange(
                semesterId,
                parseLocalDate('2026-09-01'),
                parseLocalDate('2026-10-12')
            );

            // Historical dates must have Monday classes, NO Tuesday classes
            expect(historicalResolved.some(r => r.expectedClass.startTime === '09:00')).toBe(true);
            expect(historicalResolved.some(r => r.expectedClass.startTime === '11:00')).toBe(false);

            // The recorded attendance on Sept 7 must remain matched and PRESENT
            const sept7Occurrence = historicalResolved.find(
                r => toLocalDateString(r.expectedClass.date) === '2026-09-07'
            );
            expect(sept7Occurrence).toBeDefined();
            expect(sept7Occurrence?.attendanceRecord?.id).toBe(recordedRecord.id);
            expect(sept7Occurrence?.attendanceRecord?.status).toBe(AttendanceStatus.PRESENT);

            // Resolve attendance for new range (13 Oct - 31 Oct)
            const newResolved = await attendanceService.resolveForDateRange(
                semesterId,
                parseLocalDate('2026-10-13'),
                parseLocalDate('2026-10-31')
            );

            // Future dates must have Tuesday 11:00 classes, NO Monday 09:00 classes
            expect(newResolved.some(r => r.expectedClass.startTime === '11:00')).toBe(true);
            expect(newResolved.some(r => r.expectedClass.startTime === '09:00')).toBe(false);
        });
    });

    /**
     * Test B — Multiple schedule changes
     * Three sequential versions:
     * V1: Sept 1 - Oct 1 [Monday 9:00]
     * V2: Oct 1 - Nov 1 [Wednesday 10:00]
     * V3: Nov 1 - Dec 31 [Friday 14:00]
     * Verify all intervals resolve deterministically with no gaps or overlaps.
     */
    describe('Test B — Multiple schedule changes', () => {
        it('resolves three sequential versions across semester with zero overlaps or gaps', () => {
            const v1: TimetableVersion = {
                id: 'v1',
                semesterId: 'sem1',
                validFrom: parseLocalDate('2026-09-01'),
                validUntil: parseLocalDate('2026-10-01')
            };
            const v2: TimetableVersion = {
                id: 'v2',
                semesterId: 'sem1',
                validFrom: parseLocalDate('2026-10-01'),
                validUntil: parseLocalDate('2026-11-01')
            };
            const v3: TimetableVersion = {
                id: 'v3',
                semesterId: 'sem1',
                validFrom: parseLocalDate('2026-11-01'),
                validUntil: null
            };

            const versions = [v1, v2, v3];

            // In interval 1
            expect(determineEffectiveVersion(versions, parseLocalDate('2026-09-01'))?.id).toBe('v1');
            expect(determineEffectiveVersion(versions, parseLocalDate('2026-09-15'))?.id).toBe('v1');
            expect(determineEffectiveVersion(versions, parseLocalDate('2026-09-30'))?.id).toBe('v1');

            // Exact boundary at Oct 1
            expect(determineEffectiveVersion(versions, parseLocalDate('2026-10-01'))?.id).toBe('v2');
            expect(determineEffectiveVersion(versions, parseLocalDate('2026-10-15'))?.id).toBe('v2');
            expect(determineEffectiveVersion(versions, parseLocalDate('2026-10-31'))?.id).toBe('v2');

            // Exact boundary at Nov 1
            expect(determineEffectiveVersion(versions, parseLocalDate('2026-11-01'))?.id).toBe('v3');
            expect(determineEffectiveVersion(versions, parseLocalDate('2026-12-15'))?.id).toBe('v3');

            // Before semester
            expect(determineEffectiveVersion(versions, parseLocalDate('2026-08-31'))).toBeNull();
        });
    });

    /**
     * Test C — Historical attendance integrity
     * Seed attendance records (PRESENT, ABSENT).
     * Edit timetable with future version.
     * Verify IDs, statuses, subject associations, and statistics remain strictly unchanged.
     */
    describe('Test C — Historical attendance integrity', () => {
        it('preserves all record IDs, course associations, statuses, and historical statistics after schedule edits', async () => {
            const semesterRepo = new ZustandSemesterRepository();
            const timetableRepo = new ZustandTimetableVersionRepository();
            const calendarRepo = new ZustandAcademicCalendarRepository();
            const overrideRepo = new ZustandScheduleOverrideRepository();
            const attendanceRepo = new ZustandAttendanceRepository();
            const commandService = new AttendanceCommandService(attendanceRepo);
            const attendanceService = new AttendanceService(
                semesterRepo,
                timetableRepo,
                calendarRepo,
                overrideRepo,
                attendanceRepo
            );

            const semesterId = 'sem-integrity';
            await semesterRepo.saveSemester({
                id: semesterId,
                name: 'Semester 1',
                startDate: parseLocalDate('2026-09-01'),
                endDate: parseLocalDate('2026-12-31'),
                targetAttendancePercentage: 75
            });

            // Initial Version: Monday 09:00 Math, Monday 10:00 Physics
            const v1: TimetableVersion = {
                id: 'v1',
                semesterId,
                validFrom: parseLocalDate('2026-09-01'),
                validUntil: null
            };
            const v1Math: TimetableSlot = {
                id: 'slot-v1-math',
                timetableVersionId: 'v1',
                subjectId: 'sub-math',
                dayOfWeek: DayOfWeek.MONDAY,
                startTime: '09:00',
                endTime: '10:00'
            };
            const v1Phys: TimetableSlot = {
                id: 'slot-v1-phys',
                timetableVersionId: 'v1',
                subjectId: 'sub-phys',
                dayOfWeek: DayOfWeek.MONDAY,
                startTime: '10:00',
                endTime: '11:00'
            };
            await timetableRepo.createVersion(v1);
            await timetableRepo.createTimetableSlots([v1Math, v1Phys]);

            // Seed historical attendance: Sept 7 (Math PRESENT, Phys ABSENT)
            const r1 = await commandService.recordAttendance(
                parseLocalDate('2026-09-07'),
                'sub-math',
                'slot-v1-math',
                AttendanceStatus.PRESENT
            );
            const r2 = await commandService.recordAttendance(
                parseLocalDate('2026-09-07'),
                'sub-phys',
                'slot-v1-phys',
                AttendanceStatus.ABSENT
            );

            // Compute pre-edit statistics for historical period (Sept 1 to Sept 30)
            const preResolved = await attendanceService.resolveForDateRange(
                semesterId,
                parseLocalDate('2026-09-01'),
                parseLocalDate('2026-09-30')
            );
            const preStats = StatisticsService.calculateOverall(preResolved);

            // NOW: User changes timetable effective 13 October
            // V1 closed at 13 Oct, V2 starts 13 Oct with Tuesday classes only
            const v2: TimetableVersion = {
                id: 'v2',
                semesterId,
                validFrom: parseLocalDate('2026-10-13'),
                validUntil: null
            };
            const v2Slot: TimetableSlot = {
                id: 'slot-v2-chem',
                timetableVersionId: 'v2',
                subjectId: 'sub-chem',
                dayOfWeek: DayOfWeek.TUESDAY,
                startTime: '14:00',
                endTime: '15:00'
            };
            // Close V1 and save V2
            await timetableRepo.updateVersion({ ...v1, validUntil: parseLocalDate('2026-10-13') });
            await timetableRepo.createVersion(v2);
            await timetableRepo.createTimetableSlots([v2Slot]);

            // Re-resolve historical period after edit
            const postResolved = await attendanceService.resolveForDateRange(
                semesterId,
                parseLocalDate('2026-09-01'),
                parseLocalDate('2026-09-30')
            );
            const postStats = StatisticsService.calculateOverall(postResolved);

            // Verify record integrity
            const postR1 = postResolved.find(r => r.expectedClass.subjectId === 'sub-math' && toLocalDateString(r.expectedClass.date) === '2026-09-07');
            const postR2 = postResolved.find(r => r.expectedClass.subjectId === 'sub-phys' && toLocalDateString(r.expectedClass.date) === '2026-09-07');

            expect(postR1?.attendanceRecord?.id).toBe(r1.id);
            expect(postR1?.attendanceRecord?.status).toBe(AttendanceStatus.PRESENT);
            expect(postR1?.expectedClass.timetableSlotId).toBe('slot-v1-math');

            expect(postR2?.attendanceRecord?.id).toBe(r2.id);
            expect(postR2?.attendanceRecord?.status).toBe(AttendanceStatus.ABSENT);
            expect(postR2?.expectedClass.timetableSlotId).toBe('slot-v1-phys');

            // Statistics for historical period must be identical
            expect(postStats.totalScheduled).toBe(preStats.totalScheduled);
            expect(postStats.totalAttended).toBe(preStats.totalAttended);
            expect(postStats.totalAbsent).toBe(preStats.totalAbsent);
            expect(postStats.attendancePercentage).toBe(preStats.attendancePercentage);
        });
    });

    /**
     * Test D — Overrides across schedule-version boundaries
     * Test cancelled class, extra class, and holiday.
     * Verify precedence rules and that no duplicate expected classes appear.
     */
    describe('Test D — Overrides across schedule-version boundaries', () => {
        it('applies cancelled classes, extra classes, and holidays correctly without duplicate classes', () => {
            const v1: TimetableVersion = {
                id: 'v1',
                semesterId: 'sem1',
                validFrom: parseLocalDate('2026-09-01'),
                validUntil: parseLocalDate('2026-10-13')
            };
            const v2: TimetableVersion = {
                id: 'v2',
                semesterId: 'sem1',
                validFrom: parseLocalDate('2026-10-13'),
                validUntil: null
            };

            const slots: TimetableSlot[] = [
                {
                    id: 's1',
                    timetableVersionId: 'v1',
                    subjectId: 'sub-math',
                    dayOfWeek: DayOfWeek.MONDAY,
                    startTime: '09:00',
                    endTime: '10:00'
                },
                {
                    id: 's2',
                    timetableVersionId: 'v2',
                    subjectId: 'sub-math',
                    dayOfWeek: DayOfWeek.TUESDAY,
                    startTime: '11:00',
                    endTime: '12:00'
                }
            ];

            // 1. Cancelled override on historical Monday: 2026-09-07
            const cancelOverride: ScheduleOverride = {
                id: 'ov-cancel',
                type: ScheduleOverrideType.CANCELLED,
                subjectId: 'sub-math',
                originalStartTime: '09:00',
                date: parseLocalDate('2026-09-07'),
                notes: 'Professor sick'
            };

            // 2. Extra override on future date: 2026-10-15
            const extraOverride: ScheduleOverride = {
                id: 'ov-extra',
                type: ScheduleOverrideType.EXTRA,
                subjectId: 'sub-cs',
                replacementStartTime: '16:00',
                replacementEndTime: '17:00',
                date: parseLocalDate('2026-10-15'),
                notes: 'Remedial'
            };

            // 3. Holiday event: 2026-10-20 (a Tuesday in V2)
            const holidayEvent: AcademicCalendarEvent = {
                id: 'event-holiday',
                semesterId: 'sem1',
                date: parseLocalDate('2026-10-20'),
                type: AcademicCalendarEventType.HOLIDAY,
                description: 'Midterm Break'
            };

            const projections = projectExpectedClasses(
                parseLocalDate('2026-09-01'),
                parseLocalDate('2026-10-31'),
                [v1, v2],
                slots,
                [holidayEvent],
                [cancelOverride, extraOverride]
            );

            // Check cancelled override
            const sept7 = projections.filter(p => toLocalDateString(p.date) === '2026-09-07');
            expect(sept7).toHaveLength(1);
            expect(sept7[0].status).toBe(ExpectedClassStatus.CANCELLED);

            // Check extra class
            const oct15 = projections.filter(p => toLocalDateString(p.date) === '2026-10-15');
            expect(oct15).toHaveLength(1);
            expect(oct15[0].status).toBe(ExpectedClassStatus.EXTRA);

            // Check holiday on Tuesday Oct 20
            const oct20 = projections.filter(p => toLocalDateString(p.date) === '2026-10-20');
            expect(oct20).toHaveLength(1);
            expect(oct20[0].status).toBe(ExpectedClassStatus.HOLIDAY);

            // Check that on boundary date 13 Oct, no duplicates exist
            const oct13 = projections.filter(p => toLocalDateString(p.date) === '2026-10-13');
            // 2026-10-13 is a Tuesday, so only V2's Tuesday class should appear
            expect(oct13).toHaveLength(1);
            expect(oct13[0].timetableVersionId).toBe('v2');
        });
    });

    /**
     * Test E — Boundary conditions
     * - Day immediately before effective date.
     * - Effective start date.
     * - Day immediately after.
     * - Future-dated schedule change.
     * - Multiple edits on same day.
     * - Missing or malformed dates.
     */
    describe('Test E — Boundary conditions', () => {
        const v1: TimetableVersion = {
            id: 'v1',
            semesterId: 'sem1',
            validFrom: parseLocalDate('2026-09-01'),
            validUntil: parseLocalDate('2026-10-13')
        };
        const v2: TimetableVersion = {
            id: 'v2',
            semesterId: 'sem1',
            validFrom: parseLocalDate('2026-10-13'),
            validUntil: null
        };

        it('resolves day before, day of, and day after effective date accurately', () => {
            // Day before: 12 October 2026 -> v1
            expect(determineEffectiveVersion([v1, v2], parseLocalDate('2026-10-12'))?.id).toBe('v1');

            // Effective date: 13 October 2026 -> v2
            expect(determineEffectiveVersion([v1, v2], parseLocalDate('2026-10-13'))?.id).toBe('v2');

            // Day after: 14 October 2026 -> v2
            expect(determineEffectiveVersion([v1, v2], parseLocalDate('2026-10-14'))?.id).toBe('v2');
        });

        it('handles future-dated schedule changes cleanly', () => {
            const vFuture: TimetableVersion = {
                id: 'v-future',
                semesterId: 'sem1',
                validFrom: parseLocalDate('2026-12-01'),
                validUntil: null
            };
            const resolved = resolveVersionBoundaries([v1, { ...v2, validUntil: parseLocalDate('2026-12-01') }, vFuture]);
            expect(resolved[1].validUntil?.getTime()).toBe(parseLocalDate('2026-12-01').getTime());
            expect(determineEffectiveVersion(resolved, parseLocalDate('2026-11-30'))?.id).toBe('v2');
            expect(determineEffectiveVersion(resolved, parseLocalDate('2026-12-01'))?.id).toBe('v-future');
        });

        it('handles same-day edits by properly closing open version without overlap', () => {
            const activeV: TimetableVersion = {
                id: 'v-active',
                semesterId: 'sem1',
                validFrom: parseLocalDate('2026-09-01'),
                validUntil: null
            };
            const newV: TimetableVersion = {
                id: 'v-new',
                semesterId: 'sem1',
                validFrom: parseLocalDate('2026-10-13'),
                validUntil: null
            };

            const res = prepareNewVersion([activeV], newV);
            expect(res.updatedVersions[0].validUntil?.getTime()).toBe(parseLocalDate('2026-10-13').getTime());
            expect(res.newVersion.validFrom.getTime()).toBe(parseLocalDate('2026-10-13').getTime());
        });

        it('safely handles missing or malformed date inputs without crashing', () => {
            // Undefined or null version list
            expect(determineEffectiveVersion([], new Date())).toBeNull();

            // Malformed version in list
            const malformedVersion = {
                id: 'v-bad',
                semesterId: 'sem1',
                validFrom: new Date('invalid-date'),
                validUntil: null
            } as unknown as TimetableVersion;

            expect(() => determineEffectiveVersion([malformedVersion, v2], parseLocalDate('2026-10-15'))).not.toThrow();
            expect(determineEffectiveVersion([malformedVersion, v2], parseLocalDate('2026-10-15'))?.id).toBe('v2');
        });
    });

    /**
     * Test F — Legacy data and persistence
     * Verify hydration of legacy data with single unversioned timetable,
     * restore from backup envelope, and idempotent migrations.
     */
    describe('Test F — Legacy data and persistence', () => {
        it('safely hydrates legacy data with single timetable version', async () => {
            // Synthetic legacy state with 1 version and no validUntil
            const legacyState: Partial<AttendanceState> = {
                semesters: {
                    'sem-legacy': {
                        id: 'sem-legacy',
                        name: 'Legacy Semester',
                        startDate: parseLocalDate('2026-01-01'),
                        endDate: parseLocalDate('2026-05-31'),
                        targetAttendancePercentage: 75
                    }
                },
                timetableVersions: {
                    'ver-legacy': {
                        id: 'ver-legacy',
                        semesterId: 'sem-legacy',
                        validFrom: parseLocalDate('2026-01-01'),
                        validUntil: null
                    }
                },
                timetableSlots: {
                    'slot-legacy': {
                        id: 'slot-legacy',
                        timetableVersionId: 'ver-legacy',
                        subjectId: 'sub-legacy',
                        dayOfWeek: DayOfWeek.MONDAY,
                        startTime: '09:00',
                        endTime: '10:00'
                    }
                },
                attendanceRecords: {
                    'rec-legacy': {
                        id: 'rec-legacy',
                        date: parseLocalDate('2026-01-05'),
                        subjectId: 'sub-legacy',
                        timetableSlotId: 'slot-legacy',
                        status: AttendanceStatus.PRESENT
                    }
                }
            };

            attendanceStore.setState(legacyState as AttendanceState);

            const timetableRepo = new ZustandTimetableVersionRepository();
            const versions = await timetableRepo.findVersionsForSemester('sem-legacy');
            expect(versions).toHaveLength(1);
            expect(versions[0].validUntil).toBeNull();

            // Effective version resolves correctly
            const eff = determineEffectiveVersion(versions, parseLocalDate('2026-02-01'));
            expect(eff?.id).toBe('ver-legacy');
        });

        it('safely creates snapshot and restores through BackupEngine without loss or corruption', async () => {
            const semester: Semester = {
                id: 'sem-backup',
                name: 'Backup Sem',
                startDate: parseLocalDate('2026-09-01'),
                endDate: parseLocalDate('2026-12-31'),
                targetAttendancePercentage: 80
            };
            const v1: TimetableVersion = {
                id: 'v1-backup',
                semesterId: 'sem-backup',
                validFrom: parseLocalDate('2026-09-01'),
                validUntil: parseLocalDate('2026-10-15')
            };
            const v2: TimetableVersion = {
                id: 'v2-backup',
                semesterId: 'sem-backup',
                validFrom: parseLocalDate('2026-10-15'),
                validUntil: null
            };

            attendanceStore.setState({
                semesters: { [semester.id]: semester },
                subjects: {},
                timetableVersions: { [v1.id]: v1, [v2.id]: v2 },
                timetableSlots: {},
                calendarEvents: {},
                scheduleOverrides: {},
                attendanceRecords: {}
            });

            const snapshot = BackupEngine.createSnapshot();
            const attendanceData = snapshot.data.attendance as AttendanceState;
            expect(attendanceData.timetableVersions['v1-backup']).toBeDefined();
            expect(attendanceData.timetableVersions['v2-backup']).toBeDefined();

            // Clear store
            attendanceStore.setState({
                semesters: {},
                subjects: {},
                timetableVersions: {},
                timetableSlots: {},
                calendarEvents: {},
                scheduleOverrides: {},
                attendanceRecords: {}
            });

            // Restore
            const restoreResult = await BackupEngine.validateAndRestore(snapshot);
            expect(restoreResult.success).toBe(true);

            const restoredState = attendanceStore.getState();
            expect(restoredState.timetableVersions['v1-backup']).toBeDefined();
            expect(restoredState.timetableVersions['v2-backup']).toBeDefined();
        });

        it('is idempotent across repeated migration runs', async () => {
            // Run migration once
            await MigrationEngine.runMigrations();
            const stateAfterFirst = attendanceStore.getState();

            // Run migration second time
            await MigrationEngine.runMigrations();
            const stateAfterSecond = attendanceStore.getState();

            expect(stateAfterSecond.timetableVersions).toEqual(stateAfterFirst.timetableVersions);
        });
    });

    /**
     * Test G — Regression protection
     * Confirms that editing a timetable today does NOT modify any attendance record
     * whose date precedes the new version's effective date.
     * Snapshot comparison checks exact data-level equality.
     */
    describe('Test G — Regression protection', () => {
        it('guarantees data-level equality of historical attendance and statistics before and after editing a schedule', async () => {
            const semesterRepo = new ZustandSemesterRepository();
            const timetableRepo = new ZustandTimetableVersionRepository();
            const calendarRepo = new ZustandAcademicCalendarRepository();
            const overrideRepo = new ZustandScheduleOverrideRepository();
            const attendanceRepo = new ZustandAttendanceRepository();
            const commandService = new AttendanceCommandService(attendanceRepo);
            const attendanceService = new AttendanceService(
                semesterRepo,
                timetableRepo,
                calendarRepo,
                overrideRepo,
                attendanceRepo
            );

            const semesterId = 'sem-regression';
            await semesterRepo.saveSemester({
                id: semesterId,
                name: 'Regression Test Semester',
                startDate: parseLocalDate('2026-09-01'),
                endDate: parseLocalDate('2026-12-31'),
                targetAttendancePercentage: 75
            });

            // V1 effective 1 Sept
            const v1: TimetableVersion = {
                id: 'v1',
                semesterId,
                validFrom: parseLocalDate('2026-09-01'),
                validUntil: null
            };
            const v1Slot: TimetableSlot = {
                id: 'slot-mon',
                timetableVersionId: 'v1',
                subjectId: 'sub-history',
                dayOfWeek: DayOfWeek.MONDAY,
                startTime: '09:00',
                endTime: '10:00'
            };
            await timetableRepo.createVersion(v1);
            await timetableRepo.createTimetableSlots([v1Slot]);

            // Seed historical records on 3 consecutive Mondays
            await commandService.recordAttendance(parseLocalDate('2026-09-07'), 'sub-history', 'slot-mon', AttendanceStatus.PRESENT);
            await commandService.recordAttendance(parseLocalDate('2026-09-14'), 'sub-history', 'slot-mon', AttendanceStatus.PRESENT);
            await commandService.recordAttendance(parseLocalDate('2026-09-21'), 'sub-history', 'slot-mon', AttendanceStatus.ABSENT);

            // Capture BEFORE snapshot of historical period
            const historicalStartDate = parseLocalDate('2026-09-01');
            const historicalEndDate = parseLocalDate('2026-10-12');

            const beforeResolved = await attendanceService.resolveForDateRange(semesterId, historicalStartDate, historicalEndDate);
            const beforeStats = StatisticsService.calculateOverall(beforeResolved);
            const beforeSubjectStats = StatisticsService.calculateSubjectWise(beforeResolved);
            const beforeAttendanceStoreState = JSON.parse(JSON.stringify(attendanceStore.getState().attendanceRecords));

            // PERFORM SCHEDULE EDIT: effective 13 October
            // Close V1 at 13 Oct, create V2 effective 13 Oct with new Wednesday schedule
            await timetableRepo.updateVersion({ ...v1, validUntil: parseLocalDate('2026-10-13') });
            const v2: TimetableVersion = {
                id: 'v2',
                semesterId,
                validFrom: parseLocalDate('2026-10-13'),
                validUntil: null
            };
            const v2Slot: TimetableSlot = {
                id: 'slot-wed',
                timetableVersionId: 'v2',
                subjectId: 'sub-history',
                dayOfWeek: DayOfWeek.WEDNESDAY,
                startTime: '13:00',
                endTime: '14:00'
            };
            await timetableRepo.createVersion(v2);
            await timetableRepo.createTimetableSlots([v2Slot]);

            // Capture AFTER snapshot of historical period
            const afterResolved = await attendanceService.resolveForDateRange(semesterId, historicalStartDate, historicalEndDate);
            const afterStats = StatisticsService.calculateOverall(afterResolved);
            const afterSubjectStats = StatisticsService.calculateSubjectWise(afterResolved);
            const afterAttendanceStoreState = JSON.parse(JSON.stringify(attendanceStore.getState().attendanceRecords));

            // 1. AttendanceRecords store must be completely identical
            expect(afterAttendanceStoreState).toEqual(beforeAttendanceStoreState);

            // 2. Resolved attendance for historical dates must be completely identical
            expect(afterResolved.length).toBe(beforeResolved.length);
            for (let i = 0; i < beforeResolved.length; i++) {
                expect(afterResolved[i].expectedClass.date.getTime()).toBe(beforeResolved[i].expectedClass.date.getTime());
                expect(afterResolved[i].expectedClass.subjectId).toBe(beforeResolved[i].expectedClass.subjectId);
                expect(afterResolved[i].expectedClass.startTime).toBe(beforeResolved[i].expectedClass.startTime);
                expect(afterResolved[i].expectedClass.status).toBe(beforeResolved[i].expectedClass.status);
                expect(afterResolved[i].attendanceRecord?.id).toBe(beforeResolved[i].attendanceRecord?.id);
                expect(afterResolved[i].attendanceRecord?.status).toBe(beforeResolved[i].attendanceRecord?.status);
            }

            // 3. Statistics must match exactly
            expect(afterStats).toEqual(beforeStats);
            expect(afterSubjectStats).toEqual(beforeSubjectStats);
        });
    });
});
