import { useState } from "react";
import { Container } from "../../components/ui/Container";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Plus, BookOpen, Search, RotateCcw } from "lucide-react";
import { useStudyStore } from "../../store/studyStore";
import { StudySessionCard } from "../../components/study/StudySessionCard";
import { StudySessionFormModal } from "../../components/study/StudySessionFormModal";
import { EmptyStateStory } from "../../components/analytics/EmptyStateStory";
import { AnimatePresence } from "framer-motion";
import type { StudySession } from "../../types/study";

export default function StudyPage() {
  const { sessions, activeSession, startActiveSession, stopActiveSession, cancelActiveSession, addSession, updateSession, deleteSession, lastDeletedSession, undoDelete } = useStudyStore();
  const [isModalOpen, setIsModalOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("action") === "add";
  });
  const [sessionToEdit, setSessionToEdit] = useState<StudySession | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = sessions
    .filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => b.date - a.date);

  const handleEdit = (session: StudySession) => {
    setSessionToEdit(session);
    setIsModalOpen(true);
  };

  const handleSave = (data: Omit<StudySession, "id" | "createdAt" | "updatedAt">) => {
    if (sessionToEdit) {
      updateSession(sessionToEdit.id, data);
    } else {
      addSession(data);
    }
  };

  const openNewModal = () => {
    setSessionToEdit(null);
    setIsModalOpen(true);
  };

  return (
    <Container>
      <PageHeader 
        title="Study Sessions" 
        description="Track your learning and revision." 
        actions={
          <div className="flex items-center gap-2">
            {lastDeletedSession && (
              <Button variant="secondary" onClick={undoDelete} className="px-3" title="Undo Delete">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={openNewModal}>
              <Plus className="h-4 w-4 mr-2" />
              Log Session
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-8 pb-24 md:pb-12">
        {/* ACTIVE SESSION OR QUICK START */}
        {activeSession ? (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Studying {activeSession.course}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Session in progress
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Button onClick={() => stopActiveSession()} className="flex-1 sm:flex-none">
                Stop & Save
              </Button>
              <Button variant="ghost" onClick={cancelActiveSession} className="text-muted-foreground hover:text-destructive">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-base font-bold text-foreground mb-4">Start Study Session</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input 
                type="text" 
                placeholder="Course or Subject (e.g. CS101, Math)" 
                className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    startActiveSession(e.currentTarget.value.trim());
                    e.currentTarget.value = "";
                  }
                }}
                id="quick-start-course"
              />
              <Button 
                onClick={() => {
                  const input = document.getElementById('quick-start-course') as HTMLInputElement;
                  if (input.value.trim()) {
                    startActiveSession(input.value.trim());
                    input.value = "";
                  }
                }} 
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" /> Start
              </Button>
            </div>
          </div>
        )}

        {/* SEARCH & RECENT SESSIONS */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Recent Sessions</h2>
            <div className="relative w-full max-w-[200px] sm:max-w-xs hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
              />
            </div>
          </div>

          <div className="sm:hidden relative w-full mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {sessions.length === 0 ? (
            <EmptyStateStory 
              title="Your story starts here." 
              description="Log your first study session to start building your academic history."
              icon={<BookOpen className="h-6 w-6" />}
            />
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
              No sessions found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredSessions.map((session) => (
                  <StudySessionCard 
                    key={session.id} 
                    session={session} 
                    onEdit={handleEdit} 
                    onDelete={deleteSession} 
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <StudySessionFormModal
        isOpen={isModalOpen}
        onClose={() => {
          if (isModalOpen) {
            const url = new URL(window.location.href);
            url.searchParams.delete("action");
            window.history.replaceState({}, "", url);
          }
          setIsModalOpen(false);
        }}
        onSave={handleSave}
        sessionToEdit={sessionToEdit}
      />
    </Container>
  );
}
