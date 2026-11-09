/** 캐릭터 레벨이 이 값에 도달하면 해당 모습이 열린다. */
export const STAGE_LEVELS = [1, 25, 50, 75, 99];
export interface ArtStage { level: number; portrait: string; full: string }
export interface CharacterArt { stages: ArtStage[] }

const artOf = (id: string): CharacterArt => ({
  stages: STAGE_LEVELS.map((level, i) => ({ level, portrait: `characters/${id}-${i + 1}-portrait.webp`, full: `characters/${id}-${i + 1}-full.webp` })),
});

/** 현재 캐릭터 레벨에서 열려 있는 가장 새로운 모습. */
export function artStage(art: CharacterArt, level: number): ArtStage {
  return [...art.stages].reverse().find((s) => level >= s.level) ?? art.stages[0];
}

export interface CharacterDef {
  id: string;
  name: string;
  tagline: string;
  startsUnlocked: boolean;
  palette: [string, string];
  /** 일러스트가 있는 캐릭터. 없으면 픽셀 스프라이트를 쓴다. 캐릭터 레벨에 따라 모습이 바뀐다. */
  art?: CharacterArt;
}

export const CHARACTERS: CharacterDef[] = [
  { id: 'ember', name: '에버', tagline: '불꽃 검을 든 견습 검사', startsUnlocked: true, palette: ['#e4572e', '#ffd166'], art: artOf('ember') },
  { id: 'shade', name: '카게', tagline: '그림자처럼 움직이는 닌자', startsUnlocked: true, palette: ['#3d405b', '#81b29a'], art: artOf('shade') },
  { id: 'lumi', name: '루미', tagline: '별빛을 읽는 학자', startsUnlocked: true, palette: ['#6a4c93', '#c8b6ff'], art: artOf('lumi') },
  { id: 'sky', name: '하늘', tagline: '마음을 다스리는 거북이 수도승', startsUnlocked: false, palette: ['#2a9d8f', '#e9f5db'] },
  { id: 'leaf', name: '리프', tagline: '숲을 달리는 사슴 궁수', startsUnlocked: false, palette: ['#588157', '#dad7cd'] },
  { id: 'luna', name: '루나', tagline: '달빛 아래의 날쌘 토끼 도적', startsUnlocked: false, palette: ['#1d3557', '#a8dadc'] },
  { id: 'melo', name: '멜로', tagline: '행운을 노래하는 작은 새 음유시인', startsUnlocked: false, palette: ['#f4a261', '#264653'] },
  { id: 'fang', name: '팡', tagline: '불씨를 품은 아기 용', startsUnlocked: false, palette: ['#bc6c25', '#fefae0'] },
];
