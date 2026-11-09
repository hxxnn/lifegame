import { useState, type ReactNode } from 'react';
import { CHARACTERS } from '../../data/characters';
import { STAT_DESC } from '../../data/statInfo';
import { STAT_IDS, STAT_NAMES, type StatId } from '../../domain/types';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { Icon } from '../components/Icons';

export function Onboarding({ onStart, notices }: { onStart: (p: { characterId: string; focus: [StatId, StatId]; nickname: string }) => void; notices?: ReactNode }) {
  const [nickname, setNickname] = useState('');
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [focus, setFocus] = useState<StatId[]>([]);

  const toggle = (s: StatId) => setFocus((f) => (f.includes(s) ? f.filter((x) => x !== s) : f.length < 2 ? [...f, s] : f));
  const ready = characterId !== null && focus.length === 2;

  return (
    <main className="app">
      <h1>라이프 RPG</h1>
      <p className="muted">매일의 작은 퀘스트로 나의 캐릭터를 키워 보세요.</p>
      {notices}

      <section className="surface">
        <h2>1. 닉네임</h2>
        <input type="text" value={nickname} maxLength={20} placeholder="모험가 이름 (최대 20자)" onChange={(e) => setNickname(e.target.value)} aria-label="닉네임" />
      </section>

      <section className="surface">
        <h2>2. 캐릭터 선택</h2>
        <div className="grid">
          {CHARACTERS.filter((c) => c.startsUnlocked).map((c) => (
            <button key={c.id} className="pick" aria-pressed={characterId === c.id} onClick={() => setCharacterId(c.id)}>
              <CharacterAvatar id={c.id} size={72} />
              <div><strong>{c.name}</strong></div>
              <div className="muted">{c.tagline}</div>
            </button>
          ))}
        </div>
        <details style={{ marginTop: 12 }}>
          <summary>잠긴 캐릭터 {CHARACTERS.filter((c) => !c.startsUnlocked).length}명 보기</summary>
          <p className="muted">퀘스트를 클리어하면 하나씩 열려요.</p>
          <div className="grid">
            {CHARACTERS.filter((c) => !c.startsUnlocked).map((c) => (
              <div key={c.id} className="pick locked-pick" aria-label={`${c.name} 잠김`}>
                <CharacterAvatar id={c.id} size={56} />
                <div><strong>{c.name}</strong></div>
              </div>
            ))}
          </div>
        </details>
      </section>

      <section className="surface">
        <h2>3. 이번 주 주력 스탯 2개</h2>
        <p className="muted">주력 스탯의 퀘스트가 더 많이 나와요. 월요일에만 바꿀 수 있어요.</p>
        <div className="grid">
          {STAT_IDS.map((s) => (
            <button key={s} className="pick" aria-pressed={focus.includes(s)} onClick={() => toggle(s)}>
              <Icon name={s} /><div><strong>{STAT_NAMES[s]}</strong></div><div className="muted">{STAT_DESC[s]}</div>
            </button>
          ))}
        </div>
      </section>

      <button className="btn block" disabled={!ready} onClick={() => ready && onStart({ characterId: characterId!, focus: focus as [StatId, StatId], nickname })}>
        모험 시작하기
      </button>
    </main>
  );
}
