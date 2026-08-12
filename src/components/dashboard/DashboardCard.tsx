import type { HTMLAttributes } from "react";
import { forwardRef } from "react";
import { clsx } from "clsx";

interface DashboardCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  className?: string;
}

/**
 * DashboardCard — semantic wrapper for all dashboard sections.
 * Thin layer on top of the base Card so dashboard cards can be
 * visually distinguished without duplicating Card logic.
 */
export const DashboardCard = forwardRef<HTMLDivElement, DashboardCardProps>(
  ({ title, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        "rounded-xl border border-border bg-card shadow-sm",
        className
      )}
      {...props}
    >
      {title && (
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  )
);
DashboardCard.displayName = "DashboardCard";
