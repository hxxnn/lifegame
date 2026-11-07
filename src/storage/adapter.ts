import { backupRaw } from './backup';
import { migrate } from './migrate';
import type { PlayerState } from '../domain/types';

export const STORAGE_KEY = 'lifegame:v1';

export interface StorageAdapter {
  load(): { state: PlayerState | null; recovered: boolean };
  save(state: PlayerState): boolean;
}

export function createMemoryAdapter(): StorageAdapter {
  let mem: PlayerState | null = null;
  return {
    load: () => ({ state: mem, recovered: false }),
    save: (s) => {
      mem = s;
      return true;
    },
  };
}

function defaultStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

/** localStorage-backed adapter. Any storage failure degrades to an in-memory copy and save() returns false. */
export function createLocalAdapter(storage: Storage | undefined = defaultStorage()): StorageAdapter {
  const memory = createMemoryAdapter();
  if (!storage) {
    return { load: memory.load, save: (s) => (memory.save(s), false) };
  }
  return {
    load() {
      let raw: string | null;
      try {
        raw = storage.getItem(STORAGE_KEY);
      } catch {
        return memory.load();
      }
      if (raw === null) return memory.load();
      let state: PlayerState | null = null;
      try {
        state = migrate(JSON.parse(raw));
      } catch {
        state = null;
      }
      if (!state) {
        backupRaw(storage, raw);
        return { state: null, recovered: true };
      }
      return { state, recovered: false };
    },
    save(state) {
      memory.save(state);
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
      } catch {
        return false;
      }
    },
  };
}
