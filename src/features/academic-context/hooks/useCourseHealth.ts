import { useMemo } from "react";
import { useActivityProjection } from "./useActivityProjection";
import { useNow } from "../../../hooks/useNow";
import { isBefore, addDays } from "date-fns";
import { useCourseStore } from "../../../store/courseStore";
import { useAttendanceData } from "../../attendance/application/hooks";
import { AssignmentStatus } from "../../../types/assignmentStatus";

export type CourseHealthStatus = "Good" | "Needs Attention" | "Critical" | "Neutral";

export interface CourseHealth {
  status: CourseHealthStatus;
  reasons: string[];
}

export function useCourseHealth(courseId: string): CourseHealth {
  const activities = useActivityProjection();
  const { courses } = useCourseStore();
  const now = useNow();

  const { subjectStats } = useAttendanceData();

  return useMemo(() => {
    const reasons: string[] = [];
    let statusScore = 0; // Negative means bad, positive means good

    const course = courses.find(c => c.id === courseId);
    if (!course) return { status: "Neutral", reasons: ["Course not found"] };

    // 1. Assignment Check (from activities since they project all pending assignments)
    const courseActivities = activities.filter(a => a.courseId === courseId);
    const assignments = courseActivities.filter(a => a.type === "ASSIGNMENT_DEADLINE");
    
    let overdueCount = 0;
    let dueSoonCount = 0;

    assignments.forEach(a => {
      if (a.metadata?.status !== AssignmentStatus.DONE) {
        if (isBefore(a.timestamp, now)) {
          overdueCount++;
        } else if (isBefore(a.timestamp, addDays(now, 3))) {
          dueSoonCount++;
        }
      }
    });

    if (overdueCount > 0) {
      statusScore -= 2;
      reasons.push(`${overdueCount} assignment(s) overdue`);
    } else if (dueSoonCount > 0) {
      statusScore -= 1;
      reasons.push(`${dueSoonCount} assignment(s) due soon`);
    }

    // 2. Attendance Check
    const target = course.targetAttendancePercentage || 75; // Default 75%
    const stats = subjectStats[courseId];
    if (stats && stats.totalScheduled > 0) {
      const percentage = stats.attendancePercentage;
      if (percentage < target) {
        statusScore -= 2;
        reasons.push(`Attendance is ${percentage}% (below ${target}% target)`);
      } else if (percentage < target + 5) {
        statusScore -= 1;
        reasons.push(`Attendance is ${percentage}% (close to target)`);
      }
    }

    // 3. Study Check (Look for recent study sessions in the past 7 days)
    const recentStudyThreshold = addDays(now, -7).getTime();
    const recentStudyActivities = courseActivities.filter(a => 
      (a.type === "STUDY_SESSION" || a.type === "POMODORO") && 
      a.timestamp > recentStudyThreshold
    );

    const recentStudyMinutes = recentStudyActivities.reduce((total, a) => {
      return total + (Number(a.metadata?.durationMinutes) || 0);
    }, 0);

    if (recentStudyMinutes === 0) {
      statusScore -= 1;
      reasons.push(`No study activity in the last 7 days`);
    } else if (recentStudyMinutes > 120) {
      statusScore += 1;
      reasons.push(`Good study consistency (${recentStudyMinutes} mins recently)`);
    }

    // Evaluate final status
    let finalStatus: CourseHealthStatus = "Neutral";
    if (statusScore <= -3) finalStatus = "Critical";
    else if (statusScore < 0) finalStatus = "Needs Attention";
    else if (statusScore > 0) finalStatus = "Good";
    
    if (reasons.length === 0) {
      reasons.push("On track");
    }

    return { status: finalStatus, reasons };
  }, [activities, courses, courseId, now, subjectStats]);
}
