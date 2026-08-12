import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import type { CalendarEvent } from "../../types/calendar";
import { EventCard } from "./EventCard";
import { clsx } from "clsx";

interface MonthViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick?: (event: CalendarEvent) => void;
}

export function MonthView({ events, currentDate, onEventClick }: MonthViewProps) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-col w-full h-full min-h-[600px] border border-border sm:rounded-xl bg-card overflow-hidden shadow-sm">
      {/* Header Row */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {weekDays.map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);
          
          // Find events for this day
          const dayEvents = events.filter(e => {
            const eventDate = new Date(e.date);
            return isSameDay(eventDate, day);
          });

          return (
            <div 
              key={day.getTime()} 
              className={clsx(
                "min-h-[100px] p-1 sm:p-2 border-r border-b flex flex-col gap-1 transition-colors hover:bg-muted/10",
                !isCurrentMonth && "bg-muted/5",
                idx % 7 === 6 && "border-r-0"
              )}
            >
              <div className="flex items-center justify-between">
                <span 
                  className={clsx(
                    "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                    isDayToday ? "bg-primary text-primary-foreground" : 
                    isCurrentMonth ? "text-foreground" : "text-muted-foreground/50"
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-medium sm:hidden">
                    {dayEvents.length}
                  </span>
                )}
              </div>
              
              <div className="hidden sm:flex flex-col gap-1 mt-1 overflow-y-auto max-h-[100px] scrollbar-none">
                {dayEvents.map(event => (
                  <EventCard key={event.id} event={event} isCompact={true} onClick={onEventClick} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
