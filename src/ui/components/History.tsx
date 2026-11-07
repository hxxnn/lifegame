import { BALANCE } from '../../data/balance';
import { clearRateOf } from '../../domain/difficulty';
import type { PlayerState } from '../../domain/types';
import { THEME_INFO } from '../themeInfo';

export function History({ state }: { state: PlayerState }) {
  const weeks = state.weeks.slice(-BALANCE.historyWeeks).reverse();
  return (
    <section className="surface">
      <h2>주간 기록</h2>
      {weeks.length === 0 && <p className="muted">아직 기록이 없어요.</p>}
      {weeks.map((w, i) => {
        const current = i === 0;
        const rate = Math.round((w.clearRate ?? clearRateOf(w.days)) * 100);
        const info = THEME_INFO[w.theme];
        return (
          <div key={w.weekId} className="hist-row">
            <div className="row between">
              <span><span aria-hidden="true">{info.icon}</span> {info.name} <span className="muted">{w.weekId.slice(5).replace('-', '/')} 주</span></span>
              <strong>{rate}%{current ? <span className="muted"> 진행 중</span> : null}</strong>
            </div>
            <div className="meter"><i style={{ width: `${rate}%` }} /></div>
          </div>
        );
      })}
    </section>
  );
}
