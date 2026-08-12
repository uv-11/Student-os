import { forwardRef } from "react";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { Text } from "./Text";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

export type EmptyStateProps = HTMLMotionProps<"div"> & {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className, ...props }, ref) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      ref={ref}
      className={clsx(
        "flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-8 text-center shadow-sm",
        className
      )}
      {...props}
    >
      <motion.div 
        animate={{ y: [-3, 3] }}
        transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-foreground ring-1 ring-inset ring-border shadow-sm"
      >
        {icon}
      </motion.div>
      <Text variant="h3" className="mb-2 text-foreground font-semibold tracking-tight text-xl">
        {title}
      </Text>
      <Text variant="muted" className="mb-8 max-w-sm leading-relaxed">
        {description}
      </Text>
      {action && <div>{action}</div>}
    </motion.div>
  )
);
EmptyState.displayName = "EmptyState";



