import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { createPortal } from "react-dom";
import { APP_ROUTES } from "../../config/routes";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";

const SEARCHABLE_ROUTES = [
  { name: "Dashboard", path: APP_ROUTES.DASHBOARD, keywords: ["home", "main"] },
  { name: "Attendance", path: APP_ROUTES.ATTENDANCE, keywords: ["classes", "presence", "track"] },
  { name: "Courses", path: APP_ROUTES.COURSES, keywords: ["subjects", "classes"] },
  { name: "Assignments", path: APP_ROUTES.ASSIGNMENTS, keywords: ["homework", "tasks", "due"] },
  { name: "Calendar", path: APP_ROUTES.CALENDAR, keywords: ["schedule", "events", "week", "month"] },
  { name: "Habits", path: APP_ROUTES.HABITS, keywords: ["tracking", "daily", "streaks"] },
  { name: "Pomodoro", path: APP_ROUTES.POMODORO, keywords: ["timer", "focus", "study"] },
  { name: "Study Sessions", path: APP_ROUTES.STUDY, keywords: ["log", "time", "revision"] },
  { name: "Settings", path: APP_ROUTES.SETTINGS, keywords: ["preferences", "theme", "export"] },
  { name: "Profile", path: "/profile", keywords: ["account", "identity", "avatar"] },
  { name: "Attendance Analytics", path: APP_ROUTES.ANALYTICS_ATTENDANCE, keywords: ["stats", "insights", "graphs"] },
  { name: "Task Analytics", path: APP_ROUTES.ANALYTICS_TASKS, keywords: ["stats", "insights", "graphs"] },
  { name: "Habit Analytics", path: APP_ROUTES.ANALYTICS_HABITS, keywords: ["stats", "insights", "graphs"] },
  { name: "Pomodoro Analytics", path: APP_ROUTES.ANALYTICS_POMODORO, keywords: ["stats", "insights", "graphs"] },
  { name: "Study Analytics", path: APP_ROUTES.ANALYTICS_STUDY, keywords: ["stats", "insights", "graphs"] },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => {
          if (!open) {
            setQuery("");
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 10);
          }
          return !open;
        });
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);



  const filteredRoutes = useMemo(() => {
    if (!query.trim()) return SEARCHABLE_ROUTES;
    const lowerQuery = query.toLowerCase();
    return SEARCHABLE_ROUTES.filter(
      (r) => 
        r.name.toLowerCase().includes(lowerQuery) || 
        r.keywords.some((k) => k.toLowerCase().includes(lowerQuery))
    );
  }, [query]);



  const handleSelect = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredRoutes.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && filteredRoutes.length > 0) {
      e.preventDefault();
      handleSelect(filteredRoutes[selectedIndex].path);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-4 sm:pt-[15vh] px-2 sm:px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[60vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Command Palette"
        >
          <div className="flex shrink-0 items-center border-b border-border px-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="flex h-14 w-full rounded-md bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground text-foreground"
              placeholder="Search for pages, settings, analytics..."
              aria-label="Search input"
            />
          </div>
          <div className="overflow-y-auto p-2 flex-1">
            {filteredRoutes.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredRoutes.map((route, i) => (
                  <button
                    key={route.path}
                    onClick={() => handleSelect(route.path)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={clsx(
                      "flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors text-left",
                      i === selectedIndex 
                        ? "bg-primary/10 text-primary" 
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <span className="font-medium">{route.name}</span>
                    {i === selectedIndex && <ArrowRight className="w-4 h-4 opacity-50" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="hidden sm:flex shrink-0 items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground bg-muted/20">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><kbd className="font-sans px-1.5 py-0.5 rounded bg-background border border-border/50 shadow-sm leading-none">↑</kbd><kbd className="font-sans px-1.5 py-0.5 rounded bg-background border border-border/50 shadow-sm leading-none">↓</kbd> to navigate</span>
              <span className="flex items-center gap-1.5"><kbd className="font-sans px-1.5 py-0.5 rounded bg-background border border-border/50 shadow-sm leading-none">↵</kbd> to select</span>
            </div>
            <span className="flex items-center gap-1.5"><kbd className="font-sans px-1.5 py-0.5 rounded bg-background border border-border/50 shadow-sm leading-none">esc</kbd> to close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
