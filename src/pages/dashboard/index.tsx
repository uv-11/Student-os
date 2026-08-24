import { Container } from "../../components/ui/Container";
import { PageHeader } from "../../components/ui/PageHeader";

import { AttendanceSummaryWidget } from "../../components/dashboard/widgets/AttendanceSummaryWidget";
import { TodayClassesWidget } from "../../components/dashboard/widgets/TodayClassesWidget";
import { QuickActionsCard } from "../../components/dashboard/QuickActionsCard";
import { PriorityWidget } from "../../components/dashboard/widgets/PriorityWidget";

import { AssignmentsWidget } from "../../components/dashboard/widgets/AssignmentsWidget";
import { CalendarWidget } from "../../components/dashboard/widgets/CalendarWidget";
import { HabitsWidget } from "../../components/dashboard/widgets/HabitsWidget";

import { FocusWidget } from "../../components/dashboard/widgets/FocusWidget";
import { RecentActivityWidget } from "../../components/dashboard/widgets/RecentActivityWidget";
import { WorkspaceWidget } from "../../components/dashboard/widgets/WorkspaceWidget";

import { WarningSubjectsCard } from "../../components/dashboard/WarningSubjectsCard";
import { WeeklySummaryWidget } from "../../components/dashboard/widgets/WeeklySummaryWidget";
import { StudyHoursWidget } from "../../components/dashboard/widgets/StudyHoursWidget";

import { TodaySnapshotWidget } from "../../components/dashboard/widgets/TodaySnapshotWidget";

export default function DashboardPage() {
  return (
    <Container className="max-w-7xl pb-12">
      <PageHeader title="Dashboard" description="Your academic command center." />

      <div className="flex flex-col gap-4 lg:gap-6">
        <TodaySnapshotWidget />
        <PriorityWidget />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6">
          {/* Primary Grid - Mobile Order: Classes -> Attendance -> Quick Actions */}
          <div className="md:col-span-6 lg:col-span-5 flex flex-col order-1 lg:order-none">
            <TodayClassesWidget />
          </div>
          <div className="md:col-span-6 lg:col-span-3 flex flex-col order-2 lg:order-none">
            <AttendanceSummaryWidget />
          </div>
          <div className="md:col-span-12 lg:col-span-4 flex flex-col order-3 lg:order-none">
            <QuickActionsCard />
          </div>

          {/* Productivity Grid */}
          <div className="md:col-span-6 lg:col-span-4 flex flex-col order-4 lg:order-none">
            <AssignmentsWidget />
          </div>
          <div className="md:col-span-6 lg:col-span-4 flex flex-col order-6 lg:order-none">
            <HabitsWidget />
          </div>
          <div className="md:col-span-12 lg:col-span-4 flex flex-col order-5 lg:order-none">
            <CalendarWidget />
          </div>

          {/* Activity Grid */}
          <div className="md:col-span-6 lg:col-span-4 flex flex-col order-7 lg:order-none">
            <FocusWidget />
          </div>
          <div className="md:col-span-6 lg:col-span-4 flex flex-col order-8 lg:order-none">
            <RecentActivityWidget />
          </div>
          <div className="md:col-span-12 lg:col-span-4 flex flex-col order-9 lg:order-none">
            <WorkspaceWidget />
          </div>

          {/* Lower Analytics */}
          <div className="col-span-1 md:col-span-12 flex flex-col order-10 lg:order-none">
            <WarningSubjectsCard />
          </div>
          <div className="md:col-span-6 flex flex-col order-11 lg:order-none">
            <WeeklySummaryWidget />
          </div>
          <div className="md:col-span-6 flex flex-col order-12 lg:order-none">
            <StudyHoursWidget />
          </div>
        </div>
      </div>
    </Container>
  );
}
