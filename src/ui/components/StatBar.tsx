import { levelFromXp } from '../../domain/leveling';
import { STAT_NAMES, type StatId } from '../../domain/types';

export function StatBar({ stat, xp, focus }: { stat: StatId; xp: number; focus?: boolean }) {
  const { level, into, need } = levelFromXp(xp);
  const pct = need === null ? 100 : Math.min(100, Math.round((into / need) * 100));
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="row between">
        <strong className={`stat-${stat}`}>{STAT_NAMES[stat]}{focus ? ' ★' : ''}</strong>
        <span className="muted">Lv.{level}{need === null ? ' MAX' : ` · ${into}/${need}`}</span>
      </div>
      <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${STAT_NAMES[stat]} 경험치`}>
        <i style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
