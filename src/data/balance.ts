import type { ThemeId, Tier } from '../domain/types';

export const THEME_IDS: ThemeId[] = ['calm', 'normal', 'challenge', 'hell'];

export const BALANCE = {
  levelBase: 100,
  levelRatio: 1.12,
  maxLevel: 30,
  themeMultiplier: { calm: 1.0, normal: 1.3, challenge: 1.6, hell: 2.0 } as Record<ThemeId, number>,
  themeBaseProb: { calm: 30, normal: 40, challenge: 25, hell: 5 } as Record<ThemeId, number>,
  themeProbHighClear: { calm: 10, normal: 35, challenge: 40, hell: 15 } as Record<ThemeId, number>,
  themeProbLowClear: { calm: 50, normal: 35, challenge: 13, hell: 2 } as Record<ThemeId, number>,
  themeTierWeights: {
    calm: { 1: 80, 2: 20 },
    normal: { 1: 30, 2: 60, 3: 10 },
    challenge: { 2: 30, 3: 60, 4: 10 },
    hell: { 3: 50, 4: 50 },
  } as Record<ThemeId, Partial<Record<Tier, number>>>,
  tierBaseXp: { 1: 10, 2: 20, 3: 35, 4: 55 } as Record<Tier, number>,
  focusShare: 0.6,
  weekdayQuests: 5,
  weekendQuests: 7,
  dayBonusRate: 0.1,
  weeklyBonusDays: 5,
  weeklyBonusXp: 100,
  statUnlockLevels: [5, 10, 15, 20, 25, 30],
  dailySwaps: 2,
  backupNudgeDays: 7,
  backupMinCleared: 10,
  historyWeeks: 8,
  highClear: 0.8,
  lowClear: 0.4,
};
