import { useNavigate } from "react-router-dom";
import { CheckSquare, FileText, Activity, Clock, BookOpen, Calendar as CalendarIcon } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { APP_ROUTES } from "../../config/routes";

export function QuickActionsCard() {
  const navigate = useNavigate();

  const actions = [
    {
      id: "mark-attendance",
      icon: <CheckSquare className="h-5 w-5" />,
      label: "Mark Attendance",
      description: "Record today's classes",
      onClick: () => navigate(APP_ROUTES.ATTENDANCE),
    },
    {
      id: "add-assignment",
      icon: <FileText className="h-5 w-5" />,
      label: "Add Assignment",
      description: "Track new coursework",
      onClick: () => navigate(`${APP_ROUTES.ASSIGNMENTS}?action=add`),
    },
    {
      id: "add-habit",
      icon: <Activity className="h-5 w-5" />,
      label: "Add Habit",
      description: "Build a new routine",
      onClick: () => navigate(`${APP_ROUTES.HABITS}?action=add`),
    },
    {
      id: "add-event",
      icon: <CalendarIcon className="h-5 w-5" />,
      label: "Add Calendar Event",
      description: "Schedule something new",
      onClick: () => navigate(`${APP_ROUTES.CALENDAR}?action=add`),
    },
    {
      id: "start-pomodoro",
      icon: <Clock className="h-5 w-5" />,
      label: "Start Pomodoro",
      description: "Begin a focus session",
      onClick: () => navigate(`${APP_ROUTES.POMODORO}?action=add`),
    },
    {
      id: "start-study",
      icon: <BookOpen className="h-5 w-5" />,
      label: "Log Study Session",
      description: "Record your study time",
      onClick: () => navigate(`${APP_ROUTES.STUDY}?action=add`),
    },
  ];

  return (
    <DashboardCard title="Quick Actions" className="h-full flex flex-col">
      <div className="grid grid-cols-2 gap-2 p-3 flex-1 overflow-y-auto content-start">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="group flex flex-col items-center justify-center gap-2 p-3 text-center rounded-xl hover:bg-accent border border-transparent hover:border-border transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card border border-border text-muted-foreground shadow-sm group-hover:text-foreground group-hover:border-border-strong transition-colors">
              {action.icon}
            </span>
            <span className="text-[11px] font-bold text-foreground leading-tight px-1">{action.label}</span>
          </button>
        ))}
      </div>
    </DashboardCard>
  );
}
