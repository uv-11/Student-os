import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, BookOpen, Tag as TagIcon, AlignLeft } from "lucide-react";
import { Button } from "../ui/Button";
import type { StudySession } from "../../types/study";
import { useCourseStore } from "../../store/courseStore";
import { format } from "date-fns";

interface StudySessionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<StudySession, "id" | "createdAt" | "updatedAt">) => void;
  sessionToEdit?: StudySession | null;
}

export function StudySessionFormModal({ isOpen, onClose, onSave, sessionToEdit }: StudySessionFormModalProps) {
  const { courses } = useCourseStore();
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courseNameFallback, setCourseNameFallback] = useState("");
  const [duration, setDuration] = useState("60");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");

  const [prevSession, setPrevSession] = useState(sessionToEdit);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (sessionToEdit !== prevSession || isOpen !== prevIsOpen) {
    setPrevSession(sessionToEdit);
    setPrevIsOpen(isOpen);
    
    if (isOpen) {
      if (sessionToEdit) {
        setTitle(sessionToEdit.title);
        setCourseId(sessionToEdit.courseId || "");
        setCourseNameFallback(sessionToEdit.course || "");
        setDuration(sessionToEdit.durationMinutes.toString());
        setDate(format(sessionToEdit.date, "yyyy-MM-dd"));
        setTags(sessionToEdit.tags.join(", "));
        setNotes(sessionToEdit.notes || "");
      } else {
        setTitle("");
        setCourseId("");
        setCourseNameFallback("");
        setDuration("60");
        setDate(format(new Date(), "yyyy-MM-dd"));
        setTags("");
        setNotes("");
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!courseId && !courseNameFallback) || !duration || !date) return;

    const selectedCourse = courses.find(c => c.id === courseId);

    onSave({
      title,
      courseId: courseId || undefined,
      course: selectedCourse ? selectedCourse.name : courseNameFallback, // Legacy string fallback
      durationMinutes: parseInt(duration, 10),
      date: new Date(date).getTime(),
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      notes,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card w-full max-w-md max-h-[90dvh] flex flex-col rounded-2xl shadow-xl border border-border overflow-hidden"
        >
          <div className="flex shrink-0 items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">{sessionToEdit ? "Edit Session" : "Log Study Session"}</h2>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-muted rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-sm font-medium mb-1">Session Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Graph Algorithms"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> Course</label>
                {courses.length > 0 ? (
                  <select
                    required={!courseNameFallback}
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="" disabled>Select Course</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={courseNameFallback}
                    onChange={(e) => setCourseNameFallback(e.target.value)}
                    placeholder="e.g. CS 101"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                )}
                {courses.length > 0 && courseNameFallback && !courseId && (
                  <div className="text-xs text-muted-foreground mt-1">Legacy: {courseNameFallback}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Duration (min)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1"><TagIcon className="h-3.5 w-3.5" /> Tags (comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. revision, homework"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1"><AlignLeft className="h-3.5 w-3.5" /> Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you learn?"
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {sessionToEdit ? "Save Changes" : "Log Session"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
