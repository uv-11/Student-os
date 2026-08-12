import { useState } from "react";
import { Menu, Search } from "lucide-react";
import { Logo } from "../ui/Logo";
import { MobileDrawer } from "./MobileDrawer";
import { CommandPalette } from "../ui/CommandPalette";
import { UserProfileDropdown } from "../user/UserProfileDropdown";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { useAppStore } from "../../store/appStore";

export function Header() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className="h-14 border-b border-border bg-surface-header px-4 flex items-center justify-between shrink-0 md:h-16 md:px-8">
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] -ml-2 text-muted-foreground hover:text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-colors"
            aria-label="Open Menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Logo />
        </div>
        <div className="hidden md:flex">
          <Logo />
        </div>
        <div className="ml-auto flex items-center gap-4">
          <button
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background text-muted-foreground text-sm hover:bg-accent hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 hover:scale-[1.02] focus:scale-[1.02] active:scale-[0.98] transition-all duration-200 group"
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
              document.dispatchEvent(event);
            }}
            aria-label="Search Command Palette"
          >
            <Search className="h-4 w-4 group-hover:text-primary transition-colors" />
            <span className="group-hover:text-foreground transition-colors">Search...</span>
            <kbd className="hidden md:inline-flex items-center gap-1 font-sans text-xs border border-border rounded px-1.5 ml-2 bg-muted group-hover:border-primary/30 transition-colors">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </button>
          
          <button
            className="sm:hidden flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
              document.dispatchEvent(event);
            }}
          >
            <Search className="h-5 w-5" />
          </button>

          <NotificationsDropdown />

          {/* Theme Toggle - Desktop Only */}
          <div className="hidden md:block">
            <button
              onClick={() => {
                const isDark = document.documentElement.classList.contains('dark');
                useAppStore.getState().updateSettings({ theme: isDark ? 'light' : 'dark' });
              }}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sun dark:hidden"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-moon hidden dark:block"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            </button>
          </div>

          {/* User Profile Dropdown - Mobile Only */}
          <div className="md:hidden">
            <UserProfileDropdown variant="header" />
          </div>
        </div>
      </header>
      
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <CommandPalette />
    </>
  );
}


