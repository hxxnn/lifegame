import { describe, expect, it } from 'vitest';
import { clearRateOf, rollTheme, themeProbabilities } from '../../src/domain/difficulty';
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
