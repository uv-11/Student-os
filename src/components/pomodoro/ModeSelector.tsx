import { clsx } from "clsx";
import { Brain, Coffee } from "lucide-react";
import { PomodoroMode } from "../../types/pomodoroMode";

interface ModeSelectorProps {
  mode: PomodoroMode;
  onChange: (mode: PomodoroMode) => void;
}

const MODES: { value: PomodoroMode; label: string }[] = [
  { value: PomodoroMode.FOCUS, label: "Focus" },
  { value: PomodoroMode.BREAK, label: "Break" },
];

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm" role="tablist" aria-label="Timer mode">
      {MODES.map((m) => (
        <button
          key={m.value}
          role="tab"
          aria-selected={mode === m.value}
          onClick={() => onChange(m.value)}
          className={clsx(
            "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-primary",
            mode === m.value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {m.value === PomodoroMode.FOCUS ? <Brain className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
          {m.label}
        </button>
      ))}
    </div>
  );
}
