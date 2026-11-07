import { describe, expect, it } from 'vitest';
import { syncState } from '../../src/domain/rollover';
import { mulberry32 } from '../../src/domain/rng';
import { STAT_IDS, emptyState, type PlayerState, type QuestDef, type Tier } from '../../src/domain/types';

const pool: QuestDef[] = [];
for (const stat of STAT_IDS)
  for (const tier of [1, 2, 3] as Tier[])
    for (let i = 0; i < 6; i++) pool.push({ id: `${stat}-${tier}-${i}`, stat, tier, title: '', desc: '', baseXp: 10 });
for (let i = 0; i < 3; i++) pool.push({ id: `fixed-${i}`, stat: 'spi', tier: 1, title: '', desc: '', baseXp: 10, fixed: true });

const ready = (): PlayerState => ({ ...emptyState(), characterId: 'c', focusStats: ['str', 'int'] });
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12, 0);

describe('syncState', () => {
  it('first run mid-week: only today is generated (pre-install days are not counted)', () => {
    const s = syncState(ready(), at(2026, 11, 11), pool, mulberry32(1));
    expect(s.weeks.length).toBe(1);
    expect(s.weeks[0].weekId).toBe('2026-11-09');
    expect(s.weeks[0].days.map((d) => d.date)).toEqual(['2026-11-11']);
    expect(s.weeks[0].days[0].quests.length).toBe(5);
    expect(s.lastDate).toBe('2026-11-11');
  });
  it('is idempotent on the same day', () => {
    const once = syncState(ready(), at(2026, 11, 11), pool, mulberry32(1));
    expect(syncState(once, at(2026, 11, 11), pool, mulberry32(2))).toEqual(once);
  });
  it('Sunday to Monday settles last week and opens a new one', () => {
    let s = syncState(ready(), at(2026, 11, 8), pool, mulberry32(1));
    s = { ...s, weeks: s.weeks.map((w) => ({ ...w, days: w.days.map((d) => ({ ...d, quests: d.quests.map((q) => ({ ...q, done: true })) })) })) };
    s = syncState(s, at(2026, 11, 9), pool, mulberry32(1));
    expect(s.weeks.length).toBe(2);
    expect(s.weeks[0].clearRate).toBe(1);
    expect(s.weeks[1].weekId).toBe('2026-11-09');
    expect(s.weeks[1].clearRate).toBeNull();
    expect(s.weeks[1].days.length).toBe(1);
  });
  it('three weeks away: every missed day is recorded as undone and themes are rolled from clear rate 0', () => {
    const rng = () => 0.8; // base table -> challenge, low-clear table -> normal
    let s = syncState(ready(), at(2026, 11, 2), pool, rng);
    s = syncState(s, at(2026, 11, 24), pool, rng);
    expect(s.weeks.map((w) => w.weekId)).toEqual(['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23']);
    expect(s.weeks.flatMap((w) => w.days).length).toBe(23);
    expect(s.weeks.slice(0, 3).map((w) => w.clearRate)).toEqual([0, 0, 0]);
    expect(s.weeks[3].clearRate).toBeNull();
    expect(s.weeks[0].theme).toBe('challenge');
    expect(s.weeks.slice(1).map((w) => w.theme)).toEqual(['normal', 'normal', 'normal']);
    expect(s.weeks[1].days.flatMap((d) => d.quests).length).toBe(39);
    expect(s.weeks.flatMap((w) => w.days).flatMap((d) => d.quests).every((q) => !q.done)).toBe(true);
  });
  it('clock moved backwards leaves state untouched', () => {
    const s = syncState(ready(), at(2026, 11, 11), pool, mulberry32(1));
    expect(syncState(s, at(2026, 11, 5), pool, mulberry32(1))).toBe(s);
  });
  it('before onboarding nothing is generated', () => {
    const s = emptyState();
    expect(syncState(s, at(2026, 11, 11), pool, mulberry32(1))).toBe(s);
  });
  it('consecutive days do not repeat yesterday\'s quests', () => {
    let s = syncState(ready(), at(2026, 11, 9), pool, mulberry32(7));
    s = syncState(s, at(2026, 11, 10), pool, mulberry32(8));
    const [d1, d2] = s.weeks[0].days.map((d) => d.quests.map((q) => q.questId));
    expect(d2.filter((id) => d1.includes(id))).toEqual([]);
  });
});

import { pickDisplayDay } from '../../src/domain/rollover';
describe('pickDisplayDay', () => {
  it('returns today\'s record, or the latest one when the clock was corrected backwards', () => {
    const s = syncState(ready(), at(2027, 1, 5), pool, mulberry32(1)); // clock was wrongly ahead
    expect(pickDisplayDay(s, '2027-01-05')!.date).toBe('2027-01-05');
    expect(pickDisplayDay(s, '2026-11-11')!.date).toBe('2027-01-05');
    expect(pickDisplayDay(emptyState(), '2026-11-11')).toBeNull();
  });
});
