import { BALANCE } from '../../data/balance';
import { STAT_NAMES, type QuestDef, type ThemeId } from '../../domain/types';
import { Icon } from './Icons';

const TIER_NAMES = { 1: '쉬움', 2: '보통', 3: '어려움', 4: '극한' } as const;

export function QuestCard({ def, done, theme, focus, onComplete }: { def: QuestDef; done: boolean; theme: ThemeId; focus: boolean; onComplete: () => void }) {
  const xp = Math.round(def.baseXp * BALANCE.themeMultiplier[theme]);
  const kind = def.fixed ? 'pill' : focus ? 'big' : '';
  return (
    <button className={`quest ${kind}`} aria-pressed={done} disabled={done} onClick={onComplete}>
      <span className="q-ico"><Icon name={def.stat} size={kind === 'big' ? 26 : 22} /></span>
      <span className="grow">
        <span className="q-title">{def.title}</span>
        {!def.fixed && <span className="q-desc">{def.desc}</span>}
        <span className="q-meta">
          <span className="chip">{STAT_NAMES[def.stat]}</span>
          <span role="img" aria-label={`난이도 ${TIER_NAMES[def.tier]}`} className="stars">{'★'.repeat(def.tier)}{'☆'.repeat(4 - def.tier)}</span>
          <span className="muted">{def.fixed ? '매일 고정  ' : ''}+{xp} XP</span>
        </span>
      </span>
      <span className="check"><Icon name="check" size={18} /></span>
    </button>
  );
}
