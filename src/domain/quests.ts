import { BALANCE } from '../data/balance';
import { isWeekend } from './dates';
import { pickWeighted } from './rng';
import { STAT_IDS, type DayRecord, type QuestDef, type Rng, type StatId, type ThemeId, type Tier } from './types';

export function dailyQuestCount(date: string): 5 | 7 {
  return isWeekend(date) ? 7 : 5;
}

export function isUnlocked(q: QuestDef, levels: Record<StatId, number>): boolean {
  return !q.requires || levels[q.requires.stat] >= q.requires.level;
}

export interface GenerateArgs {
  date: string;
  theme: ThemeId;
  focus: [StatId, StatId];
  levels: Record<StatId, number>;
  pool: QuestDef[];
  previousIds: string[];
}

function pickOne<T>(items: T[], rng: Rng): T {
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))];
}

function closestTier(cands: QuestDef[], tier: Tier): QuestDef[] {
  const best = Math.min(...cands.map((q) => Math.abs(q.tier - tier)));
  return cands.filter((q) => Math.abs(q.tier - tier) === best);
}

export function generateDay(args: GenerateArgs, rng: Rng): DayRecord {
  const { date, theme, focus, levels, previousIds } = args;
  const prev = new Set(previousIds);
  const unlocked = args.pool.filter((q) => isUnlocked(q, levels));
  const picked: QuestDef[] = [];
  const used = new Set<string>();

  const fixed = unlocked.filter((q) => q.fixed);
  if (fixed.length > 0) {
    const fresh = fixed.filter((q) => !prev.has(q.id));
    const f = pickOne(fresh.length > 0 ? fresh : fixed, rng);
    picked.push(f);
    used.add(f.id);
  }

  const regular = unlocked.filter((q) => !q.fixed);
  const others = STAT_IDS.filter((s) => !focus.includes(s));
  const statWeights = STAT_IDS.map((s) => ({
    item: s,
    weight: focus.includes(s) ? BALANCE.focusShare / 2 : (1 - BALANCE.focusShare) / others.length,
  }));
  const tierWeights = Object.entries(BALANCE.themeTierWeights[theme]).map(([t, w]) => ({ item: Number(t) as Tier, weight: w as number }));

  const count = dailyQuestCount(date);
  while (picked.length < count) {
    const stat = pickWeighted(statWeights, rng);
    const tier = pickWeighted(tierWeights, rng);
    const free = regular.filter((q) => !used.has(q.id));
    const sameStat = free.filter((q) => q.stat === stat);
    const stages: (() => QuestDef[])[] = [
      () => sameStat.filter((q) => q.tier === tier && !prev.has(q.id)),
      () => sameStat.filter((q) => q.tier === tier),
      () => closest(sameStat.filter((q) => !prev.has(q.id))),
      () => closest(sameStat),
      () => closest(free.filter((q) => !prev.has(q.id))),
      () => closest(free),
    ];
    function closest(c: QuestDef[]): QuestDef[] {
      return c.length > 0 ? closestTier(c, tier) : c;
    }
    let chosen: QuestDef | undefined;
    for (const stage of stages) {
      const c = stage();
      if (c.length > 0) {
        chosen = pickOne(c, rng);
        break;
      }
    }
    if (!chosen) break; // pool exhausted
    picked.push(chosen);
    used.add(chosen.id);
  }

  return { date, quests: picked.map((q) => ({ questId: q.id, done: false })), allDoneBonus: false };
}
