import { useEffect, useMemo, useReducer, useState } from 'react';
import { CHARACTERS } from '../data/characters';
import { COSMETIC_SEQUENCE } from '../data/cosmetics';
import { QUEST_POOL } from '../data/questPool';
import { dateKey, addDays, isMonday } from '../domain/dates';
import { generateDay } from '../domain/quests';
import { statLevels } from '../domain/progress';
import { syncState } from '../domain/rollover';
import { completeAndUnlock } from '../domain/unlocks';
import { STAT_IDS, emptyState, type PlayerState, type StatId } from '../domain/types';
import { stripNick } from '../share/codec';
import { createLocalAdapter } from '../storage/adapter';

export type Action =
  | { type: 'init'; now: Date }
  | { type: 'onboard'; characterId: string; focus: [StatId, StatId]; nickname: string }
  | { type: 'complete'; date: string; questId: string }
  | { type: 'changeProfile'; characterId: string; focus: [StatId, StatId]; now: Date }
  | { type: 'setNickname'; nickname: string }
  | { type: 'import'; state: PlayerState; now: Date }
  | { type: 'reset' };

export function isCharacterUnlocked(state: PlayerState, id: string): boolean {
  const c = CHARACTERS.find((x) => x.id === id);
  return !!c && (c.startsUnlocked || state.unlockedIds.includes(`char:${id}`));
}

export function canChangeProfile(state: PlayerState, today: string): boolean {
  return state.characterId === null || isMonday(today);
}

const validFocus = (f: [StatId, StatId]) => f[0] !== f[1] && f.every((s) => STAT_IDS.includes(s));

export function reducer(state: PlayerState, action: Action): PlayerState {
  switch (action.type) {
    case 'init':
      return syncState(state, action.now, QUEST_POOL, Math.random);
    case 'onboard': {
      const base = emptyState();
      if (!isCharacterUnlocked(base, action.characterId) || !validFocus(action.focus)) return state;
      return { ...state, characterId: action.characterId, focusStats: action.focus, nickname: stripNick(action.nickname) };
    }
    case 'complete':
      return completeAndUnlock(state, action.date, action.questId, QUEST_POOL, COSMETIC_SEQUENCE);
    case 'changeProfile': {
      const today = dateKey(action.now);
      if (!canChangeProfile(state, today) || !isCharacterUnlocked(state, action.characterId) || !validFocus(action.focus)) return state;
      let next: PlayerState = { ...state, characterId: action.characterId, focusStats: action.focus };
      const week = next.weeks.at(-1);
      const day = week?.days.at(-1);
      if (week && day && day.date === today && day.quests.every((q) => !q.done)) {
        const prev = week.days.at(-2) ?? next.weeks.at(-2)?.days.at(-1);
        const fresh = generateDay(
          { date: today, theme: week.theme, focus: action.focus, levels: statLevels(next), pool: QUEST_POOL, previousIds: prev?.quests.map((q) => q.questId) ?? [] },
          Math.random,
        );
        next = { ...next, weeks: next.weeks.map((w) => (w === week ? { ...w, days: [...w.days.slice(0, -1), fresh] } : w)) };
      }
      return next;
    }
    case 'setNickname':
      return { ...state, nickname: stripNick(action.nickname) };
    case 'import':
      return syncState(action.state, action.now, QUEST_POOL, Math.random);
    case 'reset':
      return emptyState();
  }
}

/** Owns the game state, persistence, and day rollover (checked every minute and when the tab becomes visible). */
export function useGame() {
  const adapter = useMemo(() => createLocalAdapter(), []);
  const [loaded] = useState(() => adapter.load());
  const [state, dispatch] = useReducer(reducer, loaded.state ?? emptyState());
  const [storageOk, setStorageOk] = useState(true);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  const todayKey = dateKey(now);
  useEffect(() => {
    dispatch({ type: 'init', now });
  }, [todayKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setStorageOk(adapter.save(state));
  }, [state, adapter]);

  return { state, dispatch, todayKey, now, storageOk, recovered: loaded.recovered, yesterdayKey: addDays(todayKey, -1) };
}
