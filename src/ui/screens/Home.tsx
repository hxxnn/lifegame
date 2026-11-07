import { COSMETIC_LABELS, latestTitle } from '../../data/cosmetics';
import { QUEST_BY_ID } from '../../data/questPool';
import { pickDisplayDay } from '../../domain/rollover';
import { STAT_IDS, type PlayerState } from '../../domain/types';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { QuestCard } from '../components/QuestCard';
import { StatBar } from '../components/StatBar';
import { WeekBanner } from '../components/WeekBanner';
import type { Action } from '../store';

export function Home({ state, todayKey, dispatch }: { state: PlayerState; todayKey: string; dispatch: (a: Action) => void }) {
  const day = pickDisplayDay(state, todayKey);
  const week = state.weeks.find((w) => w.days.includes(day!));
  if (!week || !day) return <p className="muted">오늘의 퀘스트를 불러오는 중…</p>;

  const done = day.quests.filter((q) => q.done).length;
  const total = day.quests.length;
  return (
    <>
      <section className="hero">
        <CharacterAvatar id={state.characterId!} size={128} unlockedIds={state.unlockedIds} />
        <h1>{state.nickname || '모험가'}</h1>
        <p className="muted">{latestTitle(state.unlockedIds) ? `${COSMETIC_LABELS[latestTitle(state.unlockedIds)!]}, ` : ''}누적 클리어 {state.totalCleared}개</p>
      </section>
      <WeekBanner week={week} />
      <section className="quests">
        <div className="row between"><h2>오늘의 퀘스트</h2><strong data-testid="today-progress">{done}/{total}</strong></div>
        <div className="meter" style={{ margin: '4px 0 12px' }}><i style={{ width: `${(done / total) * 100}%` }} /></div>
        {day.quests.map((q) => {
          const def = QUEST_BY_ID[q.questId];
          return def ? <QuestCard key={q.questId} def={def} done={q.done} theme={week.theme} focus={!!state.focusStats?.includes(def.stat)} onComplete={() => dispatch({ type: 'complete', date: day.date, questId: q.questId })} /> : null;
        })}
        {done === total && <p className="muted">🎉 오늘의 퀘스트를 모두 완료했어요! (+10% 보너스)</p>}
      </section>
      <section className="surface">
        <h2>스탯</h2>
        {STAT_IDS.map((s) => <StatBar key={s} stat={s} xp={state.xp[s]} focus={state.focusStats?.includes(s)} />)}
      </section>
    </>
  );
}
