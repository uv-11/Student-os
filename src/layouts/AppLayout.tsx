import { Header } from "../components/navigation/Header";
import { Sidebar } from "../components/navigation/Sidebar";
import { BottomNav } from "../components/navigation/BottomNav";
import { MainContent } from "./MainContent";
import { PageTransition } from "../components/layout/PageTransition";
import { KeyboardShortcutsModal } from "../components/ui/KeyboardShortcutsModal";
import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../config/routes";

export function AppLayout({ children }: { children: ReactNode }) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const navigate = useNavigate();
  const sequenceRef = useRef<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement;
      if (activeEl && (
        activeEl.tagName === "INPUT" || 
        activeEl.tagName === "TEXTAREA" || 
        activeEl.isContentEditable
      )) {
        return;
      }

      // Toggle shortcuts modal with '?'
      if (e.key === "?") {
        setShowShortcuts(true);
        return;
      }

      // Handle sequences
      const key = e.key.toUpperCase();
      sequenceRef.current.push(key);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        sequenceRef.current = [];
      }, 750);

      const seq = sequenceRef.current.join("");

      if (seq === "GD") {
        navigate(APP_ROUTES.DASHBOARD);
        sequenceRef.current = [];
      } else if (seq === "GA") {
        navigate(APP_ROUTES.ATTENDANCE);
        sequenceRef.current = [];
      } else if (seq === "GP") {
        navigate(APP_ROUTES.POMODORO);
        sequenceRef.current = [];
      }
    };
    
    const handleShowShortcuts = () => setShowShortcuts(true);

    window.addEventListener("keydown", handleGlobalKeyDown);
    document.addEventListener("show-keyboard-shortcuts", handleShowShortcuts);
    
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      document.removeEventListener("show-keyboard-shortcuts", handleShowShortcuts);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [navigate]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background text-muted-foreground selection:bg-primary/20 dark:selection:bg-primary/20">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full relative">
        <Header />
        <MainContent>
          <PageTransition>
            {children}
          </PageTransition>
        </MainContent>
        <BottomNav />
        <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      </div>
    </div>
  );
}
