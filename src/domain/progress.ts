import { BALANCE } from '../data/balance';
import { levelFromXp } from './leveling';
import { STAT_IDS, type PlayerState, type QuestDef, type StatId } from './types';

export function statLevels(state: PlayerState): Record<StatId, number> {
  const out = {} as Record<StatId, number>;
  for (const s of STAT_IDS) out[s] = levelFromXp(state.xp[s]).level;
  return out;
}

export function completeQuest(state: PlayerState, date: string, questId: string, pool: QuestDef[]): PlayerState {
  const weekIdx = state.weeks.findIndex((w) => w.days.some((d) => d.date === date));
  if (weekIdx < 0) return state;
  const week = state.weeks[weekIdx];
  const dayIdx = week.days.findIndex((d) => d.date === date);
  const day = week.days[dayIdx];
  const qIdx = day.quests.findIndex((q) => q.questId === questId);
  const def = pool.find((q) => q.id === questId);
  if (qIdx < 0 || !def || day.quests[qIdx].done) return state;

  const mult = BALANCE.themeMultiplier[week.theme];
  const questXp = (id: string) => {
    const d = pool.find((q) => q.id === id);
    return d ? Math.round(d.baseXp * mult) : 0;
  };

  const xp = { ...state.xp };
  xp[def.stat] += questXp(questId);

  const quests = day.quests.map((q, i) => (i === qIdx ? { ...q, done: true } : q));
  let allDoneBonus = day.allDoneBonus;
  if (!allDoneBonus && quests.every((q) => q.done)) {
    allDoneBonus = true;
    for (const q of quests) {
      const d = pool.find((p) => p.id === q.questId);
      if (d) xp[d.stat] += Math.round(questXp(q.questId) * BALANCE.dayBonusRate);
    }
  }

  const days = week.days.map((d, i) => (i === dayIdx ? { ...d, quests, allDoneBonus } : d));
  let weeklyBonus = week.weeklyBonus;
  if (!weeklyBonus && days.filter((d) => d.allDoneBonus).length >= BALANCE.weeklyBonusDays && state.focusStats) {
    weeklyBonus = true;
    for (const s of state.focusStats) xp[s] += BALANCE.weeklyBonusXp / state.focusStats.length;
  }

  const weeks = state.weeks.map((w, i) => (i === weekIdx ? { ...w, days, weeklyBonus } : w));
  return { ...state, xp, weeks, totalCleared: state.totalCleared + 1 };
}
