import { useMemo } from "react";
import { format, isToday } from "date-fns";
import type { CalendarEvent } from "../../types/calendar";
import { EventCard } from "./EventCard";
import { EmptyState } from "../ui/EmptyState";
import { Calendar as CalendarIcon } from "lucide-react";

interface AgendaViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

export function AgendaView({ events, onEventClick }: AgendaViewProps) {
  const groupedEvents = useMemo(() => {
    // Group events by day (timestamp at 00:00:00)
    const groups: Record<number, CalendarEvent[]> = {};
    
    events.forEach(event => {
      const dayStart = new Date(event.date).setHours(0, 0, 0, 0);
      if (!groups[dayStart]) groups[dayStart] = [];
      groups[dayStart].push(event);
    });

    // Sort days chronologically
    return Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b)
      .map(timestamp => ({
        timestamp,
        date: new Date(timestamp),
        events: groups[timestamp].sort((a, b) => a.date - b.date),
      }));
  }, [events]);

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<CalendarIcon className="w-6 h-6" />}
        title="No events scheduled."
        description="Your agenda is completely clear."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-20">
      {groupedEvents.map(group => {
        const today = isToday(group.date);
        return (
          <div key={group.timestamp} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0 ${today ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider">{format(group.date, 'EEE')}</span>
                <span className="text-lg font-bold leading-none">{format(group.date, 'd')}</span>
              </div>
              <div className="h-px bg-border/50 flex-1" />
            </div>
            
            <div className="pl-15 flex flex-col gap-2">
              {group.events.map(event => (
                <EventCard key={event.id} event={event} onClick={onEventClick} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
