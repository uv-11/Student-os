import { useEffect, useRef, useCallback } from "react";
import { PomodoroMode } from "../types/pomodoroMode";
import type { PomodoroSettings } from "../types/pomodoroSettings";
import { playCompletionTone } from "../utils/pomodoro";
import { usePomodoroStore } from "../store/pomodoroStore";

interface UsePomodoroReturn {
  timeRemaining: number;
  sessionTotal: number;
  isRunning: boolean;
  mode: PomodoroMode;
  start: () => void;
  pause: () => void;
  reset: () => void;
  changeMode: (mode: PomodoroMode) => void;
}

function calcTotal(mode: PomodoroMode, settings: PomodoroSettings): number {
  return mode === PomodoroMode.FOCUS
    ? settings.focusMinutes * 60
    : settings.breakMinutes * 60;
}

/**
 * usePomodoro — custom hook encapsulating all timer logic.
 *
 * Timer state is persisted to the store to survive navigation.
 */
export function usePomodoro(
  settings: PomodoroSettings,
  onSessionComplete: (mode: PomodoroMode, durationMinutes: number) => void
): UsePomodoroReturn {
  const { activeTimer, setActiveTimer, updateActiveTimer } = usePomodoroStore();

  const mode = activeTimer?.mode ?? PomodoroMode.FOCUS;
  const isRunning = activeTimer?.isRunning ?? false;
  const sessionTotal = activeTimer?.sessionTotal ?? calcTotal(PomodoroMode.FOCUS, settings);
  const timeRemaining = activeTimer?.timeRemaining ?? calcTotal(PomodoroMode.FOCUS, settings);
  const targetEndTime = activeTimer?.targetEndTime ?? null;

  // Stable refs — avoid stale closures inside effects
  const settingsRef = useRef(settings);
  const modeRef = useRef(mode);
  const sessionTotalRef = useRef(sessionTotal);
  const onCompleteRef = useRef(onSessionComplete);
  
  useEffect(() => {
    settingsRef.current = settings;
    modeRef.current = mode;
    sessionTotalRef.current = sessionTotal;
    onCompleteRef.current = onSessionComplete;
  }, [settings, mode, sessionTotal, onSessionComplete]);

  // Transition to a new mode, optionally auto-starting
  const switchMode = useCallback((nextMode: PomodoroMode, autoStart: boolean = false) => {
    const total = calcTotal(nextMode, settingsRef.current);
    setActiveTimer({
      mode: nextMode,
      sessionTotal: total,
      timeRemaining: total,
      isRunning: autoStart,
      targetEndTime: autoStart ? Date.now() + total * 1000 : null,
    });
  }, [setActiveTimer]);

  const initializedRef = useRef(false);
  // Handle initialization and catch up time if navigating away while running
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    if (!activeTimer) {
      const total = calcTotal(PomodoroMode.FOCUS, settingsRef.current);
      setActiveTimer({
        mode: PomodoroMode.FOCUS,
        isRunning: false,
        sessionTotal: total,
        timeRemaining: total,
        targetEndTime: null,
      });
    } else if (activeTimer.isRunning && activeTimer.targetEndTime) {
      const now = Date.now();
      const newRemaining = Math.max(0, Math.ceil((activeTimer.targetEndTime - now) / 1000));
      if (newRemaining !== activeTimer.timeRemaining) {
        updateActiveTimer({ timeRemaining: newRemaining });
      }
    }
  }, [activeTimer, setActiveTimer, updateActiveTimer]);

  // 1-second interval tick
  useEffect(() => {
    if (!isRunning || !targetEndTime) return;
    const id = setInterval(() => {
      const now = Date.now();
      const nextRemaining = Math.max(0, Math.ceil((targetEndTime - now) / 1000));
      updateActiveTimer({ timeRemaining: nextRemaining });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, targetEndTime, updateActiveTimer]);

  // Completion: fires when timeRemaining hits 0 while running
  useEffect(() => {
    if (timeRemaining !== 0 || !isRunning) return;
    
    setTimeout(() => {
      updateActiveTimer({ isRunning: false, targetEndTime: null });

      const s = settingsRef.current;
      const m = modeRef.current;

      if (s.soundEnabled) playCompletionTone();

      if (m === PomodoroMode.FOCUS) {
        onCompleteRef.current(PomodoroMode.FOCUS, sessionTotalRef.current / 60);
        switchMode(PomodoroMode.BREAK, s.autoStartBreak);
      } else {
        // Break ended — reset to focus, do not auto-start
        switchMode(PomodoroMode.FOCUS, false);
      }
    }, 0);
  }, [timeRemaining, isRunning, switchMode, updateActiveTimer]);

  // Resync timer when settings change while not running
  const prevFocusRef = useRef(settings.focusMinutes);
  const prevBreakRef = useRef(settings.breakMinutes);
  useEffect(() => {
    const focusChanged = prevFocusRef.current !== settings.focusMinutes;
    const breakChanged = prevBreakRef.current !== settings.breakMinutes;
    prevFocusRef.current = settings.focusMinutes;
    prevBreakRef.current = settings.breakMinutes;

    if (!isRunning && (focusChanged || breakChanged)) {
      const total = calcTotal(modeRef.current, settings);
      updateActiveTimer({
        sessionTotal: total,
        timeRemaining: total,
      });
    }
  }, [settings.focusMinutes, settings.breakMinutes, isRunning, updateActiveTimer, settings]);

  const start = useCallback(() => {
    updateActiveTimer({ 
      isRunning: true, 
      targetEndTime: Date.now() + (activeTimer?.timeRemaining || calcTotal(modeRef.current, settingsRef.current)) * 1000 
    });
  }, [updateActiveTimer, activeTimer?.timeRemaining]);

  const pause = useCallback(() => {
    updateActiveTimer({ 
      isRunning: false,
      targetEndTime: null
    });
  }, [updateActiveTimer]);

  const reset = useCallback(() => {
    const total = calcTotal(modeRef.current, settingsRef.current);
    updateActiveTimer({
      isRunning: false,
      targetEndTime: null,
      sessionTotal: total,
      timeRemaining: total
    });
  }, [updateActiveTimer]);

  const changeMode = useCallback(
    (nextMode: PomodoroMode) => {
      switchMode(nextMode);
    },
    [switchMode]
  );

  return { timeRemaining, sessionTotal, isRunning, mode, start, pause, reset, changeMode };
}
