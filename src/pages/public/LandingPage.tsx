import { Hero } from "../../components/public/Hero";
import { SectionHeader } from "../../components/public/SectionHeader";
import { BentoCard } from "../../components/public/BentoCard";
import { AnimatedSection } from "../../components/public/AnimatedSection";
import { BookOpen, CheckSquare, Coffee, Clock, Shield, Zap, Smartphone, ArrowRight } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { motion } from "framer-motion";
import { Link, Navigate } from "react-router-dom";
import { APP_ROUTES } from "../../config/routes";
import { useState } from "react";
import { markLandingSeen } from "../../utils/firstVisit";

export default function LandingPage() {
  const [hasSeenLanding] = useState(() => {
    try {
      return localStorage.getItem("studentos_has_seen_landing") === "true";
    } catch {
      return false;
    }
  });

  if (hasSeenLanding) {
    return <Navigate to={APP_ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="flex flex-col gap-24 pb-24 relative overflow-x-hidden">
      <Seo />
      
      <Hero />
      
      {/* Problem / Context Section */}
      <section className="container mx-auto px-4 sm:px-6 -mt-10">
        <AnimatedSection direction="up" className="max-w-4xl mx-auto text-center bg-card/60 backdrop-blur-xl border border-border rounded-3xl p-8 md:p-12 shadow-2xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
            The problem with student productivity
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            You track attendance in a messy spreadsheet, write assignments in a notes app, use a generic habit tracker, and run Pomodoros on your phone. <strong className="text-foreground">It's disconnected.</strong> You spend more time managing your system than actually doing the work.
          </p>
        </AnimatedSection>
      </section>

      {/* Core OS Capabilities / Bento Grid */}
      <section className="container mx-auto px-4 sm:px-6 mt-12">
        <AnimatedSection direction="up">
          <SectionHeader 
            title="One workspace for everything."
            description="All your academic data lives in one unified system. When you check your dashboard, you instantly know what needs attention today."
          />
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-6xl mx-auto">
          {/* Large Card spanning 2 columns */}
          <BentoCard 
            title="Intelligent Attendance"
            description="Know your margins. Automatically calculates how many classes you can skip while maintaining your target grade."
            icon={<BookOpen className="w-6 h-6 text-indigo-500" />}
            className="md:col-span-2 min-h-[320px] bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow border-border/50"
            delay={0.1}
          >
            <div className="w-full mt-6 p-5 rounded-2xl border dark:border-border-strong bg-background/90 shadow-sm flex flex-col gap-4 group">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Advanced Calculus</div>
                  <div className="text-3xl font-bold text-foreground tracking-tight">82.5%</div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-bold border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  Safe to skip 2
                </div>
              </div>
              <div className="w-full h-4 rounded-full bg-muted overflow-hidden border border-border">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: "82.5%" }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  viewport={{ once: true }}
                  className="h-full bg-indigo-500 w-[82.5%] rounded-full" 
                />
              </div>
              <div className="flex justify-between text-sm font-medium text-muted-foreground mt-1">
                <span>Target: 75%</span>
                <span>33 / 40 Attended</span>
              </div>
            </div>
          </BentoCard>

          {/* Regular Card */}
          <BentoCard 
            title="Deadlines"
            description="Your assignments and exams, perfectly organized by priority and due date."
            icon={<CheckSquare className="w-6 h-6 text-emerald-500" />}
            className="min-h-[320px] bg-card/80 backdrop-blur-sm border-border/50"
            delay={0.2}
          >
            <div className="w-full mt-6 flex flex-col gap-3">
              <div className="p-4 rounded-xl border dark:border-border-strong bg-background/90 flex items-center justify-between shadow-sm hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-rose-500" />
                  <span className="text-sm font-semibold text-foreground">Calculus Midterm</span>
                </div>
                <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded">Today</span>
              </div>
              <div className="p-4 rounded-xl border dark:border-border-strong bg-background/90 flex items-center justify-between shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-500" />
                  <span className="text-sm font-semibold text-foreground">Physics Lab</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">Tomorrow</span>
              </div>
            </div>
          </BentoCard>

          {/* Regular Card */}
          <BentoCard 
            title="Habits & Streaks"
            description="Build routines that stick. Connect your daily habits directly to your academic goals."
            icon={<Coffee className="w-6 h-6 text-amber-500" />}
            className="min-h-[320px] bg-card/80 backdrop-blur-sm border-border/50"
            delay={0.3}
          >
            <div className="w-full mt-6 p-4 rounded-2xl border dark:border-border-strong bg-background/90 shadow-sm">
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-sm font-bold text-foreground">Read 10 pages</span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">🔥 12 Days</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 14 }).map((_, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    viewport={{ once: true }}
                    key={i} 
                    className={`aspect-square rounded-md border ${i < 12 ? 'bg-amber-500 border-amber-600' : 'bg-muted border-border-strong'}`} 
                  />
                ))}
              </div>
            </div>
          </BentoCard>

          {/* Large Card spanning 2 columns */}
          <BentoCard 
            title="Deep Focus"
            description="Persistent Pomodoro sessions that track your study time and keep you locked in."
            icon={<Clock className="w-6 h-6 text-rose-500" />}
            className="md:col-span-2 min-h-[320px] bg-card/80 backdrop-blur-sm border-border/50"
            delay={0.4}
          >
            <div className="w-full mt-6 flex items-center justify-center p-6 rounded-2xl border dark:border-border-strong bg-background/90 shadow-sm group hover:border-rose-500/30 transition-colors">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="283" strokeDashoffset="70" className="text-rose-500 group-hover:stroke-[8px] transition-all" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold tracking-tighter text-foreground">25:00</span>
                  <span className="text-[11px] uppercase tracking-widest text-rose-500 font-bold mt-1">Focus</span>
                </div>
              </div>
              <div className="ml-12 flex flex-col gap-6 hidden sm:flex">
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Session</div>
                  <div className="text-xl font-bold text-foreground">Deep Work</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Daily Total</div>
                  <div className="text-xl font-bold text-foreground">2h 45m</div>
                </div>
              </div>
            </div>
          </BentoCard>
        </div>
      </section>

      {/* Actual Product Screenshot Section */}
      <section className="container mx-auto px-4 sm:px-6 mt-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">A workspace, not a dashboard</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Thoughtfully organized to show exactly what needs your attention right now. Fast, clean, and a joy to use.
          </p>
        </div>

        <AnimatedSection direction="up" className="max-w-6xl mx-auto rounded-2xl border border-border overflow-hidden shadow-2xl bg-card">
          {/* Window Chrome */}
          <div className="h-10 sm:h-12 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="mx-auto text-xs font-semibold text-muted-foreground tracking-wide px-4 py-1 rounded-md bg-background/50 border border-border">StudentOS Workspace</div>
          </div>
          {/* Abstract App Representation */}
          <div className="w-full bg-background flex">
            {/* Sidebar (Desktop only) */}
            <div className="w-64 border-r border-border p-4 hidden md:flex flex-col gap-6 bg-card/50">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">SO</div>
                <div className="h-4 w-20 bg-foreground/80 rounded" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-9 w-full bg-primary/10 border border-primary/20 rounded-lg flex items-center px-3 gap-3">
                  <div className="w-4 h-4 rounded bg-primary/40" />
                  <div className="h-3 w-16 bg-primary/60 rounded" />
                </div>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-9 w-full rounded-lg flex items-center px-3 gap-3 opacity-60">
                    <div className="w-4 h-4 rounded bg-muted-foreground/30" />
                    <div className="h-3 w-20 bg-muted-foreground/30 rounded" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8 bg-background">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-7 sm:h-9 w-40 sm:w-64 bg-foreground rounded-lg" />
                  <div className="h-4 w-48 sm:w-80 bg-muted-foreground/40 rounded" />
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-muted rounded-full flex-shrink-0" />
              </div>
              
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-3 sm:p-4 shadow-sm flex flex-col justify-between aspect-[4/3] sm:aspect-auto sm:h-28">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-primary/40" />
                    </div>
                    <div>
                      <div className="h-5 sm:h-6 w-12 sm:w-16 bg-foreground rounded mb-1" />
                      <div className="h-3 w-16 sm:w-20 bg-muted-foreground/40 rounded" />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Complex Layout Area */}
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 min-h-[300px]">
                 {/* Main Table/List */}
                 <div className="flex-1 bg-card rounded-xl border border-border shadow-sm flex flex-col">
                   <div className="p-4 border-b border-border flex items-center justify-between">
                     <div className="h-5 w-32 bg-foreground rounded" />
                     <div className="h-8 w-24 bg-muted rounded-md" />
                   </div>
                   <div className="p-4 flex flex-col gap-4">
                     {[...Array(4)].map((_, i) => (
                       <div key={i} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
                           <div className="space-y-2">
                             <div className="h-4 w-32 sm:w-48 bg-foreground rounded" />
                             <div className="h-3 w-20 sm:w-24 bg-muted-foreground/40 rounded" />
                           </div>
                         </div>
                         <div className="h-6 w-16 bg-primary/10 rounded-full" />
                       </div>
                     ))}
                   </div>
                 </div>
                 
                 {/* Right Sidebar (Widgets) */}
                 <div className="w-full lg:w-80 flex flex-col gap-4 sm:gap-6">
                    <div className="bg-card rounded-xl border border-border shadow-sm p-4 h-48 flex flex-col">
                      <div className="h-5 w-24 bg-foreground rounded mb-4" />
                      <div className="flex-1 bg-muted/50 rounded-lg border border-border flex items-center justify-center">
                         <div className="h-24 w-24 rounded-full border-4 border-primary/30" />
                      </div>
                    </div>
                    <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex-1">
                      <div className="h-5 w-32 bg-foreground rounded mb-4" />
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-sm border-2 border-border-strong flex-shrink-0" />
                            <div className="h-4 w-full bg-muted-foreground/40 rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Local First / Privacy Section */}
      <section className="container mx-auto px-4 sm:px-6 mt-24 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-card border border-border rounded-3xl p-8 md:p-12 shadow-lg">
          <AnimatedSection direction="right" className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm">
              <Shield className="w-4 h-4" /> Local-First Architecture
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Your data belongs to you.
            </h2>
            <p className="text-lg text-muted-foreground">
              StudentOS stores everything locally on your device by default using IndexedDB. It works completely offline, loads instantly, and ensures your private academic data stays private.
            </p>
            <ul className="space-y-3 pt-4">
              {[
                { icon: <Zap className="w-5 h-5 text-amber-500" />, text: "Instant load times, zero network lag" },
                { icon: <Shield className="w-5 h-5 text-emerald-500" />, text: "No accounts required to start" },
                { icon: <Smartphone className="w-5 h-5 text-indigo-500" />, text: "Install as a PWA for native experience" },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                  {item.icon}
                  {item.text}
                </li>
              ))}
            </ul>
          </AnimatedSection>
          
          <AnimatedSection direction="left" className="flex justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent blur-3xl -z-10" />
            <div className="w-full max-w-sm rounded-3xl border-2 border-border-strong bg-background p-6 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
               <div className="flex items-center justify-between mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                   <Shield className="w-6 h-6 text-primary" />
                 </div>
                 <div className="text-xs font-bold px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-md">Protected</div>
               </div>
               <div className="space-y-4">
                 <div className="h-4 w-3/4 bg-foreground/20 rounded" />
                 <div className="h-4 w-full bg-muted rounded" />
                 <div className="h-4 w-5/6 bg-muted rounded" />
               </div>
               <div className="mt-8 pt-6 border-t border-border flex justify-between items-center text-sm font-medium">
                 <span className="text-muted-foreground">Data Storage</span>
                 <span className="text-foreground">Local Device</span>
               </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 sm:px-6 mt-12 mb-20 text-center">
        <AnimatedSection direction="up" className="max-w-3xl mx-auto flex flex-col items-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Ready to upgrade your semester?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of students who have already switched to a better academic operating system.
          </p>
          <Link
            to={APP_ROUTES.DASHBOARD}
            onClick={markLandingSeen}
            className="group px-8 py-4 rounded-2xl bg-foreground text-background font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl shadow-foreground/20"
          >
            Open Workspace
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </AnimatedSection>
      </section>
    </div>
  );
}

