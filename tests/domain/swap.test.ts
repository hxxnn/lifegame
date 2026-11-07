import { describe, expect, it } from 'vitest';
import { canSwap, swapQuest } from '../../src/domain/swap';
import { mulberry32 } from '../../src/domain/rng';
import { STAT_IDS, emptyState, type PlayerState, type QuestDef, type Tier } from '../../src/domain/types';

const pool: QuestDef[] = [];
for (const stat of STAT_IDS) for (const tier of [1, 2] as Tier[]) for (let i = 0; i < 4; i++) pool.push({ id: `${stat}-${tier}-${i}`, stat, tier, title: '', desc: '', baseXp: 10 });
pool.push({ id: 'fixed-a', stat: 'spi', tier: 1, title: '', desc: '', baseXp: 10, fixed: true });

function state(ids: string[], extra: Partial<PlayerState['weeks'][0]['days'][0]> = {}, prevIds: string[] = []): PlayerState {
  const mk = (date: string, q: string[]) => ({ date, allDoneBonus: false, quests: q.map((questId) => ({ questId, done: false })), ...extra });
  return { ...emptyState(), characterId: 'c', focusStats: ['str', 'int'], lastDate: '2026-11-10',
    weeks: [{ weekId: '2026-11-09', theme: 'calm', weeklyBonus: false, clearRate: null, days: [...(prevIds.length ? [{ ...mk('2026-11-09', prevIds), swaps: undefined }] : []), mk('2026-11-10', ids)] }] };
}
const today = '2026-11-10';

describe('swapQuest', () => {
  it('replaces with a quest of the same stat and tier that is not already in the day, counting the swap', () => {
    const s = state(['str-1-0', 'int-1-0', 'fixed-a']);
    for (let seed = 0; seed < 20; seed++) {
      const out = swapQuest(s, today, 'str-1-0', pool, mulberry32(seed));
      const day = out.weeks[0].days.at(-1)!;
      const swapped = day.quests[0];
      expect(swapped.questId).toMatch(/^str-1-/);
      expect(swapped.questId).not.toBe('str-1-0');
      expect(swapped.done).toBe(false);
      expect(day.quests.map((q) => q.questId).slice(1)).toEqual(['int-1-0', 'fixed-a']);
      expect(day.swaps).toBe(1);
    }
  });
  it('allows at most two swaps per day', () => {
    let s = state(['str-1-0', 'int-1-0', 'agi-1-0']);
    s = swapQuest(s, today, 'str-1-0', pool, mulberry32(1));
    s = swapQuest(s, today, 'int-1-0', pool, mulberry32(2));
    expect(s.weeks[0].days.at(-1)!.swaps).toBe(2);
    expect(canSwap(s, today, 'agi-1-0', pool)).toBe(false);
    expect(swapQuest(s, today, 'agi-1-0', pool, mulberry32(3))).toBe(s);
  });
  it('refuses fixed habits, completed quests and unknown quests', () => {
    const s = state(['str-1-0', 'fixed-a']);
    expect(swapQuest(s, today, 'fixed-a', pool, mulberry32(1))).toBe(s);
    expect(swapQuest(s, today, 'nope', pool, mulberry32(1))).toBe(s);
    const done = { ...s, weeks: [{ ...s.weeks[0], days: [{ ...s.weeks[0].days[0], quests: [{ questId: 'str-1-0', done: true }, { questId: 'fixed-a', done: false }] }] }] };
    expect(canSwap(done, today, 'str-1-0', pool)).toBe(false);
  });
  it('prefers quests that were not served yesterday but relaxes that when nothing else is left', () => {
    const yesterday = ['str-1-1', 'str-1-2', 'str-1-3'];
    const s = state(['str-1-0'], {}, yesterday);
    expect(canSwap(s, today, 'str-1-0', pool)).toBe(true);
    const out = swapQuest(s, today, 'str-1-0', pool, mulberry32(1));
    expect(yesterday).toContain(out.weeks[0].days.at(-1)!.quests[0].questId); // only yesterday's remain
    const roomy = state(['str-1-0'], {}, ['str-1-1']);
    for (let seed = 0; seed < 20; seed++)
      expect(['str-1-2', 'str-1-3']).toContain(swapQuest(roomy, today, 'str-1-0', pool, mulberry32(seed)).weeks[0].days.at(-1)!.quests[0].questId);
  });
  it('does nothing when the pool has no other quest of that stat and tier', () => {
    const tiny = pool.filter((q) => q.id === 'str-1-0' || q.stat !== 'str' || q.tier !== 1);
    const s = state(['str-1-0']);
    expect(canSwap(s, today, 'str-1-0', tiny)).toBe(false);
    expect(swapQuest(s, today, 'str-1-0', tiny, mulberry32(1))).toBe(s);
  });
});
