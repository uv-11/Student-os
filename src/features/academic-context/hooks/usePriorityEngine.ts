import { useMemo } from "react";
import { useActivityProjection } from "./useActivityProjection";
import { useNow } from "../../../hooks/useNow";
import { isBefore, addDays, isSameDay } from "date-fns";
import { useCourseStore } from "../../../store/courseStore";
import { useAttendanceData } from "../../attendance/application/hooks";
import { AssignmentStatus } from "../../../types/assignmentStatus";
import type { Activity } from "../types";

export interface PriorityItem {
  id: string;
  title: string;
  reason: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  courseId?: string;
  sourceActivity?: Activity;
  actionDestination?: string; // Route to navigate to, e.g. "/assignments"
}

export function usePriorityEngine(): PriorityItem[] {
  const activities = useActivityProjection();
  const { courses } = useCourseStore();
  const now = useNow();
  const { subjectStats } = useAttendanceData();

  return useMemo(() => {
    const priorities: PriorityItem[] = [];

    // 1. Assignment Priorities
    const assignments = activities.filter(a => a.type === "ASSIGNMENT_DEADLINE" && a.metadata?.status !== AssignmentStatus.DONE);
    
    assignments.forEach(a => {
      const isOverdue = isBefore(a.timestamp, now);
      const dueSoon = isBefore(a.timestamp, addDays(now, 3));
      
      if (isOverdue) {
        priorities.push({
          id: `priority-overdue-${a.id}`,
          title: `Complete ${a.title}`,
          reason: "Overdue",
          urgency: "HIGH",
          courseId: a.courseId,
          sourceActivity: a,
          actionDestination: "/assignments"
        });
      } else if (dueSoon) {
        priorities.push({
          id: `priority-duesoon-${a.id}`,
          title: `Complete ${a.title}`,
          reason: isSameDay(a.timestamp, now) ? "Due today" : "Due soon",
          urgency: "MEDIUM",
          courseId: a.courseId,
          sourceActivity: a,
          actionDestination: "/assignments"
        });
      }
    });

    // 2. Attendance & Class Priorities
    const classesToday = activities.filter(a => a.type === "CLASS" && isSameDay(a.timestamp, now));
    const upcomingClasses = classesToday.filter(c => isBefore(now, c.timestamp));
    
    courses.forEach(course => {
      const target = course.targetAttendancePercentage || 75;
      let attendancePercentage = 100;
      const stats = subjectStats[course.id];
      if (stats && stats.totalScheduled > 0) {
        attendancePercentage = stats.attendancePercentage;
      }

      if (attendancePercentage < target) {
        // If there's an upcoming class for a course with low attendance, prioritize it
        const upcomingClass = upcomingClasses.find(c => c.courseId === course.id);
        if (upcomingClass) {
          priorities.push({
            id: `priority-attendance-${course.id}`,
            title: `Attend ${course.name}`,
            reason: `Attendance is ${attendancePercentage}% (below ${target}% target)`,
            urgency: "HIGH",
            courseId: course.id,
            sourceActivity: upcomingClass,
            actionDestination: "/attendance"
          });
        }
      }
    });

    // 3. Study Priorities
    const recentStudyThreshold = addDays(now, -7).getTime();
    courses.forEach(course => {
      const courseActivities = activities.filter(a => a.courseId === course.id);
      const recentStudy = courseActivities.find(a => 
        (a.type === "STUDY_SESSION" || a.type === "POMODORO") && 
        a.timestamp > recentStudyThreshold
      );

      // If there are assignments or classes but no study in 7 days
      if (!recentStudy && courseActivities.length > 0) {
        priorities.push({
          id: `priority-study-${course.id}`,
          title: `Study ${course.name}`,
          reason: "Low recent activity",
          urgency: "LOW",
          courseId: course.id,
          actionDestination: "/study"
        });
      }
    });

    // Sort priorities: HIGH first, then MEDIUM, then LOW
    const urgencyWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    priorities.sort((a, b) => urgencyWeight[b.urgency] - urgencyWeight[a.urgency]);

    return priorities;
  }, [activities, courses, now, subjectStats]);
}
