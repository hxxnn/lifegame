import { describe, expect, it } from 'vitest';
import { completeQuest, statLevels } from '../../src/domain/progress';
import { emptyState, type PlayerState, type QuestDef, type ThemeId, type WeekRecord } from '../../src/domain/types';

const pool: QuestDef[] = [
  { id: 's20', stat: 'str', tier: 2, title: '', desc: '', baseXp: 20 },
  { id: 'i20', stat: 'int', tier: 2, title: '', desc: '', baseXp: 20 },
  { id: 's10', stat: 'str', tier: 1, title: '', desc: '', baseXp: 10 },
];
function stateWith(theme: ThemeId, days: { date: string; ids: string[] }[]): PlayerState {
  const week: WeekRecord = {
    weekId: '2026-11-09', theme, weeklyBonus: false, clearRate: null,
    days: days.map((d) => ({ date: d.date, allDoneBonus: false, quests: d.ids.map((id) => ({ questId: id, done: false })) })),
  };
  return { ...emptyState(), characterId: 'c', focusStats: ['str', 'int'], weeks: [week] };
}

describe('completeQuest', () => {
  it('awards baseXp x theme multiplier to the quest stat and counts the clear', () => {
    const s = completeQuest(stateWith('challenge', [{ date: '2026-11-09', ids: ['s20', 'i20'] }]), '2026-11-09', 's20', pool);
    expect(s.xp.str).toBe(32);
    expect(s.xp.int).toBe(0);
    expect(s.totalCleared).toBe(1);
    expect(s.weeks[0].days[0].quests[0].done).toBe(true);
  });
  it('completing the same quest twice changes nothing', () => {
    const once = completeQuest(stateWith('challenge', [{ date: '2026-11-09', ids: ['s20', 'i20'] }]), '2026-11-09', 's20', pool);
    const twice = completeQuest(once, '2026-11-09', 's20', pool);
    expect(twice).toEqual(once);
    expect(twice.totalCleared).toBe(1);
  });
  it('finishing the whole day adds +10% of each quest xp once', () => {
    let s = stateWith('challenge', [{ date: '2026-11-09', ids: ['s20', 'i20'] }]);
    s = completeQuest(s, '2026-11-09', 's20', pool);
    expect(s.weeks[0].days[0].allDoneBonus).toBe(false);
    s = completeQuest(s, '2026-11-09', 'i20', pool);
    expect(s.weeks[0].days[0].allDoneBonus).toBe(true);
    expect(s.xp.str).toBe(32 + 3);
    expect(s.xp.int).toBe(32 + 3);
  });
  it('weekly bonus is granted on the 5th fully completed day, split across focus stats', () => {
    const dates = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'];
    let s = stateWith('calm', dates.map((date) => ({ date, ids: ['s10'] })));
    for (const d of dates.slice(0, 4)) s = completeQuest(s, d, 's10', pool);
    expect(s.weeks[0].weeklyBonus).toBe(false);
    expect(s.xp.int).toBe(0);
    s = completeQuest(s, dates[4], 's10', pool);
    expect(s.weeks[0].weeklyBonus).toBe(true);
    expect(s.xp.int).toBe(50);
    expect(s.xp.str).toBe(5 * 10 + 5 * 1 + 50);
  });
  it('does not mutate the input state', () => {
    const before = stateWith('calm', [{ date: '2026-11-09', ids: ['s10'] }]);
    const snapshot = JSON.stringify(before);
    completeQuest(before, '2026-11-09', 's10', pool);
    expect(JSON.stringify(before)).toBe(snapshot);
  });
  it('unknown date or quest id returns the same state', () => {
    const s = stateWith('calm', [{ date: '2026-11-09', ids: ['s10'] }]);
    expect(completeQuest(s, '2026-12-01', 's10', pool)).toBe(s);
    expect(completeQuest(s, '2026-11-09', 'nope', pool)).toBe(s);
  });
  it('statLevels derives levels from xp', () => {
    const s = { ...emptyState(), xp: { str: 100, agi: 0, int: 0, spi: 0, luk: 0 } };
    expect(statLevels(s)).toEqual({ str: 2, agi: 1, int: 1, spi: 1, luk: 1 });
  });
});

describe('completeQuest on a settled week', () => {
  it('refuses to change days of a week whose clear rate is already frozen', () => {
    const s = stateWith('calm', [{ date: '2026-11-09', ids: ['s10'] }]);
    const settled = { ...s, weeks: [{ ...s.weeks[0], clearRate: 0 }] };
    expect(completeQuest(settled, '2026-11-09', 's10', pool)).toBe(settled);
  });
});
