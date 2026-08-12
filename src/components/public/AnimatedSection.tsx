import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export function AnimatedSection({ 
  children, 
  className, 
  delay = 0,
  direction = "up"
}: AnimatedSectionProps) {
  const directionOffset = {
    up: { y: 20, x: 0 },
    down: { y: -20, x: 0 },
    left: { x: 20, y: 0 },
    right: { x: -20, y: 0 },
    none: { x: 0, y: 0 }
  };

  const initial = {
    opacity: 0,
    ...directionOffset[direction]
  };

  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.6, 
        delay, 
        ease: [0.21, 0.47, 0.32, 0.98] 
      }}
      className={clsx("w-full", className)}
    >
      {children}
    </motion.div>
  );
}
