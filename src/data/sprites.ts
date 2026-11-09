// 픽셀 아트 캐릭터 8명(16x16). 사람 1명과 동물 7명이고 실루엣이 모두 다르다.
// 각 줄의 글자는 팔레트 색, '.'은 투명이다. 장비와 배경도 같은 격자에 그린다.
import { equippedLook } from './cosmetics';

export interface Pixel { x: number; y: number; c: string }
export interface Sprite { palette: Record<string, string>; rows: string[]; /** 투구를 얹을 왼쪽 위 칸 */ helm: [number, number] }
export interface Scene { palette: Record<string, string>; rows: string[] }

export const SPRITES: Record<string, Sprite> = {
  ember: {
    palette: {"K": "#2a1a1a", "R": "#e4572e", "S": "#f2c9a0", "E": "#2a2a2a", "W": "#ffffff", "M": "#8a3a2a", "B": "#4a5fa8", "T": "#ffd166", "G": "#c9d1dc"},
    helm: [5, 1],
    rows: [
      '....K..KK..K.K..',
      '...KRKKRRKKRK.K.',
      '..KRRRRRRRRRRKGK',
      '..KRRSSSSSSRRKGK',
      '..KRSSSSSSSSRKGK',
      '..KSKKSSSSKKSKGK',
      '..KSEWSSSSEWSKGK',
      '..KSSSSMMSSSSKGK',
      '...KKSSSSSSKKGK.',
      '....KBBBBBBKKGK.',
      '...KBBTTTTBBKGK.',
      '...KBBBBBBBBKTTT',
      '...KSKBBBBKSKKGK',
      '....KKBBBBKKK...',
      '.....KBKKBK.....',
      '.....KKK.KKK....',
    ],
  },
  shade: {
    palette: {"K": "#15151f", "C": "#3d405b", "c": "#5d6190", "E": "#ffd166", "e": "#15151f", "P": "#ff8fa3", "S": "#81b29a", "s": "#5f8e79", "W": "#f1f1f1"},
    helm: [5, 2],
    rows: [
      '..KK........KK..',
      '..KCK......KCK..',
      '..KCCKKKKKKCCK..',
      '..KCCCCCCCCCCK..',
      '..KCEECCCCEECK..',
      '..KCEeCCCCeECK..',
      '..KCCCCPPCCCCK..',
      '...KCCCWWCCCK...',
      '....KKCCCCKK....',
      '....KSSSSSSK.KK.',
      '...KCSsSSSsSCKCK',
      '...KCCCCCCCCCKCK',
      '...KCWCCCCCWCKCK',
      '....KKCCCCKKKCK.',
      '....KCKKKKCK.KK.',
      '....KKK..KKK....',
    ],
  },
  lumi: {
    palette: {"K": "#2b2142", "P": "#7b5cc4", "p": "#5b3fa0", "L": "#e6dcff", "E": "#ffffff", "e": "#2b2142", "Y": "#ffd166", "G": "#ffd166"},
    helm: [5, 2],
    rows: [
      '..K..........K..',
      '..KK........KK..',
      '..KPKKKKKKKKPK..',
      '..KPPPPPPPPPPK..',
      '..KGGGGPPGGGGK..',
      '..KGEEGPPGEEGK..',
      '..KGEeGPPGeEGK..',
      '..KGGGGYYGGGGK..',
      '...KPPPYYPPPK...',
      '..KPPLLLLLLPPK..',
      '.KPPPLLLLLLPPPK.',
      '.KPpPLLLLLLPpPK.',
      '.KPpPLLLLLLPpPK.',
      '..KPPPLLLLPPPK..',
      '...KKPPKKPPKK...',
      '....YYY..YYY....',
    ],
  },
  sky: {
    palette: {"K": "#1f3b2f", "G": "#6dbf8b", "g": "#4a9a6a", "M": "#2f6b4a", "H": "#8a6f3d", "h": "#b8975a", "B": "#fff4d6"},
    helm: [5, 1],
    rows: [
      '................',
      '.....KKKKKK.....',
      '....KGGGGGGK....',
      '...KGGGGGGGGK...',
      '...KGKKGGKKGK...',
      '...KGGGGGGGGK...',
      '...KGGGMMGGGK...',
      '....KKGGGGKK....',
      '..KKHHBBBBHHKK..',
      '.KHHhHHBBHHhHHK.',
      '.KHhHHhGGhHHhHK.',
      '.KHHhHHGGHHhHHK.',
      '.KHhHHhHHhHHhHK.',
      '..KHHHHHHHHHHK..',
      '..KKGGKKKKGGKK..',
      '...KKK....KKK...',
    ],
  },
  leaf: {
    palette: {"K": "#3a2a1a", "D": "#c58a4a", "d": "#e4b57a", "A": "#6b4a2b", "E": "#2a2a2a", "W": "#ffffff", "N": "#3a2a1a", "G": "#588157", "B": "#8a6f3d", "S": "#f1eadb"},
    helm: [5, 2],
    rows: [
      '..A.A......A.A..',
      '..AAA.KKKK.AAA..',
      '...AAKDDDDKAA...',
      '....KDDDDDDK....',
      '...KDDDDDDDDK...',
      '...KDEWDDEWDDK..',
      '...KDEEDDEEDDK..',
      '...KDDDDDDDDDK..',
      '....KKDDNNDKK.BB',
      '.....KGGGGGK.BS.',
      '....KDGGGGDK.BS.',
      '....KDDDDDDKKBS.',
      '....KDWDDWDK.BS.',
      '....KDDDDDDK.BS.',
      '.....KDKKDK.BB..',
      '.....KKK.KKK....',
    ],
  },
  luna: {
    palette: {"K": "#1d2440", "W": "#f4f1ff", "P": "#f5a3c0", "H": "#2e3a6b", "h": "#4a5a9a", "E": "#1d2440", "N": "#f5a3c0", "Y": "#ffd166", "D": "#c9d1dc"},
    helm: [5, 4],
    rows: [
      '...KK......KK...',
      '...KWK....KWK...',
      '...KPK....KPK...',
      '...KPK....KPK...',
      '...KWKKKKKKWK...',
      '..KHHHHHHHHHHK..',
      '..KHWWWWWWWWHK..',
      '..KHWEWWWWEWHK..',
      '..KHWWWNNWWWHK..',
      '...KHWWWWWWHK...',
      '...KKHHYYHHKK...',
      '..KHHHHYYHHHHK..',
      '..KHhHHHHHHhHK..',
      '..KHHHHHHHHHHK..',
      '...KKHHKKHHKK...',
      '....KK....KK....',
    ],
  },
  melo: {
    palette: {"K": "#3a2a20", "B": "#f4a261", "b": "#ffe0b8", "C": "#2a9d8f", "F": "#e9c46a", "Y": "#e76f51", "E": "#2b2b2b", "W": "#ffffff", "N": "#264653"},
    helm: [2, 2],
    rows: [
      '......FF.....NN.',
      '.....FFK.....N..',
      '....KCCCCK...N..',
      '...KCCCCCCK.....',
      '..KKBBBBBBBK....',
      '.YKBEWBBBBBBK...',
      'YYKBEEBBBBBBBK..',
      '.YKBBBBBBBBBBBKK',
      '..KBBbbBBBBBBBBK',
      '..KBbbbbBBBBBBK.',
      '..KBbbbbbBBBBK..',
      '...KBbbbBBBK....',
      '....KBBBBBKKK...',
      '.....KKKKK......',
      '......KY.KY.....',
      '......YY.YY.....',
    ],
  },
  fang: {
    palette: {"K": "#4a1020", "D": "#d1495b", "L": "#ffe9c7", "E": "#1e1e1e", "W": "#ffffff", "H": "#f4e1b0", "w": "#9c2f45", "Y": "#ffd23f"},
    helm: [5, 2],
    rows: [
      '...H........H...',
      '...HK......KH...',
      '...KDKKKKKKDK...',
      '..KDDDDDDDDDDK..',
      '..KDDEWDDEWDDK..',
      '..KDDEEDDEEDDK..',
      '..KDDDDDDDDDDK..',
      '...KDDDLLDDDK...',
      '...KKDDLLDDKK...',
      '.wKDDKDDDDKDDKw.',
      'wwKDDLLLLLLDDKww',
      '.wKDDLLLLLLDDKw.',
      '..KDDLLLLLLDDK..',
      '...KKDDDDDDKK.Y.',
      '....KDKKKKDKDDK.',
      '....KKK..KKK.KK.',
    ],
  },
};

