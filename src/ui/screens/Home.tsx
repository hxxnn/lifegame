import { useEffect, useState } from 'react';
import { BALANCE } from '../../data/balance';
import { COSMETIC_LABELS, latestTitle } from '../../data/cosmetics';
import { QUEST_BY_ID, QUEST_POOL } from '../../data/questPool';
import { backupNudge, pendingReport, yesterdaySummary } from '../../domain/report';
import { pickDisplayDay } from '../../domain/rollover';
import { canSwap } from '../../domain/swap';
import { STAT_IDS, type PlayerState } from '../../domain/types';
import { exportJson, withBackupMark } from '../../storage/backup';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { QuestCard } from '../components/QuestCard';
import { ReportCard } from '../components/ReportCard';
import { StatBar } from '../components/StatBar';
import { WeekBanner } from '../components/WeekBanner';
import { saveBackup } from '../download';
import type { Action } from '../store';

export function Home({ state, todayKey, dispatch }: { state: PlayerState; todayKey: string; dispatch: (a: Action) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelected(null);
    const onPointer = (e: PointerEvent) => {
      if (!(e.target as Element).closest('.quest-wrap')) setSelected(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [selected]);

  const day = pickDisplayDay(state, todayKey);
  const week = state.weeks.find((w) => w.days.includes(day!));
  if (!week || !day) return <p className="muted">오늘의 퀘스트를 불러오는 중…</p>;

  const done = day.quests.filter((q) => q.done).length;
  const total = day.quests.length;
  const swapsLeft = BALANCE.dailySwaps - (day.swaps ?? 0);
  const report = pendingReport(state, QUEST_POOL);
  const nudge = backupNudge(state, todayKey);
  const yesterday = yesterdaySummary(state, day.date);
  const title = latestTitle(state.unlockedIds);

  const backupNow = async () => {
    const saved = await saveBackup(exportJson(withBackupMark(state, todayKey)), `lifegame-save-${todayKey}.json`);
    if (saved) dispatch({ type: 'markBackup', date: todayKey });
  };

  return (
    <>
      <section className="hero-compact">
        <CharacterAvatar id={state.characterId!} size={72} unlockedIds={state.unlockedIds} />
        <div className="grow">
          <h1>{state.nickname || '모험가'}</h1>
          <p className="muted">{title ? `${COSMETIC_LABELS[title]}, ` : ''}누적 클리어 {state.totalCleared}개{yesterday ? `, 어제 ${yesterday.done}/${yesterday.total}` : ''}</p>
        </div>
      </section>
      {report && <ReportCard report={report} onClose={() => dispatch({ type: 'dismissReport', weekId: report.weekId })} />}
      {nudge && (
        <div className="banner" role="status">
          <p><strong>{nudge.days === null ? '아직 백업한 적이 없어요.' : `백업한 지 ${nudge.days}일 지났어요.`}</strong> 브라우저 데이터가 지워지면 진행 상황도 사라져요.</p>
          <div className="row">
            <button className="btn small" onClick={() => void backupNow()}>지금 백업하기</button>
            <button className="btn ghost small" onClick={() => dispatch({ type: 'snoozeBackup', date: todayKey })}>나중에</button>
          </div>
        </div>
      )}
      <WeekBanner week={week} />
      <section className="quests">
        <div className="row between"><h2>오늘의 퀘스트</h2><strong data-testid="today-progress">{done}/{total}</strong></div>
        <div className="meter" style={{ margin: '4px 0 12px' }}><i style={{ width: `${(done / total) * 100}%` }} /></div>
        {day.quests.map((q) => {
          const def = QUEST_BY_ID[q.questId];
          return def ? (
            <QuestCard key={q.questId} def={def} done={q.done} theme={week.theme} focus={!!state.focusStats?.includes(def.stat)} expanded={selected === q.questId}
              swapsLeft={swapsLeft} canSwap={canSwap(state, day.date, q.questId, QUEST_POOL)}
              onSelect={() => setSelected(q.questId)} onCancel={() => setSelected(null)}
              onSwap={() => { setSelected(null); dispatch({ type: 'swap', date: day.date, questId: q.questId }); }}
              onComplete={() => { setSelected(null); dispatch({ type: 'complete', date: day.date, questId: q.questId }); }} />
          ) : null;
        })}
        {done === total && <p className="muted">오늘의 퀘스트를 모두 완료했어요! (+10% 보너스)</p>}
      </section>
      <section className="surface">
        <h2>스탯</h2>
        {STAT_IDS.map((s) => <StatBar key={s} stat={s} xp={state.xp[s]} focus={state.focusStats?.includes(s)} />)}
      </section>
    </>
  );
}
