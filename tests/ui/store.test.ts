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