export const BACKGROUNDS: Record<string, Scene> = {
  'bg:meadow': {
    palette: {"S": "#cfe8ff", "C": "#ffffff", "G": "#8bc34a", "g": "#6aa63a", "F": "#ff8fa3"},
    rows: [
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSCCCSSSSSSS',
      'SSSSSCCCCCSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'GGGGGGGGGGGGGGGG',
      'GGgGGGGGGFGGGGgG',
      'GGGGGFGGGGGGGGGG',
      'gGGGGGGGgGGGFGGG',
      'GGGFGGGGGGGGgGGG',
      'GGGGGGgGGGGGGGGG',
    ],
  },
  'bg:night': {
    palette: {"N": "#14183a", "n": "#1f2757", "Y": "#ffe58a", "M": "#f4f1ff"},
    rows: [
      'NNNNNNNNNNNNNNNN',
      'NNNYNNNNNNNNNNNN',
      'NNNNNNNNNNNNMMNN',
      'NNNNNNNNYNNNMMNN',
      'NNNNNNNNNNNNNNNN',
      'NNYNNNNNNNNNNNNN',
      'NNNNNNNNNNNYNNNN',
      'NNNNNNYNNNNNNNNN',
      'NNNNNNNNNNNNNNNN',
      'NNNNYNNNNNNNNNNN',
      'NNNNNNNNNNNNYNNN',
      'NNNNNNNNNNNNNNNN',
      'NNNNNNNNNNNNNNNN',
      'nnnnNNnnnnnnNNnn',
      'nnnnnnnnnnnnnnnn',
      'nnnnnnnnnnnnnnnn',
    ],
  },
  'bg:castle': {
    palette: {"W": "#aeb0c6", "w": "#8e90a8"},
    rows: [
      'wwwwwwwwwwwwwwww',
      'WWWWWwWWWWWwWWWW',
      'WWWWWwWWWWWwWWWW',
      'WWWWWwWWWWWwWWWW',
      'wwwwwwwwwwwwwwww',
      'WWwWWWWWwWWWWWwW',
      'WWwWWWWWwWWWWWwW',
      'WWwWWWWWwWWWWWwW',
      'wwwwwwwwwwwwwwww',
      'WWWWWwWWWWWwWWWW',
      'WWWWWwWWWWWwWWWW',
      'WWWWWwWWWWWwWWWW',
      'wwwwwwwwwwwwwwww',
      'WWwWWWWWwWWWWWwW',
      'WWwWWWWWwWWWWWwW',
      'WWwWWWWWwWWWWWwW',
    ],
  },
};

