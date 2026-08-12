import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { ChevronDown, Check, Plus, Settings2, GripVertical } from "lucide-react";
import { useUserStore } from "../../store/userStore";
import { clsx } from "clsx";
import { WorkspaceManagerModal } from "./WorkspaceManagerModal";

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspaceId, setActiveWorkspace, reorderWorkspaces } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEditWorkspace = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingWorkspaceId(id);
    setIsModalOpen(true);
    setIsOpen(false);
  };

  const handleCreateWorkspace = () => {
    setEditingWorkspaceId(null);
    setIsModalOpen(true);
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative px-3 py-2" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 group active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div 
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs text-white"
              style={{ backgroundColor: activeWorkspace.accentColor ? `var(--color-${activeWorkspace.accentColor}-500, #8b5cf6)` : '#8b5cf6' }}
            >
              {activeWorkspace.icon || activeWorkspace.name.charAt(0)}
            </div>
            <span className="text-sm font-semibold text-foreground truncate">
              {activeWorkspace.name}
            </span>
          </div>
          <ChevronDown 
            className={clsx(
              "h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:text-foreground",
              isOpen && "rotate-180"
            )} 
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute left-3 right-3 top-full mt-1 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden z-50 origin-top"
            >
              <div className="p-1">
                <Reorder.Group axis="y" values={workspaces} onReorder={reorderWorkspaces} className="m-0 p-0 flex flex-col gap-0.5">
                  <AnimatePresence initial={false}>
                    {workspaces.map((ws) => (
                      <Reorder.Item 
                        key={ws.id} 
                        value={ws} 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="group/item flex items-center relative"
                      >
                        <div className="absolute left-1 opacity-0 group-hover/item:opacity-30 cursor-grab active:cursor-grabbing text-muted-foreground transition-opacity flex items-center h-full">
                          <GripVertical className="h-3 w-3" />
                        </div>
                        <button
                          onClick={() => {
                            setActiveWorkspace(ws.id);
                            setIsOpen(false);
                          }}
                          className="flex-1 flex items-center justify-between p-2 pl-5 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="opacity-70">{ws.icon || ws.name.charAt(0)}</span>
                            <span className="truncate max-w-[120px]">{ws.name}</span>
                          </div>
                          {ws.id === activeWorkspaceId && <Check className="h-4 w-4 text-primary shrink-0" />}
                        </button>
                        <button
                          onClick={(e) => handleEditWorkspace(ws.id, e)}
                          className="p-2 opacity-0 group-hover/item:opacity-100 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-all active:scale-[0.98] shrink-0"
                        >
                          <Settings2 className="h-4 w-4" />
                        </button>
                      </Reorder.Item>
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
                
                <div className="h-px bg-border/50 my-1 mx-1" />
                
                <button
                  className="flex items-center gap-2 w-full p-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors active:scale-[0.98]"
                  onClick={handleCreateWorkspace}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Workspace</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <WorkspaceManagerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        workspaceIdToEdit={editingWorkspaceId} 
      />
    </>
  );
}
