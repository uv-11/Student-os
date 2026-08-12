import { Link, useLocation } from "react-router-dom";
import { Logo } from "../ui/Logo";
import { PUBLIC_ROUTES, APP_ROUTES } from "../../config/routes";
import { motion } from "framer-motion";

const navLinks = [
  { name: "Features", href: PUBLIC_ROUTES.FEATURES },
  { name: "Roadmap", href: PUBLIC_ROUTES.ROADMAP },
  { name: "Changelog", href: PUBLIC_ROUTES.CHANGELOG },
];

export function PublicNavbar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to={PUBLIC_ROUTES.HOME} className="hover:opacity-80 transition-opacity">
            <Logo />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-foreground relative py-1 ${
                  location.pathname === link.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {link.name}
                {location.pathname === link.href && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to={APP_ROUTES.DASHBOARD}
            className="text-sm font-medium px-4 py-2 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform active:scale-95 shadow-sm"
          >
            Open Workspace
          </Link>
        </div>
      </div>
    </header>
  );
}
