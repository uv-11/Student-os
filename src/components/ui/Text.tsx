import type { ReactNode, CSSProperties, ElementType } from "react";
import { clsx } from "clsx";

interface TextProps {
  children: ReactNode;
  variant?: "h1" | "h2" | "h3" | "body" | "muted";
  className?: string;
  style?: CSSProperties;
}

export function Text({ children, variant = "body", className, style }: TextProps) {
  const baseClasses = {
    h1: "text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50",
    h2: "text-lg font-medium tracking-tight text-slate-900 dark:text-slate-50",
    h3: "text-base font-medium tracking-tight text-slate-900 dark:text-slate-50",
    body: "text-sm text-slate-700 dark:text-slate-300",
    muted: "text-sm text-slate-500 dark:text-slate-400",
  };

  const Component = variant.startsWith("h") ? (variant as ElementType) : "p";

  return (
    <Component className={clsx(baseClasses[variant], className)} style={style}>
      {children}
    </Component>
  );
}



