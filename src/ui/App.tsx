import { useEffect, useRef, useState } from 'react';
import { COSMETIC_LABELS } from '../data/cosmetics';
import { STORIES } from '../data/stories';
import { activeCharacterLevel } from '../domain/characterLevel';
import { statLevels } from '../domain/progress';
import { CHARACTERS, artStage } from '../data/characters';
import { pickDisplayDay } from '../domain/rollover';
import { STAT_IDS, STAT_NAMES } from '../domain/types';
import { isCompareHash } from '../share/card';
import { TabBar, type TabDef } from './components/TabBar';
import { TopBar } from './components/TopBar';
import { Character } from './screens/Character';
import { Gallery } from './screens/Gallery';
import { Home } from './screens/Home';
import { Onboarding } from './screens/Onboarding';
import { Settings } from './screens/Settings';
import { Share } from './screens/Share';
import { useGame } from './store';
import { useTheme } from './theme';

export type TabId = 'home' | 'character' | 'gallery' | 'share' | 'settings';
const TABS: TabDef<TabId>[] = [
  { id: 'home', icon: 'home', label: '홈' },
  { id: 'character', icon: 'character', label: '캐릭터' },
  { id: 'gallery', icon: 'gallery', label: '도감' },
  { id: 'share', icon: 'share', label: '공유' },
  { id: 'settings', icon: 'settings', label: '설정' },
];

export function App() {
  const { state, dispatch, todayKey, storageOk, recovered } = useGame();
  const { theme, toggle } = useTheme();
  const [tab, setTab] = useState<TabId>('home');
  const [toast, setToast] = useState<string | null>(null);
  const [hash, setHash] = useState(() => location.hash);
  const prev = useRef<{ levels: Record<string, number>; unlocked: string[]; look: string } | null>(null);

  useEffect(() => {
    const on = () => setHash(location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    if (isCompareHash(hash)) setTab('share');
  }, [hash]);

  useEffect(() => {
    const levels = statLevels(state);
    const msgs: string[] = [];
    if (prev.current) {
      for (const s of STAT_IDS) if (levels[s] > prev.current.levels[s]) msgs.push(`${STAT_NAMES[s]} 레벨 ${levels[s]} 달성`);
      for (const id of state.unlockedIds.filter((u) => !prev.current!.unlocked.includes(u)))
        msgs.push(`해금: ${COSMETIC_LABELS[id] ?? STORIES[id]?.title ?? id}${id.startsWith('char:') ? ' (캐릭터 화면에서 고를 수 있어요)' : id.startsWith('story:') ? ' (새 퀘스트도 열렸어요)' : ''}`);
    }
    const ch = CHARACTERS.find((c) => c.id === state.characterId);
    const stage = ch?.art ? artStage(ch.art, activeCharacterLevel(state)) : null;
    const look = stage ? `${ch!.id}:${stage.level}` : '';
    if (prev.current && stage && prev.current.look && prev.current.look.startsWith(`${ch!.id}:`) && prev.current.look !== look)
      msgs.push(`새로운 모습 해금: ${ch!.name} Lv.${stage.level}`);
    prev.current = { levels, unlocked: state.unlockedIds, look };
    if (msgs.length) setToast(msgs.length > 2 ? `${msgs.slice(0, 2).join(', ')} 외 ${msgs.length - 2}건` : msgs.join(', '));
  }, [state]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab, !!state.characterId]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const notices = (
    <>
      {!storageOk && <div className="banner warn" role="alert">이 브라우저에서는 진행 상황을 저장할 수 없어요. 탭을 닫으면 사라지니 설정에서 내보내기로 백업하세요.</div>}
      {recovered && <div className="banner">저장 데이터를 읽지 못해 새로 시작했어요. 이전 데이터는 브라우저에 백업으로 남아 있을 수 있어요.</div>}
    </>
  );

  if (!state.characterId) {
    return (
      <Onboarding
        notices={notices}
        onStart={(p) => {
          dispatch({ type: 'onboard', ...p });
          dispatch({ type: 'init', now: new Date() });
        }}
      />
    );
  }

  const day = pickDisplayDay(state, todayKey);
  const progress = day ? { done: day.quests.filter((q) => q.done).length, total: day.quests.length } : null;

  return (
    <>
      {toast && <div className="toast glass" role="status">{toast}</div>}
      <main className="app">
        <TopBar characterId={state.characterId} nickname={state.nickname} unlockedIds={state.unlockedIds} level={activeCharacterLevel(state)} progress={tab === 'home' ? null : progress} theme={theme} onToggleTheme={toggle} />
        {notices}
        {tab === 'home' && <Home state={state} todayKey={todayKey} dispatch={dispatch} />}
        {tab === 'character' && <Character state={state} todayKey={todayKey} dispatch={dispatch} />}
        {tab === 'gallery' && <Gallery state={state} />}
        {tab === 'share' && <Share state={state} hash={hash} onCloseCompare={() => { history.replaceState(null, '', location.pathname); setHash(''); }} />}
        {tab === 'settings' && <Settings state={state} todayKey={todayKey} dispatch={dispatch} />}
      </main>
      <TabBar tabs={TABS} current={tab} onSelect={setTab} />
    </>
  );
}
