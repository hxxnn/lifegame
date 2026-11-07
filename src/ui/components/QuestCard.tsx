import { BALANCE } from '../../data/balance';
import { STAT_NAMES, type QuestDef, type ThemeId } from '../../domain/types';

const TIER_NAMES = { 1: '쉬움', 2: '보통', 3: '어려움', 4: '극한' } as const;

export function QuestCard({ def, done, theme, onComplete }: { def: QuestDef; done: boolean; theme: ThemeId; onComplete: () => void }) {
  const xp = Math.round(def.baseXp * BALANCE.themeMultiplier[theme]);
  return (
    <button className="quest" aria-pressed={done} disabled={done} onClick={onComplete}>
      <span className="check" aria-hidden>{done ? '✓' : ''}</span>
      <span className="grow">
        <div className="q-title"><strong>{def.title}</strong></div>
        <div className="muted">{def.desc}</div>
        <div style={{ marginTop: 4 }}>
          <span className={`chip stat-${def.stat}`}>{STAT_NAMES[def.stat]}</span>
          <span className="muted">{TIER_NAMES[def.tier]}{def.fixed ? ' · 매일 고정' : ''} · +{xp} XP</span>
        </div>
      </span>
    </button>
  );
}
