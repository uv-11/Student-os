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
  getItem: (name) => (typeof localStorage !== "undefined" ? localStorage.getItem(name) : null),
  setItem: (name, value) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(name, value);
    }
  },
  removeItem: (name) => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(name);
    }
  },
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
 * Safe Migration Adapter (Phase 1)
 * Idempotent, lazy, non-destructive migration from localStorage to IndexedDB.
 */
export const activeStorageAdapter: StorageAdapter = {
  getItem: async (name) => {
    try {
      // 1. Try to read from IndexedDB first (authoritative source post-migration)
      let idbValue = await indexedDBAdapter.getItem(name);
      
      // 2. Read from LocalStorage (legacy source)
      const lsValue = await localStorageAdapter.getItem(name);

      // 3. Migration required if data exists in LS but not in IDB
      if (lsValue && !idbValue) {
        try {
          await indexedDBAdapter.setItem(name, lsValue);
          
          // Verify integrity
          const verifiedValue = await indexedDBAdapter.getItem(name);
          if (verifiedValue === lsValue) {
            console.log(`[Storage] Successfully migrated ${name} to IndexedDB`);
            idbValue = verifiedValue;
            // NOTE: We intentionally DO NOT delete from localStorage immediately.
            // Preserving original data as a recovery fallback until completely stable.
          } else {
            console.error(`[Storage] Verification failed for ${name} during migration.`);
            return lsValue; // Safe fallback
          }
        } catch (e) {
          console.error(`[Storage] Migration failed for ${name}`, e);
          return lsValue; // Safe fallback, do not destroy data
        }
      }

      return idbValue || lsValue;
    } catch (e) {
      console.error(`[Storage] Error reading from storage for ${name}`, e);
      return await localStorageAdapter.getItem(name); // Last resort fallback
    }
  },
  setItem: async (name, value) => {
    // Write new data exclusively to IndexedDB
    await indexedDBAdapter.setItem(name, value);
  },
  removeItem: async (name) => {
    await indexedDBAdapter.removeItem(name);
    // Best effort cleanup in LS just in case
    await localStorageAdapter.removeItem(name);
  }
};
