import { CharacterAvatar } from './CharacterAvatar';
import { Icon } from './Icons';
import type { Theme } from '../theme';

export function TopBar({ characterId, nickname, unlockedIds, progress, theme, onToggleTheme }: {
  characterId: string; nickname: string; unlockedIds: string[]; progress: { done: number; total: number } | null; theme: Theme; onToggleTheme: () => void;
}) {
  return (
    <header className="topbar glass">
      <span className="topbar-avatar"><CharacterAvatar id={characterId} size={40} unlockedIds={unlockedIds} /></span>
      <span className="grow topbar-name">{nickname || '모험가'}</span>
      {progress && <span className="chip" aria-label={`오늘 퀘스트 ${progress.done}개 완료, 전체 ${progress.total}개`}>오늘 {progress.done}/{progress.total}</span>}
      <button className="icon-btn" onClick={onToggleTheme} aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}>
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
      </button>
    </header>
  );
}
