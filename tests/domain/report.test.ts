import { describe, expect, it } from 'vitest';
import { backupNudge, buildWeekReport, pendingReport, themeReason, yesterdaySummary } from '../../src/domain/report';
import { emptyState, type PlayerState, type QuestDef } from '../../src/domain/types';

const pool: QuestDef[] = [
  { id: 's', stat: 'str', tier: 2, title: '', desc: '', baseXp: 20 },
  { id: 'i', stat: 'int', tier: 2, title: '', desc: '', baseXp: 10 },
];
const day = (date: string, done: boolean[], allDoneBonus = false) => ({ date, allDoneBonus, quests: done.map((d, i) => ({ questId: i % 2 ? 'i' : 's', done: d })) });

function twoWeeks(seen: string | null = null): PlayerState {
  return {
    ...emptyState(), characterId: 'c', focusStats: ['str', 'int'], reportSeenWeek: seen,
    weeks: [
      { weekId: '2026-11-02', theme: 'challenge', weeklyBonus: true, clearRate: 0.75, days: [day('2026-11-02', [true, true], true), day('2026-11-03', [true, false])] },
      { weekId: '2026-11-09', theme: 'hell', weeklyBonus: false, clearRate: null, days: [day('2026-11-09', [false, false])] },
    ],
  };
}

describe('weekly report', () => {
  it('buildWeekReport totals completion, xp per stat (with day bonus) and full days', () => {
    const r = buildWeekReport(twoWeeks(), '2026-11-02', pool)!;
    expect(r).toMatchObject({ weekId: '2026-11-02', theme: 'challenge', done: 3, total: 4, clearRate: 0.75, fullDays: 1, weeklyBonus: true });
    // challenge x1.6: s=32, i=16. day1 both done (+10% bonus: 3 and 2), day2 only s=32
    expect(r.xpByStat.str).toBe(32 + 3 + 32);
    expect(r.xpByStat.int).toBe(16 + 2);
    expect(buildWeekReport(twoWeeks(), '1999-01-04', pool)).toBeNull();
  });
  it('themeReason explains the odds shift', () => {
    expect(themeReason(0.85)).toContain('도전');
    expect(themeReason(0.3)).toContain('쉬운');
    expect(themeReason(0.6)).toContain('기본');
    expect(themeReason(null)).toContain('기본');
  });
  it('pendingReport shows last week once, with the reason for the new theme', () => {
    const r = pendingReport(twoWeeks(), pool)!;
    expect(r.weekId).toBe('2026-11-02');
    expect(r.nextTheme).toBe('hell');
    expect(r.reason).toBe(themeReason(0.75));
    expect(pendingReport(twoWeeks('2026-11-02'), pool)).toBeNull();
    expect(pendingReport({ ...twoWeeks(), weeks: [twoWeeks().weeks[1]] }, pool)).toBeNull();
  });
  it('yesterdaySummary reads the previous calendar day', () => {
    expect(yesterdaySummary(twoWeeks(), '2026-11-03')).toEqual({ done: 2, total: 2 });
    expect(yesterdaySummary(twoWeeks(), '2026-11-09')).toBeNull(); // 11-08 has no record
  });
});

describe('backupNudge', () => {
  const base = (over: Partial<PlayerState>): PlayerState => ({ ...emptyState(), totalCleared: 10, ...over });
  it('needs 10+ clears, an old or missing backup, and no nudge today', () => {
    expect(backupNudge(base({ totalCleared: 9 }), '2026-11-09')).toBeNull();
    expect(backupNudge(base({}), '2026-11-09')).toEqual({ days: null });
    expect(backupNudge(base({ backup: { lastAt: '2026-11-01', nudgedAt: null } }), '2026-11-09')).toEqual({ days: 8 });
    expect(backupNudge(base({ backup: { lastAt: '2026-11-05', nudgedAt: null } }), '2026-11-09')).toBeNull();
    expect(backupNudge(base({ backup: { lastAt: null, nudgedAt: '2026-11-09' } }), '2026-11-09')).toBeNull();
  });
});
