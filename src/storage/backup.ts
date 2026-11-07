import { migrate } from './migrate';
import type { PlayerState } from '../domain/types';

export function exportJson(state: PlayerState): string {
  return JSON.stringify(state, null, 2);
}

/** 내보내는 파일 자체에 '오늘 백업함'을 기록한다. 이 파일을 복원해도 백업 안내가 바로 다시 뜨지 않는다. */
export function withBackupMark(state: PlayerState, today: string): PlayerState {
  return { ...state, backup: { lastAt: today, nudgedAt: today } };
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
