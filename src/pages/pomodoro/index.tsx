import React from "react";
import { Container } from "../../components/ui/Container";
import { PageHeader } from "../../components/ui/PageHeader";
import { TimerRing } from "../../components/pomodoro/TimerRing";
import { TimerControls } from "../../components/pomodoro/TimerControls";
import { ModeSelector } from "../../components/pomodoro/ModeSelector";
import { SessionHistory } from "../../components/pomodoro/SessionHistory";
import { TimerSettings } from "../../components/pomodoro/TimerSettings";
import { usePomodoroStore } from "../../store/pomodoroStore";
import { usePomodoro } from "../../hooks/usePomodoro";
import { getTodayFocusMinutes, getTodayFocusCount } from "../../utils/pomodoro";

export default function PomodoroPage() {
  const { sessions, settings, addSession, clearHistory } = usePomodoroStore();
  const { timeRemaining, sessionTotal, isRunning, mode, start, pause, reset, changeMode } =
    usePomodoro(settings, (completedMode, durationMinutes) => {
      addSession(completedMode, durationMinutes);
    });

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "add") {
      start();
      const url = new URL(window.location.href);
      url.searchParams.delete("action");
      window.history.replaceState({}, "", url);
    }
  }, [start]);

  const focusMinutesToday = getTodayFocusMinutes(sessions);
  const focusCountToday = getTodayFocusCount(sessions);

  return (
    <Container>
      <PageHeader
        title="Pomodoro"
        description="Stay focused with timed work and break sessions."
      />

      <div className="flex flex-col gap-6 max-w-lg mx-auto">
        {/* Timer centrepiece */}
        <div className="flex flex-col items-center justify-center py-6 sm:py-10">
          <ModeSelector mode={mode} onChange={changeMode} />
          
          <div className="w-full flex justify-center py-8">
            <TimerRing
              timeRemaining={timeRemaining}
              sessionTotal={sessionTotal}
              mode={mode}
            />
          </div>

          <TimerControls
            isRunning={isRunning}
            onStart={start}
            onPause={pause}
            onReset={reset}
          />
        </div>

        {/* Daily stats */}
        <div className="grid grid-cols-2 divide-x divide-border rounded-xl border border-border bg-card/50">
          <div className="flex flex-col items-center gap-1 py-5">
            <p className="text-3xl font-bold tabular-nums text-foreground">
              {focusCountToday}
            </p>
            <p className="text-xs text-muted-foreground">sessions today</p>
          </div>
          <div className="flex flex-col items-center gap-1 py-5">
            <p className="text-3xl font-bold tabular-nums text-foreground">
              {focusMinutesToday}
              <span className="text-sm font-medium text-muted-foreground ml-1">min</span>
            </p>
            <p className="text-xs text-muted-foreground">focus today</p>
          </div>
        </div>

        {/* Timer Settings */}
        <TimerSettings 
          settings={settings} 
          onChange={(updates) => usePomodoroStore.getState().updateSettings(updates)} 
        />

        {/* Session history */}
        <SessionHistory sessions={sessions} onClear={clearHistory} />
      </div>
    </Container>
  );
}
