import { forwardRef } from "react";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { clsx } from "clsx";

export type CardProps = HTMLMotionProps<"div">;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, whileHover, transition, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileHover={whileHover ?? { y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={transition ?? { duration: 0.2, ease: "easeOut" }}
      className={clsx(
        "rounded-2xl border border-border bg-card text-foreground shadow-sm hover:border-border-strong transition-colors",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";



