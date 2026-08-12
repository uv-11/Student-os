import { useEffect, Suspense, lazy } from "react";
import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { PublicLayout } from "./layouts/PublicLayout";
const DashboardPage = lazy(() => import("./pages/dashboard"));
const CoursesPage = lazy(() => import("./pages/courses"));
const ProfilePage = lazy(() => import("./pages/profile"));
const AttendancePage = lazy(() => import("./pages/attendance"));
const AssignmentsPage = lazy(() => import("./pages/assignments"));
const HabitsPage = lazy(() => import("./pages/habits"));
const TodoPage = lazy(() => import("./pages/todo"));
const CalendarPage = lazy(() => import("./pages/calendar"));
const PomodoroPage = lazy(() => import("./pages/pomodoro"));
const StudyPage = lazy(() => import("./pages/study"));
const SettingsPage = lazy(() => import("./pages/settings"));

// Analytics Pages
const AnalyticsAttendancePage = lazy(() => import("./pages/analytics/attendance"));
const AnalyticsHabitsPage = lazy(() => import("./pages/analytics/habits"));
const AnalyticsPomodoroPage = lazy(() => import("./pages/analytics/pomodoro"));
const AnalyticsTasksPage = lazy(() => import("./pages/analytics/tasks"));
const AnalyticsStudyPage = lazy(() => import("./pages/analytics/study"));
const AuthPage = lazy(() => import("./pages/auth"));

// Public Pages
const LandingPage = lazy(() => import("./pages/public/LandingPage"));
const AboutPage = lazy(() => import("./pages/public/AboutPage"));
const FeaturesPage = lazy(() => import("./pages/public/FeaturesPage"));
const RoadmapPage = lazy(() => import("./pages/public/RoadmapPage"));
const ChangelogPage = lazy(() => import("./pages/public/ChangelogPage"));
const FaqPage = lazy(() => import("./pages/public/FaqPage"));
const PrivacyPage = lazy(() => import("./pages/public/PrivacyPage"));
const ContactPage = lazy(() => import("./pages/public/ContactPage"));

// Routes config
import { PUBLIC_ROUTES, APP_ROUTES, LEGACY_ROUTES } from "./config/routes";
import { useAppStore } from "./store/appStore";

