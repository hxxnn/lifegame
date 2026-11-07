import { COSMETIC_LABELS, COSMETIC_SEQUENCE } from '../../data/cosmetics';
import { BALANCE } from '../../data/balance';
import { STORIES } from '../../data/stories';
import { milestoneThreshold } from '../../domain/unlocks';
import { STAT_IDS, STAT_NAMES, type PlayerState } from '../../domain/types';

export function Gallery({ state }: { state: PlayerState }) {
  const nextIdx = COSMETIC_SEQUENCE.findIndex((id) => !state.unlockedIds.includes(id));
  return (
    <>
      <section className="card">
        <h2>꾸미기 도감</h2>
        {nextIdx >= 0 && <p className="muted">다음 해금까지 {milestoneThreshold(nextIdx + 1) - state.totalCleared}개 클리어 남았어요.</p>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {COSMETIC_SEQUENCE.map((id, i) => {
            const open = state.unlockedIds.includes(id);
            return (
              <li key={id} className="row between" style={{ padding: '6px 0', opacity: open ? 1 : 0.5 }}>
                <span>{open ? `✅ ${COSMETIC_LABELS[id]}` : '🔒 ???'}</span>
                <span className="muted">{milestoneThreshold(i + 1)}개 클리어</span>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="card">
        <h2>스토리</h2>
        {STAT_IDS.flatMap((stat) =>
          BALANCE.statUnlockLevels.map((lv) => {
            const id = `story:${stat}:${lv}`;
            const story = STORIES[id];
            return state.unlockedIds.includes(id) ? (
              <details key={id} style={{ marginBottom: 8 }}>
                <summary className={`stat-${stat}`}><strong>{STAT_NAMES[stat]} Lv.{lv} · {story.title}</strong></summary>
                <p>{story.text}</p>
              </details>
            ) : (
              <p key={id} className="muted">🔒 {STAT_NAMES[stat]} Lv.{lv} 달성 시 해금</p>
            );
          }),
        )}
      </section>
    </>
  );
}
