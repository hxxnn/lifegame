import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CHARACTERS, STAGE_LEVELS, artStage } from '../../src/data/characters';

const withArt = CHARACTERS.filter((c) => c.art);
const le24 = (b: Buffer, o: number) => b[o] | (b[o + 1] << 8) | (b[o + 2] << 16);

describe('illustrated characters', () => {
  it('ember, shade and lumi use the illustrations; the rest keep their pixel sprites', () => {
    expect(withArt.map((c) => c.id).sort()).toEqual(['ember', 'lumi', 'shade']);
  });
  it('has five stages per character at levels 1, 25, 50, 75 and 99', () => {
    expect(STAGE_LEVELS).toEqual([1, 25, 50, 75, 99]);
    for (const c of withArt) expect(c.art!.stages.map((s) => s.level), c.id).toEqual(STAGE_LEVELS);
  });
  it('ships transparent WebP images in a fixed size, kept small', () => {
    for (const c of withArt)
      for (const s of c.art!.stages)
        for (const key of ['portrait', 'full'] as const) {
          const file = `public/${s[key]}`;
          expect(existsSync(file), file).toBe(true);
          const buf = readFileSync(file);
          expect(buf.subarray(0, 4).toString(), file).toBe('RIFF');
          expect(buf.subarray(8, 12).toString(), file).toBe('WEBP');
          expect(buf.subarray(12, 16).toString(), file).toBe('VP8X');
          expect(buf[20] & 0x10, `${file} keeps its alpha channel`).toBe(0x10);
          expect(statSync(file).size, file).toBeLessThan(120_000);
          const width = le24(buf, 24) + 1, height = le24(buf, 27) + 1;
          if (key === 'portrait') expect([width, height], file).toEqual([256, 256]);
          else expect(height, file).toBe(640);
        }
  });
});

describe('artStage', () => {
  const art = CHARACTERS.find((c) => c.id === 'ember')!.art!;
  it('picks the newest stage the character level has reached', () => {
    const idx = (lv: number) => art.stages.indexOf(artStage(art, lv));
    expect([1, 24, 25, 49, 50, 74, 75, 98, 99, 146].map(idx)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
    expect(idx(0)).toBe(0);
  });
});
