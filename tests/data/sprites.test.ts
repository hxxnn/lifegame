import { describe, expect, it } from 'vitest';
import { BACKGROUNDS, SPRITES, composeAvatar } from '../../src/data/sprites';
import { CHARACTERS } from '../../src/data/characters';
import { COSMETIC_SEQUENCE } from '../../src/data/cosmetics';

const mask = (rows: string[]) => rows.map((r) => [...r].map((c) => (c === '.' ? 0 : 1)));
const distance = (a: number[][], b: number[][]) => a.flat().reduce<number>((d, v, i) => d + (v !== b.flat()[i] ? 1 : 0), 0);

describe('pixel sprites', () => {
  it('has one 16x16 sprite per character, using only palette colors', () => {
    expect(Object.keys(SPRITES).sort()).toEqual(CHARACTERS.map((c) => c.id).sort());
    for (const [id, s] of Object.entries(SPRITES)) {
      expect(s.rows.length, id).toBe(16);
      for (const r of s.rows) {
        expect(r.length, id).toBe(16);
        for (const ch of r) expect(ch === '.' || ch in s.palette, `${id}:${ch}`).toBe(true);
      }
      const filled = s.rows.join('').replace(/\./g, '').length;
      expect(filled, id).toBeGreaterThan(70);
      expect(filled, id).toBeLessThan(220);
    }
  });
  it('gives every character its own silhouette (no shared template)', () => {
    const ids = Object.keys(SPRITES);
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++)
        expect(distance(mask(SPRITES[ids[i]].rows), mask(SPRITES[ids[j]].rows)), `${ids[i]} vs ${ids[j]}`).toBeGreaterThanOrEqual(24);
  });
  it('has a pixel scene for every unlockable background', () => {
    const bgs = COSMETIC_SEQUENCE.filter((id) => id.startsWith('bg:'));
    expect(bgs.length).toBeGreaterThan(0);
    for (const id of bgs) {
      const b = BACKGROUNDS[id];
      expect(b, id).toBeDefined();
      expect(b.rows.length).toBe(16);
      for (const r of b.rows) expect(r.length).toBe(16);
    }
  });
});

describe('composeAvatar', () => {
  const inBounds = (px: { x: number; y: number }[]) => px.every((p) => p.x >= 0 && p.x < 16 && p.y >= 0 && p.y < 16);
  it('draws just the sprite on the default background when nothing is unlocked', () => {
    const a = composeAvatar('ember', []);
    expect(a.sprite.length).toBeGreaterThan(70);
    expect(a.behind).toEqual([]);
    expect(a.front).toEqual([]);
    expect(a.scene).toBeNull();
  });
  it('puts the cape behind the sprite, the helm and sword in front, and the newest scene as background', () => {
    const a = composeAvatar('luna', ['bg:meadow', 'bg:night', 'gear:cape', 'gear:iron-helm', 'gear:wooden-sword']);
    expect(a.behind.length).toBeGreaterThan(0);
    expect(a.front.length).toBeGreaterThan(0);
    expect(a.scene).not.toBeNull();
    expect(a.scene!.length).toBeGreaterThan(100);
    for (const layer of [a.behind, a.front, a.sprite, a.scene!]) expect(inBounds(layer)).toBe(true);
    const night = composeAvatar('luna', ['bg:night']).scene!;
    expect(a.scene).toEqual(night); // newest background wins
  });
  it('places the helm on top of this character\'s head', () => {
    for (const id of Object.keys(SPRITES)) {
      const a = composeAvatar(id, ['gear:iron-helm']);
      expect(a.front.length, id).toBeGreaterThan(4);
      const topOfHead = Math.min(...a.sprite.map((p) => p.y));
      expect(Math.min(...a.front.map((p) => p.y)), id).toBeGreaterThanOrEqual(topOfHead);
      expect(Math.min(...a.front.map((p) => p.y)), id).toBeLessThanOrEqual(topOfHead + 6);
    }
  });
});
