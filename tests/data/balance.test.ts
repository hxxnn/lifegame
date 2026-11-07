import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../src/data/balance';

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

describe('BALANCE', () => {
  it('theme probability tables each sum to 100', () => {
    expect(sum(BALANCE.themeBaseProb)).toBe(100);
    expect(sum(BALANCE.themeProbHighClear)).toBe(100);
    expect(sum(BALANCE.themeProbLowClear)).toBe(100);
  });
  it('tier weights per theme sum to 100', () => {
    for (const w of Object.values(BALANCE.themeTierWeights)) expect(sum(w as Record<string, number>)).toBe(100);
  });
  it('matches spec values', () => {
    expect(BALANCE.themeMultiplier.hell).toBe(2.0);
    expect(BALANCE.weekdayQuests).toBe(5);
    expect(BALANCE.weekendQuests).toBe(7);
    expect(BALANCE.maxLevel).toBe(30);
  });
});
