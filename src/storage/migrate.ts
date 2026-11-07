import { CHARACTERS } from '../data/characters';
import { STAT_IDS, type PlayerState, type StatId } from '../domain/types';

const THEMES = ['calm', 'normal', 'challenge', 'hell'];
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isDate = (v: unknown): v is string => typeof v === 'string' && DATE.test(v);
const isNonNegInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

/** Validates untrusted data and returns a PlayerState, or null when it is not a valid v1 save. */
export function migrate(input: unknown): PlayerState | null {
  if (!isObj(input) || (input.version !== 1 && input.version !== 2)) return null;
  // v1 -> v2: add the new fields with defaults
  const raw: Record<string, unknown> = input.version === 1
    ? { ...input, version: 2, settings: { dayStartHour: 0 }, backup: { lastAt: null, nudgedAt: null }, reportSeenWeek: null }
    : input;
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
    }
  }
  return raw as unknown as PlayerState;
}
