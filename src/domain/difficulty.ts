import { BALANCE, THEME_IDS } from '../data/balance';
import { pickWeighted } from './rng';
import type { DayRecord, Rng, ThemeId } from './types';

export function themeProbabilities(prevClearRate: number | null): Record<ThemeId, number> {
  if (prevClearRate === null) return BALANCE.themeBaseProb;
  if (prevClearRate >= BALANCE.highClear) return BALANCE.themeProbHighClear;
  if (prevClearRate <= BALANCE.lowClear) return BALANCE.themeProbLowClear;
  return BALANCE.themeBaseProb;
}

export function rollTheme(prevClearRate: number | null, rng: Rng): ThemeId {
  const probs = themeProbabilities(prevClearRate);
  return pickWeighted(THEME_IDS.map((t) => ({ item: t, weight: probs[t] })), rng);
}

export function clearRateOf(days: DayRecord[]): number {
  const all = days.flatMap((d) => d.quests);
  return all.length === 0 ? 0 : all.filter((q) => q.done).length / all.length;
}
