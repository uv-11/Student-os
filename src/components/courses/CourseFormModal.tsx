import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, User, Star, AlignLeft, Palette } from "lucide-react";
import { Button } from "../ui/Button";
import type { Course, CourseType } from "../../types/course";

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Course, "id" | "createdAt" | "updatedAt">) => void;
  courseToEdit?: Course | null;
}

export function CourseFormModal({ isOpen, onClose, onSave, courseToEdit }: CourseFormModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CourseType>("academic");
  const [emoji, setEmoji] = useState("📚");
  const [color, setColor] = useState("#8b5cf6");
  const [description, setDescription] = useState("");

  const [prevCourse, setPrevCourse] = useState(courseToEdit);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (courseToEdit !== prevCourse || isOpen !== prevIsOpen) {
    setPrevCourse(courseToEdit);
    setPrevIsOpen(isOpen);
    
    if (isOpen) {
      if (courseToEdit) {
        setName(courseToEdit.name);
        setType(courseToEdit.type);
        setEmoji(courseToEdit.emoji || "📚");
        setColor(courseToEdit.color || "#8b5cf6");
        setDescription(courseToEdit.description || "");
      } else {
        setName("");
        setType("academic");
        setEmoji("📚");
        setColor("#8b5cf6");
        setDescription("");
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    onSave({
      name,
      type,
      emoji,
      color,
      description,
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
            <h2 className="text-lg font-semibold">{courseToEdit ? "Edit Course" : "New Course"}</h2>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-muted rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-sm font-medium mb-1">Course Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Data Structures"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Emoji</label>
                <input
                  type="text"
                  maxLength={2}
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1"><Palette className="h-3.5 w-3.5" /> Color</label>
                <div className="flex items-center gap-2 h-[42px]">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-full p-0 border-0 rounded-lg cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Course Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setType("academic")}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-colors ${type === "academic" ? "bg-primary/10 border-primary text-primary" : "border-border hover:bg-muted"}`}
                >
                  <BookOpen className="h-4 w-4 mb-1" />
                  <span className="text-xs">Academic</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType("personal")}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-colors ${type === "personal" ? "bg-primary/10 border-primary text-primary" : "border-border hover:bg-muted"}`}
                >
                  <User className="h-4 w-4 mb-1" />
                  <span className="text-xs">Personal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType("skill")}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-colors ${type === "skill" ? "bg-primary/10 border-primary text-primary" : "border-border hover:bg-muted"}`}
                >
                  <Star className="h-4 w-4 mb-1" />
                  <span className="text-xs">Skill</span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {type === "academic" ? "Academic courses support attendance tracking and exam planning." : "Personal and skill courses do not require attendance tracking."}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1"><AlignLeft className="h-3.5 w-3.5" /> Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {courseToEdit ? "Save Changes" : "Create Course"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
