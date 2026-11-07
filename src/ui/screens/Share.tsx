import { useMemo, useState } from 'react';
import { CHARACTERS } from '../../data/characters';
import { latestTitle } from '../../data/cosmetics';
import { statLevels } from '../../domain/progress';
import { STAT_IDS, STAT_NAMES, type PlayerState } from '../../domain/types';
import { buildPayload, type SharePayload } from '../../share/codec';
import { isCompareHash, parseCompareHash, renderCardPng, shareUrl } from '../../share/card';
import { CharacterAvatar } from '../components/CharacterAvatar';

function Compare({ me, other }: { me: SharePayload; other: SharePayload }) {
  const name = (p: SharePayload) => CHARACTERS.find((c) => c.id === p.char)?.name ?? '';
  return (
    <section className="card">
      <h2>비교</h2>
      <div className="compare">
        <div><CharacterAvatar id={me.char} size={64} /><div><strong>{me.nick}</strong></div><div className="muted">{name(me)}</div></div>
        <span className="muted">VS</span>
        <div><CharacterAvatar id={other.char} size={64} /><div><strong>{other.nick}</strong></div><div className="muted">{name(other)}</div></div>
        {STAT_IDS.map((s) => (
          <div key={s} style={{ display: 'contents' }}>
            <span className={me.lv[s] > other.lv[s] ? 'win' : ''}>Lv.{me.lv[s]}</span>
            <span className={`stat-${s}`}>{STAT_NAMES[s]}</span>
            <span className={other.lv[s] > me.lv[s] ? 'win' : ''}>Lv.{other.lv[s]}</span>
          </div>
        ))}
        <span className={me.cleared > other.cleared ? 'win' : ''}>{me.cleared}</span>
        <span className="muted">클리어</span>
        <span className={other.cleared > me.cleared ? 'win' : ''}>{other.cleared}</span>
      </div>
    </section>
  );
}

export function Share({ state, hash, onCloseCompare }: { state: PlayerState; hash: string; onCloseCompare: () => void }) {
  const me = useMemo(() => buildPayload(state, statLevels(state), latestTitle(state.unlockedIds)), [state]);
  const url = shareUrl(location.origin + location.pathname, me);
  const [msg, setMsg] = useState<string | null>(null);
  const comparing = isCompareHash(hash);
  const other = comparing ? parseCompareHash(hash) : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setMsg('링크를 복사했어요!');
    } catch {
      setMsg('복사에 실패했어요. 아래 링크를 직접 복사하세요.');
    }
  };
  const savePng = async () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(await renderCardPng(me));
    a.download = `lifegame-${me.nick}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      {comparing && (other ? (
        <>
          <Compare me={me} other={other} />
          <button className="btn ghost" onClick={onCloseCompare} style={{ marginBottom: 12 }}>비교 닫기</button>
        </>
      ) : (
        <div className="banner warn" role="alert">
          열 수 없는 공유 링크예요. 링크가 잘렸거나 잘못되었을 수 있어요.
          <div><button className="btn ghost" onClick={onCloseCompare} style={{ marginTop: 8 }}>닫기</button></div>
        </div>
      ))}
      <section className="card">
        <h2>내 카드 공유</h2>
        <p className="muted">친구에게 링크를 보내면 내 캐릭터와 나란히 비교할 수 있어요.</p>
        <div className="row" style={{ marginBottom: 8 }}>
          <button className="btn" onClick={() => void copy()}>링크 복사</button>
          <button className="btn ghost" onClick={() => void savePng()}>카드 이미지 저장</button>
        </div>
        <input type="text" readOnly value={url} aria-label="공유 링크" onFocus={(e) => e.currentTarget.select()} />
        {msg && <p role="status" style={{ marginTop: 8 }}>{msg}</p>}
      </section>
    </>
  );
}
