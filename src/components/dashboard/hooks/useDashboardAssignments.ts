import { useMemo } from "react";
import { useAssignmentStore } from "../../../store/assignmentStore";
import { AssignmentStatus } from "../../../types/assignmentStatus";
import { startOfDay, endOfDay, endOfWeek, isBefore, isWithinInterval } from "date-fns";
import { useNow } from "../../../hooks/useNow";

export function useDashboardAssignments() {
  const { assignments } = useAssignmentStore();
  const now = useNow();

  return useMemo(() => {
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Assuming Monday start

    let dueToday = 0;
    let dueThisWeek = 0;
    let overdue = 0;

    const pendingAssignments = assignments.filter((a) => a.status !== AssignmentStatus.DONE);
    const completedAssignments = assignments.filter((a) => a.status === AssignmentStatus.DONE);

    pendingAssignments.forEach((a) => {
      if (!a.dueDate) return;
      const dueDate = new Date(a.dueDate);
      
      if (isBefore(dueDate, todayStart)) {
        overdue++;
      } else if (isWithinInterval(dueDate, { start: todayStart, end: todayEnd })) {
        dueToday++;
        dueThisWeek++;
      } else if (isWithinInterval(dueDate, { start: todayStart, end: weekEnd })) {
        dueThisWeek++;
      }
    });

    const recentThreshold = now.getTime() - 7 * 24 * 60 * 60 * 1000; // 7 days
    const recentlyCompleted = completedAssignments.filter(
      (a) => a.updatedAt && a.updatedAt > recentThreshold
    ).length;

    // Get a few upcoming or overdue assignments for display
    const displayAssignments = [...pendingAssignments]
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 5);

    return {
      dueToday,
      dueThisWeek,
      overdue,
      recentlyCompleted,
      displayAssignments,
      totalCount: assignments.length,
    };
  }, [assignments, now]);
}
