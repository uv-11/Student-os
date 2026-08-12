import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { useUserStore } from "../../store/userStore";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceIdToEdit?: string | null;
}

export function WorkspaceManagerModal({ isOpen, onClose, workspaceIdToEdit }: Props) {
  const { workspaces, createWorkspace, updateWorkspace, deleteWorkspace, setActiveWorkspace } = useUserStore();
  
  const editingWorkspace = workspaceIdToEdit ? workspaces.find(w => w.id === workspaceIdToEdit) : null;
  const isEditing = !!editingWorkspace;
  
  const [name, setName] = useState(editingWorkspace?.name || "");
  const [icon, setIcon] = useState(editingWorkspace?.icon || "📚");
  const [accentColor, setAccentColor] = useState(editingWorkspace?.accentColor || "violet");

  // Reset state when modal opens
  useState(() => {
    if (isOpen) {
      setName(editingWorkspace?.name || "");
      setIcon(editingWorkspace?.icon || "📚");
      setAccentColor(editingWorkspace?.accentColor || "violet");
    }
  });

  const handleSave = () => {
    if (!name.trim()) return;

    if (isEditing && editingWorkspace) {
      updateWorkspace(editingWorkspace.id, { name, icon, accentColor });
    } else {
      const newId = `ws-${Date.now()}`;
      createWorkspace({ id: newId, name, icon, accentColor });
      setActiveWorkspace(newId);
    }
    onClose();
  };

  const handleDelete = () => {
    if (isEditing && editingWorkspace) {
      deleteWorkspace(editingWorkspace.id);
      onClose();
    }
  };

  const commonIcons = ["📚", "🤖", "🏠", "💻", "🚀", "🎓", "🔬", "🎨"];
  const themeColors = ["violet", "emerald", "rose", "amber", "blue", "cyan", "indigo", "slate"];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed left-[50%] top-[50%] z-50 w-full max-w-md max-h-[90dvh] flex flex-col translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border bg-card shadow-xl"
          >
            <div className="flex shrink-0 items-center justify-between p-6 pb-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">
                {isEditing ? "Edit Workspace" : "Create Workspace"}
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-6 overflow-y-auto flex-1">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Workspace Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fall Semester 2026"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {commonIcons.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setIcon(emoji)}
                      className={`h-10 w-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                        icon === emoji 
                          ? "bg-primary/20 border-2 border-primary scale-105" 
                          : "bg-muted/50 border-2 border-transparent hover:bg-muted active:scale-[0.98]"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                  <Input
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-16 h-10 text-center px-1"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Accent Color</label>
                <div className="flex gap-2 flex-wrap">
                  {themeColors.map((color) => {
                    const colorMap: Record<string, string> = {
                      violet: "bg-violet-500/20 text-violet-500",
                      emerald: "bg-emerald-500/20 text-emerald-500",
                      rose: "bg-rose-500/20 text-rose-500",
                      amber: "bg-amber-500/20 text-amber-500",
                      blue: "bg-blue-500/20 text-blue-500",
                      cyan: "bg-cyan-500/20 text-cyan-500",
                      indigo: "bg-indigo-500/20 text-indigo-500",
                      slate: "bg-slate-500/20 text-slate-500",
                    };
                    return (
                      <button
                        key={color}
                        onClick={() => setAccentColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all active:scale-[0.98] ${
                          accentColor === color 
                            ? "border-foreground scale-110 shadow-sm" 
                            : "border-transparent hover:scale-105"
                        } ${colorMap[color]}`}
                        aria-label={`Select ${color} color`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-6 border-t border-border">
                {isEditing && workspaces.length > 1 ? (
                  <Button variant="outline" className="text-red-500 border-red-500/20 hover:bg-red-500/10 active:scale-[0.98]" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                ) : (
                  <div /> // Placeholder to push Save to the right
                )}
                
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={onClose} className="active:scale-[0.98]">Cancel</Button>
                  <Button onClick={handleSave} disabled={!name.trim()} className="active:scale-[0.98]">
                    {isEditing ? "Save Changes" : "Create"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
