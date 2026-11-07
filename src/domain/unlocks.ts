import { BALANCE } from '../data/balance';
import { completeQuest, statLevels } from './progress';
import { STAT_IDS, type PlayerState, type QuestDef } from './types';

/** i-th cosmetic milestone (1-based): 5, 12, 22, 35, 51, 70 ... (gaps grow by 3). */
export function milestoneThreshold(i: number): number {
  return 5 + (i - 1) * 4 + (3 * (i - 1) * i) / 2;
}

export function evaluateUnlocks(state: PlayerState, cosmeticSequence: string[], statUnlockLevels: number[]): PlayerState {
  const ids = new Set(state.unlockedIds);
  const order = [...state.unlockedIds];
  const add = (id: string) => {
    if (!ids.has(id)) {
      ids.add(id);
      order.push(id);
    }
  };
  for (let i = 1; i <= cosmeticSequence.length && milestoneThreshold(i) <= state.totalCleared; i++) add(cosmeticSequence[i - 1]);
  const levels = statLevels(state);
  for (const stat of STAT_IDS) for (const lv of statUnlockLevels) if (levels[stat] >= lv) add(`story:${stat}:${lv}`);
  return order.length === state.unlockedIds.length ? state : { ...state, unlockedIds: order };
}

export function completeAndUnlock(
  state: PlayerState, date: string, questId: string, pool: QuestDef[], cosmeticSequence: string[],
): PlayerState {
  return evaluateUnlocks(completeQuest(state, date, questId, pool), cosmeticSequence, BALANCE.statUnlockLevels);
}
