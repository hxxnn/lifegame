import { describe, expect, it } from 'vitest';
import { CHAR_MAX_LEVEL, activeCharacterLevel, charLevelFromXp, charLevelProgress, charXpForLevel, levelOfCharacter } from '../../src/domain/characterLevel';
import { emptyState } from '../../src/domain/types';

describe('character level curve', () => {
  it('needs 0, 2,374, 10,630, 25,264 and 45,572 xp for Lv.1, 25, 50, 75 and 99', () => {
    expect([1, 2, 3, 10, 25, 26, 50, 75, 99].map(charXpForLevel)).toEqual([0, 3, 13, 303, 2374, 2587, 10630, 25264, 45572]);
    expect(CHAR_MAX_LEVEL).toBe(99);
  });
  it('charLevelFromXp is the exact inverse, capped at 99', () => {
    for (let l = 1; l <= 99; l++) {
      expect(charLevelFromXp(charXpForLevel(l)), `Lv.${l}`).toBe(l);
      if (l > 1) expect(charLevelFromXp(charXpForLevel(l) - 1), `Lv.${l} - 1xp`).toBe(l - 1);
    }
    expect(charLevelFromXp(1e9)).toBe(99);
    expect(charLevelFromXp(-5)).toBe(1);
    expect(charLevelFromXp(Number.NaN)).toBe(1);
  });
  it('charLevelProgress reports xp into the level and the xp needed for the next', () => {
    expect(charLevelProgress(0)).toEqual({ level: 1, into: 0, need: 3 });
    expect(charLevelProgress(5)).toEqual({ level: 2, into: 2, need: 10 });
    expect(charLevelProgress(1e9)).toEqual({ level: 99, into: 1e9 - 45572, need: null });
  });
  it('every character has its own level, defaulting to Lv.1', () => {
    const s = { ...emptyState(), characterId: 'ember', characters: { ember: { xp: 2374 } } };
    expect(levelOfCharacter(s, 'ember')).toBe(25);
    expect(levelOfCharacter(s, 'lumi')).toBe(1);
    expect(activeCharacterLevel(s)).toBe(25);
    expect(activeCharacterLevel(emptyState())).toBe(1);
  });
});
