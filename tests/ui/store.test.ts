import { describe, expect, it } from 'vitest';
import { canChangeFocus, reducer } from '../../src/ui/store';
import { emptyState, type PlayerState } from '../../src/domain/types';
import { QUEST_BY_ID } from '../../src/data/questPool';

const wed = new Date(2026, 10, 11, 12); // 2026-11-11 Wednesday
const mon = new Date(2026, 10, 9, 12); // 2026-11-09 Monday
const started = (now: Date): PlayerState => {
  const s = reducer(emptyState(), { type: 'onboard', characterId: 'ember', focus: ['str', 'int'], nickname: '철수' });
  return reducer(s, { type: 'init', now });
};

describe('store reducer', () => {
  it('onboard + init produces today\'s quests', () => {
    const s = started(wed);
    expect(s.characterId).toBe('ember');
    expect(s.nickname).toBe('철수');
    expect(s.weeks[0].days.at(-1)!.date).toBe('2026-11-11');
    expect(s.weeks[0].days.at(-1)!.quests.length).toBe(5);
  });
  it('onboard rejects locked characters, equal focus stats and cleans the nickname', () => {
    const bad1 = reducer(emptyState(), { type: 'onboard', characterId: 'fang', focus: ['str', 'int'], nickname: 'a' });
    expect(bad1.characterId).toBeNull();
    const bad2 = reducer(emptyState(), { type: 'onboard', characterId: 'ember', focus: ['str', 'str'], nickname: 'a' });
    expect(bad2.characterId).toBeNull();
    const ok = reducer(emptyState(), { type: 'onboard', characterId: 'ember', focus: ['str', 'int'], nickname: '\u0000' + 'x'.repeat(40) });
    expect(ok.nickname).toBe('x'.repeat(20));
  });
  it('canChangeFocus: free before onboarding, Monday-only afterwards', () => {
    expect(canChangeFocus(emptyState(), '2026-11-11')).toBe(true);
    expect(canChangeFocus(started(wed), '2026-11-11')).toBe(false);
    expect(canChangeFocus(started(mon), '2026-11-09')).toBe(true);
  });
  it('changeFocus is ignored on a non-Monday and applied on Monday (the character stays)', () => {
    const w = started(wed);
    expect(reducer(w, { type: 'changeFocus', focus: ['agi', 'luk'], now: wed })).toBe(w);
    const m = started(mon);
    const out = reducer(m, { type: 'changeFocus', focus: ['agi', 'luk'], now: mon });
    expect(out.focusStats).toEqual(['agi', 'luk']);
    expect(out.characterId).toBe('ember');
  });
  it('a Monday focus change re-rolls today\'s quests only when nothing is completed yet', () => {
    const m = started(mon);
    const fresh = reducer(m, { type: 'changeFocus', focus: ['agi', 'luk'], now: mon });
    expect(fresh.weeks[0].days[0].quests.length).toBe(5);
    expect(fresh.weeks[0].days[0].date).toBe('2026-11-09');
    const qid = m.weeks[0].days[0].quests[0].questId;
    const done = reducer(m, { type: 'complete', date: '2026-11-09', questId: qid });
    const kept = reducer(done, { type: 'changeFocus', focus: ['agi', 'luk'], now: mon });
    expect(kept.weeks[0].days[0].quests).toEqual(done.weeks[0].days[0].quests);
    expect(kept.focusStats).toEqual(['agi', 'luk']);
  });
  it('changeFocus rejects the same stat twice and unknown stats', () => {
    const m = started(mon);
    expect(reducer(m, { type: 'changeFocus', focus: ['str', 'str'], now: mon })).toBe(m);
    expect(reducer(m, { type: 'changeFocus', focus: ['str', 'xx' as never], now: mon })).toBe(m);
  });
  it('changeCharacter works on any day and touches nothing but the character', () => {
    const w = started(wed);
    const out = reducer(w, { type: 'changeCharacter', characterId: 'shade' });
    expect(out.characterId).toBe('shade');
    expect(out.focusStats).toBe(w.focusStats);
    expect(out.weeks).toBe(w.weeks);
    expect(out.xp).toBe(w.xp);
    const sat = started(new Date(2026, 10, 14, 12));
    expect(reducer(sat, { type: 'changeCharacter', characterId: 'lumi' }).characterId).toBe('lumi');
  });
  it('changeCharacter rejects locked, unknown and unchanged characters, and does nothing before onboarding', () => {
    const w = started(wed);
    expect(reducer(w, { type: 'changeCharacter', characterId: 'fang' })).toBe(w);
    expect(reducer(w, { type: 'changeCharacter', characterId: 'nobody' })).toBe(w);
    expect(reducer(w, { type: 'changeCharacter', characterId: 'ember' })).toBe(w);
    expect(reducer(emptyState(), { type: 'changeCharacter', characterId: 'shade' }).characterId).toBeNull();
  });
  it('a character unlocked by the cosmetic sequence can be picked straight away', () => {
    const w = { ...started(wed), unlockedIds: ['char:sky'] };
    expect(reducer(w, { type: 'changeCharacter', characterId: 'sky' }).characterId).toBe('sky');
  });
  it('complete applies xp and unlock rules', () => {
    const s = started(wed);
    const q = s.weeks[0].days[0].quests[0].questId;
    const out = reducer(s, { type: 'complete', date: '2026-11-11', questId: q });
    expect(out.totalCleared).toBe(1);
    expect(out.xp[QUEST_BY_ID[q].stat]).toBeGreaterThan(0);
  });
  it('reset returns an empty state; setNickname cleans input', () => {
    expect(reducer(started(wed), { type: 'reset' })).toEqual(emptyState());
    expect(reducer(started(wed), { type: 'setNickname', nickname: '  하늘  ' }).nickname).toBe('하늘');
  });
});

