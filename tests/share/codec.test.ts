import { describe, expect, it } from 'vitest';
import { buildPayload, decodeShare, encodeShare, type SharePayload } from '../../src/share/codec';
import { emptyState } from '../../src/domain/types';

const payload = (over: Partial<SharePayload> = {}): SharePayload => ({
  nick: '모험가', char: 'ember', lv: { str: 5, agi: 3, int: 12, spi: 1, luk: 30 },
  focus: ['str', 'int'], title: 'title:novice', cleared: 42, cl: 26, ...over,
});

describe('share codec', () => {
  it('round-trips', () => {
    expect(decodeShare(encodeShare(payload()))).toEqual(payload());
    expect(decodeShare(encodeShare(payload({ title: null })))).toEqual(payload({ title: null }));
  });
  it('rejects out-of-range or non-integer levels', () => {
    for (const bad of [0, 31, 2.5, -1])
      expect(decodeShare(encodeShare(payload({ lv: { str: bad, agi: 1, int: 1, spi: 1, luk: 1 } })))).toBeNull();
  });
  it('rejects unknown character ids, equal focus stats and negative clear counts', () => {
    expect(decodeShare(encodeShare(payload({ char: 'goku' })))).toBeNull();
    expect(decodeShare(encodeShare(payload({ focus: ['str', 'str'] })))).toBeNull();
    expect(decodeShare(encodeShare(payload({ cleared: -3 })))).toBeNull();
  });
  it('truncates the nickname to 20 chars and strips control / bidi characters', () => {
    const nick = '\u0000‮' + '<img src=x onerror=alert(1)>' + 'a'.repeat(50);
    const out = decodeShare(encodeShare(payload({ nick })));
    expect(out).not.toBeNull();
    expect(out!.nick).toBe('<img src=x onerror=a');
    expect(out!.nick.length).toBeLessThanOrEqual(20);
    expect(decodeShare(encodeShare(payload({ nick: '   ' })))!.nick).toBe('이름 없음');
  });
  it('garbage input returns null and never throws', () => {
    for (const bad of ['', '%%%', 'hello world', btoa('hello'), btoa('[1,2,3]'), 'a'.repeat(3000)])
      expect(decodeShare(bad)).toBeNull();
  });
  it('encoded form is URL safe and compact', () => {
    const s = encodeShare(payload({ nick: '가'.repeat(20) }));
    expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(s.length).toBeLessThanOrEqual(300);
  });
  it('unknown titles are dropped instead of failing', () => {
    expect(decodeShare(encodeShare(payload({ title: 'title:hacker' })))!.title).toBeNull();
  });
  it('buildPayload reads nickname, character and clear count from the state', () => {
    const state = { ...emptyState(), nickname: '철수', characterId: 'shade', focusStats: ['agi', 'luk'] as ['agi', 'luk'], totalCleared: 9 };
    expect(buildPayload({ ...state, characters: { shade: { xp: 2374 } } }, payload().lv, null)).toEqual({ nick: '철수', char: 'shade', lv: payload().lv, focus: ['agi', 'luk'], title: null, cleared: 9, cl: 25 });
  });
});

describe('share link bounds', () => {
  it('rejects an absurd clear count', () => {
    expect(decodeShare(encodeShare(payload({ cleared: 1_000_001 })))).toBeNull();
    expect(decodeShare(encodeShare(payload({ cleared: 1_000_000 })))).not.toBeNull();
  });
});


describe('share link character level', () => {
  const b64 = (arr: unknown[]) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(arr)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  it('still opens links made before character levels existed (treated as Lv.1)', () => {
    const old = b64([1, '철수', 'ember', [1, 1, 1, 1, 1], [0, 1], null, 3]);
    expect(decodeShare(old)!.cl).toBe(1);
  });
  it('rejects a character level outside 1..99', () => {
    expect(decodeShare(encodeShare(payload({ cl: 0 })))).toBeNull();
    expect(decodeShare(encodeShare(payload({ cl: 100 })))).toBeNull();
    expect(decodeShare(encodeShare(payload({ cl: 99 })))!.cl).toBe(99);
  });
});
