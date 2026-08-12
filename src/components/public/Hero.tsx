import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { APP_ROUTES, PUBLIC_ROUTES } from "../../config/routes";
import { AnimatedSection } from "./AnimatedSection";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
      <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center flex flex-col items-center">
        <AnimatedSection direction="up" className="max-w-5xl mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/80 backdrop-blur-md text-sm font-medium text-foreground mb-10 ring-1 ring-inset ring-border shadow-sm hover:bg-muted transition-colors cursor-default"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="opacity-90">StudentOS is now an Academic Operating System</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl md:text-[5.5rem] font-bold tracking-tight text-foreground mb-6 md:mb-8 leading-[1.1] max-w-4xl"
          >
            Your academic life, <br className="hidden sm:block" />
            <span className="text-muted-foreground font-serif italic pr-2 font-normal">finally</span> connected.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed px-2"
          >
            Stop managing your semester across ten disconnected apps. Attendance, deadlines, calendar, habits, and focus—all in one local-first workspace.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <Link
              to={APP_ROUTES.DASHBOARD}
              className="group w-full sm:w-auto px-8 py-4 rounded-2xl bg-foreground text-background font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl shadow-foreground/10"
            >
              Enter Workspace
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to={PUBLIC_ROUTES.FEATURES}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-muted/80 backdrop-blur-sm text-foreground font-semibold hover:bg-muted transition-colors flex items-center justify-center border border-border"
            >
              See how it works
            </Link>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}

