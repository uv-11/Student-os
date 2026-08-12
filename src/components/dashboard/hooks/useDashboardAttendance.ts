import { useMemo } from "react";
import { useAttendanceData, useAttendanceCommands } from "../../../features/attendance/application/hooks";
import { useNow } from "../../../hooks/useNow";

export function useDashboardAttendance() {
  const { overallStats, todayAttendance, subjects, isLoading, subjectStats } = useAttendanceData();
  const { markAttendance } = useAttendanceCommands();
  const now = useNow();

  const attendancePercentage = overallStats?.attendancePercentage ?? 0;
  const attendedClasses = overallStats?.totalAttended ?? 0;
  const conductedClasses = (overallStats?.totalAttended ?? 0) + (overallStats?.totalAbsent ?? 0);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const { currentClass, nextClass } = useMemo(() => {
    let current = null;
    let next = null;

    const sortedToday = [...todayAttendance].sort((a, b) => {
      return a.expectedClass.startTime.localeCompare(b.expectedClass.startTime);
    });

    for (const classItem of sortedToday) {
      const [startHour, startMinute] = classItem.expectedClass.startTime.split(":").map(Number);
      const [endHour, endMinute] = classItem.expectedClass.endTime.split(":").map(Number);
      const startMins = startHour * 60 + startMinute;
      const endMins = endHour * 60 + endMinute;

      if (currentMinutes >= startMins && currentMinutes <= endMins) {
        current = classItem;
      } else if (startMins > currentMinutes && !next) {
        next = classItem;
      }
    }

    return { currentClass: current, nextClass: next };
  }, [todayAttendance, currentMinutes]);

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || "Unknown Subject";
  };
  
  const getSubjectColor = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.color || "blue";
  };

  return {
    attendancePercentage,
    attendedClasses,
    conductedClasses,
    todayAttendance,
    currentClass,
    nextClass,
    getSubjectName,
    getSubjectColor,
    markAttendance,
    isLoading,
    subjectStats,
    subjects,
  };
}
