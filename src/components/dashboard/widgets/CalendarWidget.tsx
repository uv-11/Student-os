import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { useDashboardCalendar } from "../hooks/useDashboardCalendar";
import { DashboardCard } from "../DashboardCard";
import { EmptyState } from "../../ui/EmptyState";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";

export function CalendarWidget() {
  const { todayEvents, upcomingEvents, totalEvents } = useDashboardCalendar();

  if (totalEvents === 0) {
    return (
      <DashboardCard title="Calendar" className="h-full flex flex-col">
        <EmptyState
          icon={<CalendarIcon className="h-6 w-6" />}
          title="No events scheduled"
          description="Your calendar is empty."
          action={
            <Link to={APP_ROUTES.CALENDAR} className="text-sm text-primary hover:underline font-medium">
              View Calendar
            </Link>
          }
          className="flex-1"
        />
      </DashboardCard>
    );
  }

  const displayEvents = todayEvents.length > 0 ? todayEvents : upcomingEvents;

  return (
    <DashboardCard title={todayEvents.length > 0 ? "Today's Events" : "Upcoming Events"} className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-2 max-h-[300px]">
        {displayEvents.length === 0 ? (
           <EmptyState
             icon={<CalendarIcon className="h-6 w-6" />}
             title="No events"
             description="Nothing upcoming soon."
             className="flex-1 min-h-[200px]"
           />
        ) : (
          <ul className="divide-y divide-border/50">
            {displayEvents.slice(0, 4).map((event) => (
              <li key={event.id} className="p-3 hover:bg-accent/50 rounded-lg transition-colors flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium leading-tight">{event.title}</span>
                  <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-sm shrink-0 border border-transparent
                    ${event.type === 'task' ? 'bg-info/10 text-info border-info/20' :
                      event.type === 'assignment' ? 'bg-primary/10 text-primary border-primary/20' :
                      event.type === 'pomodoro' ? 'bg-success/10 text-success border-success/20' :
                      event.type === 'study' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' :
                      'bg-muted text-muted-foreground'
                    }
                  `}>
                    {event.type}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{format(new Date(event.date), "MMM d, h:mm a")}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardCard>
  );
}
