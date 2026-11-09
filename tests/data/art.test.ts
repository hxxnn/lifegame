import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../../src/data/characters';

const withArt = CHARACTERS.filter((c) => c.art);

describe('illustrated characters', () => {
  it('ember, shade and lumi use the illustrations; the rest keep their pixel sprites', () => {
    expect(withArt.map((c) => c.id).sort()).toEqual(['ember', 'lumi', 'shade']);
  });
  it('ships a transparent WebP portrait and full-body image for each, kept small', () => {
    for (const c of withArt) {
      for (const key of ['portrait', 'full'] as const) {
        const file = `public/${c.art![key]}`;
        expect(existsSync(file), file).toBe(true);
        const buf = readFileSync(file);
        expect(buf.subarray(0, 4).toString(), file).toBe('RIFF');
        expect(buf.subarray(8, 12).toString(), file).toBe('WEBP');
        expect(statSync(file).size, file).toBeLessThan(120_000);
        // VP8X header with the alpha flag set means the cut-out kept its transparency
        expect(buf.subarray(12, 16).toString(), file).toBe('VP8X');
        expect(buf[20] & 0x10, file).toBe(0x10);
      }
    }
  });
});
