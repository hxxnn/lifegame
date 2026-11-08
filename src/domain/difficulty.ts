import { BALANCE, THEME_IDS } from '../data/balance';
import { pickWeighted } from './rng';
import type { DayRecord, Rng, ThemeId, Tier } from './types';

export function themeProbabilities(prevClearRate: number | null): Record<ThemeId, number> {
  if (prevClearRate === null) return BALANCE.themeBaseProb;
  if (prevClearRate >= BALANCE.highClear) return BALANCE.themeProbHighClear;
  if (prevClearRate <= BALANCE.lowClear) return BALANCE.themeProbLowClear;
  return BALANCE.themeBaseProb;
}

/** 주력 스탯 레벨 기준으로 열려 있는 가장 높은 퀘스트 난이도. */
export function maxUnlockedTier(level: number): Tier {
  if (level >= BALANCE.tierUnlockLevel[5]) return 5;
  if (level >= BALANCE.tierUnlockLevel[4]) return 4;
  if (level >= BALANCE.tierUnlockLevel[3]) return 3;
  return 2;
}

/** 그 난이도의 퀘스트를 실제로 받을 수 있는 테마만 나올 수 있다(초반에 쉬운 퀘스트가 지옥의 배율로 나오는 것을 막는다). */
export function allowedThemes(focusLevels: number[]): ThemeId[] {
  const tier = maxUnlockedTier(Math.max(...focusLevels));
  return THEME_IDS.filter((t) => tier >= BALANCE.themeMinTier[t]);
}

export function rollTheme(prevClearRate: number | null, rng: Rng, allowed: ThemeId[] = THEME_IDS): ThemeId {
  const probs = themeProbabilities(prevClearRate);
  return pickWeighted(allowed.map((t) => ({ item: t, weight: probs[t] })), rng);
}

export function clearRateOf(days: DayRecord[]): number {
  const all = days.flatMap((d) => d.quests);
  return all.length === 0 ? 0 : all.filter((q) => q.done).length / all.length;
}
