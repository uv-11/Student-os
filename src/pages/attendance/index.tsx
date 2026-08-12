import { useState, useMemo } from "react";
import { Container } from "../../components/ui/Container";
import { useAttendanceData } from "../../features/attendance/application/hooks";
import { SemesterSetup } from "../../features/attendance/components/SemesterSetup";
import { SubjectSetup } from "../../features/attendance/components/SubjectSetup";
import { TimetableSetup } from "../../features/attendance/components/TimetableSetup";
import { TodayClasses } from "../../features/attendance/components/TodayClasses";
import { OverallStats } from "../../features/attendance/components/OverallStats";
import { SubjectStats } from "../../features/attendance/components/SubjectStats";

type SetupStep = 'SEMESTER' | 'SUBJECTS' | 'TIMETABLE' | 'READY';

const STEPS: readonly SetupStep[] = ['SEMESTER', 'SUBJECTS', 'TIMETABLE'];

export default function AttendancePage() {
    const { activeSemester, subjects, isLoading, timetableVersions } = useAttendanceData();
    const [overrideState, setOverrideState] = useState<SetupStep | null>(null);

    const defaultState: SetupStep = useMemo(() => {
        if (!activeSemester) return 'SEMESTER';
        if (subjects.length === 0) return 'SUBJECTS';
        if (timetableVersions.length === 0) return 'TIMETABLE';
        return 'READY';
    }, [activeSemester, subjects.length, timetableVersions.length]);

    const setupState = overrideState ?? defaultState;

    if (isLoading) {
        return (
            <Container>
                <div className="animate-pulse h-8 w-48 bg-muted rounded mb-8" />
                <div className="space-y-6">
                    <div className="h-40 bg-card border border-border rounded-xl" />
                    <div className="h-64 bg-card border border-border rounded-xl" />
                </div>
            </Container>
        );
    }

    const renderProgress = (current: SetupStep) => {
        if (current === 'READY') return null;
        return (
            <div className="flex items-center justify-center gap-4 text-[11px] font-bold uppercase tracking-wider mb-8">
                {STEPS.map((step, idx) => {
                    const isActive = step === current;
                    const isPast = STEPS.indexOf(step) < STEPS.indexOf(current);
                    return (
                        <div key={step} className="flex items-center gap-4">
                            <span className={isActive ? 'text-primary' : isPast ? 'text-muted-foreground' : 'text-muted'}>
                                {step}
                            </span>
                            {idx < STEPS.length - 1 && <span className="text-border">→</span>}
                        </div>
                    );
                })}
            </div>
        );
    };

    if (setupState === 'SEMESTER') {
        return (
            <Container>
                <div className="pt-12">
                    {renderProgress(setupState)}
                    <SemesterSetup onComplete={() => setOverrideState('SUBJECTS')} />
                </div>
            </Container>
        );
    }

    if (setupState === 'SUBJECTS') {
        return (
            <Container>
                <div className="pt-12">
                    {renderProgress(setupState)}
                    <SubjectSetup 
                        onComplete={() => setOverrideState('TIMETABLE')} 
                        onBack={() => setOverrideState('SEMESTER')} 
                    />
                </div>
            </Container>
        );
    }

    if (setupState === 'TIMETABLE') {
        return (
            <Container>
                <div className="pt-12">
                    {renderProgress(setupState)}
                    <TimetableSetup 
                        onComplete={() => setOverrideState('READY')} 
                        onBack={() => setOverrideState('SUBJECTS')}
                    />
                </div>
            </Container>
        );
    }

    return (
        <Container>
            <div className="flex flex-col gap-6 pb-24 md:pb-12 pt-6">
                {/* 1. Hero Section: Weekly Attendance Timetable */}
                <TimetableSetup 
                    readOnly={true}
                    onEditSchedule={() => setOverrideState('TIMETABLE')}
                    onComplete={() => {}}
                    onBack={() => {}}
                />

                {/* 2. Today's Classes */}
                <TodayClasses />

                {/* 3. Overall Statistics */}
                <OverallStats />

                {/* 4. Subject Cards */}
                <div className="mt-2">
                    <h3 className="text-lg font-bold tracking-tight mb-4">Subjects</h3>
                    <SubjectStats />
                </div>
            </div>
        </Container>
    );
}
