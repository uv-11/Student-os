import { attendanceStore } from "../../features/attendance/repositories/zustand-store";
import { useAssignmentStore } from "../../store/assignmentStore";
import { useHabitStore } from "../../store/habitStore";
import { usePomodoroStore } from "../../store/pomodoroStore";
import { useStudyStore } from "../../store/studyStore";
import { useCalendarStore } from "../../store/calendarStore";
import { useCourseStore } from "../../store/courseStore";
import { useUserStore } from "../../store/userStore";
import { useAppStore } from "../../store/appStore";
import { useTodoStore } from "../../store/todoStore";

import type { BackupEnvelope, RestoreResult } from "./types";
import { validateAssignment, validateHabit, sanitizeString } from "../../utils/importValidator";
import type { Assignment } from "../../types/assignment";
import type { Habit } from "../../types/habit";

export class BackupEngine {
  public static readonly CURRENT_SCHEMA_VERSION = "2.1";
  public static readonly APP_VERSION = "2.0.0"; // Or fetch from environment

  /**
   * Orchestrates the creation of a complete local snapshot of the application state.
   */
  static createSnapshot(): BackupEnvelope {
    return {
      metadata: {
        schemaVersion: this.CURRENT_SCHEMA_VERSION,
        appVersion: this.APP_VERSION,
        createdAt: Date.now(),
        backupId: crypto.randomUUID(),
      },
      data: {
        // Domain Data (Category A)
        attendance: attendanceStore.getState(),
        assignments: useAssignmentStore.getState().assignments,
        habits: useHabitStore.getState().habits,
        pomodoro: {
          sessions: usePomodoroStore.getState().sessions,
          settings: usePomodoroStore.getState().settings,
        },
        study: useStudyStore.getState().sessions,
        calendar: useCalendarStore.getState().events,
        courses: useCourseStore.getState().courses,
        todos: useTodoStore.getState().todos,
        user: {
            profile: useUserStore.getState().profile,
            workspaces: useUserStore.getState().workspaces,
        },
        // User Preferences (Category B)
        appSettings: useAppStore.getState().settings,
      }
    };
  }

