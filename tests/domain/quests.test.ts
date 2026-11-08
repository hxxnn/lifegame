import { describe, expect, it } from 'vitest';
import { dailyQuestCount, generateDay, isUnlocked } from '../../src/domain/quests';
import { mulberry32 } from '../../src/domain/rng';
import { STAT_IDS, type QuestDef, type StatId, type Tier } from '../../src/domain/types';

const TIERS: Tier[] = [1, 2, 3, 4];
function makePool(perCell = 6): QuestDef[] {
  const pool: QuestDef[] = [];
  for (const stat of STAT_IDS)
    for (const tier of TIERS)
      for (let i = 0; i < perCell; i++)
        pool.push({
          id: `${stat}-${tier}-${i}`, stat, tier, title: 't', desc: 'd', baseXp: 10,
          ...(tier === 4 ? { requires: { stat, level: 10 } } : {}),
        });
  for (let i = 0; i < 3; i++) pool.push({ id: `fixed-${i}`, stat: 'spi', tier: 1, title: 'f', desc: 'd', baseXp: 10, fixed: true });
  return pool;
}
const lv = (n: number): Record<StatId, number> => ({ str: n, agi: n, int: n, spi: n, luk: n });
const base = { theme: 'normal' as const, focus: ['str', 'int'] as [StatId, StatId], levels: lv(1), pool: makePool(), previousIds: [] as string[] };

describe('quests', () => {
  it('dailyQuestCount: 5 on weekdays, 7 on weekends', () => {
    expect(dailyQuestCount('2026-11-09')).toBe(5);
    expect(dailyQuestCount('2026-11-07')).toBe(7);
    expect(dailyQuestCount('2026-11-08')).toBe(7);
  });
  it('isUnlocked respects requires', () => {
    const q: QuestDef = { id: 'a', stat: 'str', tier: 4, title: '', desc: '', baseXp: 1, requires: { stat: 'str', level: 10 } };
    expect(isUnlocked(q, lv(9))).toBe(false);
    expect(isUnlocked(q, lv(10))).toBe(true);
  });
  it('generates 5 weekday / 7 weekend quests with exactly one fixed habit, no duplicates', () => {
    for (const date of ['2026-11-09', '2026-11-07']) {
      const day = generateDay({ ...base, date }, mulberry32(3));
      const ids = day.quests.map((q) => q.questId);
      expect(ids.length).toBe(dailyQuestCount(date));
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.filter((i) => i.startsWith('fixed-')).length).toBe(1);
      expect(day.quests.every((q) => !q.done)).toBe(true);
    }
  });
  it('never serves locked quests', () => {
    for (let s = 0; s < 50; s++) {
      const day = generateDay({ ...base, theme: 'hell', date: '2026-11-07' }, mulberry32(s));
      expect(day.quests.some((q) => q.questId.includes('-4-'))).toBe(false);
    }
  });
  it('avoids yesterday\'s quests when candidates are plentiful', () => {
    const y = generateDay({ ...base, date: '2026-11-09' }, mulberry32(1));
    const prev = y.quests.map((q) => q.questId);
    for (let s = 0; s < 30; s++) {
      const day = generateDay({ ...base, date: '2026-11-10', previousIds: prev }, mulberry32(s));
      expect(day.quests.filter((q) => prev.includes(q.questId))).toEqual([]);
    }
  });
  it('focus stats take about 60% of variable slots', () => {
    let focus = 0, total = 0;
    for (let s = 0; s < 2000; s++) {
      const day = generateDay({ ...base, theme: 'calm', date: '2026-11-07' }, mulberry32(s));
      for (const q of day.quests) {
        if (q.questId.startsWith('fixed-')) continue;
        total++;
        if (q.questId.startsWith('str-') || q.questId.startsWith('int-')) focus++;
      }
    }
    expect(focus / total).toBeGreaterThan(0.55);
    expect(focus / total).toBeLessThan(0.65);
  });
  it('tiny pool: fills as many distinct quests as exist, no error', () => {
    const pool = makePool(0).concat([
      { id: 'a', stat: 'str', tier: 1, title: '', desc: '', baseXp: 1 },
      { id: 'b', stat: 'agi', tier: 2, title: '', desc: '', baseXp: 1 },
      { id: 'c', stat: 'luk', tier: 3, title: '', desc: '', baseXp: 1 },
    ]);
    const day = generateDay({ ...base, pool, date: '2026-11-09' }, mulberry32(1));
    const ids = day.quests.map((q) => q.questId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(4); // only one of the 3 fixed habits is served: 1 fixed + 3 regular
  });
  it('relaxes yesterday-exclusion and tier so the day is still full', () => {
    // only 5 non-fixed quests of tier 1 in the whole pool, all of them served yesterday
    const pool: QuestDef[] = [
      { id: 'f', stat: 'spi', tier: 1, title: '', desc: '', baseXp: 1, fixed: true },
      ...['str', 'agi', 'int', 'spi'].map((stat, i) => ({ id: `n${i}`, stat: stat as StatId, tier: 1 as Tier, title: '', desc: '', baseXp: 1 })),
    ];
    const day = generateDay({ ...base, theme: 'hell', pool, previousIds: ['f', 'n0', 'n1', 'n2', 'n3'], date: '2026-11-09' }, mulberry32(5));
    expect(day.quests.length).toBe(5);
    expect(new Set(day.quests.map((q) => q.questId)).size).toBe(5);
  });
});

import { QUEST_POOL } from '../../src/data/questPool';
describe('legend quests in generation', () => {
  const served = (level: number): number => {
    let legend = 0;
    for (let seed = 0; seed < 400; seed++) {
      const day = generateDay({ date: '2026-11-07', theme: 'hell', focus: ['str', 'int'], levels: lv(level), pool: QUEST_POOL, previousIds: [] }, mulberry32(seed));
      legend += day.quests.filter((q) => QUEST_POOL.find((p) => p.id === q.questId)!.tier === 5).length;
    }
    return legend;
  };
  it('are never served below the first unlock level and do show up in hell weeks from Lv15', () => {
    expect(served(14)).toBe(0);
    expect(served(15)).toBeGreaterThan(0);
  });
});
