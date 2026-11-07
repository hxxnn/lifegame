import { describe, expect, it } from 'vitest';
import { completeAndUnlock, evaluateUnlocks, milestoneThreshold } from '../../src/domain/unlocks';
import { emptyState, type PlayerState, type QuestDef } from '../../src/domain/types';
import { BALANCE } from '../../src/data/balance';

const seq = ['a', 'b', 'c'];
const withCleared = (n: number): PlayerState => ({ ...emptyState(), totalCleared: n });

describe('unlocks', () => {
  it('milestoneThreshold: 5, 12, 22, 35, 51, 70', () => {
    expect([1, 2, 3, 4, 5, 6].map(milestoneThreshold)).toEqual([5, 12, 22, 35, 51, 70]);
  });
  it('unlocks the next cosmetic at each milestone', () => {
    expect(evaluateUnlocks(withCleared(4), seq, BALANCE.statUnlockLevels).unlockedIds).toEqual([]);
    expect(evaluateUnlocks(withCleared(5), seq, BALANCE.statUnlockLevels).unlockedIds).toEqual(['a']);
    expect(evaluateUnlocks(withCleared(15), seq, BALANCE.statUnlockLevels).unlockedIds).toEqual(['a', 'b']);
  });
  it('never unlocks beyond the sequence length', () => {
    expect(evaluateUnlocks(withCleared(9999), seq, BALANCE.statUnlockLevels).unlockedIds).toEqual(['a', 'b', 'c']);
  });
  it('unlocks the stat story when the stat reaches a threshold level', () => {
    const lv5 = { ...emptyState(), xp: { ...emptyState().xp, str: 477 } };
    const lv4 = { ...emptyState(), xp: { ...emptyState().xp, str: 476 } };
    expect(evaluateUnlocks(lv5, [], BALANCE.statUnlockLevels).unlockedIds).toEqual(['story:str:5']);
    expect(evaluateUnlocks(lv4, [], BALANCE.statUnlockLevels).unlockedIds).toEqual([]);
  });
  it('is idempotent', () => {
    const once = evaluateUnlocks(withCleared(12), seq, BALANCE.statUnlockLevels);
    expect(evaluateUnlocks(once, seq, BALANCE.statUnlockLevels)).toEqual(once);
  });
  it('completeAndUnlock completes then unlocks', () => {
    const pool: QuestDef[] = [{ id: 'q', stat: 'str', tier: 1, title: '', desc: '', baseXp: 10 }];
    const s: PlayerState = {
      ...withCleared(4), characterId: 'c', focusStats: ['str', 'int'],
      weeks: [{ weekId: '2026-11-09', theme: 'calm', weeklyBonus: false, clearRate: null,
        days: [{ date: '2026-11-09', allDoneBonus: false, quests: [{ questId: 'q', done: false }] }] }],
    };
    const out = completeAndUnlock(s, '2026-11-09', 'q', pool, seq);
    expect(out.totalCleared).toBe(5);
    expect(out.unlockedIds).toEqual(['a']);
  });
});
