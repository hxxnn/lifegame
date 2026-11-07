import type { WeekRecord } from '../../domain/types';
import { THEME_INFO } from '../themeInfo';

export function WeekBanner({ week }: { week: WeekRecord }) {
  const info = THEME_INFO[week.theme];
  const fullDays = week.days.filter((d) => d.allDoneBonus).length;
  return (
    <section className="surface week">
      <h2><span aria-hidden="true">{info.icon}</span> 이번 주는 {info.name}</h2>
      <p className="muted">{info.blurb}</p>
      <p className="muted">전부 완료한 날 {fullDays}일. 주 5일 이상이면 주간 보너스를 받아요{week.weeklyBonus ? ' (획득!)' : ''}.</p>
    </section>
  );
}
