import { Activity, Flame, CheckCircle, Circle } from "lucide-react";
import { useDashboardHabits } from "../hooks/useDashboardHabits";
import { DashboardCard } from "../DashboardCard";
import { EmptyState } from "../../ui/EmptyState";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import { ProgressBar } from "../../ui/ProgressBar";

export function HabitsWidget() {
  const { 
    totalHabits, 
    completedToday, 
    currentStreak, 
    displayHabits, 
    toggleCompletion, 
    todayStr 
  } = useDashboardHabits();

  if (totalHabits === 0) {
    return (
      <DashboardCard title="Habits" className="h-full flex flex-col">
        <EmptyState
          icon={<Activity className="h-6 w-6" />}
          title="No habits yet"
          description="Add a habit to start tracking."
          action={
            <Link to={APP_ROUTES.HABITS} className="text-sm text-primary hover:underline font-medium">
              Create Habit
            </Link>
          }
          className="flex-1"
        />
      </DashboardCard>
    );
  }

  const todayPercentage = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;

  return (
    <DashboardCard title="Habits" className="h-full flex flex-col">
      <div className="p-4 flex flex-col gap-4 border-b border-border bg-card">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
             <span className="text-2xl font-bold tracking-tight text-primary">{Math.round(todayPercentage)}%</span>
             <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground leading-tight max-w-[60px]">Completed Today</span>
          </div>
          <div className="flex items-center gap-2 bg-warning/10 text-warning px-3 py-1.5 rounded-xl border border-warning/20">
            <Flame className="h-4 w-4" />
            <span className="text-sm font-bold">{currentStreak}</span>
          </div>
        </div>
        <ProgressBar percentage={todayPercentage} className="h-1.5" />
      </div>

      <div className="flex-1 overflow-y-auto p-2 max-h-[220px]">
        <ul className="divide-y divide-border/50">
          {displayHabits.map((habit) => (
            <li key={habit.id} className="flex items-center justify-between p-3 hover:bg-accent/50 rounded-lg transition-colors">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{habit.name}</span>
                {habit.description && <span className="text-xs text-muted-foreground line-clamp-1">{habit.description}</span>}
              </div>
              <button 
                onClick={() => toggleCompletion(habit.id, todayStr)}
                className="text-muted-foreground hover:text-primary transition-colors p-1"
              >
                {habit.isCompletedToday ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </DashboardCard>
  );
}
