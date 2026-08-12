import { motion } from "framer-motion";
import { Clock, BookOpen, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { StudySession } from "../../types/study";
import { useState } from "react";

interface StudySessionCardProps {
  session: StudySession;
  onEdit: (session: StudySession) => void;
  onDelete: (id: string) => void;
}

export function StudySessionCard({ session, onEdit, onDelete }: StudySessionCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-4 border rounded-xl bg-card border-border/50 shadow-sm relative group"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg text-foreground tracking-tight">{session.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{session.course}</span>
            <span className="mx-1">•</span>
            <span>{format(session.date, "MMM d, yyyy")}</span>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 w-36 bg-card border border-border shadow-lg rounded-lg py-1 z-10">
              <button
                onClick={() => { setShowMenu(false); onEdit(session); }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" /> Edit
              </button>
              <button
                onClick={() => { setShowMenu(false); onDelete(session.id); }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-muted text-rose-500 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {session.notes && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {session.notes}
        </p>
      )}

      <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md">
            <Clock className="h-3.5 w-3.5" />
            {session.durationMinutes} min
          </div>
          {session.tags && session.tags.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[120px]">
              {session.tags.slice(0, 2).map((tag, i) => (
                <span key={i} className="text-[10px] bg-muted/50 border border-border text-muted-foreground font-semibold px-1.5 py-0.5 rounded whitespace-nowrap">
                  {tag}
                </span>
              ))}
              {session.tags.length > 2 && (
                <span className="text-[10px] text-muted-foreground">+{session.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invisible backdrop for menu */}
      {showMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)} />
      )}
    </motion.div>
  );
}
