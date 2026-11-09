import { COSMETIC_LABELS, COSMETIC_SEQUENCE, nextUnlockIndex, unlockCategory } from '../../data/cosmetics';
import { BALANCE } from '../../data/balance';
import { STORIES } from '../../data/stories';
import { milestoneThreshold } from '../../domain/unlocks';
import { STAT_IDS, STAT_NAMES, type PlayerState } from '../../domain/types';
import { Icon } from '../components/Icons';

export function Gallery({ state }: { state: PlayerState }) {
  const nextIdx = nextUnlockIndex(state.unlockedIds);
  return (
    <>
      <section className="surface">
        <h2>꾸미기 도감</h2>
        {nextIdx >= 0 && <p className="muted">다음 해금까지 {milestoneThreshold(nextIdx + 1) - state.totalCleared}개 클리어 남았어요. 해금한 캐릭터는 캐릭터 화면에서 언제든 고를 수 있어요.</p>}
        <ul className="unlock-list">
          {COSMETIC_SEQUENCE.map((id, i) => {
            const open = state.unlockedIds.includes(id);
            const next = i === nextIdx;
            return (
              <li key={id} className={`row between${open ? '' : ' locked'}${next ? ' next' : ''}`}>
                <span className="label">
                  {open ? <><Icon name="check" />{COSMETIC_LABELS[id]}</> : next ? <>다음 보상: {COSMETIC_LABELS[id]} ({unlockCategory(id)})</> : <><Icon name="lock" />{unlockCategory(id)} ???</>}
                </span>
                <span className="muted">{milestoneThreshold(i + 1)}개 클리어</span>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="surface">
        <h2>스토리</h2>
        {STAT_IDS.flatMap((stat) =>
          BALANCE.statUnlockLevels.map((lv) => {
            const id = `story:${stat}:${lv}`;
            const story = STORIES[id];
            return state.unlockedIds.includes(id) ? (
              <details key={id} style={{ marginBottom: 8 }}>
                <summary><strong>{STAT_NAMES[stat]} Lv.{lv} · {story.title}</strong></summary>
                <p>{story.text}</p>
              </details>
            ) : (
              <p key={id} className="muted row"><Icon name="lock" />{STAT_NAMES[stat]} Lv.{lv} 달성 시 해금</p>
            );
          }),
        )}
      </section>
    </>
  );
}
