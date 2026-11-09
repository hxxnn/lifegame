import type { PlayerState } from './types';

export const CHAR_MAX_LEVEL = 99;

/** 캐릭터 레벨 L에 도달하는 데 필요한 누적 경험치. Lv.25 2,374 / Lv.50 10,630 / Lv.75 25,264 / Lv.99 45,572. */
export const charXpForLevel = (level: number): number => (level <= 1 ? 0 : Math.round(3 * (level - 1) ** 2.1));

export function charLevelFromXp(xp: number): number {
  if (!Number.isFinite(xp) || xp <= 0) return 1;
  let level = 1;
  while (level < CHAR_MAX_LEVEL && xp >= charXpForLevel(level + 1)) level++;
  return level;
}

export function charLevelProgress(xp: number): { level: number; into: number; need: number | null } {
  const level = charLevelFromXp(xp);
  const base = charXpForLevel(level);
  return { level, into: Number.isFinite(xp) ? Math.max(0, xp - base) : 0, need: level >= CHAR_MAX_LEVEL ? null : charXpForLevel(level + 1) - base };
}

export const levelOfCharacter = (state: PlayerState, id: string): number => charLevelFromXp(state.characters[id]?.xp ?? 0);

/** 지금 고른 캐릭터의 레벨. 아직 고르지 않았으면 1. */
export const activeCharacterLevel = (state: PlayerState): number => (state.characterId ? levelOfCharacter(state, state.characterId) : 1);
