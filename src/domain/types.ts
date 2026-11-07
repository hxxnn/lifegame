export type StatId = 'str' | 'agi' | 'int' | 'spi' | 'luk';
export const STAT_IDS: StatId[] = ['str', 'agi', 'int', 'spi', 'luk'];
export const STAT_NAMES: Record<StatId, string> = { str: '힘', agi: '민첩', int: '지력', spi: '정신력', luk: '행운' };
export type Tier = 1 | 2 | 3 | 4;
export type ThemeId = 'calm' | 'normal' | 'challenge' | 'hell';
export type Rng = () => number;

export interface QuestDef {
  id: string;
  stat: StatId;
  tier: Tier;
  title: string;
  desc: string;
  baseXp: number;
  fixed?: boolean;
  requires?: { stat: StatId; level: number };
}
export interface QuestInstance { questId: string; done: boolean }
export interface DayRecord { date: string; quests: QuestInstance[]; allDoneBonus: boolean; swaps?: number }
export interface WeekRecord {
  weekId: string;
  theme: ThemeId;
  days: DayRecord[];
  weeklyBonus: boolean;
  clearRate: number | null;
}
export interface PlayerState {
  version: 2;
  nickname: string;
  characterId: string | null;
  focusStats: [StatId, StatId] | null;
  xp: Record<StatId, number>;
  weeks: WeekRecord[];
  unlockedIds: string[];
  totalCleared: number;
  lastDate: string | null;
  settings: { dayStartHour: number };
  backup: { lastAt: string | null; nudgedAt: string | null };
  reportSeenWeek: string | null;
}

export function emptyState(): PlayerState {
  return {
    version: 2,
    nickname: '',
    characterId: null,
    focusStats: null,
    xp: { str: 0, agi: 0, int: 0, spi: 0, luk: 0 },
    weeks: [],
    unlockedIds: [],
    totalCleared: 0,
    lastDate: null,
    settings: { dayStartHour: 0 },
    backup: { lastAt: null, nudgedAt: null },
    reportSeenWeek: null,
  };
}
