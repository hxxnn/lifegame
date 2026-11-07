import { CHARACTERS } from './characters';

/** 누적 클리어 마일스톤(5, 12, 22, 35 ...)마다 순서대로 하나씩 열린다. */
export const COSMETIC_SEQUENCE: string[] = [
  'title:novice', 'gear:wooden-sword', 'char:sky', 'bg:meadow', 'title:steady', 'gear:cape', 'char:leaf',
  'bg:night', 'title:challenger', 'char:luna', 'gear:iron-helm', 'char:melo', 'bg:castle', 'char:fang', 'title:legend',
];

export const COSMETIC_LABELS: Record<string, string> = {
  'title:novice': '견습 모험가', 'title:steady': '꾸준한 자', 'title:challenger': '도전자', 'title:legend': '전설의 모험가',
  'gear:wooden-sword': '나무 검', 'gear:cape': '낡은 망토', 'gear:iron-helm': '철 투구',
  'bg:meadow': '초원 배경', 'bg:night': '밤하늘 배경', 'bg:castle': '성 배경',
  ...Object.fromEntries(CHARACTERS.filter((c) => !c.startsUnlocked).map((c) => [`char:${c.id}`, `${c.name} (캐릭터)`])),
};
