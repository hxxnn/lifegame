import { migrate } from './migrate';
import type { PlayerState } from '../domain/types';

export function exportJson(state: PlayerState): string {
  return JSON.stringify(state, null, 2);
}

export function importJson(text: string): PlayerState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('INVALID_SAVE');
  }
  const state = migrate(parsed);
  if (!state) throw new Error('INVALID_SAVE');
  return state;
}

export function backupRaw(storage: Storage, raw: string): void {
  try {
    storage.setItem(`lifegame:backup:${Date.now()}`, raw);
  } catch {
    /* backup is best effort */
  }
}