const CAPE: Pixel[] = [
  ...[8, 9, 10, 11, 12, 13, 14].flatMap((y) => (y === 8 ? [{ x: 2, y, c: '#c24a4a' }, { x: 13, y, c: '#c24a4a' }] : [{ x: 1, y, c: '#8e2f2f' }, { x: 2, y, c: '#c24a4a' }, { x: 13, y, c: '#c24a4a' }, { x: 14, y, c: '#8e2f2f' }])),
];
const HELM_ROWS = ['.MMMM.', 'MhhhhM'];
const HELM_COLORS: Record<string, string> = { M: '#5b6472', h: '#9aa3b2' };
const SWORD: Pixel[] = [
  { x: 0, y: 15, c: '#6b4423' }, { x: 1, y: 14, c: '#6b4423' }, { x: 2, y: 13, c: '#c9964f' }, { x: 3, y: 12, c: '#c9964f' }, { x: 4, y: 11, c: '#e0b878' },
];

export function pixelsOf(rows: string[], palette: Record<string, string>, ox = 0, oy = 0): Pixel[] {
  return rows.flatMap((row, y) => [...row].flatMap((ch, x) => (ch === '.' ? [] : [{ x: x + ox, y: y + oy, c: palette[ch] }])));
}

/** 장식 없이 캐릭터만 / 해금한 배경(가장 최근 1개)과 장비(망토는 뒤, 투구와 나무 검은 앞)를 겹친 층 */
export function composeAvatar(characterId: string, unlockedIds: string[]): { scene: Pixel[] | null; behind: Pixel[]; sprite: Pixel[]; front: Pixel[] } {
  const sprite = SPRITES[characterId] ?? SPRITES.ember;
  const look = equippedLook(unlockedIds);
  const scene = look.bg && BACKGROUNDS[look.bg] ? pixelsOf(BACKGROUNDS[look.bg].rows, BACKGROUNDS[look.bg].palette) : null;
  const behind = look.gear.includes('gear:cape') ? CAPE : [];
  const front: Pixel[] = [];
  if (look.gear.includes('gear:iron-helm')) front.push(...pixelsOf(HELM_ROWS, HELM_COLORS, sprite.helm[0], sprite.helm[1]));
  if (look.gear.includes('gear:wooden-sword')) front.push(...SWORD);
  return { scene, behind, sprite: pixelsOf(sprite.rows, sprite.palette), front };
}
