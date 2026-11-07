import { describe, expect, it } from 'vitest';
import { levelFromXp, xpToNext } from '../../src/domain/leveling';

describe('leveling', () => {
  it('xpToNext follows 100 * 1.12^(L-1)', () => {
    expect(xpToNext(1)).toBe(100);
    expect(xpToNext(5)).toBe(157);
    expect(xpToNext(10)).toBe(277);
    expect(xpToNext(20)).toBe(861);
    expect(xpToNext(29)).toBe(2388);
  });
  it('levelFromXp', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, into: 0, need: 100 });
    expect(levelFromXp(100)).toMatchObject({ level: 2, into: 0 });
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(21456)).toEqual({ level: 30, into: 0, need: null });
    expect(levelFromXp(1e9).level).toBe(30);
  });
});
