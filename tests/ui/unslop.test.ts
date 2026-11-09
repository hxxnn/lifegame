import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// unslop 점검: AI 기본값처럼 보이는 신호가 다시 들어오지 않도록 지킨다.
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const srcFiles = [...walk('src/ui'), ...walk('src/data'), 'src/share/card.ts'].filter((f) => /\.tsx?$/.test(f));
const css = readFileSync('src/ui/styles.css', 'utf8');

describe('unslop: icons and copy', () => {
  it('uses no emoji or star glyphs as icons', () => {
    const emoji = /[\u{1F300}-\u{1FAFF}☀-➿⭐✅★☆]/u;
    const hits = srcFiles.filter((f) => emoji.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });
  it('has no exclamation marks in Korean interface text', () => {
    const hits = walk('src/ui').filter((f) => /\.tsx?$/.test(f) && /[가-힣]!/.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });
});

describe('unslop: styles', () => {
  it('keeps font weights at 600 or below', () => {
    const weights = [...css.matchAll(/font-weight:\s*(\d+)/g)].map((m) => Number(m[1]));
    expect(weights.filter((w) => w > 600)).toEqual([]);
  });
  it('has no hue gradients and no full-pill radii', () => {
    expect(css).not.toMatch(/linear-gradient|radial-gradient/);
    expect(css).not.toMatch(/border-radius:\s*(99|999)px/);
  });
  it('uses one easing curve, never bouncy, and never animates width', () => {
    const curves = new Set([...css.matchAll(/cubic-bezier\([^)]*\)/g)].map((m) => m[0].replace(/\s/g, '')));
    expect([...curves]).toEqual(['cubic-bezier(0.22,1,0.36,1)']);
    expect(css).not.toMatch(/transition:[^;]*\bwidth\b/);
  });
  it('puts every spacing value on the 4px grid (2px nudges allowed)', () => {
    const bad: string[] = [];
    for (const m of css.matchAll(/(?:^|[;{\s])(padding|margin|gap)(?:-[a-z]+)?:\s*([^;}{]+)/g)) {
      for (const v of m[2].match(/-?\d+(?:\.\d+)?px/g) ?? []) {
        const n = Math.abs(parseFloat(v));
        if (n % 4 !== 0 && n !== 2 && n !== 0) bad.push(`${m[1]}: ${v}`);
      }
    }
    expect([...new Set(bad)]).toEqual([]);
  });
  it('sets tabular figures for numbers', () => {
    expect(css).toMatch(/font-variant-numeric:\s*tabular-nums/);
  });
});
