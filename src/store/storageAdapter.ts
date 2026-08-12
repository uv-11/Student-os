import { get, set, del } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";

/**
 * Common interface for all storage adapters.
 * Aligns with Zustand's StateStorage requirements.
 */
export interface StorageAdapter extends StateStorage {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => void | Promise<void>;
  removeItem: (name: string) => void | Promise<void>;
}

/**
 * LocalStorage Adapter (Current Source of Truth)
 * Synchronous, blocking, 5MB limit. Used for Phase 1.
 */
const localStorageAdapter: StorageAdapter = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
};

/**
 * IndexedDB Adapter via idb-keyval
 * Asynchronous, non-blocking, huge capacity.
 * Prepares the infrastructure for the Phase 2 migration.
 */
export const indexedDBAdapter: StorageAdapter = {
  getItem: async (name) => {
    return (await get(name)) || null;
  },
  setItem: async (name, value) => {
    await set(name, value);
  },
  removeItem: async (name) => {
    await del(name);
  },
};

/**
 * Current Active Storage Adapter
 * Maintained as LocalStorage for Phase 1 compatibility.
 * We will switch this to migrationAdapter when ready.
 */
export const activeStorageAdapter: StorageAdapter = localStorageAdapter;
