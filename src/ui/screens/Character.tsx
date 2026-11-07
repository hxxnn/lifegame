import { useState } from 'react';
import { CHARACTERS } from '../../data/characters';
import { addDays, weekIdOf } from '../../domain/dates';
import { STAT_IDS, STAT_NAMES, type PlayerState, type StatId } from '../../domain/types';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { StatBar } from '../components/StatBar';
import { canChangeProfile, isCharacterUnlocked, type Action } from '../store';

export function Character({ state, todayKey, dispatch }: { state: PlayerState; todayKey: string; dispatch: (a: Action) => void }) {
  const current = CHARACTERS.find((c) => c.id === state.characterId) ?? CHARACTERS[0];
  const editable = canChangeProfile(state, todayKey);
  const [characterId, setCharacterId] = useState(current.id);
  const [focus, setFocus] = useState<StatId[]>(state.focusStats ?? []);
  const toggle = (s: StatId) => setFocus((f) => (f.includes(s) ? f.filter((x) => x !== s) : f.length < 2 ? [...f, s] : f));
  const nextMonday = addDays(weekIdOf(todayKey), 7);

  return (
    <>
      <section className="card row">
        <CharacterAvatar id={current.id} size={96} unlockedIds={state.unlockedIds} />
        <div className="grow">
          <h1>{current.name}</h1>
          <p className="muted">{current.tagline}</p>
          <p className="muted">주력 스탯: {state.focusStats?.map((s) => STAT_NAMES[s]).join(', ')}</p>
        </div>
      </section>
      <section className="card">
        <h2>스탯</h2>
        {STAT_IDS.map((s) => <StatBar key={s} stat={s} xp={state.xp[s]} focus={state.focusStats?.includes(s)} />)}
      </section>
      <section className="card">
        <h2>캐릭터·주력 스탯 변경</h2>
        {!editable ? (
          <p className="muted">변경은 월요일에만 할 수 있어요. 다음 변경 가능일: {nextMonday}</p>
        ) : (
          <>
            <div className="grid" style={{ marginBottom: 10 }}>
              {CHARACTERS.map((c) => (
                <button key={c.id} className="pick" aria-pressed={characterId === c.id} disabled={!isCharacterUnlocked(state, c.id)} onClick={() => setCharacterId(c.id)}>
                  <CharacterAvatar id={c.id} size={56} /><div><strong>{c.name}</strong></div>
                  {!isCharacterUnlocked(state, c.id) && <div className="muted">🔒</div>}
                </button>
              ))}
            </div>
            <div className="grid" style={{ marginBottom: 10 }}>
              {STAT_IDS.map((s) => (
                <button key={s} className={`pick stat-${s}`} aria-pressed={focus.includes(s)} onClick={() => toggle(s)}><strong>{STAT_NAMES[s]}</strong></button>
              ))}
            </div>
            <button className="btn" disabled={focus.length !== 2} onClick={() => dispatch({ type: 'changeProfile', characterId, focus: focus as [StatId, StatId], now: new Date() })}>
              변경 적용
            </button>
          </>
        )}
      </section>
    </>
  );
}
