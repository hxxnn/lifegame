import { useEffect, useState } from 'react';
import type { PlayerState } from '../../domain/types';
import { exportJson, importJson, withBackupMark } from '../../storage/backup';
import { saveBackup } from '../download';
import type { Action } from '../store';

export function Settings({ state, todayKey, dispatch }: { state: PlayerState; todayKey: string; dispatch: (a: Action) => void }) {
  const [nick, setNick] = useState(state.nickname);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => setNick(state.nickname), [state.nickname]);

  const download = async () => {
    const saved = await saveBackup(exportJson(withBackupMark(state, todayKey)), `lifegame-save-${todayKey}.json`);
    if (saved) dispatch({ type: 'markBackup', date: todayKey });
    setMsg(saved ? '백업 파일을 저장했어요.' : '저장을 취소했어요. 백업은 기록되지 않았어요.');
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
        <h2>하루 시작 시간</h2>
        <p className="muted">새벽에 활동하는 편이라면 늦춰 보세요. 이 시간이 되어야 새 하루와 새 퀘스트가 시작돼요.</p>
        <select aria-label="하루 시작 시간" value={state.settings.dayStartHour} onChange={(e) => dispatch({ type: 'setDayStart', hour: Number(e.target.value) })}>
          {[0, 1, 2, 3, 4, 5, 6].map((h) => <option key={h} value={h}>{h === 0 ? '자정 (0시)' : `새벽 ${h}시`}</option>)}
        </select>
      </section>
      <section className="surface">
        <h2>백업</h2>
        <p className="muted">진행 상황은 이 브라우저에만 저장돼요. 기기를 바꾸기 전에 꼭 내보내기로 백업하세요.</p>
        <p className="muted">마지막 백업: {state.backup.lastAt ?? '아직 없어요'}</p>
        <div className="row">
          <button className="btn" onClick={() => void download()}>내보내기</button>
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