const WithAppLayout = ({ children }: { children: ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

const WithPublicLayout = ({ children }: { children: ReactNode }) => (
  <PublicLayout>{children}</PublicLayout>
);

function App() {
  const theme = useAppStore((state) => state.settings.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    let activeTheme = theme;
    if (theme === "system") {
      activeTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    
    root.classList.add(activeTheme);

    // Sync browser theme-color meta tag for PWA
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", activeTheme === "dark" ? "#020617" : "#f8fafc");
    }
  }, [theme]);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-500">Loading...</div>}>
        <Routes>
        {/* Public Routes */}
        <Route path={PUBLIC_ROUTES.HOME} element={<WithPublicLayout><LandingPage /></WithPublicLayout>} />
        <Route path={PUBLIC_ROUTES.ABOUT} element={<WithPublicLayout><AboutPage /></WithPublicLayout>} />
        <Route path={PUBLIC_ROUTES.FEATURES} element={<WithPublicLayout><FeaturesPage /></WithPublicLayout>} />
        <Route path={PUBLIC_ROUTES.ROADMAP} element={<WithPublicLayout><RoadmapPage /></WithPublicLayout>} />
        <Route path={PUBLIC_ROUTES.CHANGELOG} element={<WithPublicLayout><ChangelogPage /></WithPublicLayout>} />
        <Route path={PUBLIC_ROUTES.FAQ} element={<WithPublicLayout><FaqPage /></WithPublicLayout>} />
        <Route path={PUBLIC_ROUTES.PRIVACY} element={<WithPublicLayout><PrivacyPage /></WithPublicLayout>} />
        <Route path={PUBLIC_ROUTES.CONTACT} element={<WithPublicLayout><ContactPage /></WithPublicLayout>} />

        {/* App Routes */}
        <Route path={APP_ROUTES.DASHBOARD} element={<WithAppLayout><DashboardPage /></WithAppLayout>} />
        <Route path={APP_ROUTES.COURSES} element={<WithAppLayout><CoursesPage /></WithAppLayout>} />
        <Route path={APP_ROUTES.PROFILE} element={<WithAppLayout><ProfilePage /></WithAppLayout>} />
        <Route path={APP_ROUTES.ATTENDANCE} element={<WithAppLayout><AttendancePage /></WithAppLayout>} />
        <Route path={APP_ROUTES.ASSIGNMENTS} element={<WithAppLayout><AssignmentsPage /></WithAppLayout>} />
        <Route path={APP_ROUTES.HABITS} element={<WithAppLayout><HabitsPage /></WithAppLayout>} />
        <Route path={APP_ROUTES.TODO} element={<WithAppLayout><TodoPage /></WithAppLayout>} />
        <Route path={APP_ROUTES.CALENDAR} element={<WithAppLayout><CalendarPage /></WithAppLayout>} />
        <Route path={APP_ROUTES.POMODORO} element={<WithAppLayout><PomodoroPage /></WithAppLayout>} />
        <Route path={APP_ROUTES.STUDY} element={<WithAppLayout><StudyPage /></WithAppLayout>} />
        <Route path={APP_ROUTES.SETTINGS} element={<WithAppLayout><SettingsPage /></WithAppLayout>} />

        {/* Analytics Routes */}
        <Route path={APP_ROUTES.ANALYTICS_ATTENDANCE} element={<WithAppLayout><AnalyticsAttendancePage /></WithAppLayout>} />
        <Route path={APP_ROUTES.ANALYTICS_HABITS} element={<WithAppLayout><AnalyticsHabitsPage /></WithAppLayout>} />
        <Route path={APP_ROUTES.ANALYTICS_POMODORO} element={<WithAppLayout><AnalyticsPomodoroPage /></WithAppLayout>} />
        <Route path={APP_ROUTES.ANALYTICS_TASKS} element={<WithAppLayout><AnalyticsTasksPage /></WithAppLayout>} />
        <Route path={APP_ROUTES.ANALYTICS_STUDY} element={<WithAppLayout><AnalyticsStudyPage /></WithAppLayout>} />

        {/* Auth Route */}
        <Route path={APP_ROUTES.LOGIN} element={<AuthPage />} />

        {/* Legacy Redirects */}
        <Route path={LEGACY_ROUTES.COURSES} element={<Navigate to={APP_ROUTES.COURSES} replace />} />
        <Route path={LEGACY_ROUTES.PROFILE} element={<Navigate to={APP_ROUTES.PROFILE} replace />} />
        <Route path={LEGACY_ROUTES.ATTENDANCE} element={<Navigate to={APP_ROUTES.ATTENDANCE} replace />} />
        <Route path={LEGACY_ROUTES.ASSIGNMENTS} element={<Navigate to={APP_ROUTES.ASSIGNMENTS} replace />} />
        <Route path={LEGACY_ROUTES.HABITS} element={<Navigate to={APP_ROUTES.HABITS} replace />} />
        <Route path={LEGACY_ROUTES.TODO} element={<Navigate to={APP_ROUTES.TODO} replace />} />
        <Route path={LEGACY_ROUTES.CALENDAR} element={<Navigate to={APP_ROUTES.CALENDAR} replace />} />
        <Route path={LEGACY_ROUTES.POMODORO} element={<Navigate to={APP_ROUTES.POMODORO} replace />} />
        <Route path={LEGACY_ROUTES.STUDY} element={<Navigate to={APP_ROUTES.STUDY} replace />} />
        <Route path={LEGACY_ROUTES.SETTINGS} element={<Navigate to={APP_ROUTES.SETTINGS} replace />} />

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;


