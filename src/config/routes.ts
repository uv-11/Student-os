export const PUBLIC_ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  FEATURES: "/features",
  ROADMAP: "/roadmap",
  CHANGELOG: "/changelog",
  FAQ: "/faq",
  PRIVACY: "/privacy",
  CONTACT: "/contact",
} as const;

export const APP_ROUTES = {
  DASHBOARD: "/app",
  COURSES: "/app/courses",
  PROFILE: "/app/profile",
  ATTENDANCE: "/app/attendance",
  ASSIGNMENTS: "/app/assignments",
  HABITS: "/app/habits",
  TODO: "/app/todo",
  CALENDAR: "/app/calendar",
  POMODORO: "/app/pomodoro",
  STUDY: "/app/study",
  SETTINGS: "/app/settings",
  LOGIN: "/login",
  ANALYTICS_ATTENDANCE: "/app/analytics/attendance",
  ANALYTICS_HABITS: "/app/analytics/habits",
  ANALYTICS_POMODORO: "/app/analytics/pomodoro",
  ANALYTICS_TASKS: "/app/analytics/tasks",
  ANALYTICS_STUDY: "/app/analytics/study",
} as const;

export const LEGACY_ROUTES = {
  DASHBOARD: "/",
  COURSES: "/courses",
  PROFILE: "/profile",
  ATTENDANCE: "/attendance",
  ASSIGNMENTS: "/assignments",
  HABITS: "/habits",
  TODO: "/todo",
  CALENDAR: "/calendar",
  POMODORO: "/pomodoro",
  STUDY: "/study",
  SETTINGS: "/settings",
} as const;
