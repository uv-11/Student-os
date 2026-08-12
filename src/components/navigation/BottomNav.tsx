import { NavLink } from "react-router-dom";
import { LayoutDashboard, CheckSquare, FileText, Activity, Clock, BookOpen, GraduationCap } from "lucide-react";
import { clsx } from "clsx";
import { APP_ROUTES } from "../../config/routes";

const NAV_ITEMS = [
  { name: "Home", path: APP_ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: "Courses", path: APP_ROUTES.COURSES, icon: GraduationCap },
  { name: "Attend", path: APP_ROUTES.ATTENDANCE, icon: CheckSquare },
  { name: "Tasks", path: APP_ROUTES.ASSIGNMENTS, icon: FileText },
  { name: "Habits", path: APP_ROUTES.HABITS, icon: Activity },
  { name: "Timer", path: APP_ROUTES.POMODORO, icon: Clock },
  { name: "Study", path: APP_ROUTES.STUDY, icon: BookOpen },
];

export function BottomNav() {
  return (
    <nav className="flex h-16 shrink-0 items-center justify-start overflow-x-auto flex-nowrap snap-x hide-scrollbar border-t border-border bg-card px-2 pb-safe md:hidden">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            clsx(
              "flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-1.5 min-w-[64px] shrink-0 snap-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
              isActive
                ? "text-muted-foreground"
                : "text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground"
            )
          }
        >
          <item.icon className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
}


