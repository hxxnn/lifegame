import { BALANCE } from '../data/balance';

export function xpToNext(level: number): number {
  return Math.round(BALANCE.levelBase * BALANCE.levelRatio ** (level - 1));
}

export function levelFromXp(totalXp: number): { level: number; into: number; need: number | null } {
  let level = 1;
  let rest = Math.max(0, totalXp);
  while (level < BALANCE.maxLevel) {
    const need = xpToNext(level);
    if (rest < need) return { level, into: rest, need };
    rest -= need;
    level++;
  }
  return { level, into: rest, need: null };
}
