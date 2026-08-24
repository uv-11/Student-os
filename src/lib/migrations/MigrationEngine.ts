import { useAppStore } from "../../store/appStore";
import { useCourseStore } from "../../store/courseStore";
import { attendanceStore } from "../../features/attendance/repositories/zustand-store";
import type { AttendanceState } from "../../features/attendance/repositories/zustand-store";
import { useAssignmentStore } from "../../store/assignmentStore";
import type { Course } from "../../types/course";
import type { Assignment } from "../../types/assignment";

export class MigrationEngine {
  public static async runMigrations() {
    const { schemaVersion, setSchemaVersion } = useAppStore.getState();

    // Check BOTH version marker AND actual persisted state shape
    const attendanceState = attendanceStore.getState();
    const hasLegacySubjects = Object.keys(attendanceState.subjects || {}).length > 0;

    if (schemaVersion < 3 || hasLegacySubjects) {
      const success = this.runV2ToV3Migration();
      if (success) {
        setSchemaVersion(3);
      } else {
        console.warn("Migration V2->V3 aborted. Schema version unchanged.");
      }
    }
  }

  private static runV2ToV3Migration(): boolean {
    const attendanceState = attendanceStore.getState();
    const courseState = useCourseStore.getState();
    const assignmentState = useAssignmentStore.getState();

    const legacySubjects = Object.values(attendanceState.subjects || {});
    if (legacySubjects.length === 0) {
      // Nothing to migrate in attendance, just return success
      return true;
    }

    const currentCourses = [...courseState.courses];
    const newCourses: Course[] = [];
    const subjectToCourseMap = new Map<string, string>();
    const ambiguousSubjects: string[] = []; // To track unresolved mappings if any

    // PHASE 2: SUBJECT → COURSE MATCHING
    for (const subject of legacySubjects) {
      const subjectNameNormalized = subject.name.trim().toLowerCase();
      
      // Find possible matches
      const possibleMatches = currentCourses.filter(
        c => c.name.trim().toLowerCase() === subjectNameNormalized ||
             (c.code && subject.code && c.code.trim().toLowerCase() === subject.code.trim().toLowerCase())
      );

      if (possibleMatches.length === 1) {
        // CASE A: Exactly one reliable match
        subjectToCourseMap.set(subject.id, possibleMatches[0].id);
      } else if (possibleMatches.length === 0) {
        // CASE B: No match
        const newCourseId = crypto.randomUUID();
        const now = Date.now();
        const newCourse: Course = {
          id: newCourseId,
          name: subject.name,
          code: subject.code,
          color: subject.color,
          type: "academic", // Default to academic for attendance subjects
          createdAt: now,
          updatedAt: now,
        };
        newCourses.push(newCourse);
        subjectToCourseMap.set(subject.id, newCourseId);
      } else {
        // CASE C: Ambiguous match
        ambiguousSubjects.push(subject.id);
      }
    }

    if (ambiguousSubjects.length > 0) {
      console.error("Migration Aborted due to ambiguous subject matches for IDs:", ambiguousSubjects);
      return false;
    }

    // PHASE 3 & 4: MAPPING AND VALIDATION (IN MEMORY)
    const nextAttendanceState: Partial<AttendanceState> = {
      timetableSlots: {},
      attendanceRecords: {},
      scheduleOverrides: {},
    };

    // Rewrite TimetableSlots
    for (const [id, slot] of Object.entries(attendanceState.timetableSlots)) {
      const newCourseId = subjectToCourseMap.get(slot.subjectId);
      if (!newCourseId) {
          console.error(`Missing mapped course for slot subject: ${slot.subjectId}. Aborting migration to preserve orphaned data.`);
          return false; // Abort
      }
      nextAttendanceState.timetableSlots![id] = {
        ...slot,
        subjectId: newCourseId // Keeping the field name subjectId in DB for now, but its value is courseId
      };
    }

    // Rewrite AttendanceRecords
    for (const [id, record] of Object.entries(attendanceState.attendanceRecords)) {
      const newCourseId = subjectToCourseMap.get(record.subjectId);
      if (!newCourseId) {
          console.error(`Missing mapped course for record subject: ${record.subjectId}. Aborting migration to preserve orphaned data.`);
          return false; // Abort
      }
      nextAttendanceState.attendanceRecords![id] = {
        ...record,
        subjectId: newCourseId
      };
    }

    // Rewrite ScheduleOverrides
    for (const [id, override] of Object.entries(attendanceState.scheduleOverrides)) {
      // Need to cast because of discriminate union
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newCourseId = subjectToCourseMap.get((override as any).subjectId);
      if (!newCourseId) {
          console.error(`Missing mapped course for override subject. Aborting migration to preserve orphaned data.`);
          return false; // Abort
      }
      nextAttendanceState.scheduleOverrides![id] = {
        ...override,
        subjectId: newCourseId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    }

    // PHASE 5: ASSIGNMENT MIGRATION
    const nextAssignments: Assignment[] = assignmentState.assignments.map(assignment => {
      if (assignment.subjectId && subjectToCourseMap.has(assignment.subjectId)) {
        return {
          ...assignment,
          courseId: subjectToCourseMap.get(assignment.subjectId),
          // We DO NOT remove subjectId or subjectName yet as per instruction.
        };
      }
      // If no subjectId or not in map, return as is.
      return assignment;
    });

    // PHASE 6: COMMIT MIGRATION
    // 1. Commit new courses
    if (newCourses.length > 0) {
      useCourseStore.setState({ courses: [...currentCourses, ...newCourses] });
    }

    // 2. Commit rewritten attendance and remove legacy subjects
    attendanceStore.setState({
      ...nextAttendanceState,
      subjects: {} // Remove legacy subjects
    });

    // 3. Commit assignments
    useAssignmentStore.setState({
      assignments: nextAssignments
    });

    console.log("Migration V2->V3 completed successfully.");
    return true;
  }
}
