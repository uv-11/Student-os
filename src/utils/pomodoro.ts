import type { PomodoroSession } from "../types/pomodoroSession";
import { PomodoroMode } from "../types/pomodoroMode";

/** Formats seconds into MM:SS display string. */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Filters sessions completed today (local calendar day). */
function getTodaySessions(sessions: PomodoroSession[]): PomodoroSession[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return sessions.filter((s) => s.completedAt >= todayStart);
}

/** Total focus minutes for today's sessions. */
export function getTodayFocusMinutes(sessions: PomodoroSession[]): number {
  return getTodaySessions(sessions)
    .filter((s) => s.mode === PomodoroMode.FOCUS)
    .reduce((acc, s) => acc + s.durationMinutes, 0);
}

/** Count of completed focus sessions today. */
export function getTodayFocusCount(sessions: PomodoroSession[]): number {
  return getTodaySessions(sessions).filter((s) => s.mode === PomodoroMode.FOCUS).length;
}

/** Formats a Unix timestamp as a human-readable time string. */
export function formatCompletedAt(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Plays a soft two-note completion tone via Web Audio API. No libraries required. */
export function playCompletionTone(): void {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.65);
  } catch {
    // Silently fail if AudioContext is blocked by the browser.
  }
}
