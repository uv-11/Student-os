import { useState } from "react";
import { Edit2, Trash2, Flame, Trophy } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { useHabitStore } from "../../store/habitStore";
import {
  getCurrentStreak,
  getLongestStreak,
  getCompletionPercentage,
  getLast7DayStatuses,
  isCompletedToday,
  isCompletedYesterday,
  getTodayString,
  getYesterdayString,
} from "../../utils/habits";
import type { Habit } from "../../types/habit";
import type { DayStatus } from "../../utils/habits";

interface HabitCardProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onDeleteOverride?: () => void;
}

function SevenDayStrip({ statuses }: { statuses: DayStatus[] }) {
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date();
  // Compute actual day-of-week labels for the 7 displayed days
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return dayLabels[d.getDay()];
  });

  return (
    <div className="flex items-end gap-1.5" aria-label="Last 7 days activity">
      {statuses.map((status, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div
            className={clsx(
              "h-3 w-3 rounded-full transition-colors",
              i === 6 && "ring-2 ring-offset-1 ring-slate-300 dark:ring-slate-600",
              status === "done"
                ? "bg-emerald-500 dark:bg-emerald-400"
                : "bg-muted"
            )}
            title={status === "done" ? "Completed" : "Missed"}
          />
          <span className="text-[9px] text-muted-foreground">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function HabitCard({ habit, onEdit, onDeleteOverride }: HabitCardProps) {
  const { toggleCompletion, deleteHabit } = useHabitStore();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const streak = getCurrentStreak(habit.completionLog);
  const longest = getLongestStreak(habit.completionLog);
  const pct = getCompletionPercentage(habit.completionLog, habit.createdAt);
  const statuses = getLast7DayStatuses(habit.completionLog);
  const todayDone = isCompletedToday(habit.completionLog);
  const yesterdayDone = isCompletedYesterday(habit.completionLog);

  const handleDelete = () => {
    if (isConfirmingDelete) {
      if (onDeleteOverride) onDeleteOverride();
      else deleteHabit(habit.id);
    } else {
      setIsConfirmingDelete(true);
    }
  };

  const accentStyle = habit.color ? { borderLeftColor: habit.color } : undefined;

  return (
    <Card
      className={clsx("p-3 sm:p-4 flex flex-col gap-3 transition-all border border-border hover:shadow-md", todayDone && "opacity-60", habit.color && "border-l-4")}
      style={accentStyle}
    >
      <div className="flex items-start gap-3 justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Completion Toggle (One-Tap) */}
          <button
            onClick={() => toggleCompletion(habit.id, getTodayString())}
            aria-label={todayDone ? "Undo completion" : "Mark done"}
            className={clsx(
              "mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 flex items-center justify-center",
              todayDone
                ? "border-primary bg-primary"
                : "border-muted-foreground/30 hover:border-primary/50 bg-transparent"
            )}
          >
            {todayDone && (
              <svg viewBox="0 0 12 12" className="h-3 w-3 text-primary-foreground" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          
          <div className="min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              {habit.icon && <span className="text-base leading-none shrink-0">{habit.icon}</span>}
              <h4 className={clsx("text-sm font-bold text-foreground leading-tight truncate", todayDone && "line-through text-muted-foreground")}>
                {habit.name}
              </h4>
            </div>
            {habit.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 opacity-80">{habit.description}</p>
            )}
            
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 text-orange-500/90 dark:text-orange-400/90">
                <Flame className="h-3.5 w-3.5" />
                <span className="font-semibold">{streak}</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" />
                <span className="font-semibold">{longest}</span>
              </div>
              <div className="font-medium">
                {pct}% (30d)
              </div>
            </div>
          </div>
        </div>

        {/* Actions / Delete Confirm */}
        {isConfirmingDelete ? (
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 shrink-0 bg-destructive/10 px-2 py-1 rounded-md border border-destructive/20">
            <span className="text-xs font-semibold text-destructive whitespace-nowrap hidden sm:inline-block">Delete?</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={handleDelete} className="h-6 px-1.5 text-destructive hover:bg-destructive/20">Yes</Button>
              <Button variant="ghost" size="sm" onClick={() => setIsConfirmingDelete(false)} className="h-6 px-1.5 hover:bg-muted">No</Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-0.5 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onEdit(habit)} aria-label="Edit habit" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted">
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete} aria-label="Delete habit" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* 7-day strip */}
      <div className="pt-2 sm:pt-0 sm:pl-8 flex justify-between items-end gap-2 mt-auto">
        <SevenDayStrip statuses={statuses} />
        <Button
          variant="ghost"
          size="sm"
          className={clsx("h-6 px-2 text-[10px] font-semibold tracking-wide uppercase", yesterdayDone ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
          onClick={() => toggleCompletion(habit.id, getYesterdayString())}
          title={yesterdayDone ? "Undo yesterday" : "Mark yesterday as done"}
        >
          {yesterdayDone ? "✓ Yesterday" : "Yesterday"}
        </Button>
      </div>
    </Card>
  );
}
