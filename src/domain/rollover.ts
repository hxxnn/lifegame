import { addDays, logicalDate, weekIdOf } from './dates';
import { clearRateOf, rollTheme } from './difficulty';
import { statLevels } from './progress';
import { generateDay } from './quests';
import type { DayRecord, PlayerState, QuestDef, Rng, WeekRecord } from './types';

/** Brings the state up to `now`: settles finished weeks and generates every day since lastDate. */
export function syncState(state: PlayerState, now: Date, pool: QuestDef[], rng: Rng): PlayerState {
  if (!state.characterId || !state.focusStats) return state;
  const today = logicalDate(now, state.settings.dayStartHour);
  if (state.lastDate !== null && today <= state.lastDate) return state;

  const weeks: WeekRecord[] = [...state.weeks];
  const focus = state.focusStats;
  const start = state.lastDate ? addDays(state.lastDate, 1) : today;
  let previousIds = weeks.at(-1)?.days.at(-1)?.quests.map((q) => q.questId) ?? [];

  for (let d = start; d <= today; d = addDays(d, 1)) {
    const weekId = weekIdOf(d);
    let current = weeks.at(-1);
    if (!current || current.weekId !== weekId) {
      let prevRate: number | null = null;
      if (current) {
        prevRate = clearRateOf(current.days);
        weeks[weeks.length - 1] = { ...current, clearRate: prevRate };
      }
      current = { weekId, theme: rollTheme(prevRate, rng), days: [], weeklyBonus: false, clearRate: null };
      weeks.push(current);
    }
    const levels = statLevels({ ...state, weeks });
    const day = generateDay({ date: d, theme: current.theme, focus, levels, pool, previousIds }, rng);
    weeks[weeks.length - 1] = { ...current, days: [...current.days, day] };
    previousIds = day.quests.map((q) => q.questId);
  }
  return { ...state, weeks, lastDate: today };
}

/** Today's record, or the latest generated one if the clock was corrected backwards (so Home never gets stuck). */
export function pickDisplayDay(state: PlayerState, todayKey: string): DayRecord | null {
  const days = state.weeks.flatMap((w) => w.days);
  return days.find((d) => d.date === todayKey) ?? days.at(-1) ?? null;
}
