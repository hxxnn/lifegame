import { STAT_IDS, type PlayerState, type StatId } from '../domain/types';

const THEMES = ['calm', 'normal', 'challenge', 'hell'];
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNonNegInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

/** Validates untrusted data and returns a PlayerState, or null when it is not a valid v1 save. */
export function migrate(raw: unknown): PlayerState | null {
  if (!isObj(raw) || raw.version !== 1) return null;
  if (!isStr(raw.nickname) || raw.nickname.length > 20) return null;
  if (raw.characterId !== null && !isStr(raw.characterId)) return null;
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
  if (raw.lastDate !== null && !isStr(raw.lastDate)) return null;
  if (!Array.isArray(raw.weeks)) return null;
  for (const w of raw.weeks) {
    if (!isObj(w) || !isStr(w.weekId) || !THEMES.includes(w.theme as string) || typeof w.weeklyBonus !== 'boolean') return null;
    if (w.clearRate !== null && typeof w.clearRate !== 'number') return null;
    if (!Array.isArray(w.days)) return null;
    for (const d of w.days) {
      if (!isObj(d) || !isStr(d.date) || typeof d.allDoneBonus !== 'boolean' || !Array.isArray(d.quests)) return null;
      if (!d.quests.every((q) => isObj(q) && isStr(q.questId) && typeof q.done === 'boolean')) return null;
    }
  }
  return raw as unknown as PlayerState;
}
