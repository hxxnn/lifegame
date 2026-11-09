import { CHARACTERS } from '../data/characters';
import { CHAR_MAX_LEVEL, charXpForLevel } from '../domain/characterLevel';
import { levelFromXp } from '../domain/leveling';
import { STAT_IDS, type PlayerState, type StatId } from '../domain/types';

const THEMES = ['calm', 'normal', 'challenge', 'hell'];
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isDate = (v: unknown): v is string => typeof v === 'string' && DATE.test(v);
const isNonNegInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

/** v1 -> v2: 지난주 결산이 업그레이드 직후 갑자기 뜨지 않도록 직전 주를 '본 것'으로 처리한다. */
function previousWeekId(weeks: unknown): string | null {
  if (!Array.isArray(weeks) || weeks.length < 2) return null;
  const prev = weeks[weeks.length - 2] as { weekId?: unknown } | null;
  return prev && typeof prev.weekId === 'string' ? prev.weekId : null;
}

/** v2 -> v3: 지금까지의 진행(스탯 레벨 합으로 계산하던 캐릭터 레벨)을 지금 고른 캐릭터에게 그대로 넘긴다. */
function charactersFromStats(raw: Record<string, unknown>): Record<string, { xp: number }> {
  const id = raw.characterId;
  if (typeof id !== 'string' || !isObj(raw.xp)) return {};
  let sum = 0;
  for (const s of STAT_IDS) {
    const v = raw.xp[s];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return {};
    sum += levelFromXp(v).level;
  }
  const oldLevel = Math.min(CHAR_MAX_LEVEL, Math.max(1, sum - (STAT_IDS.length - 1)));
  return { [id]: { xp: charXpForLevel(oldLevel) } };
}

/** Validates untrusted data (v1, v2 or v3) and returns an up-to-date PlayerState, or null when it is not a valid save. */
export function migrate(input: unknown): PlayerState | null {
  if (!isObj(input) || (input.version !== 1 && input.version !== 2 && input.version !== 3)) return null;
  let raw: Record<string, unknown> = input;
  // v1 -> v2: add the new fields with defaults
  if (raw.version === 1) raw = { ...raw, version: 2, settings: { dayStartHour: 0 }, backup: { lastAt: null, nudgedAt: null }, reportSeenWeek: previousWeekId(raw.weeks) };
  // v2 -> v3: per-character progress
  if (raw.version === 2) raw = { ...raw, version: 3, characters: charactersFromStats(raw) };
  if (!isObj(raw.characters)) return null;
  for (const [id, v] of Object.entries(raw.characters)) {
    if (!CHARACTERS.some((c) => c.id === id) || !isObj(v) || typeof v.xp !== 'number' || !Number.isFinite(v.xp) || v.xp < 0 || v.xp > 1e9) return null;
  }
  if (!isObj(raw.settings) || !Number.isInteger(raw.settings.dayStartHour) || (raw.settings.dayStartHour as number) < 0 || (raw.settings.dayStartHour as number) > 6) return null;
  if (!isObj(raw.backup) || (raw.backup.lastAt !== null && !isDate(raw.backup.lastAt)) || (raw.backup.nudgedAt !== null && !isDate(raw.backup.nudgedAt))) return null;
  if (raw.reportSeenWeek !== null && !isDate(raw.reportSeenWeek)) return null;
  if (!isStr(raw.nickname) || Array.from(raw.nickname).length > 20) return null;
  if (raw.characterId !== null && !CHARACTERS.some((c) => c.id === raw.characterId)) return null;
  if ((raw.characterId === null) !== (raw.focusStats === null)) return null;
  const f = raw.focusStats;
  if (f !== null) {
    if (!Array.isArray(f) || f.length !== 2 || f[0] === f[1] || !f.every((s) => STAT_IDS.includes(s as StatId))) return null;
  }
  if (!isObj(raw.xp)) return null;
  for (const s of STAT_IDS) {
    const v = raw.xp[s];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return null;
  }
  if (!Array.isArray(raw.unlockedIds) || !raw.unlockedIds.every(isStr)) return null;
  if (!isNonNegInt(raw.totalCleared)) return null;
  if (raw.lastDate !== null && !isDate(raw.lastDate)) return null;
  if (!Array.isArray(raw.weeks)) return null;
  for (const w of raw.weeks) {
    if (!isObj(w) || !isDate(w.weekId) || !THEMES.includes(w.theme as string) || typeof w.weeklyBonus !== 'boolean') return null;
    if (w.clearRate !== null && typeof w.clearRate !== 'number') return null;
    if (!Array.isArray(w.days)) return null;
    for (const d of w.days) {
      if (!isObj(d) || !isDate(d.date) || typeof d.allDoneBonus !== 'boolean' || !Array.isArray(d.quests)) return null;
      if (!d.quests.every((q) => isObj(q) && isStr(q.questId) && typeof q.done === 'boolean')) return null;
      if (d.swaps !== undefined && !isNonNegInt(d.swaps)) return null;
      if (d.swappedOut !== undefined && !(Array.isArray(d.swappedOut) && d.swappedOut.every(isStr))) return null;
    }
  }
  return raw as unknown as PlayerState;
}
