import { useEffect, useState, useRef } from "react";
import { useAppStore } from "../../store/appStore";

export function BackgroundVideo() {
  const theme = useAppStore((state) => state.settings.theme);
  
  const [shouldPlay, setShouldPlay] = useState(() => {
    if (typeof window === "undefined") return true;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });

  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  
  const isDark = theme === "dark" || (theme === "system" && systemIsDark);

  const lightVideoRef = useRef<HTMLVideoElement>(null);
  const darkVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 768px)");

    const handleMotionChange = (e: MediaQueryListEvent) => setShouldPlay(!e.matches);
    const handleMobileChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    motionQuery.addEventListener("change", handleMotionChange);
    mobileQuery.addEventListener("change", handleMobileChange);
    
    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      mobileQuery.removeEventListener("change", handleMobileChange);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    
    mq.addEventListener("change", handleSystemThemeChange);
    return () => mq.removeEventListener("change", handleSystemThemeChange);
  }, []);

  // Handle playing/pausing logic to prevent unnecessary duplicate playback
  useEffect(() => {
    if (!shouldPlay) return;

    if (isDark) {
      darkVideoRef.current?.play().catch(() => {});
      // Pause light video after transition finishes
      const timeout = setTimeout(() => {
        lightVideoRef.current?.pause();
      }, 1000);
      return () => clearTimeout(timeout);
    } else {
      lightVideoRef.current?.play().catch(() => {});
      // Pause dark video after transition finishes
      const timeout = setTimeout(() => {
        darkVideoRef.current?.pause();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isDark, shouldPlay]);

  if (!shouldPlay) {
    return (
      <div className="fixed inset-0 z-[-10] w-full h-full bg-background transition-colors duration-700" />
    );
  }

  // On mobile, we might want to apply a stronger blur or lower opacity to save battery and reduce distraction
  const videoOpacity = isMobile ? "opacity-20" : "opacity-30";

  return (
    <div className="fixed inset-0 z-[-10] w-full h-full overflow-hidden bg-background pointer-events-none">
      <video
        ref={lightVideoRef}
        src={`${import.meta.env.BASE_URL}bg/light.mp4`}
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          !isDark ? videoOpacity : "opacity-0"
        }`}
      />
      <video
        ref={darkVideoRef}
        src={`${import.meta.env.BASE_URL}bg/dark.mp4`}
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isDark ? videoOpacity : "opacity-0"
        }`}
      />
      {/* Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
    </div>
  );
}
