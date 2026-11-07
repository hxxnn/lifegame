import { BALANCE } from '../data/balance';
import { statLevels } from './progress';
import { isUnlocked } from './quests';
import type { PlayerState, QuestDef, Rng } from './types';

interface Found { weekIdx: number; dayIdx: number; qIdx: number; cands: QuestDef[] }

function find(state: PlayerState, date: string, questId: string, pool: QuestDef[]): Found | null {
  const weekIdx = state.weeks.findIndex((w) => w.days.some((d) => d.date === date));
  if (weekIdx < 0) return null;
  const day = state.weeks[weekIdx].days.find((d) => d.date === date)!;
  const dayIdx = state.weeks[weekIdx].days.indexOf(day);
  const qIdx = day.quests.findIndex((q) => q.questId === questId);
  const def = pool.find((p) => p.id === questId);
  if (qIdx < 0 || !def || def.fixed || day.quests[qIdx].done) return null;
  if ((day.swaps ?? 0) >= BALANCE.dailySwaps) return null;

  const levels = statLevels(state);
  const used = new Set([...day.quests.map((q) => q.questId), ...(day.swappedOut ?? [])]); // 오늘 바꿔 낸 퀘스트도 다시 나오지 않게
  const all = state.weeks.flatMap((w) => w.days);
  const prevDay = all[all.indexOf(day) - 1];
  const prev = new Set(prevDay?.quests.map((q) => q.questId) ?? []);
  const same = pool.filter((p) => !p.fixed && p.stat === def.stat && p.tier === def.tier && !used.has(p.id) && isUnlocked(p, levels));
  const fresh = same.filter((p) => !prev.has(p.id));
  const cands = fresh.length > 0 ? fresh : same;
  return cands.length > 0 ? { weekIdx, dayIdx, qIdx, cands } : null;
}

export function canSwap(state: PlayerState, date: string, questId: string, pool: QuestDef[]): boolean {
  return find(state, date, questId, pool) !== null;
}

/** 같은 스탯·같은 티어의 다른 퀘스트로 교체한다. 불가능하면 같은 state 객체를 돌려준다. */
export function swapQuest(state: PlayerState, date: string, questId: string, pool: QuestDef[], rng: Rng): PlayerState {
  const f = find(state, date, questId, pool);
  if (!f) return state;
  const pick = f.cands[Math.min(f.cands.length - 1, Math.floor(rng() * f.cands.length))];
  const weeks = state.weeks.map((w, wi) =>
    wi !== f.weekIdx ? w : {
      ...w,
      days: w.days.map((d, di) =>
        di !== f.dayIdx ? d : {
          ...d,
          swaps: (d.swaps ?? 0) + 1,
          swappedOut: [...(d.swappedOut ?? []), questId],
          quests: d.quests.map((q, qi) => (qi === f.qIdx ? { questId: pick.id, done: false } : q)),
        }),
    });
  return { ...state, weeks };
}
