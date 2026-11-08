import { addDays, logicalDate, weekIdOf } from './dates';
import { allowedThemes, clearRateOf, rollTheme } from './difficulty';
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
      const lv = statLevels({ ...state, weeks });
      current = { weekId, theme: rollTheme(prevRate, rng, allowedThemes(focus.map((s) => lv[s]))), days: [], weeklyBonus: false, clearRate: null };
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

/** 화면과 규칙이 쓰는 '오늘'. 이미 생성된 마지막 날보다 앞으로 가지 않는다(하루 시작 시간을 늦췄거나 시계가 되돌려진 경우). */
export function effectiveToday(state: PlayerState, now: Date): string {
  const logical = logicalDate(now, state.settings.dayStartHour);
  return state.lastDate !== null && state.lastDate > logical ? state.lastDate : logical;
}
