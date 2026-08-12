import type { ReactNode } from "react";
import { PublicNavbar } from "../components/public/PublicNavbar";
import { PublicFooter } from "../components/public/PublicFooter";
import { PageTransition } from "../components/layout/PageTransition";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-muted-foreground selection:bg-primary/20 dark:selection:bg-primary/20 font-sans">
      <PublicNavbar />
      <main className="flex-1 flex flex-col">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <PublicFooter />
    </div>
  );
}
