import { levelFromXp } from '../../domain/leveling';
import { STAT_NAMES, type StatId } from '../../domain/types';
import { Icon } from './Icons';

export function StatBar({ stat, xp, focus }: { stat: StatId; xp: number; focus?: boolean }) {
  const { level, into, need } = levelFromXp(xp);
  const pct = need === null ? 100 : Math.min(100, Math.round((into / need) * 100));
  return (
    <div className="stat">
      <div className="row between">
        <strong className="row" style={{ gap: 8 }}><Icon name={stat} size={20} />{STAT_NAMES[stat]}{focus && <span className="chip chip-accent">주력</span>}</strong>
        <span className="muted">Lv.{level}{need === null ? ' MAX' : `  ${into}/${need}`}</span>
      </div>
      <div className="meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${STAT_NAMES[stat]} 경험치`}>
        <i style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
