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
import { MigrationEngine } from "../migrations/MigrationEngine";

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
   * Restores a snapshot in case of failure.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static rollbackToSnapshot(data: any) {
    try {
      attendanceStore.setState(data.attendance);
      useAssignmentStore.setState({ assignments: data.assignments });
      useHabitStore.setState({ habits: data.habits });
      usePomodoroStore.setState({ sessions: data.pomodoro.sessions });
      usePomodoroStore.getState().updateSettings(data.pomodoro.settings);
      useStudyStore.setState({ sessions: data.study });
      useCalendarStore.setState({ events: data.calendar });
      useCourseStore.setState({ courses: data.courses });
      useTodoStore.setState({ todos: data.todos });
      useUserStore.getState().updateProfile(data.user.profile);
      useUserStore.getState().reorderWorkspaces(data.user.workspaces);
      useAppStore.getState().updateSettings(data.appSettings);
    } catch (e) {
      console.error("FATAL: Rollback failed.", e);
    }
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

    // 1. PRE-RESTORE SNAPSHOT for atomic rollback
    const preRestoreSnapshot = this.createSnapshot();

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

      if (metadata.schemaVersion !== "2.1" && metadata.schemaVersion !== "2.0") {
        throw new Error(`Unsupported schema version: ${metadata.schemaVersion}`);
      }

      // 2. BUILD AND VALIDATE NEXT STATE IN MEMORY
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nextState: any = {};

      if (data.attendance && typeof data.attendance === "object") {
        nextState.attendance = {
          semesters: data.attendance.semesters || {},
          subjects: data.attendance.subjects || {},
          timetableVersions: data.attendance.timetableVersions || {},
          timetableSlots: data.attendance.timetableSlots || {},
          calendarEvents: data.attendance.calendarEvents || {},
          scheduleOverrides: data.attendance.scheduleOverrides || {},
          attendanceRecords: data.attendance.attendanceRecords || {}
        };
      }

      if (Array.isArray(data.assignments)) {
        const validAssignments = data.assignments.filter(validateAssignment);
        result.skippedEntities += (data.assignments.length - validAssignments.length);
        if (validAssignments.length > 0 || data.assignments.length === 0) {
          nextState.assignments = validAssignments.map((a: Assignment) => ({
            ...a,
            title: sanitizeString(a.title, 200),
            description: a.description ? sanitizeString(a.description, 2000) : undefined,
          }));
        }
      }

      if (Array.isArray(data.habits)) {
        const validHabits = data.habits.filter(validateHabit);
        result.skippedEntities += (data.habits.length - validHabits.length);
        if (validHabits.length > 0 || data.habits.length === 0) {
          nextState.habits = validHabits.map((h: Habit) => ({
            ...h,
            name: sanitizeString(h.name, 100),
            description: h.description ? sanitizeString(h.description, 1000) : undefined,
          }));
        }
      }

      if (data.pomodoro && typeof data.pomodoro === "object") {
        nextState.pomodoro = {};
        if (Array.isArray(data.pomodoro)) {
          nextState.pomodoro.sessions = data.pomodoro;
        } else {
          if (Array.isArray(data.pomodoro.sessions)) nextState.pomodoro.sessions = data.pomodoro.sessions;
          if (data.pomodoro.settings) nextState.pomodoro.settings = data.pomodoro.settings;
        }
      }

      if (Array.isArray(data.study)) nextState.study = data.study;
      if (Array.isArray(data.calendar)) nextState.calendar = data.calendar;
      if (Array.isArray(data.courses)) nextState.courses = data.courses;
      if (Array.isArray(data.todos)) nextState.todos = data.todos;
      if (data.user && typeof data.user === "object") nextState.user = data.user;
      if (data.appSettings && typeof data.appSettings === "object") nextState.appSettings = data.appSettings;

      // 3. ATOMIC COMMIT TO LIVE STORES
      if (nextState.attendance) {
        attendanceStore.setState(nextState.attendance);
        result.importedCount++;
      }
      if (nextState.assignments) {
        useAssignmentStore.setState({ assignments: nextState.assignments });
        result.importedCount += nextState.assignments.length;
      }
      if (nextState.habits) {
        useHabitStore.setState({ habits: nextState.habits });
        result.importedCount += nextState.habits.length;
      }
      if (nextState.pomodoro) {
        if (nextState.pomodoro.sessions) {
          usePomodoroStore.setState({ sessions: nextState.pomodoro.sessions, activeTimer: null });
          result.importedCount += nextState.pomodoro.sessions.length;
        }
        if (nextState.pomodoro.settings) {
          usePomodoroStore.getState().updateSettings(nextState.pomodoro.settings);
        }
      }
      if (nextState.study) {
        useStudyStore.setState({ sessions: nextState.study, activeSession: null });
        result.importedCount += nextState.study.length;
      }
      if (nextState.calendar) {
        useCalendarStore.setState({ events: nextState.calendar });
        result.importedCount += nextState.calendar.length;
      }
      if (nextState.courses) {
        useCourseStore.setState({ courses: nextState.courses, lastDeletedCourse: null });
        result.importedCount += nextState.courses.length;
      }
      if (nextState.todos) {
        useTodoStore.setState({ todos: nextState.todos, lastDeletedTodo: null });
        result.importedCount += nextState.todos.length;
      }
      if (nextState.user) {
        if (nextState.user.profile) {
          useUserStore.getState().updateProfile(nextState.user.profile);
          result.importedCount++;
        }
        if (Array.isArray(nextState.user.workspaces) && nextState.user.workspaces.length > 0) {
           useUserStore.getState().reorderWorkspaces(nextState.user.workspaces);
           const currentActiveId = useUserStore.getState().activeWorkspaceId;
           const exists = nextState.user.workspaces.some((ws: Record<string, unknown>) => ws.id === currentActiveId);
           if (!exists) {
             useUserStore.getState().setActiveWorkspace(nextState.user.workspaces[0].id);
           }
           result.importedCount++;
        }
      }
      if (nextState.appSettings) {
        useAppStore.getState().updateSettings(nextState.appSettings);
        result.importedCount++;
      }

      // 4. RUN MIGRATIONS
      await MigrationEngine.runMigrations();

      result.success = true;
      return result;

    } catch (e) {
      console.warn("Restore failed, rolling back to pre-restore snapshot.", e);
      this.rollbackToSnapshot(preRestoreSnapshot.data);
      
      result.success = false;
      const errorMessage = e instanceof Error ? e.message : "Unknown error during restore.";
      result.errors.push(errorMessage);
      return result;
    }
  }
}