  /**
   * Orchestrates the safe staging and validation of a backup before committing
   * it to the live application state.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async validateAndRestore(envelope: BackupEnvelope | any): Promise<RestoreResult> {
    const result: RestoreResult = {
      success: false,
      importedCount: 0,
      errors: [],
      skippedEntities: 0,
    };

    try {
      if (!envelope) {
        throw new Error("Backup file is empty or undefined");
      }

      // Handle Legacy V2 Format vs New BackupEnvelope Format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const env = envelope as any;
      let metadata = env.metadata;
      let data = env.data;

      if (!metadata || !data) {
        // Assume Legacy v2.0 export from StudentOS
        if (envelope.version === "2.0" || envelope.exportedAt) {
          metadata = {
            schemaVersion: "2.0",
            appVersion: "2.0.0",
            createdAt: envelope.exportedAt || Date.now(),
            backupId: "legacy-v2",
          };
          data = envelope;
        } else {
          throw new Error("Invalid backup envelope structure. Missing metadata and data blocks.");
        }
      }

      // We only support schema version >= 2.0 right now
      if (metadata.schemaVersion !== "2.1" && metadata.schemaVersion !== "2.0") {
        throw new Error(`Unsupported schema version: ${metadata.schemaVersion}`);
      }

      // Begin Domain Restorations Safely
      
      // 1. Restore Attendance (Whole domain replacement with safe mapping)
      if (data.attendance && typeof data.attendance === "object") {
        try {
          const safeAttendance = {
            semesters: data.attendance.semesters || {},
            subjects: data.attendance.subjects || {},
            timetableVersions: data.attendance.timetableVersions || {},
            timetableSlots: data.attendance.timetableSlots || {},
            calendarEvents: data.attendance.calendarEvents || {},
            scheduleOverrides: data.attendance.scheduleOverrides || {},
            attendanceRecords: data.attendance.attendanceRecords || {}
          };
          attendanceStore.setState(safeAttendance);
          result.importedCount++;
        } catch {
          result.errors.push("Failed to restore attendance data.");
        }
      }

      // 2. Restore Assignments (Entity level validation)
      if (Array.isArray(data.assignments)) {
        const validAssignments = data.assignments.filter(validateAssignment);
        result.skippedEntities += (data.assignments.length - validAssignments.length);

        if (validAssignments.length > 0 || data.assignments.length === 0) {
          const cleanAssignments = validAssignments.map((a: Assignment) => ({
            ...a,
            title: sanitizeString(a.title, 200),
            description: a.description ? sanitizeString(a.description, 2000) : undefined,
          }));
          useAssignmentStore.setState({ assignments: cleanAssignments });
          result.importedCount += validAssignments.length;
        }
      }

      // 3. Restore Habits (Entity level validation)
      if (Array.isArray(data.habits)) {
        const validHabits = data.habits.filter(validateHabit);
        result.skippedEntities += (data.habits.length - validHabits.length);

        if (validHabits.length > 0 || data.habits.length === 0) {
          const cleanHabits = validHabits.map((h: Habit) => ({
            ...h,
            name: sanitizeString(h.name, 100),
            description: h.description ? sanitizeString(h.description, 1000) : undefined,
          }));
          useHabitStore.setState({ habits: cleanHabits });
          result.importedCount += validHabits.length;
        }
      }

      // 4. Restore Pomodoro Sessions & Settings
      if (data.pomodoro && typeof data.pomodoro === "object") {
        if (Array.isArray(data.pomodoro)) {
          usePomodoroStore.setState({ sessions: data.pomodoro, activeTimer: null });
          result.importedCount += data.pomodoro.length;
        } else {
          // Object format (v2.1+)
          if (Array.isArray(data.pomodoro.sessions)) {
            usePomodoroStore.setState({ sessions: data.pomodoro.sessions, activeTimer: null });
            result.importedCount += data.pomodoro.sessions.length;
          }
          if (data.pomodoro.settings) {
            usePomodoroStore.getState().updateSettings(data.pomodoro.settings);
          }
        }
      }

      // 5. Restore Study Sessions
      if (Array.isArray(data.study)) {
        useStudyStore.setState({ sessions: data.study, activeSession: null }); // activeSession is transient, clear it
        result.importedCount += data.study.length;
      }

      // 6. Restore Calendar Events
      if (Array.isArray(data.calendar)) {
        useCalendarStore.setState({ events: data.calendar });
        result.importedCount += data.calendar.length;
      }

      // 7. Restore Courses
      if (Array.isArray(data.courses)) {
        useCourseStore.setState({ courses: data.courses, lastDeletedCourse: null });
        result.importedCount += data.courses.length;
      }

      // 8. Restore Todos
      if (Array.isArray(data.todos)) {
        useTodoStore.setState({ todos: data.todos, lastDeletedTodo: null });
        result.importedCount += data.todos.length;
      }

      // 9. Restore User Profile & Workspaces
      if (data.user && typeof data.user === "object") {
        if (data.user.profile) {
          useUserStore.getState().updateProfile(data.user.profile);
          result.importedCount++;
        }
        if (Array.isArray(data.user.workspaces) && data.user.workspaces.length > 0) {
           useUserStore.getState().reorderWorkspaces(data.user.workspaces);
           // Fallback active workspace if the current active one is missing
           const currentActiveId = useUserStore.getState().activeWorkspaceId;
           const exists = data.user.workspaces.some((ws: Record<string, unknown>) => ws.id === currentActiveId);
           if (!exists) {
             useUserStore.getState().setActiveWorkspace(data.user.workspaces[0].id);
           }
           result.importedCount++;
        }
      }

      // 10. Restore App Settings (User Preferences)
      if (data.appSettings && typeof data.appSettings === "object") {
        useAppStore.getState().updateSettings(data.appSettings);
        result.importedCount++;
      }

      result.success = true;
      return result;

    } catch (e) {
      result.success = false;
      const errorMessage = e instanceof Error ? e.message : "Unknown error during restore.";
      result.errors.push(errorMessage);
      return result;
    }
  }
}
