import { useState, useEffect } from "react";
import { addMonths, subMonths, addWeeks, subWeeks, format } from "date-fns";
import { Container } from "../../components/ui/Container";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { ChevronLeft, ChevronRight, LayoutGrid, List, LayoutTemplate, Plus } from "lucide-react";
import { clsx } from "clsx";

import { useCalendarEvents } from "../../hooks/useCalendarEvents";
import { MonthView } from "../../components/calendar/MonthView";
import { WeekView } from "../../components/calendar/WeekView";
import { AgendaView } from "../../components/calendar/AgendaView";
import { EventForm } from "../../components/calendar/EventForm";
import type { CalendarEvent } from "../../types/calendar";
import type { StandaloneCalendarEvent } from "../../store/calendarStore";

type ViewType = "month" | "week" | "agenda";

export default function CalendarPage() {
  const events = useCalendarEvents();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Persist view preference or default to month (agenda on mobile)
  const [view, setView] = useState<ViewType>(() => {
    const saved = localStorage.getItem("studentos-calendar-view");
    if (saved === "month" || saved === "week" || saved === "agenda") return saved;
    return window.innerWidth < 640 ? "agenda" : "month";
  });

  const [isAdding, setIsAdding] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("action") === "add";
  });
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const handleCloseForm = () => {
    if (isAdding) {
      const url = new URL(window.location.href);
      url.searchParams.delete("action");
      window.history.replaceState({}, "", url);
    }
    setIsAdding(false);
    setEditingEvent(null);
  };

  useEffect(() => {
    localStorage.setItem("studentos-calendar-view", view);
  }, [view]);

  const handlePrevious = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    else {
      // For Agenda, jump 1 month back for simplicity
      setCurrentDate(subMonths(currentDate, 1));
    }
  };


  const handleNext = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getHeaderLabel = () => {
    if (view === "month") return format(currentDate, "MMMM yyyy");
    if (view === "week") return `Week of ${format(currentDate, "MMM d, yyyy")}`;
    return "All Scheduled Events";
  };

  return (
    <Container className="flex flex-col h-full overflow-hidden pb-4">
      <PageHeader 
        title="Calendar" 
        description="Your academic timeline." 
        className="shrink-0 mb-4" 
        actions={
          <Button onClick={() => setIsAdding(true)} className="hidden md:flex">
            <Plus className="h-4 w-4 mr-2" /> Add Event
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-foreground min-w-[180px] tracking-tight">
            {getHeaderLabel()}
          </h2>
          
          <div className="flex items-center bg-card border border-border rounded-md shadow-sm overflow-hidden">
            <Button variant="ghost" size="sm" onClick={handlePrevious} className="px-2 h-7 rounded-none border-r border-border hover:bg-muted">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToday} className="px-3 h-7 rounded-none border-r border-border text-[11px] font-bold uppercase tracking-wider hover:bg-muted text-muted-foreground">
              Today
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNext} className="px-2 h-7 rounded-none hover:bg-muted">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="flex items-center bg-muted/30 border border-border p-0.5 rounded-lg">
          <button
            onClick={() => setView("month")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors",
              view === "month" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Month</span>
          </button>
          <button
            onClick={() => setView("week")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors",
              view === "week" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Week</span>
          </button>
          <button
            onClick={() => setView("agenda")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors",
              view === "agenda" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Agenda</span>
          </button>
        </div>
      </div>

      {/* View Container */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="min-w-[800px] h-full sm:min-w-0">
          {view === "month" && <MonthView events={events} currentDate={currentDate} onEventClick={(e) => e.type === 'custom' && setEditingEvent(e)} />}
          {view === "week" && <WeekView events={events} currentDate={currentDate} onEventClick={(e) => e.type === 'custom' && setEditingEvent(e)} />}
        </div>
        {view === "agenda" && (
          <div className="w-full h-full mt-2">
             <AgendaView events={events} onEventClick={(e) => e.type === 'custom' && setEditingEvent(e)} />
          </div>
        )}
      </div>

      {(isAdding || editingEvent) && (
        <EventForm
          initialData={editingEvent?.type === "custom" ? (editingEvent as unknown as StandaloneCalendarEvent) : undefined}
          selectedDate={currentDate}
          onClose={handleCloseForm}
        />
      )}

      {/* Mobile FAB */}
      {!isAdding && !editingEvent && (
        <Button
          onClick={() => setIsAdding(true)}
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg md:hidden flex items-center justify-center p-0 z-40"
          aria-label="Add Event"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </Container>
  );
}
