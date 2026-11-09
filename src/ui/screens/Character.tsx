import { useState } from 'react';
import { CHARACTERS, artStage } from '../../data/characters';
import { activeCharacterLevel, charLevelProgress, levelOfCharacter } from '../../domain/characterLevel';
import { addDays, weekIdOf } from '../../domain/dates';
import { STAT_IDS, STAT_NAMES, type PlayerState, type StatId } from '../../domain/types';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { Icon } from '../components/Icons';
import { History } from '../components/History';
import { artUrl } from '../artUrl';
import { StatBar } from '../components/StatBar';
import { canChangeProfile, isCharacterUnlocked, type Action } from '../store';

export function Character({ state, todayKey, dispatch }: { state: PlayerState; todayKey: string; dispatch: (a: Action) => void }) {
  const current = CHARACTERS.find((c) => c.id === state.characterId) ?? CHARACTERS[0];
  const editable = canChangeProfile(state, todayKey);
  const [characterId, setCharacterId] = useState(current.id);
  const [focus, setFocus] = useState<StatId[]>(state.focusStats ?? []);
  const toggle = (s: StatId) => setFocus((f) => (f.includes(s) ? f.filter((x) => x !== s) : f.length < 2 ? [...f, s] : f));
  const nextMonday = addDays(weekIdOf(todayKey), 7);
  const level = activeCharacterLevel(state);
  const progress = charLevelProgress(state.characters[current.id]?.xp ?? 0);
  const stage = current.art ? artStage(current.art, level) : null;
  const nextStage = current.art?.stages.find((st) => st.level > level) ?? null;

  return (
    <>
      <section className="surface row">
        {current.art ? <img className="char-full" src={artUrl(stage!.full)} alt={`${current.name} 전신`} height={224} decoding="async" /> : <CharacterAvatar id={current.id} size={96} unlockedIds={state.unlockedIds} level={level} />}
        <div className="grow">
          <h1>{current.name}</h1>
          <p className="muted">{current.tagline}</p>
          <p><strong>캐릭터 Lv.{level}</strong></p>
          <div className="meter" role="progressbar" aria-label="다음 레벨까지" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.need === null ? 100 : Math.round((progress.into / progress.need) * 100)}>
            <i style={{ transform: `scaleX(${progress.need === null ? 1 : progress.into / progress.need})` }} />
          </div>
          <p className="muted">{progress.need === null ? '최고 레벨이에요' : `다음 레벨까지 ${progress.need - progress.into} XP`}</p>
          <p className="muted">주력 스탯: {state.focusStats?.map((s) => STAT_NAMES[s]).join(', ')}</p>
        </div>
      </section>
      {current.art && (
        <section className="surface">
          <h2>모습</h2>
          <p className="muted">{nextStage ? `다음 모습은 Lv.${nextStage.level}에 열려요` : '모든 모습을 열었어요'}</p>
          <div className="stage-strip">
            {current.art.stages.map((st) => {
              const open = level >= st.level;
              return (
                <div key={st.level} className={`stage${open ? '' : ' locked'}`}>
                  <div className="stage-thumb">
                    <img src={artUrl(st.portrait)} alt={open ? `${current.name} Lv.${st.level} 모습` : ''} width={56} height={56} decoding="async" />
                    {!open && <Icon name="lock" />}
                  </div>
                  <span className="muted">Lv.{st.level}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <section className="surface">
        <h2>스탯</h2>
        {STAT_IDS.map((s) => <StatBar key={s} stat={s} xp={state.xp[s]} focus={state.focusStats?.includes(s)} />)}
      </section>
      <section className="surface">
        <h2>캐릭터·주력 스탯 변경</h2>
        {!editable ? (
          <>
            <p className="muted">변경은 월요일에만 할 수 있어요. 다음 변경 가능일: {nextMonday}</p>
            <p className="muted">캐릭터마다 자기 레벨이 있어서, 다른 캐릭터로 바꾸면 그 캐릭터의 레벨에서 이어져요.</p>
          </>
        ) : (
          <>
            <div className="grid" style={{ marginBottom: 12 }}>
              {CHARACTERS.map((c) => (
                <button key={c.id} className="pick" aria-pressed={characterId === c.id} disabled={!isCharacterUnlocked(state, c.id)} onClick={() => setCharacterId(c.id)}>
                  <CharacterAvatar id={c.id} size={56} level={levelOfCharacter(state, c.id)} /><div><strong>{c.name}</strong></div><div className="muted">Lv.{levelOfCharacter(state, c.id)}</div>
                  {!isCharacterUnlocked(state, c.id) && <Icon name="lock" />}
                </button>
              ))}
            </div>
            <div className="grid" style={{ marginBottom: 12 }}>
              {STAT_IDS.map((s) => (
                <button key={s} className="pick" aria-pressed={focus.includes(s)} onClick={() => toggle(s)}><Icon name={s} size={24} /><div><strong>{STAT_NAMES[s]}</strong></div></button>
              ))}
            </div>
            <button className="btn" disabled={focus.length !== 2} onClick={() => dispatch({ type: 'changeProfile', characterId, focus: focus as [StatId, StatId], now: new Date() })}>
              변경 적용
            </button>
          </>
        )}
      </section>
      <History state={state} />
    </>
  );
}
