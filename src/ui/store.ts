import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { CHARACTERS } from '../data/characters';
import { COSMETIC_SEQUENCE } from '../data/cosmetics';
import { QUEST_POOL } from '../data/questPool';
import { addDays, isMonday } from '../domain/dates';
import { generateDay } from '../domain/quests';
import { statLevels } from '../domain/progress';
import { effectiveToday, syncState } from '../domain/rollover';
import { swapQuest } from '../domain/swap';
import { completeAndUnlock } from '../domain/unlocks';
import { STAT_IDS, emptyState, type PlayerState, type StatId } from '../domain/types';
import { stripNick } from '../share/codec';
import { STORAGE_KEY, createLocalAdapter, parseExternalSave } from '../storage/adapter';

export type Action =
  | { type: 'init'; now: Date }
  | { type: 'onboard'; characterId: string; focus: [StatId, StatId]; nickname: string }
  | { type: 'complete'; date: string; questId: string }
  | { type: 'changeCharacter'; characterId: string }
  | { type: 'changeFocus'; focus: [StatId, StatId]; now: Date }
  | { type: 'setNickname'; nickname: string }
  | { type: 'import'; state: PlayerState; now: Date }
  | { type: 'swap'; date: string; questId: string }
  | { type: 'dismissReport'; weekId: string }
  | { type: 'markBackup'; date: string }
  | { type: 'snoozeBackup'; date: string }
  | { type: 'setDayStart'; hour: number }
  | { type: 'reset' };

export function isCharacterUnlocked(state: PlayerState, id: string): boolean {
  const c = CHARACTERS.find((x) => x.id === id);
  return !!c && (c.startsUnlocked || state.unlockedIds.includes(`char:${id}`));
}

/** 주력 스탯은 월요일에만 바꿀 수 있다(처음 고를 때는 언제든). 캐릭터는 요일과 상관없이 바꿀 수 있다. */
export function canChangeFocus(state: PlayerState, today: string): boolean {
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
    case 'changeCharacter':
      // 캐릭터마다 자기 레벨이 따로 있으니 언제든 바꿀 수 있다. 퀘스트와 스탯은 건드리지 않는다.
      if (state.characterId === null || action.characterId === state.characterId || !isCharacterUnlocked(state, action.characterId)) return state;
      return { ...state, characterId: action.characterId };
    case 'changeFocus': {
      const today = effectiveToday(state, action.now);
      if (!canChangeFocus(state, today) || !validFocus(action.focus)) return state;
      let next: PlayerState = { ...state, focusStats: action.focus };
      const week = next.weeks.at(-1);
      const day = week?.days.at(-1);
      if (week && day && day.date === today && day.quests.every((q) => !q.done)) {
        const prev = week.days.at(-2) ?? next.weeks.at(-2)?.days.at(-1);
        const fresh = generateDay(
          { date: today, theme: week.theme, focus: action.focus, levels: statLevels(next), pool: QUEST_POOL, previousIds: prev?.quests.map((q) => q.questId) ?? [] },
          Math.random,
        );
        const kept = { ...fresh, ...(day.swaps !== undefined ? { swaps: day.swaps } : {}), ...(day.swappedOut ? { swappedOut: day.swappedOut } : {}) };
        next = { ...next, weeks: next.weeks.map((w) => (w === week ? { ...w, days: [...w.days.slice(0, -1), kept] } : w)) };
      }
      return next;
    }
    case 'setNickname':
      return { ...state, nickname: stripNick(action.nickname) };
    case 'import':
      return syncState(action.state, action.now, QUEST_POOL, Math.random);
    case 'swap':
      return swapQuest(state, action.date, action.questId, QUEST_POOL, Math.random);
    case 'dismissReport':
      return { ...state, reportSeenWeek: action.weekId };
    case 'markBackup':
      return { ...state, backup: { lastAt: action.date, nudgedAt: action.date } };
    case 'snoozeBackup':
      return { ...state, backup: { ...state.backup, nudgedAt: action.date } };
    case 'setDayStart':
      return Number.isInteger(action.hour) && action.hour >= 0 && action.hour <= 6 ? { ...state, settings: { ...state.settings, dayStartHour: action.hour } } : state;
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
  const stateRef = useRef(state);
  stateRef.current = state;

  // 다른 탭이 저장하면 그 내용을 받아 온다. 이전 버전 탭이 덮어쓴 데이터는 무시하고 내 상태를 다시 저장한다.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const incoming = parseExternalSave(e.newValue);
      if (incoming) dispatch({ type: 'import', state: incoming, now: new Date() });
      else adapter.save(stateRef.current);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [adapter]);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  const todayKey = effectiveToday(state, now);
  useEffect(() => {
    dispatch({ type: 'init', now });
  }, [todayKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setStorageOk(adapter.save(state));
  }, [state, adapter]);

  return { state, dispatch, todayKey, now, storageOk, recovered: loaded.recovered, yesterdayKey: addDays(todayKey, -1) };
}
