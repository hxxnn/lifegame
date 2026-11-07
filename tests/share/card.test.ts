import { describe, expect, it } from 'vitest';
import { isCompareHash, parseCompareHash, shareUrl } from '../../src/share/card';
import { latestTitle } from '../../src/data/cosmetics';
import type { SharePayload } from '../../src/share/codec';

const p: SharePayload = { nick: '철수', char: 'shade', lv: { str: 1, agi: 9, int: 4, spi: 2, luk: 7 }, focus: ['agi', 'luk'], title: 'title:novice', cleared: 12 };

describe('share links', () => {
  it('shareUrl / parseCompareHash round-trip', () => {
    const url = shareUrl('https://x.test', p);
    expect(url.startsWith('https://x.test/#/compare/')).toBe(true);
    expect(parseCompareHash(new URL(url).hash)).toEqual(p);
  });
  it('shareUrl keeps a sub-path base intact', () => {
    expect(shareUrl('https://x.test/app/', p).startsWith('https://x.test/app/#/compare/')).toBe(true);
  });
  it('invalid hashes parse to null', () => {
    for (const h of ['#/compare/', '#/compare/%%%', '#/other', '', '#/compare/abc']) expect(parseCompareHash(h)).toBeNull();
  });
  it('isCompareHash detects compare links even when the payload is broken', () => {
    expect(isCompareHash('#/compare/%%%')).toBe(true);
    expect(isCompareHash('#/other')).toBe(false);
  });
  it('latestTitle returns the most advanced unlocked title', () => {
    expect(latestTitle([])).toBeNull();
    expect(latestTitle(['title:novice', 'gear:cape'])).toBe('title:novice');
    expect(latestTitle(['title:novice', 'title:steady'])).toBe('title:steady');
  });
});
