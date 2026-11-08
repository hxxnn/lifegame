import { describe, expect, it } from 'vitest';
import { allowedThemes, clearRateOf, rollTheme, themeProbabilities } from '../../src/domain/difficulty';
import { mulberry32, pickWeighted } from '../../src/domain/rng';
import { BALANCE } from '../../src/data/balance';
import type { DayRecord, ThemeId } from '../../src/domain/types';

describe('difficulty', () => {
  it('themeProbabilities picks table by previous clear rate', () => {
    expect(themeProbabilities(null)).toEqual(BALANCE.themeBaseProb);
    expect(themeProbabilities(0.8)).toEqual(BALANCE.themeProbHighClear);
    expect(themeProbabilities(1)).toEqual(BALANCE.themeProbHighClear);
    expect(themeProbabilities(0.4)).toEqual(BALANCE.themeProbLowClear);
    expect(themeProbabilities(0)).toEqual(BALANCE.themeProbLowClear);
    expect(themeProbabilities(0.6)).toEqual(BALANCE.themeBaseProb);
  });
  it('rollTheme distribution matches base probabilities within 3pp', () => {
    const rng = mulberry32(1);
    const n = 10000;
    const c: Record<ThemeId, number> = { calm: 0, normal: 0, challenge: 0, hell: 0 };
    for (let i = 0; i < n; i++) c[rollTheme(null, rng)]++;
    for (const t of Object.keys(c) as ThemeId[]) expect(Math.abs((c[t] / n) * 100 - BALANCE.themeBaseProb[t])).toBeLessThan(3);
  });
  it('same seed gives same sequence', () => {
    const a = mulberry32(42), b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(pickWeighted([{ item: 'x', weight: 1 }], mulberry32(1))).toBe('x');
  });
  it('clearRateOf = done / total, 0 when empty', () => {
    const d = (n: number, done: number): DayRecord => ({
      date: 'x',
      allDoneBonus: false,
      quests: Array.from({ length: n }, (_, i) => ({ questId: 'q' + i, done: i < done })),
    });
    expect(clearRateOf([d(5, 2)])).toBeCloseTo(0.4);
    expect(clearRateOf([])).toBe(0);
  });
});

describe('theme gating by unlocked quest tiers', () => {
  it('challenge needs the hard tier (Lv5), hell needs the extreme tier (Lv10), judged by the focus stats', () => {
    expect(allowedThemes([1, 1])).toEqual(['calm', 'normal']);
    expect(allowedThemes([4, 4])).toEqual(['calm', 'normal']);
    expect(allowedThemes([5, 1])).toEqual(['calm', 'normal', 'challenge']);
    expect(allowedThemes([4, 9])).toEqual(['calm', 'normal', 'challenge']);
    expect(allowedThemes([10, 3])).toEqual(['calm', 'normal', 'challenge', 'hell']);
    expect(allowedThemes([30, 30])).toEqual(['calm', 'normal', 'challenge', 'hell']);
  });
  it('rollTheme only returns allowed themes and renormalises the odds', () => {
    for (let seed = 0; seed < 500; seed++) {
      expect(['calm', 'normal']).toContain(rollTheme(0.9, mulberry32(seed), ['calm', 'normal']));
      expect(rollTheme(null, mulberry32(seed), ['calm'])).toBe('calm');
    }
    const c = { calm: 0, normal: 0 };
    for (let seed = 0; seed < 4000; seed++) c[rollTheme(null, mulberry32(seed), ['calm', 'normal']) as 'calm' | 'normal']++;
    expect(c.calm / 4000).toBeGreaterThan(0.38); // 30 : 40 -> about 43% calm
    expect(c.calm / 4000).toBeLessThan(0.48);
  });
});
