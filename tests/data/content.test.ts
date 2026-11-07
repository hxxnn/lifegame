import { describe, expect, it } from 'vitest';
import { QUEST_POOL } from '../../src/data/questPool';
import { CHARACTERS } from '../../src/data/characters';
import { STORIES } from '../../src/data/stories';
import { COSMETIC_LABELS, COSMETIC_SEQUENCE } from '../../src/data/cosmetics';
import { BALANCE } from '../../src/data/balance';
import { STAT_IDS, type Tier } from '../../src/domain/types';

const regular = QUEST_POOL.filter((q) => !q.fixed);

describe('quest pool', () => {
  it('ids are unique and text is filled', () => {
    expect(new Set(QUEST_POOL.map((q) => q.id)).size).toBe(QUEST_POOL.length);
    for (const q of QUEST_POOL) {
      expect(q.title.length).toBeGreaterThan(0);
      expect(q.desc.length).toBeGreaterThan(0);
    }
  });
  it('each stat has 20+ regular quests and 4+ per tier', () => {
    for (const stat of STAT_IDS) {
      expect(regular.filter((q) => q.stat === stat).length).toBeGreaterThanOrEqual(20);
      for (const tier of [1, 2, 3, 4] as Tier[])
        expect(regular.filter((q) => q.stat === stat && q.tier === tier).length).toBeGreaterThanOrEqual(4);
    }
  });
  it('has 3+ daily fixed habits at tier 1 with no unlock requirement', () => {
    const fixed = QUEST_POOL.filter((q) => q.fixed);
    expect(fixed.length).toBeGreaterThanOrEqual(3);
    for (const f of fixed) expect(f.requires).toBeUndefined();
  });
  it('baseXp matches tier and harder tiers are gated by the quest\'s own stat level', () => {
    for (const q of QUEST_POOL) expect(q.baseXp).toBe(BALANCE.tierBaseXp[q.tier]);
    for (const q of regular.filter((x) => x.tier === 3)) expect(q.requires).toEqual({ stat: q.stat, level: 5 });
    for (const q of regular.filter((x) => x.tier === 4)) expect(q.requires).toEqual({ stat: q.stat, level: 10 });
    for (const q of regular.filter((x) => x.tier <= 2)) expect(q.requires).toBeUndefined();
  });
});

describe('characters', () => {
  it('8 original characters, 3 available at start', () => {
    expect(CHARACTERS.length).toBe(8);
    expect(CHARACTERS.filter((c) => c.startsUnlocked).length).toBe(3);
    expect(new Set(CHARACTERS.map((c) => c.id)).size).toBe(8);
  });
});

describe('stories and cosmetics', () => {
  it('has a story for every stat x unlock level', () => {
    for (const stat of STAT_IDS)
      for (const lv of BALANCE.statUnlockLevels) {
        const s = STORIES[`story:${stat}:${lv}`];
        expect(s?.title.length).toBeGreaterThan(0);
        expect(s?.text.length).toBeGreaterThan(10);
      }
  });
  it('cosmetic sequence has 12+ unique items, every locked character, and labels for all', () => {
    expect(COSMETIC_SEQUENCE.length).toBeGreaterThanOrEqual(12);
    expect(new Set(COSMETIC_SEQUENCE).size).toBe(COSMETIC_SEQUENCE.length);
    for (const c of CHARACTERS.filter((x) => !x.startsUnlocked)) expect(COSMETIC_SEQUENCE).toContain(`char:${c.id}`);
    for (const id of COSMETIC_SEQUENCE) expect(COSMETIC_LABELS[id]?.length).toBeGreaterThan(0);
  });
});

import { equippedLook } from '../../src/data/cosmetics';
describe('equippedLook', () => {
  it('uses the most advanced unlocked background and every unlocked gear piece', () => {
    expect(equippedLook([])).toEqual({ bg: null, gear: [] });
    expect(equippedLook(['bg:meadow', 'bg:night', 'gear:cape', 'title:novice'])).toEqual({ bg: 'bg:night', gear: ['gear:cape'] });
  });
});
