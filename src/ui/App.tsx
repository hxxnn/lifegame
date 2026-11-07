import { useEffect, useRef, useState } from 'react';
import { COSMETIC_LABELS } from '../data/cosmetics';
import { STORIES } from '../data/stories';
import { statLevels } from '../domain/progress';
import { STAT_IDS, STAT_NAMES } from '../domain/types';
import { Home } from './screens/Home';
import { Onboarding } from './screens/Onboarding';
import { useGame } from './store';

export type TabId = 'home';
const TABS: { id: TabId; icon: string; label: string }[] = [{ id: 'home', icon: '🏠', label: '홈' }];

export function App() {
  const { state, dispatch, todayKey, storageOk, recovered } = useGame();
  const [tab, setTab] = useState<TabId>('home');
  const [toast, setToast] = useState<string | null>(null);
  const prev = useRef<{ levels: Record<string, number>; unlocked: string[] } | null>(null);

  useEffect(() => {
    const levels = statLevels(state);
    const msgs: string[] = [];
    if (prev.current) {
      for (const s of STAT_IDS) if (levels[s] > prev.current.levels[s]) msgs.push(`${STAT_NAMES[s]} 레벨 ${levels[s]} 달성!`);
      for (const id of state.unlockedIds.filter((u) => !prev.current!.unlocked.includes(u)))
        msgs.push(`🔓 해금: ${COSMETIC_LABELS[id] ?? STORIES[id]?.title ?? id}`);
    }
    prev.current = { levels, unlocked: state.unlockedIds };
    if (msgs.length) setToast(msgs.join(' · '));
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  if (!state.characterId) {
    return (
      <Onboarding
        onStart={(p) => {
          dispatch({ type: 'onboard', ...p });
          dispatch({ type: 'init', now: new Date() });
        }}
      />
    );
  }

  return (
    <>
      {toast && <div className="toast" role="status">{toast}</div>}
      <main className="app">
        {!storageOk && <div className="banner warn" role="alert">⚠️ 이 브라우저에서는 진행 상황을 저장할 수 없어요. 탭을 닫으면 사라지니 설정에서 내보내기로 백업하세요.</div>}
        {recovered && <div className="banner">저장 데이터가 손상되어 새로 시작했어요. 이전 데이터는 브라우저에 백업으로 남아 있어요.</div>}
        {tab === 'home' && <Home state={state} todayKey={todayKey} dispatch={dispatch} />}
      </main>
      <nav className="tabs" aria-label="메뉴">
        <div className="inner">
          {TABS.map((t) => (
            <button key={t.id} className="tab" aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
              <span className="ico" aria-hidden>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
