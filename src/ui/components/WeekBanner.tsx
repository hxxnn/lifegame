import { BALANCE } from '../../data/balance';
import type { WeekRecord } from '../../domain/types';
import { THEME_INFO } from '../themeInfo';
import { Icon } from './Icons';

export function WeekBanner({ week }: { week: WeekRecord }) {
  const info = THEME_INFO[week.theme];
  const fullDays = week.days.filter((d) => d.allDoneBonus).length;
  return (
    <details className="surface week">
      <summary>
        <span role="heading" aria-level={2} className="row"><Icon name={info.icon} /> {info.name}</span>
        <span className="muted">경험치 ×{BALANCE.themeMultiplier[week.theme]}, 완료한 날 {fullDays}/{BALANCE.weeklyBonusDays}</span>
      </summary>
      <p className="muted">{info.blurb}</p>
      <p className="muted">전부 완료한 날 {fullDays}일. 주 5일 이상이면 주간 보너스를 받아요{week.weeklyBonus ? ' (획득)' : ''}.</p>
    </details>
  );
}
