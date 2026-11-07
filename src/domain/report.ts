import { BALANCE } from '../data/balance';
import { addDays, daysBetween } from './dates';
import type { PlayerState, QuestDef, StatId, ThemeId } from './types';

export interface WeekReport {
  weekId: string;
  theme: ThemeId;
  done: number;
  total: number;
  clearRate: number;
  fullDays: number;
  weeklyBonus: boolean;
  xpByStat: Record<StatId, number>;
}
export interface PendingReport extends WeekReport { nextTheme: ThemeId; reason: string }

export function buildWeekReport(state: PlayerState, weekId: string, pool: QuestDef[]): WeekReport | null {
  const week = state.weeks.find((w) => w.weekId === weekId);
  if (!week) return null;
  const mult = BALANCE.themeMultiplier[week.theme];
  const xpByStat = { str: 0, agi: 0, int: 0, spi: 0, luk: 0 } as Record<StatId, number>;
  let done = 0, total = 0, fullDays = 0;
  for (const day of week.days) {
    if (day.allDoneBonus) fullDays++;
    for (const q of day.quests) {
      total++;
      const def = pool.find((p) => p.id === q.questId);
      if (!q.done || !def) continue;
      done++;
      const xp = Math.round(def.baseXp * mult);
      xpByStat[def.stat] += xp + (day.allDoneBonus ? Math.round(xp * BALANCE.dayBonusRate) : 0);
    }
  }
  return { weekId, theme: week.theme, done, total, clearRate: week.clearRate ?? (total ? done / total : 0), fullDays, weeklyBonus: week.weeklyBonus, xpByStat };
}

export function themeReason(prevClearRate: number | null): string {
  if (prevClearRate === null) return '첫 주라서 기본 확률로 정해졌어요.';
  const pct = Math.round(prevClearRate * 100);
  if (prevClearRate >= BALANCE.highClear) return `지난주 클리어율 ${pct}%라서 도전·지옥의 주가 나올 확률이 올라갔어요.`;
  if (prevClearRate <= BALANCE.lowClear) return `지난주 클리어율 ${pct}%라서 쉬운 주(평온·보통)가 나올 확률이 올라갔어요.`;
  return `지난주 클리어율 ${pct}%는 기준 범위라서 기본 확률로 정해졌어요.`;
}

/** 아직 안 본 지난주 결산. 새 주 기록이 있어야 한다. */
export function pendingReport(state: PlayerState, pool: QuestDef[]): PendingReport | null {
  if (state.weeks.length < 2) return null;
  const prev = state.weeks.at(-2)!;
  const cur = state.weeks.at(-1)!;
  if (state.reportSeenWeek === prev.weekId) return null;
  const base = buildWeekReport(state, prev.weekId, pool);
  return base ? { ...base, nextTheme: cur.theme, reason: themeReason(prev.clearRate) } : null;
}

export function yesterdaySummary(state: PlayerState, today: string): { done: number; total: number } | null {
  const date = addDays(today, -1);
  const day = state.weeks.flatMap((w) => w.days).find((d) => d.date === date);
  return day ? { done: day.quests.filter((q) => q.done).length, total: day.quests.length } : null;
}

/** 백업 안내가 필요하면 마지막 백업 이후 일수(없으면 days: null)를 돌려준다. */
export function backupNudge(state: PlayerState, today: string): { days: number | null } | null {
  if (state.totalCleared < BALANCE.backupMinCleared) return null;
  if (state.backup.nudgedAt === today) return null;
  if (state.backup.lastAt === null) return { days: null };
  const days = daysBetween(state.backup.lastAt, today);
  return days >= BALANCE.backupNudgeDays ? { days } : null;
}
