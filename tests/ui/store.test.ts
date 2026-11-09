import { describe, expect, it } from 'vitest';
import { canChangeProfile, reducer } from '../../src/ui/store';
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
  it('canChangeProfile: free before onboarding, Monday-only afterwards', () => {
    expect(canChangeProfile(emptyState(), '2026-11-11')).toBe(true);
    expect(canChangeProfile(started(wed), '2026-11-11')).toBe(false);
    expect(canChangeProfile(started(mon), '2026-11-09')).toBe(true);
  });
  it('changeProfile is ignored on a non-Monday and applied on Monday', () => {
    const w = started(wed);
    expect(reducer(w, { type: 'changeProfile', characterId: 'shade', focus: ['agi', 'luk'], now: wed })).toBe(w);
    const m = started(mon);
    const out = reducer(m, { type: 'changeProfile', characterId: 'shade', focus: ['agi', 'luk'], now: mon });
    expect(out.characterId).toBe('shade');
    expect(out.focusStats).toEqual(['agi', 'luk']);
  });
  it('Monday change re-rolls today\'s quests only when nothing is completed yet', () => {
    const m = started(mon);
    const fresh = reducer(m, { type: 'changeProfile', characterId: 'shade', focus: ['agi', 'luk'], now: mon });
    expect(fresh.weeks[0].days[0].quests.length).toBe(5);
    expect(fresh.weeks[0].days[0].date).toBe('2026-11-09');
    const qid = m.weeks[0].days[0].quests[0].questId;
    const done = reducer(m, { type: 'complete', date: '2026-11-09', questId: qid });
    const kept = reducer(done, { type: 'changeProfile', characterId: 'shade', focus: ['agi', 'luk'], now: mon });
    expect(kept.weeks[0].days[0].quests).toEqual(done.weeks[0].days[0].quests);
    expect(kept.focusStats).toEqual(['agi', 'luk']);
  });
  it('changeProfile rejects locked characters', () => {
    const m = started(mon);
    expect(reducer(m, { type: 'changeProfile', characterId: 'fang', focus: ['str', 'int'], now: mon })).toBe(m);
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
  it('profile change follows the logical date (Monday 02:00 with a 4am start is still Sunday)', () => {
    const s = { ...started(new Date(2026, 10, 8, 12)), settings: { dayStartHour: 4 } };
    const early = new Date(2026, 10, 9, 2, 0);
    expect(reducer(s, { type: 'changeProfile', characterId: 'shade', focus: ['agi', 'luk'], now: early })).toBe(s);
    const later = new Date(2026, 10, 9, 5, 0);
    expect(reducer(s, { type: 'changeProfile', characterId: 'shade', focus: ['agi', 'luk'], now: later }).characterId).toBe('shade');
  });
});

describe('v2 follow-up actions', () => {
  it('dismissReport marks the week shown on the card, even if a newer week exists by now', () => {
    let s = started(new Date(2026, 10, 1, 12));
    s = reducer(s, { type: 'init', now: new Date(2026, 10, 9, 12) });
    s = reducer(s, { type: 'init', now: new Date(2026, 10, 16, 12) });
    expect(reducer(s, { type: 'dismissReport', weekId: '2026-11-02' }).reportSeenWeek).toBe('2026-11-02');
  });
  it('a Monday profile change keeps the swap counter and history of today', () => {
    let s = started(mon);
    const target = s.weeks[0].days[0].quests.find((q) => !QUEST_BY_ID[q.questId].fixed)!.questId;
    s = reducer(s, { type: 'swap', date: '2026-11-09', questId: target });
    const before = s.weeks[0].days[0];
    const out = reducer(s, { type: 'changeProfile', characterId: 'shade', focus: ['agi', 'luk'], now: mon });
    const after = out.weeks[0].days[0];
    expect(after.swaps).toBe(before.swaps);
    expect(after.swappedOut).toEqual(before.swappedOut);
  });
});


import { levelOfCharacter } from '../../src/domain/characterLevel';
describe('per-character levels', () => {
  it('xp goes to the character in use; switching starts the other character at its own level', () => {
    let s = started(mon);
    const q = s.weeks[0].days[0].quests[0].questId;
    s = reducer(s, { type: 'complete', date: '2026-11-09', questId: q });
    const emberXp = s.characters.ember.xp;
    expect(emberXp).toBeGreaterThan(0);
    const out = reducer(s, { type: 'changeProfile', characterId: 'shade', focus: ['agi', 'luk'], now: mon });
    expect(out.characterId).toBe('shade');
    expect(out.characters.ember.xp).toBe(emberXp);   // the old character keeps its progress
    expect(levelOfCharacter(out, 'shade')).toBe(1);   // the new one does not inherit it
    expect(out.xp).toEqual(s.xp);                     // stats and quest unlocks stay shared
    const next = reducer(out, { type: 'complete', date: '2026-11-09', questId: out.weeks[0].days[0].quests.find((x) => !x.done)!.questId });
    expect(next.characters.shade.xp).toBeGreaterThan(0);
    expect(next.characters.ember.xp).toBe(emberXp);
  });
});
