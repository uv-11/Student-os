import { PomodoroMode } from "../../types/pomodoroMode";
import { formatTime } from "../../utils/pomodoro";

const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const MODE_LABELS: Record<PomodoroMode, string> = {
  [PomodoroMode.FOCUS]: "Focus",
  [PomodoroMode.BREAK]: "Break",
};

interface TimerRingProps {
  timeRemaining: number;
  sessionTotal: number;
  mode: PomodoroMode;
}

/**
 * TimerRing — circular SVG countdown display.
 * Uses stroke-dashoffset to animate progress. Fully stateless.
 */
export function TimerRing({ timeRemaining, sessionTotal, mode }: TimerRingProps) {
  const progress = sessionTotal > 0 ? timeRemaining / sessionTotal : 1;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="relative flex items-center justify-center select-none w-full max-w-[320px] aspect-square" aria-label={`${MODE_LABELS[mode]} timer: ${formatTime(timeRemaining)} remaining`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 240 240"
        className="-rotate-90 drop-shadow-sm"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx="120"
          cy="120"
          r={RADIUS}
          fill="none"
          className="stroke-muted/30"
          strokeWidth="4"
        />
        {/* Progress arc */}
        <circle
          cx="120"
          cy="120"
          r={RADIUS}
          fill="none"
          className={mode === PomodoroMode.FOCUS ? "stroke-primary" : "stroke-muted-foreground"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span className="text-[clamp(3.5rem,15vw,6rem)] font-bold tabular-nums tracking-tighter text-foreground leading-none">
          {formatTime(timeRemaining)}
        </span>
      </div>
    </div>
  );
}
