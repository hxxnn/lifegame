import { BALANCE } from '../data/balance';
import { CHARACTERS } from '../data/characters';
import { COSMETIC_LABELS } from '../data/cosmetics';
import { activeCharacterLevel, CHAR_MAX_LEVEL } from '../domain/characterLevel';
import { STAT_IDS, type PlayerState, type StatId } from '../domain/types';

export interface SharePayload {
  nick: string;
  char: string;
  lv: Record<StatId, number>;
  focus: [StatId, StatId];
  title: string | null;
  cleared: number;
  /** 이 캐릭터의 레벨 (1~99) */
  cl: number;
}

const MAX_INPUT = 2000;
const NICK_MAX = 20;
const MAX_CLEARED = 1_000_000;
const NO_NAME = '이름 없음';
// control chars, zero-width / bidi override characters
const BAD_CHARS = /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g;

export function stripNick(raw: string): string {
  return Array.from(raw.replace(BAD_CHARS, '').trim()).slice(0, NICK_MAX).join('').trim();
}

export function sanitizeNick(raw: string): string {
  return stripNick(raw) || NO_NAME;
}

export function buildPayload(state: PlayerState, levels: Record<StatId, number>, title: string | null): SharePayload {
  return {
    nick: sanitizeNick(state.nickname),
    char: state.characterId ?? '',
    lv: { ...levels },
    focus: state.focusStats ?? ['str', 'int'],
    title,
    cleared: state.totalCleared,
    cl: activeCharacterLevel(state),
  };
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function encodeShare(p: SharePayload): string {
  const arr = [1, p.nick, p.char, STAT_IDS.map((s) => p.lv[s]), p.focus.map((s) => STAT_IDS.indexOf(s)), p.title, p.cleared, p.cl];
  return toBase64Url(new TextEncoder().encode(JSON.stringify(arr)));
}

export function decodeShare(s: string): SharePayload | null {
  try {
    if (typeof s !== 'string' || s.length === 0 || s.length > MAX_INPUT || !/^[A-Za-z0-9_-]+$/.test(s)) return null;
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const text = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    const a: unknown = JSON.parse(text);
    if (!Array.isArray(a) || (a.length !== 7 && a.length !== 8) || a[0] !== 1) return null;
    const [, nick, char, lvs, foc, title, cleared, clRaw] = a as [number, unknown, unknown, unknown, unknown, unknown, unknown, unknown];
    const cl = a.length === 8 ? clRaw : 1; // 캐릭터 레벨이 생기기 전에 만든 링크는 Lv.1로 본다
    if (!Number.isInteger(cl) || (cl as number) < 1 || (cl as number) > CHAR_MAX_LEVEL) return null;
    if (typeof nick !== 'string' || typeof char !== 'string' || !CHARACTERS.some((c) => c.id === char)) return null;
    if (!Array.isArray(lvs) || lvs.length !== STAT_IDS.length) return null;
    if (!lvs.every((v) => Number.isInteger(v) && v >= 1 && v <= BALANCE.maxLevel)) return null;
    if (!Array.isArray(foc) || foc.length !== 2 || foc[0] === foc[1]) return null;
    const focus = foc.map((i) => STAT_IDS[i as number]);
    if (focus.some((f) => f === undefined)) return null;
    if (!Number.isInteger(cleared) || (cleared as number) < 0 || (cleared as number) > MAX_CLEARED) return null;
    const lv = {} as Record<StatId, number>;
    STAT_IDS.forEach((st, i) => (lv[st] = lvs[i] as number));
    const okTitle = typeof title === 'string' && title.startsWith('title:') && title in COSMETIC_LABELS ? title : null;
    return { nick: sanitizeNick(nick), char, lv, focus: focus as [StatId, StatId], title: okTitle, cleared: cleared as number, cl: cl as number };
  } catch {
    return null;
  }
}
