import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { activeStorageAdapter } from "./storageAdapter";
import type { UserProfile } from "../lib/domain/models/user";

interface Workspace {
  id: string;
  name: string;
  icon?: string;
  accentColor?: string;
}

interface UserState {
  profile: UserProfile | null;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearProfile: () => void;
  activeWorkspaceId: string;
  workspaces: Workspace[];
  setActiveWorkspace: (id: string) => void;
  createWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
  reorderWorkspaces: (workspaces: Workspace[]) => void;
}

const DEFAULT_GUEST_PROFILE: UserProfile = {
  id: "guest",
  name: "Guest",
  subtitle: "Built by students",
  avatarColor: "violet",
  isGuest: true,
  university: "My University",
  degree: "B.Tech",
  branch: "Computer Science",
  semester: "Semester 1",
  targetAttendance: 75,
};

const DEFAULT_WORKSPACES: Workspace[] = [
  { id: "default", name: "My Workspace", icon: "📚" },
];

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: DEFAULT_GUEST_PROFILE,
      activeWorkspaceId: "default",
      workspaces: DEFAULT_WORKSPACES,
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      createWorkspace: (workspace) => set((state) => ({
        workspaces: [...state.workspaces, workspace],
      })),
      updateWorkspace: (id, updates) => set((state) => ({
        workspaces: state.workspaces.map((ws) => ws.id === id ? { ...ws, ...updates } : ws)
      })),
      deleteWorkspace: (id) => set((state) => {
        const remaining = state.workspaces.filter((ws) => ws.id !== id);
        // Ensure at least one workspace exists
        if (remaining.length === 0) {
          return state;
        }
        const newActiveId = state.activeWorkspaceId === id ? remaining[0].id : state.activeWorkspaceId;
        return {
          workspaces: remaining,
          activeWorkspaceId: newActiveId
        };
      }),
      reorderWorkspaces: (workspaces) => set({ workspaces }),
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...updates }
            : { ...DEFAULT_GUEST_PROFILE, ...updates },
        })),
      clearProfile: () => set({ profile: null }),
    }),
    {
      name: "studentos-user-storage",
      storage: createJSONStorage(() => activeStorageAdapter),
    }
  )
);
