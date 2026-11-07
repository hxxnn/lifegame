import { useState } from 'react';
import { dateKey } from '../../domain/dates';
import type { PlayerState } from '../../domain/types';
import { exportJson, importJson } from '../../storage/backup';
import type { Action } from '../store';

export function Settings({ state, dispatch }: { state: PlayerState; dispatch: (a: Action) => void }) {
  const [nick, setNick] = useState(state.nickname);
  const [msg, setMsg] = useState<string | null>(null);

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportJson(state)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifegame-save-${dateKey(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      dispatch({ type: 'import', state: importJson(await file.text()), now: new Date() });
      setMsg('가져오기 완료!');
    } catch {
      setMsg('올바른 저장 파일이 아니에요. 기존 데이터는 그대로예요.');
    }
  };

  return (
    <>
      <section className="surface">
        <h2>닉네임</h2>
        <div className="row">
          <input type="text" value={nick} maxLength={20} onChange={(e) => setNick(e.target.value)} aria-label="닉네임 수정" />
          <button className="btn" onClick={() => dispatch({ type: 'setNickname', nickname: nick })}>저장</button>
        </div>
      </section>
      <section className="surface">
        <h2>백업</h2>
        <p className="muted">진행 상황은 이 브라우저에만 저장돼요. 기기를 바꾸기 전에 꼭 내보내기로 백업하세요.</p>
        <div className="row">
          <button className="btn" onClick={download}>내보내기</button>
          <label className="btn ghost">
            가져오기
            <input type="file" accept="application/json,.json" hidden onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>
        {msg && <p role="status" style={{ marginTop: 8 }}>{msg}</p>}
      </section>
      <section className="surface">
        <h2>초기화</h2>
        <p className="muted">모든 진행 상황이 삭제돼요.</p>
        <button className="btn danger" onClick={() => window.confirm('정말 모든 데이터를 삭제할까요?') && dispatch({ type: 'reset' })}>모두 삭제</button>
      </section>
    </>
  );
}
