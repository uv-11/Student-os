import { useMemo } from "react";
import { useCalendarEvents } from "../../../hooks/useCalendarEvents";
import { isSameDay, isAfter, startOfDay } from "date-fns";
import { useNow } from "../../../hooks/useNow";

export function useDashboardCalendar() {
  const events = useCalendarEvents();
  const now = useNow();

  return useMemo(() => {
    const today = startOfDay(now);

    const todayEvents = events.filter((e) => isSameDay(new Date(e.date), today));
    const upcomingEvents = events
      .filter((e) => isAfter(new Date(e.date), today))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);

    return {
      todayEvents,
      upcomingEvents,
      totalEvents: events.length,
    };
  }, [events, now]);
}