import { pendingReport } from '../../src/domain/report';
import { QUEST_POOL } from '../../src/data/questPool';

describe('v2 actions', () => {
  it('swap replaces a regular quest and counts it', () => {
    const s = started(wed);
    const day = s.weeks[0].days[0];
    const target = day.quests.find((q) => !QUEST_BY_ID[q.questId].fixed)!.questId;
    const out = reducer(s, { type: 'swap', date: '2026-11-11', questId: target });
    const d2 = out.weeks[0].days[0];
    expect(d2.swaps).toBe(1);
    expect(d2.quests.map((q) => q.questId)).not.toContain(target);
    expect(d2.quests.length).toBe(day.quests.length);
  });
  it('dismissReport records the viewed week so the report does not return', () => {
    let s = started(new Date(2026, 10, 8, 12)); // Sunday
    s = reducer(s, { type: 'init', now: new Date(2026, 10, 9, 12) }); // Monday
    expect(pendingReport(s, QUEST_POOL)).not.toBeNull();
    s = reducer(s, { type: 'dismissReport', weekId: '2026-11-02' });
    expect(s.reportSeenWeek).toBe('2026-11-02');
    expect(pendingReport(s, QUEST_POOL)).toBeNull();
  });
  it('markBackup / snoozeBackup update the backup bookkeeping', () => {
    const s = started(wed);
    expect(reducer(s, { type: 'markBackup', date: '2026-11-11' }).backup).toEqual({ lastAt: '2026-11-11', nudgedAt: '2026-11-11' });
    expect(reducer(s, { type: 'snoozeBackup', date: '2026-11-11' }).backup).toEqual({ lastAt: null, nudgedAt: '2026-11-11' });
  });
  it('setDayStart accepts 0-6 whole hours only', () => {
    const s = started(wed);
    expect(reducer(s, { type: 'setDayStart', hour: 4 }).settings.dayStartHour).toBe(4);
    expect(reducer(s, { type: 'setDayStart', hour: 9 })).toBe(s);
    expect(reducer(s, { type: 'setDayStart', hour: 2.5 })).toBe(s);
  });
  it('focus change follows the logical date (Monday 02:00 with a 4am start is still Sunday)', () => {
    const s = { ...started(new Date(2026, 10, 8, 12)), settings: { dayStartHour: 4 } };
    const early = new Date(2026, 10, 9, 2, 0);
    expect(reducer(s, { type: 'changeFocus', focus: ['agi', 'luk'], now: early })).toBe(s);
    const later = new Date(2026, 10, 9, 5, 0);
    expect(reducer(s, { type: 'changeFocus', focus: ['agi', 'luk'], now: later }).focusStats).toEqual(['agi', 'luk']);
  });
});

describe('v2 follow-up actions', () => {
  it('dismissReport marks the week shown on the card, even if a newer week exists by now', () => {
    let s = started(new Date(2026, 10, 1, 12));
    s = reducer(s, { type: 'init', now: new Date(2026, 10, 9, 12) });
    s = reducer(s, { type: 'init', now: new Date(2026, 10, 16, 12) });
    expect(reducer(s, { type: 'dismissReport', weekId: '2026-11-02' }).reportSeenWeek).toBe('2026-11-02');
  });
  it('a Monday focus change keeps the swap counter and history of today', () => {
    let s = started(mon);
    const target = s.weeks[0].days[0].quests.find((q) => !QUEST_BY_ID[q.questId].fixed)!.questId;
    s = reducer(s, { type: 'swap', date: '2026-11-09', questId: target });
    const before = s.weeks[0].days[0];
    const out = reducer(s, { type: 'changeFocus', focus: ['agi', 'luk'], now: mon });
    const after = out.weeks[0].days[0];
    expect(after.swaps).toBe(before.swaps);
    expect(after.swappedOut).toEqual(before.swappedOut);
  });
});


import { levelOfCharacter } from '../../src/domain/characterLevel';
describe('per-character levels', () => {
  it('xp goes to the character in use; switching starts the other character at its own level', () => {
    let s = started(wed);
    const q = s.weeks[0].days[0].quests[0].questId;
    s = reducer(s, { type: 'complete', date: '2026-11-11', questId: q });
    const emberXp = s.characters.ember.xp;
    expect(emberXp).toBeGreaterThan(0);
    const out = reducer(s, { type: 'changeCharacter', characterId: 'shade' });   // any day, not just Monday
    expect(out.characterId).toBe('shade');
    expect(out.characters.ember.xp).toBe(emberXp);   // the old character keeps its progress
    expect(levelOfCharacter(out, 'shade')).toBe(1);   // the new one does not inherit it
    expect(out.xp).toEqual(s.xp);                     // stats and quest unlocks stay shared
    const next = reducer(out, { type: 'complete', date: '2026-11-11', questId: out.weeks[0].days[0].quests.find((x) => !x.done)!.questId });
    expect(next.characters.shade.xp).toBeGreaterThan(0);
    expect(next.characters.ember.xp).toBe(emberXp);
  });
});
