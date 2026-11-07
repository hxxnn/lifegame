export type CharacterShape = 'knight' | 'ninja' | 'mage' | 'monk' | 'archer' | 'rogue' | 'bard' | 'beast';
export interface CharacterDef {
  id: string;
  name: string;
  tagline: string;
  startsUnlocked: boolean;
  palette: [string, string];
  shape: CharacterShape;
}

export const CHARACTERS: CharacterDef[] = [
  { id: 'ember', name: '에버', tagline: '불꽃 검을 든 견습 검사', startsUnlocked: true, palette: ['#e4572e', '#ffd166'], shape: 'knight' },
  { id: 'shade', name: '카게', tagline: '그림자처럼 움직이는 닌자', startsUnlocked: true, palette: ['#3d405b', '#81b29a'], shape: 'ninja' },
  { id: 'lumi', name: '루미', tagline: '별빛을 읽는 마법 학자', startsUnlocked: true, palette: ['#6a4c93', '#c8b6ff'], shape: 'mage' },
  { id: 'sky', name: '하늘', tagline: '마음을 다스리는 수도승', startsUnlocked: false, palette: ['#2a9d8f', '#e9f5db'], shape: 'monk' },
  { id: 'leaf', name: '리프', tagline: '숲을 달리는 궁수', startsUnlocked: false, palette: ['#588157', '#dad7cd'], shape: 'archer' },
  { id: 'luna', name: '루나', tagline: '달빛 아래의 날쌘 도적', startsUnlocked: false, palette: ['#1d3557', '#a8dadc'], shape: 'rogue' },
  { id: 'melo', name: '멜로', tagline: '행운을 노래하는 음유시인', startsUnlocked: false, palette: ['#f4a261', '#264653'], shape: 'bard' },
  { id: 'fang', name: '팡', tagline: '야생의 기운을 가진 전사', startsUnlocked: false, palette: ['#bc6c25', '#fefae0'], shape: 'beast' },
];
