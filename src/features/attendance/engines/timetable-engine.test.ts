import { describe, it, expect } from 'vitest';
import {
    determineEffectiveVersion,
    resolveVersionBoundaries,
    prepareNewVersion
} from './timetable-engine';
import type { TimetableVersion } from '../domain';

describe('Timetable Engine', () => {
    const v1: TimetableVersion = {
        id: 'v1',
        semesterId: 'sem1',
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-03-01'),
    };

    const v2: TimetableVersion = {
        id: 'v2',
        semesterId: 'sem1',
        validFrom: new Date('2026-03-01'),
        validUntil: null,
    };

    describe('determineEffectiveVersion', () => {
        it('should return null when version list is empty', () => {
            expect(determineEffectiveVersion([], new Date('2026-02-01'))).toBeNull();
        });

        it('should return the correct version for a date within closed interval [validFrom, validUntil)', () => {
            const result = determineEffectiveVersion([v1, v2], new Date('2026-01-15'));
            expect(result?.id).toBe('v1');
        });

        it('should switch to next version exactly at validFrom of next version', () => {
            const result = determineEffectiveVersion([v1, v2], new Date('2026-03-01'));
            expect(result?.id).toBe('v2');
        });

        it('should return version with null validUntil for dates far in future', () => {
            const result = determineEffectiveVersion([v1, v2], new Date('2026-12-31'));
            expect(result?.id).toBe('v2');
        });

        it('should return null for dates before the earliest validFrom', () => {
            const result = determineEffectiveVersion([v1, v2], new Date('2025-12-31'));
            expect(result).toBeNull();
        });
    });

    describe('resolveVersionBoundaries', () => {
        it('automatically closes open-ended version when next version starts', () => {
            const openV1: TimetableVersion = {
                id: 'v1',
                semesterId: 'sem1',
                validFrom: new Date('2026-01-01'),
                validUntil: null,
            };
            const nextV2: TimetableVersion = {
                id: 'v2',
                semesterId: 'sem1',
                validFrom: new Date('2026-04-01'),
                validUntil: null,
            };

            const resolved = resolveVersionBoundaries([openV1, nextV2]);
            expect(resolved[0].validUntil?.getTime()).toBe(new Date('2026-04-01').getTime());
            expect(resolved[1].validUntil).toBeNull();
        });

        it('throws an error if versions overlap', () => {
            const overlappingV1: TimetableVersion = {
                id: 'v1',
                semesterId: 'sem1',
                validFrom: new Date('2026-01-01'),
                validUntil: new Date('2026-05-01'),
            };
            const overlappingV2: TimetableVersion = {
                id: 'v2',
                semesterId: 'sem1',
                validFrom: new Date('2026-04-01'),
                validUntil: null,
            };

            expect(() => resolveVersionBoundaries([overlappingV1, overlappingV2])).toThrow(
                'Timetable versions cannot overlap.'
            );
        });
    });

    describe('prepareNewVersion', () => {
        it('closes the currently active open version upon adding a new version', () => {
            const activeV: TimetableVersion = {
                id: 'v1',
                semesterId: 'sem1',
                validFrom: new Date('2026-01-01'),
                validUntil: null,
            };
            const newV: TimetableVersion = {
                id: 'v2',
                semesterId: 'sem1',
                validFrom: new Date('2026-06-01'),
                validUntil: null,
            };

            const result = prepareNewVersion([activeV], newV);
            expect(result.updatedVersions[0].validUntil?.getTime()).toBe(new Date('2026-06-01').getTime());
            expect(result.newVersion.id).toBe('v2');
        });

        it('throws if new version precedes an already closed version', () => {
            const closedV: TimetableVersion = {
                id: 'v1',
                semesterId: 'sem1',
                validFrom: new Date('2026-01-01'),
                validUntil: new Date('2026-04-01'),
            };
            const invalidNewV: TimetableVersion = {
                id: 'v2',
                semesterId: 'sem1',
                validFrom: new Date('2026-03-01'), // precedes closed v1's end
                validUntil: null,
            };

            expect(() => prepareNewVersion([closedV], invalidNewV)).toThrow(
                'New version validFrom date cannot precede existing closed versions.'
            );
        });
    });
});
