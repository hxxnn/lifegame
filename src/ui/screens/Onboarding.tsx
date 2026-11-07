import { useState } from 'react';
import { CHARACTERS } from '../../data/characters';
import { STAT_IDS, STAT_NAMES, type StatId } from '../../domain/types';
import { CharacterAvatar } from '../components/CharacterAvatar';

export function Onboarding({ onStart }: { onStart: (p: { characterId: string; focus: [StatId, StatId]; nickname: string }) => void }) {
  const [nickname, setNickname] = useState('');
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [focus, setFocus] = useState<StatId[]>([]);

  const toggle = (s: StatId) => setFocus((f) => (f.includes(s) ? f.filter((x) => x !== s) : f.length < 2 ? [...f, s] : f));
  const ready = characterId !== null && focus.length === 2;

  return (
    <main className="app">
      <h1>⚔️ 라이프 RPG</h1>
      <p className="muted">매일의 작은 퀘스트로 나의 캐릭터를 키워 보세요.</p>

      <section className="card">
        <h2>1. 닉네임</h2>
        <input type="text" value={nickname} maxLength={20} placeholder="모험가 이름 (최대 20자)" onChange={(e) => setNickname(e.target.value)} aria-label="닉네임" />
      </section>

      <section className="card">
        <h2>2. 캐릭터 선택</h2>
        <div className="grid">
          {CHARACTERS.map((c) => (
            <button key={c.id} className="pick" aria-pressed={characterId === c.id} disabled={!c.startsUnlocked} onClick={() => setCharacterId(c.id)}>
              <CharacterAvatar id={c.id} size={72} />
              <div><strong>{c.name}</strong></div>
              <div className="muted">{c.startsUnlocked ? c.tagline : '🔒 해금 필요'}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>3. 이번 주 주력 스탯 2개</h2>
        <p className="muted">주력 스탯의 퀘스트가 더 많이 나와요. 월요일에만 바꿀 수 있어요.</p>
        <div className="grid">
          {STAT_IDS.map((s) => (
            <button key={s} className={`pick stat-${s}`} aria-pressed={focus.includes(s)} onClick={() => toggle(s)}>
              <strong>{STAT_NAMES[s]}</strong>
            </button>
          ))}
        </div>
      </section>

      <button className="btn" disabled={!ready} onClick={() => ready && onStart({ characterId: characterId!, focus: focus as [StatId, StatId], nickname })}>
        모험 시작하기
      </button>
    </main>
  );
}
