import { clsx } from "clsx";
import type { CalendarEvent } from "../../types/calendar";
import { CheckCircle2, Clock, FileText, BookOpen, Calendar as CalendarIcon } from "lucide-react";

interface EventCardProps {
  event: CalendarEvent;
  isCompact?: boolean;
  onClick?: (event: CalendarEvent) => void;
}

const colorMap: Record<string, { border: string; dot: string }> = {
  indigo: { border: "border-l-indigo-500", dot: "bg-indigo-500" },
  blue: { border: "border-l-blue-500", dot: "bg-blue-500" },
  emerald: { border: "border-l-emerald-500", dot: "bg-emerald-500" },
  violet: { border: "border-l-violet-500", dot: "bg-violet-500" },
};

const IconMap = {
  task: CheckCircle2,
  assignment: FileText,
  pomodoro: Clock,
  study: BookOpen,
  custom: CalendarIcon,
};

export function EventCard({ event, isCompact = false, onClick }: EventCardProps) {
  const colorClass = colorMap[event.color] || colorMap.blue;
  const Icon = IconMap[event.type];

  if (isCompact) {
    return (
      <div 
        className={clsx(
          "w-full px-1.5 py-0.5 rounded text-[10px] font-medium truncate bg-card border-l-2 text-foreground transition-opacity hover:opacity-80 shadow-sm flex items-center gap-1",
          colorClass.border,
          event.isCompleted && "opacity-50 line-through",
          onClick && "cursor-pointer"
        )}
        title={event.title}
        onClick={() => onClick && onClick(event)}
      >
        <Icon className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
        <span className="truncate">{event.title}</span>
      </div>
    );
  }

  return (
    <div 
      className={clsx(
        "flex flex-col gap-1 w-full p-2.5 rounded-md bg-card border border-border border-l-4 transition-shadow hover:shadow-md",
        colorClass.border,
        event.isCompleted && "opacity-60",
        onClick && "cursor-pointer"
      )}
      onClick={() => onClick && onClick(event)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={clsx("w-1.5 h-1.5 rounded-full shrink-0", colorClass.dot)} />
          <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          <span className={clsx("text-xs font-semibold text-foreground truncate leading-tight", event.isCompleted && "line-through text-muted-foreground")}>
            {event.title}
          </span>
        </div>
      </div>
      {event.description && (
        <p className="text-[10px] text-muted-foreground line-clamp-1 pl-6">
          {event.description}
        </p>
      )}
    </div>
  );
}
