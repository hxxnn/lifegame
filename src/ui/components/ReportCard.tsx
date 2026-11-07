import { STAT_IDS, STAT_NAMES } from '../../domain/types';
import type { PendingReport } from '../../domain/report';
import { Icon } from './Icons';
import { THEME_INFO } from '../themeInfo';

export function ReportCard({ report, onClose }: { report: PendingReport; onClose: () => void }) {
  const pct = Math.round(report.clearRate * 100);
  const last = THEME_INFO[report.theme];
  const next = THEME_INFO[report.nextTheme];
  return (
    <section className="surface report" aria-label="지난주 결산">
      <h2>지난주 결산</h2>
      <p className="muted">{last.icon} {last.name}</p>
      <div className="report-rate"><strong>{pct}%</strong><span className="muted">{report.done}/{report.total}개 완료, 전부 완료한 날 {report.fullDays}일{report.weeklyBonus ? ', 주간 보너스 획득' : ''}</span></div>
      <div className="meter"><i style={{ width: `${pct}%` }} /></div>
      <ul className="report-xp">
        {STAT_IDS.map((s) => (
          <li key={s}><Icon name={s} size={18} /><span>{STAT_NAMES[s]}</span><strong>+{report.xpByStat[s]}</strong></li>
        ))}
      </ul>
      <p><strong>이번 주는 {next.icon} {next.name}</strong></p>
      <p className="muted">{report.reason}</p>
      <button className="btn" onClick={onClose}>확인</button>
    </section>
  );
}
