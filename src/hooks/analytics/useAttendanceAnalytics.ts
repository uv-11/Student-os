import { useMemo } from "react";
import { useAttendanceData } from "../../features/attendance/application/hooks";

export function useAttendanceAnalytics() {
  const { overallStats, subjectStats, subjects } = useAttendanceData();

  return useMemo(() => {
    if (!overallStats || !subjectStats || subjects.length === 0) return null;

    const subjectsWithStats = subjects.map(s => {
      const stats = subjectStats[s.id];
      return {
        ...s,
        percentage: stats?.attendancePercentage || 0,
        attendedClasses: stats?.totalAttended || 0,
        totalClasses: stats?.totalScheduled || 0,
        missedClasses: stats?.totalAbsent || 0
      };
    });

    const sorted = [...subjectsWithStats].sort((a, b) => b.percentage - a.percentage);
    
    // In the new domain we don't have "Safe Bunks", we just look at top performers and bottom performers
    const bestSubjects = sorted.filter(s => s.percentage >= 75).slice(0, 3);
    const riskSubjects = sorted.filter(s => s.percentage < 75).reverse().slice(0, 3);

    const chartData = subjectsWithStats.map(s => ({
      name: s.name.substring(0, 10),
      attended: s.attendedClasses,
      missed: s.missedClasses,
      percentage: s.percentage,
    }));

    return {
      overallPercentage: overallStats.attendancePercentage,
      totalClasses: overallStats.totalScheduled,
      totalAttended: overallStats.totalAttended,
      totalSafeBunks: 0, // Deprecated
      bestSubjects,
      riskSubjects,
      chartData
    };
  }, [overallStats, subjectStats, subjects]);
}
