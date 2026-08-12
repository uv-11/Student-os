import { Settings } from "lucide-react";
import { useDashboardWorkspace } from "../hooks/useDashboardWorkspace";
import { DashboardCard } from "../DashboardCard";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";

export function WorkspaceWidget() {
  const { activeWorkspace, workspaces, setActiveWorkspace } = useDashboardWorkspace();

  if (!activeWorkspace) return null;

  return (
    <DashboardCard title="Workspace" className="h-full flex flex-col">
      <div className="p-5 flex-1 flex flex-col justify-center gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl flex items-center justify-center text-3xl shrink-0 border border-border bg-card shadow-sm">
            {activeWorkspace.icon || "📚"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Current</span>
            <span className="text-xl font-bold truncate">{activeWorkspace.name}</span>
          </div>
        </div>

        {workspaces.length > 1 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Switch Workspace</span>
            <div className="flex flex-col gap-1">
              {workspaces.filter(w => w.id !== activeWorkspace.id).slice(0, 2).map(workspace => (
                <button
                  key={workspace.id}
                  onClick={() => setActiveWorkspace(workspace.id)}
                  className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-md transition-colors text-left"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-lg">{workspace.icon || "📚"}</span>
                    <span className="text-sm font-medium truncate">{workspace.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-border bg-card/50">
        <Link to={APP_ROUTES.SETTINGS} className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-full">
          <Settings className="h-4 w-4" /> Manage Workspaces
        </Link>
      </div>
    </DashboardCard>
  );
}
