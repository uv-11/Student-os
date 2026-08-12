import { useMemo } from "react";
import { useUserStore } from "../../../store/userStore";

export function useDashboardWorkspace() {
  const { activeWorkspaceId, workspaces, setActiveWorkspace } = useUserStore();

  return useMemo(() => {
    const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
    
    return {
      activeWorkspace,
      workspaces,
      setActiveWorkspace,
    };
  }, [activeWorkspaceId, workspaces, setActiveWorkspace]);
}
